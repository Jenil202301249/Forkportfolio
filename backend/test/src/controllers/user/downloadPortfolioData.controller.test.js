import { jest } from "@jest/globals";

// ---------------------- MOCK XlsxPopulate -------------------------
let createdWorkbook = null;
let mockSheetCalls = [];

class MockSheet {
    constructor(name) {
        this.nameValue = name;
        this.calls = [];
    }

    name(newName) {
        this.nameValue = newName;
        this.calls.push({ type: "sheetRename", newName });
        return this;
    }

    cell(r, c) {
        const cellObj = {
            r,
            c,
            value: jest.fn().mockReturnThis(),
            style: jest.fn().mockReturnThis()
        };
        this.calls.push({ type: "cell", r, c, cellObj });
        return cellObj;
    }
}

class MockWorkbook {
    constructor() {
        createdWorkbook = this;
        this.sheets = [new MockSheet("Sheet1")];
    }

    sheet(index) {
        return this.sheets[index];
    }

    addSheet(name) {
        const newSheet = new MockSheet(name);
        this.sheets.push(newSheet);
        return newSheet;
    }

    outputAsync({ password }) {
        this.generatedPassword = password;
        return Promise.resolve(Buffer.from("XLSXDATA"));
    }
}

jest.mock("xlsx-populate", () => ({
    fromBlankAsync: jest.fn(() => Promise.resolve(new MockWorkbook()))
}));

// ---------------------- MOCK DB -------------------------
jest.mock("../../../../src/db/stockSummary.js", () => ({
    getPortfolioStockSummary: jest.fn()
}));

jest.mock("../../../../src/db/userTransactions.js", () => ({
    getPortfolioTransactions: jest.fn()
}));

// ---------------------- MOCK MAIL -------------------------
jest.mock("../../../../src/utils/nodemailer.js", () => ({
    sendMail: jest.fn()
}));

// ---------------------- MOCK TEMPLATE -------------------------
jest.mock(
    "../../../../src/utils/mailPortfolioDataDownloadTemplate.js",
    () => ({
        getPortfolioDownloadEmailTemplate: jest.fn(
            (name, formatted, password) =>
                `<html>Portfolio for ${name} at ${formatted} with pass ${password}</html>`
        )
    }),
    { virtual: true }
);

// ---------------------- MOCK user.model -------------------------
jest.mock("../../../../src/mongoModels/user.model.js", () => ({
    addActivityHistory: jest.fn()
}));

// ---------------------- MOCK FILE SYSTEM -------------------------
jest.mock("fs", () => ({
    existsSync: jest.fn(),
    writeFileSync: jest.fn(),
    unlink: jest.fn(),
    unlinkSync: jest.fn()
}));

// ---------------------- MOCK PATH -------------------------
jest.mock("path", () => ({
    join: jest.fn((...args) => args.join("/"))
}));

// ===========================================================
//  IMPORT CONTROLLER AFTER MOCKS
// ===========================================================
import { createExcel } from "../../../../src/controllers/user/downloadPortfolioData.controller.js";
import * as stockDB from "../../../../src/db/stockSummary.js";
import * as transactionDB from "../../../../src/db/userTransactions.js";
import * as mailer from "../../../../src/utils/nodemailer.js";
import * as emailTemplate from "../../../../src/utils/mailPortfolioDataDownloadTemplate.js";
import * as userModel from "../../../../src/mongoModels/user.model.js";
import fs from "fs";
import path from "path";

