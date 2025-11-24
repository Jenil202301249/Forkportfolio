// @ts-nocheck
import { sql } from "../../../src/db/dbConnection.js";
import { updateProfileImage } from "../../../src/db/updateProfileImage.js";

// Mock SQL
jest.mock("../../../src/db/dbConnection.js", () => ({
  sql: jest.fn(),
}));

describe("updateProfileImage()", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ----------------------------
  // HAPPY PATH
  // ----------------------------
  it("should update profile image and return DB result for valid email and image", async () => {
    const mockEmail = "user@example.com";
    const mockProfileImage = "https://cloudinary.com/img123.png";

    const mockResult = [
      {
        id: 1,
        email: mockEmail,
        profileimage: mockProfileImage,
      },
    ];

    sql.mockResolvedValue(mockResult);

    const result = await updateProfileImage(mockEmail, mockProfileImage);

    expect(result).toEqual(mockResult);
    expect(sql).toHaveBeenCalledTimes(1);

    // Verify correct parameters sent in tagged template
    expect(sql.mock.calls[0][1]).toBe(mockProfileImage);
    expect(sql.mock.calls[0][2]).toBe(mockEmail);
  });

  // ----------------------------
  // DB ERROR CASE
  // ----------------------------
  it("should return null when DB throws an error", async () => {
    const mockEmail = "user@example.com";
    const mockProfileImage = "https://cloudinary.com/img123.png";

    sql.mockRejectedValue(new Error("DB error"));

    const result = await updateProfileImage(mockEmail, mockProfileImage);

    expect(result).toBeNull();
    expect(sql).toHaveBeenCalledTimes(1);
  });

  // ----------------------------
  // VALIDATION CASES (should NOT call DB)
  // ----------------------------
  const invalidValues = [null, undefined, ""];

  invalidValues.forEach((val) => {
    it(`should return null & NOT call DB when email is '${val}'`, async () => {
      const result = await updateProfileImage(val, "img.png");

      expect(result).toBeNull();
      expect(sql).not.toHaveBeenCalled();
    });

    it(`should return null & NOT call DB when profileImage is '${val}'`, async () => {
      const result = await updateProfileImage("user@example.com", val);

      expect(result).toBeNull();
      expect(sql).not.toHaveBeenCalled();
    });
  });
});
