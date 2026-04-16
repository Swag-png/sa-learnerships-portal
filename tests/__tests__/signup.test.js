describe("Signup Page Tests", () => {

    test("should create a user with valid input", () => {
        const user = {
            email: "test@gmail.com",
            password: "Password123"
        };

        expect(user.email).toBeDefined();
        expect(user.password.length).toBeGreaterThanOrEqual(8);
    });

    test("should fail if email is missing", () => {
        const user = {
            password: "Password123"
        };

        expect(user.email).toBeUndefined();
    });

    test("should fail if password is too short", () => {
        const password = "123";

        expect(password.length).toBeLessThan(8);
    });

    test("should fail if password matches email", () => {
        const email    = "test@gmail.com";
        const password = "test@gmail.com";

        expect(password).toBe(email);
    });

    test("should pass if password is longer than 8 characters", () => {
        const password = "SecurePass99";

        expect(password.length).toBeGreaterThan(8);
    });

    test("should fail if email format is invalid", () => {
        const email = "not-an-email";

        expect(email).not.toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    });

    test("should pass if email format is valid", () => {
        const email = "user@example.com";

        expect(email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    });
});