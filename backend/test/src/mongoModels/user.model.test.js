// @ts-nocheck
import {
  addSecurityAlert,
  addActivityHistory,
  getRecentSecurityAlerts,
  getRecentActivityHistory,
  getAllSecurityAlerts,
  getAllActivityHistory,
  getSecurityAlertsByToken,
  getActivityHistoryByToken,
  deleteSecurityAlertsByEmail,
  deleteActivityHistoryByEmail,
  User
} from "../../../src/mongoModels/user.model.js";

describe("User Model Functions", () => {
  let mockFindOneAndUpdate;
  let mockFindOne;
  let mockUpdateOne;
  let mockAggregate;

  beforeEach(() => {
    mockFindOneAndUpdate = jest.fn();
    mockFindOne = jest.fn();
    mockUpdateOne = jest.fn();
    mockAggregate = jest.fn();

    User.findOneAndUpdate = mockFindOneAndUpdate;
    User.findOne = mockFindOne;
    User.updateOne = mockUpdateOne;
    User.aggregate = mockAggregate;

    jest.clearAllMocks();
  });

  // ======================
  // addSecurityAlert
  // ======================
  describe("addSecurityAlert()", () => {
    const validEmail = "test@example.com";
    const validAlert = { token: "abc", type: "login" };

    it("should call DB for valid inputs", async () => {
      mockFindOneAndUpdate.mockResolvedValue(undefined);

      await addSecurityAlert(validEmail, validAlert);

      expect(mockFindOneAndUpdate).toHaveBeenCalledTimes(1);
    });

    it("should NOT call DB for invalid inputs", async () => {
      await addSecurityAlert("", validAlert);
      await addSecurityAlert(validEmail, "");
      await addSecurityAlert(null, validAlert);
      await addSecurityAlert(validEmail, null);

      expect(mockFindOneAndUpdate).not.toHaveBeenCalled();
    });

    it("should log error on DB failure", async () => {
      const err = new Error("DB error");
      mockFindOneAndUpdate.mockRejectedValue(err);
      const spy = jest.spyOn(console, "error").mockImplementation(() => {});

      await addSecurityAlert(validEmail, validAlert);

      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  // ======================
  // addActivityHistory
  // ======================
  describe("addActivityHistory()", () => {
    const validEmail = "test@example.com";
    const validActivity = { token: "abc", type: "click" };

    it("should call DB for valid inputs", async () => {
      mockFindOneAndUpdate.mockResolvedValue(undefined);

      await addActivityHistory(validEmail, validActivity);

      expect(mockFindOneAndUpdate).toHaveBeenCalledTimes(1);
    });

    it("should NOT call DB for invalid inputs", async () => {
      await addActivityHistory("", validActivity);
      await addActivityHistory(validEmail, "");
      await addActivityHistory(null, validActivity);
      await addActivityHistory(validEmail, null);

      expect(mockFindOneAndUpdate).not.toHaveBeenCalled();
    });

    it("should log error on DB failure", async () => {
      const err = new Error("DB error");
      mockFindOneAndUpdate.mockRejectedValue(err);
      const spy = jest.spyOn(console, "error").mockImplementation(() => {});

      await addActivityHistory(validEmail, validActivity);

      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  // ======================
  // getRecentSecurityAlerts
  // ======================
  describe("getRecentSecurityAlerts()", () => {
    const email = "test@example.com";

    it("should return sliced alerts", async () => {
      mockFindOne.mockResolvedValue({ securityAlerts: [1, 2, 3] });

      const result = await getRecentSecurityAlerts(email);

      expect(result).toEqual([1, 2, 3]);
    });

    it("should return empty array if no alerts", async () => {
      mockFindOne.mockResolvedValue(null);

      const result = await getRecentSecurityAlerts(email);

      expect(result).toEqual([]);
    });

    it("should NOT call DB for invalid email", async () => {
      await getRecentSecurityAlerts("");
      expect(mockFindOne).not.toHaveBeenCalled();
    });

    it("should throw on error", async () => {
      mockFindOne.mockRejectedValue(new Error("DB error"));
      await expect(getRecentSecurityAlerts(email)).rejects.toThrow();
    });
  });

  // ======================
  // getRecentActivityHistory
  // ======================
  describe("getRecentActivityHistory()", () => {
    const email = "test@example.com";

    it("should return sliced history", async () => {
      mockFindOne.mockResolvedValue({ activityHistory: [1, 2, 3] });

      const result = await getRecentActivityHistory(email);

      expect(result).toEqual([1, 2, 3]);
    });

    it("should return empty array if no history", async () => {
      mockFindOne.mockResolvedValue(null);
      const result = await getRecentActivityHistory(email);
      expect(result).toEqual([]);
    });

    it("should NOT call DB for invalid email", async () => {
      await getRecentActivityHistory("");
      expect(mockFindOne).not.toHaveBeenCalled();
    });

    it("should throw on DB error", async () => {
      mockFindOne.mockRejectedValue(new Error("DB error"));
      await expect(getRecentActivityHistory(email)).rejects.toThrow();
    });
  });

  // ======================
  // getAllSecurityAlerts
  // ======================
  describe("getAllSecurityAlerts()", () => {
    const email = "test@example.com";

    it("should return all alerts", async () => {
      mockFindOne.mockResolvedValue({ securityAlerts: [1, 2] });

      const result = await getAllSecurityAlerts(email);

      expect(result).toEqual([1, 2]);
    });

    it("should return empty array if no alerts", async () => {
      mockFindOne.mockResolvedValue(null);
      const result = await getAllSecurityAlerts(email);
      expect(result).toEqual([]);
    });

    it("should NOT call DB for invalid email", async () => {
      await getAllSecurityAlerts("");
      expect(mockFindOne).not.toHaveBeenCalled();
    });

    it("should throw on error", async () => {
      mockFindOne.mockRejectedValue(new Error("DB error"));
      await expect(getAllSecurityAlerts(email)).rejects.toThrow();
    });
  });

  // ======================
  // getAllActivityHistory
  // ======================
  describe("getAllActivityHistory()", () => {
    const email = "test@example.com";

    it("should return history", async () => {
      mockFindOne.mockResolvedValue({ activityHistory: [1] });
      const result = await getAllActivityHistory(email);
      expect(result).toEqual([1]);
    });

    it("should return empty array if none", async () => {
      mockFindOne.mockResolvedValue(null);
      const result = await getAllActivityHistory(email);
      expect(result).toEqual([]);
    });

    it("should NOT call DB for invalid email", async () => {
      await getAllActivityHistory("");
      expect(mockFindOne).not.toHaveBeenCalled();
    });

    it("should throw on error", async () => {
      mockFindOne.mockRejectedValue(new Error("DB error"));
      await expect(getAllActivityHistory(email)).rejects.toThrow();
    });
  });

  // ======================
  // getSecurityAlertsByToken
  // ======================
  describe("getSecurityAlertsByToken()", () => {
    it("should return aggregated results", async () => {
      mockAggregate.mockResolvedValue([1, 2]);

      const result = await getSecurityAlertsByToken("tok");

      expect(result).toEqual([1, 2]);
    });

    it("should NOT call DB for invalid token", async () => {
      await getSecurityAlertsByToken("");
      expect(mockAggregate).not.toHaveBeenCalled();
    });

    it("should throw on DB error", async () => {
      mockAggregate.mockRejectedValue(new Error("DB error"));
      await expect(getSecurityAlertsByToken("tok")).rejects.toThrow();
    });
  });

  // ======================
  // getActivityHistoryByToken
  // ======================
  describe("getActivityHistoryByToken()", () => {
    it("should return results", async () => {
      mockAggregate.mockResolvedValue([1]);

      const result = await getActivityHistoryByToken("tok");

      expect(result).toEqual([1]);
    });

    it("should NOT call DB for invalid token", async () => {
      await getActivityHistoryByToken("");
      expect(mockAggregate).not.toHaveBeenCalled();
    });

    it("should throw on DB error", async () => {
      mockAggregate.mockRejectedValue(new Error("DB error"));
      await expect(getActivityHistoryByToken("tok")).rejects.toThrow();
    });
  });

  // ======================
  // deleteSecurityAlertsByEmail
  // ======================
  describe("deleteSecurityAlertsByEmail()", () => {
    const email = "test@example.com";

    it("should call updateOne for valid email", async () => {
      mockUpdateOne.mockResolvedValue({ acknowledged: true });

      const result = await deleteSecurityAlertsByEmail(email);
      expect(result).toEqual({ acknowledged: true });
      expect(mockUpdateOne).toHaveBeenCalledTimes(1);
    });

    it("should NOT call DB for invalid email", async () => {
      await deleteSecurityAlertsByEmail("");
      expect(mockUpdateOne).not.toHaveBeenCalled();
    });

    it("should log error for DB failure", async () => {
      const err = new Error("DB error");
      mockUpdateOne.mockRejectedValue(err);

      const spy = jest.spyOn(console, "error").mockImplementation(() => {});

      await deleteSecurityAlertsByEmail(email);

      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  // ======================
  // deleteActivityHistoryByEmail
  // ======================
  describe("deleteActivityHistoryByEmail()", () => {
    const email = "test@example.com";

    it("should call updateOne for valid email", async () => {
      mockUpdateOne.mockResolvedValue({ acknowledged: true });

      const result = await deleteActivityHistoryByEmail(email);
      expect(result).toEqual({ acknowledged: true });
      expect(mockUpdateOne).toHaveBeenCalledTimes(1);
    });

    it("should NOT call DB for invalid email", async () => {
      await deleteActivityHistoryByEmail("");
      expect(mockUpdateOne).not.toHaveBeenCalled();
    });

    it("should log error on DB failure", async () => {
      const err = new Error("DB error");
      mockUpdateOne.mockRejectedValue(err);

      const spy = jest.spyOn(console, "error").mockImplementation(() => {});

      await deleteActivityHistoryByEmail(email);

      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });
});
