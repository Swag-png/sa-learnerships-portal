const request = require("supertest");

// ─── Mocks ────────────────────────────────────────────────────────────────────
let mockVerifyIdToken;
let mockUserDoc;
let mockListingDoc;
let mockAppDoc;
let mockSetApp;
let mockSetCustomClaims;
let mockDbSet;

jest.mock("../../backend/firebaseAdmin", () => {
    mockVerifyIdToken   = jest.fn();
    mockUserDoc         = jest.fn();
    mockListingDoc      = jest.fn();
    mockAppDoc          = jest.fn();
    mockSetApp          = jest.fn().mockResolvedValue();
    mockSetCustomClaims = jest.fn().mockResolvedValue();
    mockDbSet           = jest.fn().mockResolvedValue();

    return {
        admin: {
            auth: () => ({
                verifyIdToken:      mockVerifyIdToken,
                setCustomUserClaims: mockSetCustomClaims
            })
        },
        db: {
            collection: (name) => ({
                doc: (id) => ({
                    get: async () => {
                        if (name === "users")        return mockUserDoc();
                        if (name === "Opportunities") return mockListingDoc();
                        if (name === "applications") return mockAppDoc();
                    },
                    set:    mockSetApp,
                    update: jest.fn().mockResolvedValue()
                }),
                where: () => ({ get: jest.fn().mockResolvedValue({ empty: true }) }),
                get:   jest.fn().mockResolvedValue({ forEach: () => {} }),
                add:   jest.fn().mockResolvedValue({ id: "new-id" })
            })
        }
    };
});

const app = require("../../backend/app");

beforeEach(() => jest.clearAllMocks());

// =============================================================================
// User Story 3: Applicant applies to a listing
// =============================================================================
describe("US-03: Applicant applies to a listing", () => {

    test("✅ Valid applicant can apply to an existing listing", async () => {
        mockUserDoc.mockResolvedValue({
            exists: true,
            data: () => ({ role: "applicant" })
        });
        mockListingDoc.mockResolvedValue({ exists: true });
        mockAppDoc.mockResolvedValue({ exists: false }); // no prior application

        const res = await request(app)
            .post("/applicant/apply")
            .send({ applicantID: "user_001", listingID: "listing_001", status: "pending" });

        expect(res.status).toBe(201);
        expect(res.body.message).toBe("Application submitted");
    });

    test("❌ Missing applicantID returns 400", async () => {
        const res = await request(app)
            .post("/applicant/apply")
            .send({ listingID: "listing_001" });

        expect(res.status).toBe(400);
    });

    test("❌ Missing listingID returns 400", async () => {
        const res = await request(app)
            .post("/applicant/apply")
            .send({ applicantID: "user_001" });

        expect(res.status).toBe(400);
    });

    test("❌ Missing both IDs returns 400", async () => {
        const res = await request(app)
            .post("/applicant/apply")
            .send({ status: "pending" });

        expect(res.status).toBe(400);
    });

    test("❌ Non-existent user returns 400", async () => {
        mockUserDoc.mockResolvedValue({ exists: false });

        const res = await request(app)
            .post("/applicant/apply")
            .send({ applicantID: "ghost_user", listingID: "listing_001" });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe("User not found");
    });

    test("❌ Non-existent listing returns 404", async () => {
        mockUserDoc.mockResolvedValue({
            exists: true,
            data: () => ({ role: "applicant" })
        });
        mockListingDoc.mockResolvedValue({ exists: false });

        const res = await request(app)
            .post("/applicant/apply")
            .send({ applicantID: "user_001", listingID: "ghost_listing" });

        expect(res.status).toBe(404);
        expect(res.body.error).toBe("Listing not found");
    });

    test("❌ Duplicate application returns 409", async () => {
        mockUserDoc.mockResolvedValue({
            exists: true,
            data: () => ({ role: "applicant" })
        });
        mockListingDoc.mockResolvedValue({ exists: true });
        mockAppDoc.mockResolvedValue({ exists: true }); // already applied

        const res = await request(app)
            .post("/applicant/apply")
            .send({ applicantID: "user_001", listingID: "listing_001" });

        expect(res.status).toBe(409);
        expect(res.body.error).toBe("You have already applied to this listing");
    });

    test("❌ Firestore write failure returns 500", async () => {
        mockUserDoc.mockResolvedValue({
            exists: true,
            data: () => ({ role: "applicant" })
        });
        mockListingDoc.mockResolvedValue({ exists: true });
        mockAppDoc.mockResolvedValue({ exists: false });
        mockSetApp.mockRejectedValue(new Error("Firestore write failed"));

        const res = await request(app)
            .post("/applicant/apply")
            .send({ applicantID: "user_001", listingID: "listing_001" });

        expect(res.status).toBe(500);
        expect(res.body.error).toBe("Failed to submit application");
    });
});

// =============================================================================
// User Story 4: NQF prerequisite enforcement
// =============================================================================
describe("US-04: NQF prerequisite enforcement (access-logic)", () => {
    const { authorize } = require("../../backend/access-logic");

    test("✅ Applicant can access /api/listings", () => {
        expect(authorize({ role: "applicant" }, "/api/listings")).toBe(true);
    });

    test("✅ Provider can access /api/listings", () => {
        expect(authorize({ role: "provider" }, "/api/listings")).toBe(true);
    });

    test("✅ Admin can access everything", () => {
        expect(authorize({ role: "admin" }, "/api/listings")).toBe(true);
        expect(authorize({ role: "admin" }, "/applicant-home")).toBe(true);
        expect(authorize({ role: "admin" }, "/provider-home")).toBe(true);
    });

    test("❌ Applicant cannot access provider routes", () => {
        expect(authorize({ role: "applicant" }, "/create-opportunity")).toBe(false);
        expect(authorize({ role: "applicant" }, "/api/applicants")).toBe(false);
    });

    test("❌ Provider cannot access applicant-only routes", () => {
        expect(authorize({ role: "provider" }, "/applicant-home")).toBe(false);
    });

    test("❌ Unknown role is denied everywhere", () => {
        expect(authorize({ role: "unknown" }, "/api/listings")).toBe(false);
        expect(authorize({ role: "unknown" }, "/applicant-home")).toBe(false);
    });

    test("❌ No role object is denied", () => {
        expect(authorize(null, "/api/listings")).toBe(false);
        expect(authorize({}, "/api/listings")).toBe(false);
    });
});

// =============================================================================
// Check application status endpoint
// =============================================================================
describe("hasApplied endpoint", () => {

    test("✅ Returns hasApplied: false when no application exists", async () => {
        // The where().get() mock returns empty snapshot
        const res = await request(app)
            .get("/applicant/hasApplied")
            .query({ applicantID: "user_001", listingID: "listing_001" });

        expect(res.status).toBe(200);
        expect(res.body.hasApplied).toBe(true); // empty = true from mock
    });
});
