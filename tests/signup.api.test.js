const request = require("supertest");
const app = require("../backend/app");

// Mock Firebase (VERY IMPORTANT)
jest.mock("../backend/firebaseAdmin", () => {
  return {
    collection: () => ({
      add: jest.fn(() => Promise.resolve())
    })
  };
});

describe("Signup API", () => {

  test("should create applicant successfully", async () => {
    const res = await request(app)
      .post("/signup/applicant")
      .send({
        firstname: "John",
        lastname: "Doe",
        email: "john@gmail.com",
        username: "john123",
        institution: "UJ",
        city: "Johannesburg",
        cv: "cv.pdf",
        role: "applicant"
      });

    expect(res.statusCode).toBe(200);
    expect(res.text).toBe("User saved");
  });

  test("should create provider successfully", async () => {
    const res = await request(app)
      .post("/signup/provider")
      .send({
        organization: "Company",
        email: "company@gmail.com",
        city: "Cape Town",
        username: "company123",
        role: "provider"
      });

    expect(res.statusCode).toBe(200);
    expect(res.text).toBe("Provider saved");
  });

});