// ─── Assertion Library ────────────────────────────────────────────────────────
const assert = require('assert');

// ─── Mock Firestore ───────────────────────────────────────────────────────────
// We mock Firestore so tests run without a real database connection.
// Each test controls what .get() returns to simulate different scenarios.

let mockUserData   = null; // what Firestore returns for users.doc(id).get()
let mockListingData = null; // what Firestore returns for listings.doc(id).get()
let mockAppData    = null; // what Firestore returns for applications.doc(id).get()
let mockSetError   = null; // if set, db.set() will throw this error

const mockDb = {
    collection: (name) => ({
        doc: (id) => ({
            get: async () => {
                if (name === 'users')        return mockUserData;
                if (name === 'listings')     return mockListingData;
                if (name === 'applications') return mockAppData;
            },
            set: async () => {
                if (mockSetError) throw mockSetError;
            }
        })
    })
};

// ─── The function we are testing (extracted from app.js) ──────────────────────
// This mirrors the logic in your /applicant/apply route so it can be
// tested without spinning up an Express server.

async function applyToListing(applicantID, listingID, status, db) {

    if (!applicantID || !listingID) {
        return { statusCode: 400, body: { error: "applicantID and listingID are required" } };
    }

    const userDoc = await db.collection('users').doc(applicantID).get();
    if (!userDoc.exists) {
        return { statusCode: 404, body: { error: "User not found" } };
    }

    if (userDoc.data().role !== 'applicant') {
        return { statusCode: 403, body: { error: "Only applicants can apply to listings" } };
    }

    const listingDoc = await db.collection('listings').doc(listingID).get();
    if (!listingDoc.exists) {
        return { statusCode: 404, body: { error: "Listing not found" } };
    }

    const existingApp = await db.collection('applications').doc(`${applicantID}_${listingID}`).get();
    if (existingApp.exists) {
        return { statusCode: 409, body: { error: "You have already applied to this listing" } };
    }

    try {
        await db.collection('applications').doc(`${applicantID}_${listingID}`).set({
            applicantID,
            listingID,
            status,
            createdAt: new Date().toISOString()
        });
        return { statusCode: 201, body: { message: "Application submitted" } };
    } catch (error) {
        return { statusCode: 500, body: { error: "Failed to submit application" } };
    }
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('Apply Listing Tests', () => {

    // Reset mock state before each test so tests don't affect each other
    beforeEach(() => {
        mockUserData    = null;
        mockListingData = null;
        mockAppData     = null;
        mockSetError    = null;
    });

    // ── Happy Path ────────────────────────────────────────────────────────────

    it('apply_validApplicantAndListing_returns201', async () => {
        // SETUP: user exists and is an applicant, listing exists, no prior application
        mockUserData    = { exists: true,  data: () => ({ role: 'applicant' }) };
        mockListingData = { exists: true,  data: () => ({}) };
        mockAppData     = { exists: false };

        // ACT
        const result = await applyToListing('user_001', 'listing_001', 'pending', mockDb);

        // VERIFY
        assert.strictEqual(result.statusCode, 201);
        assert.strictEqual(result.body.message, 'Application submitted');
    });

    // ── Missing Fields ────────────────────────────────────────────────────────

    it('apply_missingApplicantID_returns400', async () => {
        // SETUP: no applicantID provided
        const result = await applyToListing('', 'listing_001', 'pending', mockDb);

        assert.strictEqual(result.statusCode, 400);
        assert.strictEqual(result.body.error, 'applicantID and listingID are required');
    });

    it('apply_missingListingID_returns400', async () => {
        // SETUP: no listingID provided
        const result = await applyToListing('user_001', '', 'pending', mockDb);

        assert.strictEqual(result.statusCode, 400);
        assert.strictEqual(result.body.error, 'applicantID and listingID are required');
    });

    it('apply_missingBothIDs_returns400', async () => {
        const result = await applyToListing('', '', 'pending', mockDb);

        assert.strictEqual(result.statusCode, 400);
    });

    // ── User Validation ───────────────────────────────────────────────────────

    it('apply_userDoesNotExist_returns404', async () => {
        // SETUP: user not found in Firestore
        mockUserData = { exists: false };

        const result = await applyToListing('ghost_user', 'listing_001', 'pending', mockDb);

        assert.strictEqual(result.statusCode, 404);
        assert.strictEqual(result.body.error, 'User not found');
    });

    it('apply_providerTriesToApply_returns403', async () => {
        // SETUP: user exists but is a provider, not an applicant
        mockUserData    = { exists: true, data: () => ({ role: 'provider' }) };
        mockListingData = { exists: true, data: () => ({}) };

        const result = await applyToListing('provider_001', 'listing_001', 'pending', mockDb);

        assert.strictEqual(result.statusCode, 403);
        assert.strictEqual(result.body.error, 'Only applicants can apply to listings');
    });

    it('apply_adminTriesToApply_returns403', async () => {
        // SETUP: user exists but is an admin
        mockUserData    = { exists: true, data: () => ({ role: 'admin' }) };
        mockListingData = { exists: true, data: () => ({}) };

        const result = await applyToListing('admin_001', 'listing_001', 'pending', mockDb);

        assert.strictEqual(result.statusCode, 403);
        assert.strictEqual(result.body.error, 'Only applicants can apply to listings');
    });

    // ── Listing Validation ────────────────────────────────────────────────────

    it('apply_listingDoesNotExist_returns404', async () => {
        // SETUP: user is valid applicant but listing doesn't exist
        mockUserData    = { exists: true,  data: () => ({ role: 'applicant' }) };
        mockListingData = { exists: false };

        const result = await applyToListing('user_001', 'ghost_listing', 'pending', mockDb);

        assert.strictEqual(result.statusCode, 404);
        assert.strictEqual(result.body.error, 'Listing not found');
    });

    // ── Duplicate Application ─────────────────────────────────────────────────

    it('apply_duplicateApplication_returns409', async () => {
        // SETUP: everything valid but application already exists
        mockUserData    = { exists: true, data: () => ({ role: 'applicant' }) };
        mockListingData = { exists: true, data: () => ({}) };
        mockAppData     = { exists: true }; // already applied

        const result = await applyToListing('user_001', 'listing_001', 'pending', mockDb);

        assert.strictEqual(result.statusCode, 409);
        assert.strictEqual(result.body.error, 'You have already applied to this listing');
    });

    // ── Database Failure ──────────────────────────────────────────────────────

    it('apply_databaseWriteFails_returns500', async () => {
        // SETUP: everything valid but Firestore throws on write
        mockUserData    = { exists: true,  data: () => ({ role: 'applicant' }) };
        mockListingData = { exists: true,  data: () => ({}) };
        mockAppData     = { exists: false };
        mockSetError    = new Error('Firestore write failed');

        const result = await applyToListing('user_001', 'listing_001', 'pending', mockDb);

        assert.strictEqual(result.statusCode, 500);
        assert.strictEqual(result.body.error, 'Failed to submit application');
    });

});