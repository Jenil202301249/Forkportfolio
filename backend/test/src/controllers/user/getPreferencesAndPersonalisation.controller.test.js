import { getPreferencesAndPersonalisation } from "../../../../src/controllers/user/getPreferencesAndPersonalisation.controller.js";

describe("getPreferencesAndPersonalisation.controller.js", () => {
    let req, res;

    beforeEach(() => {
        jest.clearAllMocks();

        req = {
            user: {
                theme: "dark",
                dashboardlayout: "grid",
            },
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
    });

    // ---------- SUCCESS PATH ----------
    it("returns 200 with theme and dashboardlayout", async () => {
        await getPreferencesAndPersonalisation(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            data: {
                theme: "dark",
                dashboardlayout: "grid",
            },
        });
    });

    // ---------- CATCH BLOCK ----------
    it("returns 500 when an exception occurs", async () => {
        const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

        // Force error: create throwing getter
        req.user = {};
        Object.defineProperty(req.user, "theme", {
            get() {
                throw new Error("boom");
            },
        });

        await getPreferencesAndPersonalisation(req, res);

        expect(consoleSpy).toHaveBeenCalled();

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "failed to fetch data, please try again",
        });
    });
});
