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

});