// ===========================================================
//  START TEST SUITE
// ===========================================================
describe("createExcel.controller.js FULL TEST", () => {
    let req, res;

    beforeEach(() => {
        jest.clearAllMocks();

        req = {
            user: {
                email: "test@example.com",
                name: "Chirayu",
                investmentexperience: "Beginner",
                riskprofile: "Moderate",
                financialgoals: "Wealth",
                investmenthorizon: "Long"
            },
            activeSession: {
                osType: "Windows",
                browserType: "Chrome"
            },
            cookies: { token: "abc123" }
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };

        process.env.GOOGLE_USER_EMAIL = "noreply@example.com";
    });

    // ------------------------------------------------
    // MISSING EMAIL
    // ------------------------------------------------
    it("returns 401 when email is missing", async () => {
        req.user.email = null;

        await createExcel(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "email is not present"
        });
    });

    // ------------------------------------------------
    // MISSING NAME
    // ------------------------------------------------
    it("returns 401 when name is missing", async () => {
        req.user.name = null;

        await createExcel(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "name is not present"
        });
    });

    // ------------------------------------------------
    // DB ERROR Stock Summary
    // ------------------------------------------------
    it("returns 503 when getPortfolioStockSummary returns null", async () => {
        stockDB.getPortfolioStockSummary.mockResolvedValue(null);

        await createExcel(req, res);

        expect(res.status).toHaveBeenCalledWith(503);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Database error while getting stock summary"
        });
    });

    // ------------------------------------------------
    // DB ERROR Transactions
    // ------------------------------------------------
    it("returns 503 when getPortfolioTransactions returns null", async () => {
        stockDB.getPortfolioStockSummary.mockResolvedValue([]);
        transactionDB.getPortfolioTransactions.mockResolvedValue(null);

        await createExcel(req, res);

        expect(res.status).toHaveBeenCalledWith(503);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Database error while getting transactions"
        });
    });

    // ------------------------------------------------
    // SUCCESS CASE — FULL VERIFICATION
    // ------------------------------------------------
    it("creates excel, saves, emails, logs activity, deletes file", async () => {
        stockDB.getPortfolioStockSummary.mockResolvedValue([
            { symbol: "AAPL", qty: 10, avg: 150 }
        ]);

        transactionDB.getPortfolioTransactions.mockResolvedValue([
            { date: new Date("2024-01-01"), type: "BUY", qty: 5, price: 145 }
        ]);

        fs.unlink.mockImplementation((path, cb) => cb(null));
        fs.existsSync.mockReturnValue(false);

        await createExcel(req, res);

        // Workbook created
        expect(createdWorkbook).not.toBeNull();

        // Sheet Names
        expect(createdWorkbook.sheets[0].nameValue).toBe("userData");
        expect(createdWorkbook.sheets[1].nameValue).toBe("StockSummary");
        expect(createdWorkbook.sheets[2].nameValue).toBe("TransactionHistory");

        // File path construction
        expect(path.join).toHaveBeenCalledWith("./public/portfolioData");
        expect(path.join).toHaveBeenCalledWith(
            "./public/portfolioData",
            "Chirayu_portfolio_data.xlsx"
        );

        // File saved
        expect(fs.writeFileSync).toHaveBeenCalledWith(
            expect.stringContaining("Chirayu_portfolio_data.xlsx"),
            expect.any(Buffer)
        );

        // Email sent
        expect(mailer.sendMail).toHaveBeenCalled();
        const emailArgs = mailer.sendMail.mock.calls[0][0];
        expect(emailArgs.to).toBe("test@example.com");

        // Activity logged
        expect(userModel.addActivityHistory).toHaveBeenCalledWith(
            "test@example.com",
            expect.objectContaining({
                type: "Downloaded Portfolio Data"
            })
        );

        // File deleted
        expect(fs.unlink).toHaveBeenCalled();

        // Success Response
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: "Excel file sent to your email successfully"
        });
    });

    // ------------------------------------------------
    // CATCH BLOCK — ERROR HANDLING
    // ------------------------------------------------
    it("returns 500 when an exception occurs", async () => {
        stockDB.getPortfolioStockSummary.mockRejectedValue(
            new Error("boom")
        );

        fs.existsSync.mockReturnValue(true);

        const spy = jest.spyOn(console, "error").mockImplementation(() => {});

        await createExcel(req, res);

        expect(spy).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "failed to download portfolio data, please try again"
        });

        spy.mockRestore();
    });

    it("writes correct userData headers and values", async () => {
        stockDB.getPortfolioStockSummary.mockResolvedValue([]);
        transactionDB.getPortfolioTransactions.mockResolvedValue([]);

        fs.unlink.mockImplementation((p, cb) => cb(null));

        await createExcel(req, res);

        const sheet = createdWorkbook.sheets[0];

        const headerCalls = sheet.calls.filter(c => c.type === "cell" && c.r === 1);

        const expectedHeaders = [
            "name",
            "email",
            "investmentExperience",
            "riskProfile",
            "financialGoals",
            "investmentHorizon"
        ];

        // HEADER CHECKS
        expectedHeaders.forEach((h, i) => {
            expect(headerCalls[i].cellObj.value).toHaveBeenCalledWith(h);
        });

        const rowCalls = sheet.calls.filter(c => c.type === "cell" && c.r === 2);

        expect(rowCalls[0].cellObj.value).toHaveBeenCalledWith("Chirayu");
        expect(rowCalls[1].cellObj.value).toHaveBeenCalledWith("test@example.com");
        expect(rowCalls[2].cellObj.value)
            .toHaveBeenCalledWith("Beginner");
    });

    it("generates a valid 8-character password", async () => {
        stockDB.getPortfolioStockSummary.mockResolvedValue([]);
        transactionDB.getPortfolioTransactions.mockResolvedValue([]);

        fs.unlink.mockImplementation((p, cb) => cb(null));

        await createExcel(req, res);

        const call = emailTemplate.getPortfolioDownloadEmailTemplate.mock.calls[0];
        const password = call[2];

        expect(password.length).toBe(8);
        expect(/^[A-Z0-9]{8}$/.test(password)).toBe(true);
    });

    it("writes StockSummary table headers & data correctly", async () => {
        stockDB.getPortfolioStockSummary.mockResolvedValue([
            { symbol: "AAPL", qty: 10 }
        ]);
        transactionDB.getPortfolioTransactions.mockResolvedValue([]);

        fs.unlink.mockImplementation((p, cb) => cb(null));

        await createExcel(req, res);

        const sheet = createdWorkbook.sheets[1];

        // HEADER
        const headerCalls = sheet.calls.filter(c => c.r === 1);
        expect(headerCalls[0].cellObj.value).toHaveBeenCalledWith("symbol");
        expect(headerCalls[1].cellObj.value).toHaveBeenCalledWith("qty");

        // DATA
        const dataCalls = sheet.calls.filter(c => c.r === 2);
        expect(dataCalls[0].cellObj.value).toHaveBeenCalledWith("AAPL");
        expect(dataCalls[1].cellObj.value).toHaveBeenCalledWith(10);
    });

    it("writes date cells with dd-mm-yyyy formatting", async () => {
        stockDB.getPortfolioStockSummary.mockResolvedValue([]);
        transactionDB.getPortfolioTransactions.mockResolvedValue([
            { date: new Date("2024-01-10"), qty: 5 }
        ]);

        fs.unlink.mockImplementation((p, cb) => cb(null));

        await createExcel(req, res);

        const sheet = createdWorkbook.sheets[2];

        const dateCellCall = sheet.calls.find(
            c => c.r === 2 && c.c === 1
        );

        expect(dateCellCall.cellObj.style)
            .toHaveBeenCalledWith("numberFormat", "dd-mm-yyyy");
    });

    it("uses hour12 true formatting with AM/PM", async () => {
        stockDB.getPortfolioStockSummary.mockResolvedValue([]);
        transactionDB.getPortfolioTransactions.mockResolvedValue([]);

        fs.unlink.mockImplementation((p, cb) => cb(null));

        await createExcel(req, res);

        const call = emailTemplate.getPortfolioDownloadEmailTemplate.mock.calls[0];
        const formatted = call[1];

        expect(formatted).toMatch(/\d{2}\/\d{2}\/\d{2}/);
        expect(formatted.toLowerCase()).toMatch(/am|pm/);
    });

});
