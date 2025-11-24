let createdPDFInstance = null;

class MockPDF {
    constructor(options) {
        createdPDFInstance = this;
        this.handlers = {};
        this.options = options; // Store constructor options
        this.content = []; // Track all content added to PDF
    }

    on(event, cb) {
        this.handlers[event] = cb;
    }

    emit(event, payload) {
        if (typeof this.handlers[event] === "function") {
            this.handlers[event](payload);
        }
    }

    // PDFKit chainable mocks - now tracking calls
    font(fontName) { 
        this.content.push({ type: 'font', value: fontName });
        return this; 
    }
    fontSize(size) { 
        this.content.push({ type: 'fontSize', value: size });
        return this; 
    }
    text(text, options) { 
        this.content.push({ type: 'text', value: text, options: options || {} });
        return this; 
    }
    moveDown(lines) { 
        this.content.push({ type: 'moveDown', value: lines });
        return this; 
    }

    table(tableData, options) {
        this.content.push({ type: 'table', data: tableData, options: options || {} });
        // Trigger coverage for your lines 113 & 114
        if (options?.prepareHeader) options.prepareHeader();
        if (options?.prepareRow) options.prepareRow();
        return Promise.resolve();
    }

    end() {
        setImmediate(() => {
            if (this.handlers["data"]) {
                this.handlers["data"](Buffer.from("PDFDATA"));
            }
            if (this.handlers["end"]) {
                this.handlers["end"]();
            }
        });
    }
}

jest.mock("pdfkit-table", () => {
    return jest.fn().mockImplementation((options) => new MockPDF(options));
});

// ---------------------- MOCK user.model -------------------------
jest.mock("../../../../src/mongoModels/user.model.js", () => ({
    getAllActivityHistory: jest.fn(),
}));

// ---------------------- MOCK nodemailer -------------------------
jest.mock("../../../../src/utils/nodemailer.js", () => ({
    sendMail: jest.fn(),
}));

// ---------------------- FIX: MOCK TEMPLATE (avoid import.meta crash) -------------------------
jest.mock(
  "../../../../src/utils/mailActivityHistoryReportDownloadTemplate.js",
  () => ({
      getActivityHistoryDownloadEmailTemplate: jest.fn((name, formatted) => 
          `<html>Email for ${name} at ${formatted}</html>`
      ),
  }),
  { virtual: true }
);

// ---------------------- MOCK FILE SYSTEM -------------------------
jest.mock("fs", () => ({
    existsSync: jest.fn(),
    mkdirSync: jest.fn(),
    writeFileSync: jest.fn(),
    unlink: jest.fn(),
}));

// ---------------------- MOCK PATH -------------------------
jest.mock("path", () => ({
    join: jest.fn((...args) => args.join("/")),
}));

// ===============================================================
//  NOW IMPORT CONTROLLER (AFTER MOCKS)
// ===============================================================
import { downloadActivityHistoryReport } from "../../../../src/controllers/user/downloadActivityHistoryReport.controller.js";
import * as userModel from "../../../../src/mongoModels/user.model.js";
import * as mailer from "../../../../src/utils/nodemailer.js";
import * as emailTemplate from "../../../../src/utils/mailActivityHistoryReportDownloadTemplate.js";
import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit-table";

// ===============================================================
//  START TESTS
// ===============================================================

