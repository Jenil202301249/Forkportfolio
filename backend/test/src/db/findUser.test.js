import { sql } from "../../../src/db/dbConnection.js";
import { searchUserByEmail } from "../../../src/db/findUser.js";

jest.mock("../../../src/db/dbConnection.js", () => ({
    sql: jest.fn(),
}));

describe("searchUserByEmail() searchUserByEmail method", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // Happy Path Tests
    describe("Happy Paths", () => {
        test("should return user data when a valid email is provided", async () => {
            // Arrange: Set up the mock to return a user object
            const mockUser = [
                { id: 1, email: "test@example.com", name: "Test User" },
            ];
            sql.mockResolvedValue(mockUser);

            // Act: Call the function with a valid email
            const result = await searchUserByEmail("test@example.com");

            // Assert: Verify the function returns the expected user data
            expect(result).toEqual(mockUser);
        });
    });

    // Edge Case Tests
    describe("Edge Cases", () => {
        test("should return null when the email does not exist in the database", async () => {
            // Arrange: Set up the mock to return an empty array
            sql.mockResolvedValueOnce([]);

            // Act: Call the function with a non-existent email
            const result = await searchUserByEmail("nonexistent@example.com");

            // Assert: Verify the function returns null
            expect(result).toEqual([]);
        });

        test("should return null when email is null", async () => {
            // Act: Call the function with a null email
            const result = await searchUserByEmail(null);

            // Assert: Verify the function returns null
            expect(result).toBeNull();
            expect(sql).not.toHaveBeenCalled();
        });

        test("should return null when email is undefined", async () => {
            // Act: Call the function with an undefined email
            const result = await searchUserByEmail(undefined);

            // Assert: Verify the function returns null
            expect(result).toBeNull();
            expect(sql).not.toHaveBeenCalled();
        });

        test("should return null when email is an empty string", async () => {
            // Act: Call the function with an empty string email
            const result = await searchUserByEmail("");

            // Assert: Verify the function returns null
            expect(result).toBeNull();
            expect(sql).not.toHaveBeenCalled();
        });

        test("should return null and log error when database query fails", async () => {
            // Arrange: Set up the mock to throw an error
            sql.mockRejectedValue(new Error("Database error"));

            // Act: Call the function with a valid email
            const result = await searchUserByEmail("test@example.com");

            // Assert: Verify the function returns null
            expect(result).toBeNull();
        });
    });
});
