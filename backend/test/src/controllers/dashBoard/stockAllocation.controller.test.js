jest.mock("../../../../src/utils/stockPriceStore.js", () => ({
  stockPriceStore: {
    get: jest.fn(),
    add: jest.fn()
  }
}));
import { getStocksSector } from "../../../../src/db/stockSector.js";
import { getPrice } from "../../../../src/utils/getQuotes.js";
import { getStockAllocation } from '../../../../src/controllers/dashBoard/stockAllocation.controller.js';
jest.mock("../../../../src/db/dbConnection.js", () => ({
  sql: jest.fn()
}));
jest.mock("../../../../src/utils/stores/priceRates.js", () => ({}));
jest.mock("../../../../src/db/stockSector.js");
jest.mock("../../../../src/utils/getQuotes.js");

describe('getStockAllocation() getStockAllocation method', () => {
    let req, res;

    beforeEach(() => {
        req = { user: { email: 'test@example.com' } };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
    });

    describe('Happy Paths', () => {
        it('should return correct allocation for a single stock sector', async () => {
            getStocksSector.mockResolvedValue([{ symbol: 'AAPL', sector: 'Technology', current_holding: 10 }]);
            getPrice.mockResolvedValue({ current: 150 });

            await getStockAllocation(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                labels: ['Technology'],
                values: ['100.00']
            });
        });

        it('should return correct allocation for multiple stock sectors', async () => {
            getStocksSector.mockResolvedValue([
                { symbol: 'AAPL', sector: 'Technology', current_holding: 10 },
                { symbol: 'GOOGL', sector: 'Technology', current_holding: 5 },
                { symbol: 'JPM', sector: 'Finance', current_holding: 8 }
            ]);
            getPrice.mockImplementation((symbol) => {
                if (symbol === 'AAPL') return { current: 150 };
                if (symbol === 'GOOGL') return { current: 100 };
                if (symbol === 'JPM') return { current: 50 };
            });

            await getStockAllocation(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                labels: ['Technology', 'Finance'],
                values: ['83.33', '16.67']
            });
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty stock sector list', async () => {
            getStocksSector.mockResolvedValue([]);

            await getStockAllocation(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                labels: [],
                values: []
            });
        });

        it('should handle missing stock price data gracefully', async () => {
            getStocksSector.mockResolvedValue([{ symbol: 'AAPL', sector: 'Technology', current_holding: 10 }]);
            getPrice.mockResolvedValue(null);

            await getStockAllocation(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                labels: [],
                values: []
            });
        });

        it('should return 503 if stocksSector is null', async () => {
            getStocksSector.mockResolvedValue(null);

            await getStockAllocation(req, res);

            expect(res.status).toHaveBeenCalledWith(503);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: "Failed to get stock from db."
            });
        });

        it('should return 500 on unexpected error', async () => {
            getStocksSector.mockRejectedValue(new Error('Unexpected error'));

            await getStockAllocation(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: "An error occurred while calculating stock allocation."
            });
        });
    });
});