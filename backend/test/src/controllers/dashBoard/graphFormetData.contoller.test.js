
import { getHistoricData } from "../../../../src/utils/historicData.js";
import { graphFormetData } from '../../../../src/controllers/dashBoard/graphDataFromet.js';


jest.mock("../../../../src/utils/historicData.js");

describe('graphFormetData() graphFormetData method', () => {
  let req, res;

  beforeEach(() => {
    req = { query: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  describe('Happy paths', () => {
    it('should return formatted data when valid ticker is provided', async () => {
      req.query.ticker = 'AAPL';
      const mockData = [
        { date: new Date('2022-01-01'), close: 150.123 },
        { date: new Date('2022-01-02'), close: 152.456 },
      ];
      getHistoricData.mockResolvedValue(mockData);

      await graphFormetData(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        x: ['2022-01-01', '2022-01-02'],
        y: [150.12, 152.46],
        type: 'scatter',
        mode: 'lines',
        name: 'AAPL Price',
      });
    });
  });

  describe('Edge cases', () => {
    it('should return 400 error when ticker is not provided', async () => {
      await graphFormetData(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Ticker symbol is required.',
      });
    });

    it('should return 504 error when getHistoricData does not return an array', async () => {
      req.query.ticker = 'AAPL';
      getHistoricData.mockResolvedValue(null);

      await graphFormetData(req, res);

      expect(res.status).toHaveBeenCalledWith(504);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to fetch valid data.',
      });
    });

    it('should return 500 error when getHistoricData throws an error', async () => {
      req.query.ticker = 'AAPL';
      const errorMessage = 'Network Error';
      getHistoricData.mockRejectedValue(new Error(errorMessage));

      await graphFormetData(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: errorMessage,
      });
    });
  });
});