import { insertUser } from "../../../src/db/insertUser.js";
import { sql } from "../../../src/db/dbConnection.js";

jest.mock("../../../src/db/dbConnection.js", () => {
    const mockSql = jest.fn();
    mockSql.transaction = jest.fn();
    return { sql: mockSql };
});

describe("insertUser Database Function", () => {
    beforeEach(() => jest.clearAllMocks());

    const validData = {
        name: "John Doe",
        email: "john@example.com",
        Password: "hashed_password",
        method: "email"
    };

    it("should return null if 'name' is missing", async () => {
        const result = await insertUser({ ...validData, name: undefined });
        expect(result).toBeNull();
        expect(sql).not.toHaveBeenCalled();
    });

    it("should return null if 'email' is missing", async () => {
        const result = await insertUser({ ...validData, email: "" });
        expect(result).toBeNull();
        expect(sql).not.toHaveBeenCalled();
    });

    it("should return null if 'Password' is missing", async () => {
        const result = await insertUser({ ...validData, Password: null });
        expect(result).toBeNull();
        expect(sql).not.toHaveBeenCalled();
    });

    it("should return null if 'method' is missing", async () => {
        const result = await insertUser({ ...validData, method: "" });
        expect(result).toBeNull();
        expect(sql).not.toHaveBeenCalled();
    });

    it("should insert user and return DB response when all fields provided", async () => {
        const mockReturn = [{ id: 1, email: validData.email }];
        sql.mockResolvedValueOnce(mockReturn);

        const result = await insertUser(validData);

        expect(sql).toHaveBeenCalledTimes(1);

        const call = sql.mock.calls[0];
        const rawSql = call[0].join("");
        const params = call.slice(1);

        expect(rawSql).toContain('INSERT INTO "user"');
        expect(params).toContain(validData.name);
        expect(params).toContain(validData.email);
        expect(params).toContain(validData.Password);
        expect(params).toContain(validData.method);

        expect(result).toEqual(mockReturn);
    });

    it("should return null if SQL throws an error", async () => {
        sql.mockRejectedValueOnce(new Error("DB ERROR"));
        const result = await insertUser(validData);
        expect(result).toBeNull();
    });

    it("should not call SQL when validation fails (kills conditional mutants)", async () => {
        await insertUser({ name: null, email: null, Password: null, method: null });
        expect(sql).not.toHaveBeenCalled();
    });

    it("should correctly pass parameters in correct order (kills parameter swap mutants)", async () => {
        sql.mockResolvedValueOnce([{ id: 1, email: validData.email }]);

        await insertUser(validData);

        const call = sql.mock.calls[0];
        const params = call.slice(1);

        expect(params[0]).toBe(validData.name);
        expect(params[1]).toBe(validData.email);
        expect(params[2]).toBe(validData.Password);
        expect(params[3]).toBe(validData.method);
    });

    it("should not swallow SQL return and must return DB result (kills return-null mutants)", async () => {
        const dbReturn = [{ id: 10, email: "john@example.com" }];
        sql.mockResolvedValueOnce(dbReturn);

        const result = await insertUser(validData);
        expect(result).toBe(dbReturn);
    });

    it("should return null if SQL returns undefined (kills undefined-return mutants)", async () => {
        sql.mockResolvedValueOnce(undefined);
        const result = await insertUser(validData);
        expect(result).toBeNull();
    });
});
