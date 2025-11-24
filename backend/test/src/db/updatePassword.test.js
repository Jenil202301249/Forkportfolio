// @ts-nocheck
jest.mock("../../../src/db/dbConnection.js", () => ({
  sql: jest.fn(),
}));

import { updatePassword } from "../../../src/db/updatePassword.js";
import { sql } from "../../../src/db/dbConnection.js";

describe("updatePassword", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should update password and return user info", async () => {
    const mockResult = { id: 1, email: "test@example.com" };
    sql.mockResolvedValue(mockResult);
    
    const result = await updatePassword("test@example.com", "hashed123");
    
    expect(sql).toHaveBeenCalled();
    expect(result).toEqual(mockResult);
  });

  it("should return null if query fails", async () => {
    sql.mockRejectedValue();

    const result = await updatePassword("x@example.com", "123");
    
    expect(sql).toHaveBeenCalled();
    expect(result).toBeNull();
  });
});