describe("downloadActivityHistoryReport.controller.js FULL TEST", () => {
    let req, res;

    beforeEach(() => {
        jest.clearAllMocks();
        createdPDFInstance = null;

        req = {
            user: {
                email: "test@example.com",
                name: "Chirayu",
            },
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };

        process.cwd = jest.fn(() => "/root");
        process.env.GOOGLE_USER_EMAIL = "noreply@example.com";
    });

    // --------------- MISSING EMAIL ---------------
    it("returns 401 when email is missing", async () => {
        req.user.email = null;

        await downloadActivityHistoryReport(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Expected email",
        });
    });

    // --------------- MISSING NAME ---------------
    it("returns 401 when name is missing", async () => {
        req.user.name = null;

        await downloadActivityHistoryReport(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Expected name",
        });
    });

    // --------------- DB RETURNS NULL ---------------
    it("returns 503 when getAllActivityHistory returns null", async () => {
        userModel.getAllActivityHistory.mockResolvedValue(null);

        await downloadActivityHistoryReport(req, res);

        expect(res.status).toHaveBeenCalledWith(503);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Database error occurred while getting activity history",
        });
    });

    // --------------- SUCCESS CASE WITH FULL DATA VERIFICATION ------------------------------
    it("successfully generates PDF with correct data mapping and configuration", async () => {
        const mockHistory = [
            {
                os_type: "Windows",
                browser_type: "Chrome",
                type: "Login",
                message: "Logged in successfully",
                createdAt: new Date("2024-01-15T10:30:00Z").getTime(),
            },
            {
                os_type: "Linux",
                browser_type: "Firefox",
                type: "Logout",
                message: "User logged out",
                createdAt: new Date("2024-01-15T11:45:00Z").getTime(),
            },
        ];

        userModel.getAllActivityHistory.mockResolvedValue(mockHistory);
        fs.existsSync.mockReturnValue(false);

        let resolveResponse;
        const responsePromise = new Promise(resolve => {
            resolveResponse = resolve;
        });
        
        res.json = jest.fn().mockImplementation((data) => {
            resolveResponse(data);
            return res;
        });

        fs.unlink.mockImplementation((path, callback) => {
            callback(null);
        });

        downloadActivityHistoryReport(req, res);
        await responsePromise;

        // VERIFY PDF CONSTRUCTOR OPTIONS (kills margin and size mutants)
        expect(PDFDocument).toHaveBeenCalledWith({ margin: 40, size: "A4" });
        expect(createdPDFInstance.options).toEqual({ margin: 40, size: "A4" });

        // VERIFY DATA MAPPING (kills map function mutants)
        const tableContent = createdPDFInstance.content.find(c => c.type === 'table');
        expect(tableContent).toBeDefined();
        expect(tableContent.data.datas).toHaveLength(2);
        
        // Verify first item mapped correctly
        expect(tableContent.data.datas[0].os_type).toBe("Windows");
        expect(tableContent.data.datas[0].browser_type).toBe("Chrome");
        expect(tableContent.data.datas[0].type).toBe("Login");
        expect(tableContent.data.datas[0].message).toBe("Logged in successfully");
        expect(tableContent.data.datas[0].createdAt).toContain("15"); // Should contain day
        
        // Verify second item mapped correctly
        expect(tableContent.data.datas[1].os_type).toBe("Linux");
        expect(tableContent.data.datas[1].browser_type).toBe("Firefox");

        // VERIFY TABLE HEADERS (kills header mutants)
        expect(tableContent.data.headers).toHaveLength(5);
        expect(tableContent.data.headers[0]).toEqual({ label: "OS Type", property: "os_type", width: 80 });
        expect(tableContent.data.headers[1]).toEqual({ label: "Browser", property: "browser_type", width: 80 });
        expect(tableContent.data.headers[2]).toEqual({ label: "Type", property: "type", width: 70 });
        expect(tableContent.data.headers[3]).toEqual({ label: "Message", property: "message", width: 160 });
        expect(tableContent.data.headers[4]).toEqual({ label: "Created At", property: "createdAt", width: 100 });

        // VERIFY TABLE OPTIONS (kills prepareHeader/prepareRow mutants)
        expect(tableContent.options.prepareHeader).toBeDefined();
        expect(tableContent.options.prepareRow).toBeDefined();
        expect(tableContent.options.padding).toBe(5);
        expect(tableContent.options.columnSpacing).toBe(10);

        // VERIFY PDF CONTENT
        const titleText = createdPDFInstance.content.find(c => 
            c.type === 'text' && c.value === 'User Activity History Report'
        );
        expect(titleText).toBeDefined();
        expect(titleText.options.align).toBe("center");

        // VERIFY FILE OPERATIONS
        expect(fs.mkdirSync).toHaveBeenCalledWith("/root/public/activityData", { recursive: true });
        expect(fs.writeFileSync).toHaveBeenCalledWith(
            "/root/public/activityData/Chirayu_activity_report.pdf",
            expect.any(Buffer)
        );

        // VERIFY EMAIL TEMPLATE CALLED WITH CORRECT ARGS
        expect(emailTemplate.getActivityHistoryDownloadEmailTemplate).toHaveBeenCalledWith(
            "Chirayu",
            expect.stringMatching(/\d{2}\/\d{2}\/\d{2}/) // Should be formatted date
        );

        // VERIFY MAIL OPTIONS (kills attachment mutants)
        expect(mailer.sendMail).toHaveBeenCalledWith({
            from: "noreply@example.com",
            to: "test@example.com",
            subject: "Your Activity History Report",
            html: expect.stringContaining("Chirayu"),
            attachments: [
                {
                    filename: "Chirayu_activity_report.pdf",
                    path: "/root/public/activityData/Chirayu_activity_report.pdf",
                }
            ],
        });

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: "Activity report emailed successfully",
        });
    });

    // --------------- VERIFY DATE FORMATTING OPTIONS ---------------
    it("formats date with correct locale options", async () => {
        const mockHistory = [{
            os_type: "MacOS",
            browser_type: "Safari",
            type: "Login",
            message: "Test",
            createdAt: new Date("2024-06-20T14:30:45Z").getTime(),
        }];

        userModel.getAllActivityHistory.mockResolvedValue(mockHistory);
        fs.existsSync.mockReturnValue(true);

        let resolveResponse;
        const responsePromise = new Promise(resolve => {
            resolveResponse = resolve;
        });
        
        res.json = jest.fn().mockImplementation((data) => {
            resolveResponse(data);
            return res;
        });

        fs.unlink.mockImplementation((path, callback) => callback(null));

        downloadActivityHistoryReport(req, res);
        await responsePromise;

        // Verify the email template was called with a properly formatted date
        const templateCall = emailTemplate.getActivityHistoryDownloadEmailTemplate.mock.calls[0];
        expect(templateCall[0]).toBe("Chirayu");
        
        // The formatted date should match the pattern from Intl.DateTimeFormat with hour12: true
        const formattedDate = templateCall[1];
        expect(formattedDate).toMatch(/\d{2}\/\d{2}\/\d{2}/); // Contains date
        expect(formattedDate).toMatch(/(AM|PM|am|pm)/);
    });

    // --------------- VERIFY DATA CHUNK HANDLING ---------------
    it("correctly accumulates PDF data chunks", async () => {
        const mockHistory = [{
            os_type: "Windows",
            browser_type: "Edge",
            type: "Action",
            message: "Test action",
            createdAt: Date.now(),
        }];

        userModel.getAllActivityHistory.mockResolvedValue(mockHistory);
        fs.existsSync.mockReturnValue(true);

        let resolveResponse;
        const responsePromise = new Promise(resolve => {
            resolveResponse = resolve;
        });
        
        res.json = jest.fn().mockImplementation((data) => {
            resolveResponse(data);
            return res;
        });

        fs.unlink.mockImplementation((path, callback) => callback(null));

        downloadActivityHistoryReport(req, res);
        await responsePromise;

        // Verify that writeFileSync was called with an actual Buffer (chunks were concatenated)
        const writeCall = fs.writeFileSync.mock.calls[0];
        expect(writeCall[1]).toBeInstanceOf(Buffer);
        expect(writeCall[1].toString()).toBe("PDFDATA");
    });

    // --------------- CATCH BLOCK ---------------
    it("returns 500 when an error occurs", async () => {
        userModel.getAllActivityHistory.mockRejectedValue(new Error("Boom"));
        const spy = jest.spyOn(console, "error").mockImplementation(() => {});

        await downloadActivityHistoryReport(req, res);

        expect(spy).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "failed to generate or send PDF, please try again",
        });
        
        spy.mockRestore();
    });

    // --------------- FS.UNLINK ERROR HANDLING ---------------
    it("logs error when file deletion fails", async () => {
        userModel.getAllActivityHistory.mockResolvedValue([
            {
                os_type: "Linux",
                browser_type: "Firefox",
                type: "Logout",
                message: "Logged out",
                createdAt: Date.now(),
            },
        ]);

        fs.existsSync.mockReturnValue(true);
        
        fs.unlink.mockImplementation((path, callback) => {
            callback(new Error("Failed to delete file"));
        });

        const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

        let resolveResponse;
        const responsePromise = new Promise(resolve => {
            resolveResponse = resolve;
        });
        
        res.json = jest.fn().mockImplementation((data) => {
            resolveResponse(data);
            return res;
        });

        downloadActivityHistoryReport(req, res);
        await responsePromise;

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            "Error deleting PDF file:",
            expect.any(Error)
        );

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: "Activity report emailed successfully",
        });

        consoleErrorSpy.mockRestore();
    });

    // --------------- DIRECTORY ALREADY EXISTS ---------------
    it("does not create directory when it already exists", async () => {
        userModel.getAllActivityHistory.mockResolvedValue([
            {
                os_type: "MacOS",
                browser_type: "Safari",
                type: "Login",
                message: "Successful login",
                createdAt: Date.now(),
            },
        ]);

        fs.existsSync.mockReturnValue(true);

        let resolveResponse;
        const responsePromise = new Promise(resolve => {
            resolveResponse = resolve;
        });
        
        res.json = jest.fn().mockImplementation((data) => {
            resolveResponse(data);
            return res;
        });

        fs.unlink.mockImplementation((path, callback) => callback(null));

        downloadActivityHistoryReport(req, res);
        await responsePromise;

        expect(fs.existsSync).toHaveBeenCalled();
        expect(fs.mkdirSync).not.toHaveBeenCalled();
        expect(fs.writeFileSync).toHaveBeenCalled();
        
        expect(res.status).toHaveBeenCalledWith(200);
    });

    // --------------- VERIFY COMPLETE DATA FLOW ---------------
    it("processes multiple activity records with all fields correctly", async () => {
        const mockHistory = [
            {
                os_type: "Windows 10",
                browser_type: "Chrome 120",
                type: "Login",
                message: "Login from new device",
                createdAt: new Date("2024-01-01T08:00:00Z").getTime(),
            },
            {
                os_type: "iOS",
                browser_type: "Safari Mobile",
                type: "View",
                message: "Viewed dashboard",
                createdAt: new Date("2024-01-01T09:15:30Z").getTime(),
            },
            {
                os_type: "Android",
                browser_type: "Chrome Mobile",
                type: "Action",
                message: "Updated profile",
                createdAt: new Date("2024-01-01T10:45:15Z").getTime(),
            },
        ];

        userModel.getAllActivityHistory.mockResolvedValue(mockHistory);
        fs.existsSync.mockReturnValue(false);

        let resolveResponse;
        const responsePromise = new Promise(resolve => {
            resolveResponse = resolve;
        });
        
        res.json = jest.fn().mockImplementation((data) => {
            resolveResponse(data);
            return res;
        });

        fs.unlink.mockImplementation((path, callback) => callback(null));

        downloadActivityHistoryReport(req, res);
        await responsePromise;

        const tableContent = createdPDFInstance.content.find(c => c.type === 'table');
        
        // Verify all 3 records were processed
        expect(tableContent.data.datas).toHaveLength(3);
        
        // Verify each record has all required fields
        tableContent.data.datas.forEach((record, index) => {
            expect(record.os_type).toBe(mockHistory[index].os_type);
            expect(record.browser_type).toBe(mockHistory[index].browser_type);
            expect(record.type).toBe(mockHistory[index].type);
            expect(record.message).toBe(mockHistory[index].message);
            expect(record.createdAt).toBeTruthy(); // Should be formatted date string
            expect(typeof record.createdAt).toBe('string');
        });
    });

    // --------------- VERIFY PATH CONSTRUCTION ---------------
    it("constructs file paths correctly", async () => {
        userModel.getAllActivityHistory.mockResolvedValue([{
            os_type: "Windows",
            browser_type: "Chrome",
            type: "Login",
            message: "Test",
            createdAt: Date.now(),
        }]);

        fs.existsSync.mockReturnValue(false);

        let resolveResponse;
        const responsePromise = new Promise(resolve => {
            resolveResponse = resolve;
        });
        
        res.json = jest.fn().mockImplementation((data) => {
            resolveResponse(data);
            return res;
        });

        fs.unlink.mockImplementation((path, callback) => callback(null));

        downloadActivityHistoryReport(req, res);
        await responsePromise;

        // Verify path.join was called correctly for directory
        expect(path.join).toHaveBeenCalledWith("/root", "public", "activityData");
        
        // Verify path.join was called correctly for file
        expect(path.join).toHaveBeenCalledWith(
            "/root/public/activityData",
            "Chirayu_activity_report.pdf"
        );
    });
});