import { describe, it, beforeEach, expect, vi } from "vitest";
import "@testing-library/react";
import axios from "axios";
import { MyProfileHandlers } from "../../src/utils/MyProfileHandlers";
import { validateNameStrength } from "../../src/utils/validation.js";
import "@testing-library/jest-dom";

// ----------------------
// Mock axios
// ----------------------
vi.mock("axios", () => ({
  default: {
    patch: vi.fn(),
    post: vi.fn(),
    defaults: { withCredentials: false }
  }
}));

// ----------------------
// Mock validateNameStrength
// ----------------------
vi.mock("../validation.js", () => ({
  validateNameStrength: vi.fn(),
}));

describe("MyProfileHandlers() methods", () => {
  let setUserInfo,
    setIsEditingInfo,
    setIsSendingOtp,
    setOtp,
    setOtpError,
    setResendCountdown,
    setIsVerifyingOtp,
    setConfirmPass,
    setCurrPass,
    setNewPass,
    setShowOtpModal,
    setIsEditingPass;

  beforeEach(() => {
    setUserInfo = vi.fn();
    setIsEditingInfo = vi.fn();
    setIsSendingOtp = vi.fn();
    setOtp = vi.fn();
    setOtpError = vi.fn();
    setResendCountdown = vi.fn();
    setIsVerifyingOtp = vi.fn();
    setConfirmPass = vi.fn();
    setCurrPass = vi.fn();
    setNewPass = vi.fn();
    setShowOtpModal = vi.fn();
    setIsEditingPass = vi.fn();

    vi.clearAllMocks();
    global.alert = vi.fn();
  });

  // ------------------------------------------------
  // HAPPY PATHS
  // ------------------------------------------------
  describe("Happy Paths", () => {
    it("updates profile image successfully", async () => {
      const file = new File(["dummy"], "example.png", { type: "image/png" });

      const { handlePicChange } = MyProfileHandlers({
        setUserInfo,
        setIsEditingInfo,
      });

      axios.patch.mockResolvedValueOnce({});

      const event = { target: { files: [file] } };
      await handlePicChange(event);

      expect(setUserInfo).toHaveBeenCalled();
      expect(setIsEditingInfo).toHaveBeenCalledWith(false);
    });

    it("updates profile name successfully", async () => {
      const editedName = "Valid Name";

      const { handleSaveName } = MyProfileHandlers({
        setUserInfo,
        setIsEditingInfo,
        editedName,
      });

      validateNameStrength.mockReturnValueOnce(true);
      axios.patch.mockResolvedValueOnce({});

      await handleSaveName();

      expect(validateNameStrength).toHaveBeenCalledWith(editedName);
      expect(setUserInfo).toHaveBeenCalled();
      expect(setIsEditingInfo).toHaveBeenCalledWith(false);
    });

    it("sends OTP successfully when passwords match", async () => {
      const currPass = "old";
      const newPass = "new";
      const confirmPass = "new";

      const { handleSavePass } = MyProfileHandlers({
        currPass,
        newPass,
        confirmPass,
        setIsSendingOtp,
        setShowOtpModal,
        setOtp,
        setOtpError,
        setResendCountdown,
      });

      axios.patch.mockResolvedValueOnce({});

      await handleSavePass();

      expect(setIsSendingOtp).toHaveBeenCalledWith(true);
      expect(setShowOtpModal).toHaveBeenCalledWith(true);
      expect(setOtp).toHaveBeenCalledWith("");
      expect(setOtpError).toHaveBeenCalledWith("");
      expect(setResendCountdown).toHaveBeenCalledWith(30);
    });
  });

  // ------------------------------------------------
  // EDGE CASES
  // ------------------------------------------------
  describe("Edge Cases", () => {
    it("alerts invalid file type", async () => {
      const file = new File(["dummy"], "example.txt", { type: "text/plain" });

      const { handlePicChange } = MyProfileHandlers({
        setUserInfo,
        setIsEditingInfo,
      });

      const event = { target: { files: [file] } };
      await handlePicChange(event);

      expect(global.alert).toHaveBeenCalledWith(
        "Invalid file, Please select a valid file!"
      );
    });

    it("alerts invalid name", async () => {
      const editedName = "Bad";

      const { handleSaveName } = MyProfileHandlers({
        setUserInfo,
        setIsEditingInfo,
        editedName,
      });

      validateNameStrength.mockReturnValueOnce(false);

      await handleSaveName();

      expect(validateNameStrength).toHaveBeenCalledWith(editedName);
      expect(global.alert).toHaveBeenCalledWith("Invalid Name!");
    });

    it("should NOT send OTP when passwords do NOT match", async () => {
      const currPass = "old";
      const newPass = "new";
      const confirmPass = "wrong";

      const { handleSavePass } = MyProfileHandlers({
        currPass,
        newPass,
        confirmPass,
        setIsSendingOtp,
        setShowOtpModal,
        setOtp,
        setOtpError,
        setResendCountdown,
      });

      await handleSavePass();

      expect(setIsSendingOtp).not.toHaveBeenCalled();
      expect(setShowOtpModal).not.toHaveBeenCalled();
    });
  });
});
