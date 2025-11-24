import { getNews } from "../../../../src/controllers/dashBoard/getNews.controller.js";
import { getData } from "../../../../src/utils/getData.js";

jest.mock("../../../../src/utils/getData.js", () => ({
    getData: jest.fn(),
}));

const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe("getNews Controller", () => {
    let res;

    beforeEach(() => {
        jest.clearAllMocks();
        res = mockResponse();
    });

    describe("Validation", () => {
        it("should return 400 if query param missing", async () => {
            await getNews({ params: {} }, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: "Query is required",
            });
            expect(getData).not.toHaveBeenCalled();
        });

        it("should return 400 if query is empty", async () => {
            await getNews({ params: { query: new String("") } }, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: "Query is required",
            });
        });

    });

    describe("Data Fetching", () => {
        it("should return 504 if getData returns null", async () => {
            getData.mockResolvedValueOnce(null);

            await getNews({ params: { query: "apple" } }, res);

            expect(getData).toHaveBeenCalledWith("apple");
            expect(res.status).toHaveBeenCalledWith(504);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: "No data found for the given query",
            });
        });

        it("should return 504 if getData returns undefined", async () => {
            getData.mockResolvedValueOnce(undefined);

            await getNews({ params: { query: "tesla" } }, res);

            expect(getData).toHaveBeenCalledWith("tesla");
            expect(res.status).toHaveBeenCalledWith(504);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: "No data found for the given query",
            });
        });

        it("should return 200 with news if getData returns valid data", async () => {
            const mockData = { news: [{ title: "A" }, { title: "B" }] };
            getData.mockResolvedValueOnce(mockData);

            await getNews({ params: { query: "microsoft" } }, res);

            expect(getData).toHaveBeenCalledWith("microsoft");
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                news: mockData.news,
            });
        });

        it("should return 200 with news if getData returns valid data with query length 1", async () => {
            const mockData = { news: [{ title: "A" }, { title: "B" }] };
            getData.mockResolvedValueOnce(mockData);

            await getNews({ params: { query: "m" } }, res);

            expect(getData).toHaveBeenCalledWith("m");
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                news: mockData.news,
            });
        });

        it("should handle case where data exists but news is empty", async () => {
            getData.mockResolvedValueOnce({ news: [] });

            await getNews({ params: { query: "nvidia" } }, res);

            expect(getData).toHaveBeenCalledWith("nvidia");
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                news: [],
            });
        });
    });

    describe("Error Handling", () => {
        it("should return 500 if getData throws error", async () => {
            getData.mockRejectedValueOnce(new Error("Network error"));

            await getNews({ params: { query: "failtest" } }, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: "Failed to fetch news",
            });
        });

        it("should return 500 if any synchronous error occurs", async () => {
            getData.mockImplementation(() => {
                throw new Error("Unexpected crash");
            });

            await getNews({ params: { query: "crash" } }, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: "Failed to fetch news",
            });
        });
    });
});
