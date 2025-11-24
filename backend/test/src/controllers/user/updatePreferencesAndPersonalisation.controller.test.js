import {
    updateThemeController,
    updateDashboardLayoutController
} from "../../../../src/controllers/user/updatePreferencesAndPersonalisation.controller.js";

import * as dbPrefs from "../../../../src/db/updatePreferencesAndPersonalisation.js";

jest.mock("../../../../src/db/updatePreferencesAndPersonalisation.js", () => ({
    updateTheme: jest.fn(),
    updateDashboardLayout: jest.fn(),
}));

describe("updatePreferencesAndPersonalisation.controller.js", () => {
    let req, res;

    beforeEach(() => {
        jest.clearAllMocks();

        req = {
            user: {
                email: "user@example.com",
                theme: "dark",
                dashboardlayout: "grid"
            },
            body: {},
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
    });

    // -------------------------------------------------------------------
    //                           updateThemeController
    // -------------------------------------------------------------------

    it("returns 400 when theme is missing", async () => {
        req.body.theme = "";

        await updateThemeController(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "theme is required",
        });
    });

    it("returns 200 when theme is same as previous", async () => {
        req.body.theme = "dark";

        await updateThemeController(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: "Nothing to update",
        });
    });

    it("returns 503 when updateTheme returns null", async () => {
        req.body.theme = "light";
        dbPrefs.updateTheme.mockResolvedValue(null);

        await updateThemeController(req, res);

        expect(res.status).toHaveBeenCalledWith(503);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Database error while updating theme",
        });
    });

    it("returns 410 when updateTheme returns empty array", async () => {
        req.body.theme = "light";
        dbPrefs.updateTheme.mockResolvedValue([]);

        await updateThemeController(req, res);

        expect(res.status).toHaveBeenCalledWith(410);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "User not found",
        });
    });

    it("successfully updates theme and returns 200", async () => {
        req.body.theme = "light";
        dbPrefs.updateTheme.mockResolvedValue([1]);

        await updateThemeController(req, res);

        expect(req.user.theme).toBe("light");

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: "Theme updated successfully",
        });
    });

    it("returns 500 on unexpected error", async () => {
        const spy = jest.spyOn(console, "error").mockImplementation(() => {});
        req.body.theme = "light";
        dbPrefs.updateTheme.mockRejectedValue(new Error("fail"));

        await updateThemeController(req, res);

        expect(spy).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "failed to update theme, please try again",
        });
    });

    // -------------------------------------------------------------------
    //                   updateDashboardLayoutController
    // -------------------------------------------------------------------

    it("returns 400 when dashboardlayout is missing", async () => {
        req.body.dashboardlayout = "";

        await updateDashboardLayoutController(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "dashboardlayout is required",
        });
    });

    it("returns 200 when dashboardlayout is same as previous", async () => {
        req.body.dashboardlayout = "grid";

        await updateDashboardLayoutController(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: "Nothing to update",
        });
    });

    it("returns 503 when updateDashboardLayout returns null", async () => {
        req.body.dashboardlayout = "list";
        dbPrefs.updateDashboardLayout.mockResolvedValue(null);

        await updateDashboardLayoutController(req, res);

        expect(res.status).toHaveBeenCalledWith(503);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Database error while updating dashboard layout",
        });
    });

    it("returns 410 when updateDashboardLayout returns empty array", async () => {
        req.body.dashboardlayout = "list";
        dbPrefs.updateDashboardLayout.mockResolvedValue([]);

        await updateDashboardLayoutController(req, res);

        expect(res.status).toHaveBeenCalledWith(410);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "User not found",
        });
    });

    it("successfully updates dashboard layout and returns 200", async () => {
        req.body.dashboardlayout = "list";
        dbPrefs.updateDashboardLayout.mockResolvedValue([1]);

        await updateDashboardLayoutController(req, res);

        expect(req.user.dashboardlayout).toBe("list");

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: "Dashboard layout updated successfully",
        });
    });

    it("returns 500 on unexpected error (dashboardlayout)", async () => {
        const spy = jest.spyOn(console, "error").mockImplementation(() => {});
        req.body.dashboardlayout = "list";
        dbPrefs.updateDashboardLayout.mockRejectedValue(new Error("boom"));

        await updateDashboardLayoutController(req, res);

        expect(spy).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "failed to update dashboard layout, please try again",
        });
    });
});
