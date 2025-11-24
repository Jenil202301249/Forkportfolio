
jest.mock("../../../../src/utils/stockPriceStore.js", () => ({
  stockPriceStore: {
    get: jest.fn(),
    add: jest.fn()
  }
}));
import { insertTransaction } from "../../../../src/db/insertTransaction.js";
import { addActivityHistory } from "../../../../src/mongoModels/user.model.js";
import { addTransaction } from '../../../../src/controllers/dashBoard/addTransaction.controller.js';

jest.mock("../../../../src/utils/stores/priceRates.js", () => ({}));
jest.mock("../../../../src/db/dbConnection.js", () => ({
  sql: jest.fn()
}));
jest.mock("../../../../src/db/insertTransaction.js");
jest.mock("../../../../src/mongoModels/user.model.js");

describe('addTransaction() addTransaction method', () => {
    let req, res;

    beforeEach(() => {
        req = {
            body: {
                symbol: 'AAPL',
                quantity: 10,
                transaction_type: 'BUY'
            },
            user: {
                email: 'test@example.com'
            },
            activeSession: {
                osType: 'Windows',
                browserType: 'Chrome'
            },
            cookies: {
                token: 'some-token'
            }
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        insertTransaction.mockClear();
        addActivityHistory.mockClear();
    });

    describe('Happy paths', () => {
        it('should add a transaction successfully', async () => {
            // Arrange
            insertTransaction.mockResolvedValue({ success: true });

            // Act
            await addTransaction(req, res);

            // Assert
            expect(insertTransaction).toHaveBeenCalledWith(
                'test@example.com',
                'AAPL',
                10,
                'BUY',
                expect.any(Date)
            );
            expect(addActivityHistory).toHaveBeenCalledWith('test@example.com', expect.any(Object));
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ success: true, message: "Transaction added successfully" });
        });
    });

    describe('Edge cases', () => {
        it('should return 400 if any required field is missing', async () => {
            // Arrange
            req.body.symbol = '';

            // Act
            await addTransaction(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ success: false, message: "All fields are required" });
        });

        it('should return 400 for invalid transaction type', async () => {
            // Arrange
            req.body.transaction_type = 'INVALID';

            // Act
            await addTransaction(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ success: false, message: "Invalid transaction type." });
        });

        it('should return 400 if quantity is equal to zero', async () => {
            // Arrange
            req.body.quantity = 0;

            // Act
            await addTransaction(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ success: false, message: "Quantity must be greater than zero" });
        });
        it('should return 400 if quantity is less than zero', async () => {
            // Arrange
            req.body.quantity = -10;

            // Act
            await addTransaction(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ success: false, message: "Quantity must be greater than zero" });
        });
        it('should return 400 if quantity is string', async () => {
            // Arrange
            req.body.quantity = "ten";

            // Act
            await addTransaction(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ success: false, message: "Quantity must of valid Type" });
        });
        it('should return 400 if quantity is null', async () => {
            // Arrange
            req.body.quantity = null;

            // Act
            await addTransaction(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ success: false, message: "All fields are required" });
        });
        it('should return 503 if insertTransaction fails', async () => {
            // Arrange
            insertTransaction.mockResolvedValue(null);

            // Act
            await addTransaction(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(503);
            expect(res.json).toHaveBeenCalledWith({ success: false, message: "Failed to add transaction" });
        });

        it('should return 504 if insertTransaction returns success false', async () => {
            // Arrange
            insertTransaction.mockResolvedValue({ success: false, message: "Some error" });

            // Act
            await addTransaction(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(504);
            expect(res.json).toHaveBeenCalledWith({ success: false, message: "Some error" });
        });

        it('should return 500 on internal server error', async () => {
            // Arrange
            insertTransaction.mockRejectedValue(new Error('Database error'));

            // Act
            await addTransaction(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ success: false, message: "Internal server error" });
        });
    });
});