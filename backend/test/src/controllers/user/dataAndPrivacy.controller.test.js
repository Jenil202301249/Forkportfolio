import { dataAndPrivacy } from "../../../../src/controllers/user/dataAndPrivacy.controller.js";

describe("dataAndPrivacy.controller.js", () => {
    let req, res;

    beforeEach(() => {
        jest.clearAllMocks();

        req = {
            user: { aisuggestion: true },
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
    });

    // ---------- SUCCESS PATH ----------
    it("returns 200 with aisuggestion data", async () => {
        await dataAndPrivacy(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            data: {
                aisuggestion: true,
            },
        });
    });

    // ---------- CATCH BLOCK ----------
    it("returns 500 when an exception occurs", async () => {
        const spy = jest.spyOn(console, "error").mockImplementation(() => {});

        // Force exception
        req.user = null;

        await dataAndPrivacy(req, res);

        expect(spy).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "failed to fetch data, please try again",
        });
    });
});