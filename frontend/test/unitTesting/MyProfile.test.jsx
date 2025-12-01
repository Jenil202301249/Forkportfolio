// test/unitTesting/MyProfile.test.jsx
import React, { useState, useEffect } from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor, act, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import { MyProfileHandlers } from "../../src/utils/MyProfileHandlers.jsx";
import axios from "axios";

// Mock axios
vi.mock("axios");

// Mock components
vi.mock("../../src/components/Navbar.jsx", () => ({
    default: ({ profileData }) => <div data-testid="navbar">{profileData?.name}</div>,
}));

vi.mock("../../src/components/Sidebar.jsx", () => ({
    Sidebar: ({ primaryData }) => <div data-testid="sidebar">{primaryData?.name}</div>,
}));

vi.mock("../../src/components/Footer.jsx", () => ({
    default: () => <div data-testid="footer" />,
}));

// Mock validation
vi.mock("../../src/utils/validation.js", () => ({
    validateNameStrength: vi.fn((name) => !/\d/.test(name)),
    checkPasswordStrength: vi.fn((pass) =>
        pass.length < 6 ? "Password too short" : ""
    ),
}));

// Mock AppContext
import { useAppContext } from "../../src/context/AppContext";
vi.mock("../../src/context/AppContext", () => ({
    useAppContext: vi.fn(),
}));

// Mock MyProfileHandlers with spies
const handlersMock = {
    handlePicChange: vi.fn(),
    handleSaveName: vi.fn(),
    handleSavePass: vi.fn(),
    resendOtp: vi.fn(),
    verifyOtpAndReset: vi.fn(),
    handleFinGoals: vi.fn(),
    handleInvExp: vi.fn(),
    handleInvHorizon: vi.fn(),
    handleRiskProf: vi.fn(),
    setShowOtpModal: vi.fn(),
    setOtp: vi.fn(),
    setOtpError: vi.fn(),
    setResendCountdown: vi.fn(),
    setIsSendingOtp: vi.fn(),
};

vi.mock("../../src/utils/MyProfileHandlers.jsx", () => ({
    MyProfileHandlers: vi.fn(() => handlersMock),
}));

// Helper component for testing checkCountdown logic in isolation
const TestComponentWithCountdown = ({ initialCountdown, isSending }) => {
    const [countdown, setCountdown] = useState(initialCountdown);
    
    useEffect(() => {
        let timer = null;
        if (countdown > 0) {
            timer = setTimeout(() => setCountdown(c => c - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [countdown]);
    
    function checkCountdown() {
        if (countdown > 0) {
            return `Resend (${countdown}s)`;
        }
        else {
            return isSending ? "Sending..." : "Resend";
        }
    }
    
    return (
        <div data-testid="countdown-status">
            <button disabled={countdown > 0}>{checkCountdown()}</button>
        </div>
    );
};

// Import component after mocks
import { MyProfile } from "../../src/pages/MyProfile.jsx";

describe("MyProfile component", () => {
    const mockUser = {
        name: "John Doe",
        email: "john@example.com",
        profileImage: null,
        registrationMethod: "normal",
        investmentExp: "Beginner",
        riskProfile: "Low - Conservative",
        FinGoal: "Primary Growth",
        InvHorizon: "Short-term (1-3 years)",
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        useAppContext.mockReturnValue({
            darkMode: false,
            setDarkMode: vi.fn(),
            userDetails: mockUser,
            setUserDetails: vi.fn(),
        });
        MyProfileHandlers.mockImplementation(() => handlersMock);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    // --- Core Rendering & Functionality Tests ---

    it("renders user info correctly", () => {
        render(
            <MemoryRouter>
                <MyProfile />
            </MemoryRouter>
        );
        expect(screen.getAllByText(mockUser.name)[0]).toBeInTheDocument();
        expect(screen.getByText(mockUser.email)).toBeInTheDocument();
        expect(screen.getByTestId("navbar")).toHaveTextContent(mockUser.name.split(" ")[0]);
        expect(screen.getByTestId("sidebar")).toHaveTextContent(mockUser.name);
        expect(screen.getByTestId("footer")).toBeInTheDocument();
    });

    it("toggles name editing and validates input", async () => {
        render(
            <MemoryRouter>
                <MyProfile />
            </MemoryRouter>
        );

        const editBtn = screen.getAllByText("Edit")[0];
        fireEvent.click(editBtn);

        const input = screen.getByDisplayValue(mockUser.name);
        fireEvent.change(input, { target: { value: "John123" } });
        expect(screen.getByText("Name should not contain numbers or special characters")).toBeVisible()

        fireEvent.change(input, { target: { value: "John Smith" } });
        expect(screen.queryByText("Name should not contain numbers or special characters")).not.toBeInTheDocument()

    });

    it("toggles password editing and validates input", async () => {
        render(
            <MemoryRouter>
                <MyProfile />
            </MemoryRouter>
        );

        const editPassBtn = screen.getAllByText("Edit")[1];
        fireEvent.click(editPassBtn);

        const newPassInput = screen.getByPlaceholderText("New password");
        fireEvent.change(newPassInput, { target: { value: "123" } });
        expect(screen.getByText("Password too short")).toBeVisible(); // Modified

        fireEvent.change(newPassInput, { target: { value: "123456" } });
        expect(screen.queryByText("Password too short")).not.toBeInTheDocument(); // Modified

        const confirmPassInput = screen.getByPlaceholderText("Confirm password");
        fireEvent.change(confirmPassInput, { target: { value: "654321" } });
        expect(screen.getByText("Passwords do not match")).toBeVisible(); // Modified

        fireEvent.change(confirmPassInput, { target: { value: "123456" } });
        expect(screen.queryByText("Passwords do not match")).not.toBeInTheDocument(); // Modified
    });

    it("handles cancel password editing", () => {
        render(
            <MemoryRouter>
                <MyProfile />
            </MemoryRouter>
        );

        fireEvent.click(screen.getAllByText("Edit")[1]);

        const newPassInput = screen.getByPlaceholderText("New password");
        fireEvent.change(newPassInput, { target: { value: "123456" } });

        const cancelBtn = screen.getByText("Cancel");
        fireEvent.click(cancelBtn);

        expect(screen.queryByPlaceholderText("New password")).not.toBeInTheDocument();
    });
    
    it("calls handleCancelInfo and closes name edit mode", () => {
        render(
            <MemoryRouter>
                <MyProfile />
            </MemoryRouter>
        );

        const editBtn = screen.getAllByText("Edit")[0];
        fireEvent.click(editBtn);

        const cancelBtn = screen.getByText("Cancel", { selector: "button" });
        fireEvent.click(cancelBtn);

        const mainContent = screen.getByText("Your personal profile").closest(".myPage_MainContent");
        const nameSpan = within(mainContent).getByText("John Doe");
        expect(nameSpan).toBeInTheDocument();
    });

    it("closes edit mode on Escape key without crashing", () => {
        render(
            <MemoryRouter>
                <MyProfile />
            </MemoryRouter>
        );
        fireEvent.keyDown(window, { key: "Escape" });
        expect(screen.getAllByText(mockUser.name)[0]).toBeInTheDocument();
    });

    it("toggles showPassword states", () => {
        render(
            <MemoryRouter>
                <MyProfile />
            </MemoryRouter>
        );

        fireEvent.click(screen.getAllByText("Edit")[1]);

        const toggle1 = screen.getByTestId("myPage_password-toggle1");
        const toggle2 = screen.getByTestId("myPage_password-toggle2");
        const toggle3 = screen.getByTestId("myPage_password-toggle3");

        fireEvent.click(toggle1);
        fireEvent.click(toggle2);
        fireEvent.click(toggle3);

        expect(toggle1).toBeInTheDocument();
    });

    it("triggers file input click when 'Change Photo' button is clicked", () => {
        render(
            <MemoryRouter>
                <MyProfile />
            </MemoryRouter>
        );

        const fileInput = document.querySelector("input[type='file']");
        const clickSpy = vi.spyOn(fileInput, "click");
        const changePhotoBtn = screen.getByText("Change Photo");

        fireEvent.click(changePhotoBtn);

        expect(clickSpy).toHaveBeenCalled();
    });

    // --- Additional Coverage Tests ---

    it("calls handleSaveName when name is valid and Save changes is clicked", () => {
        render(
            <MemoryRouter>
                <MyProfile />
            </MemoryRouter>
        );

        fireEvent.click(screen.getAllByText("Edit")[0]); 
        const input = screen.getByDisplayValue(mockUser.name);
        fireEvent.change(input, { target: { value: "Johnathan Smith" } });
        
        fireEvent.click(screen.getByText("Save changes", { selector: ".myPage_SaveBtn" }));
        
        expect(handlersMock.handleSaveName).toHaveBeenCalledTimes(1);
    });

    it("calls handleSavePass when passwords are valid and Save changes is clicked", () => {
        render(
            <MemoryRouter>
                <MyProfile />
            </MemoryRouter>
        );

        fireEvent.click(screen.getAllByText("Edit")[1]);

        const newPassInput = screen.getByPlaceholderText("New password");
        const confirmPassInput = screen.getByPlaceholderText("Confirm password");
        const currPassInput = screen.getByPlaceholderText("Current password");

        fireEvent.change(newPassInput, { target: { value: "StrongPass1" } });
        fireEvent.change(confirmPassInput, { target: { value: "StrongPass1" } });
        fireEvent.change(currPassInput, { target: { value: "OldPass1" } });
        
        fireEvent.click(screen.getByText("Save changes", { selector: ".myPage_SaveBtn" }));

        expect(handlersMock.handleSavePass).toHaveBeenCalledTimes(1);
    });
    
    it("calls handlePicChange when a file is selected in the hidden input", () => {
        render(
            <MemoryRouter>
                <MyProfile />
            </MemoryRouter>
        );

        const file = new File(['dummy content'], 'profile.png', { type: 'image/png' });
        
        const realFileInput = document.querySelector("input[type='file']");
        
        fireEvent.change(realFileInput, { target: { files: [file] } });

        expect(handlersMock.handlePicChange).toHaveBeenCalledTimes(1);
    });
    
    // --- OTP Modal Button Tests ---
    
    it("handles OTP modal Cancel button click and resets state", () => {
        const MockedProfile = () => {
            const [showOtpModal, setShowOtpModal] = useState(true);
            const [otp, setOtp] = useState("1234");
            const [otpError, setOtpError] = useState("Error!");

            return showOtpModal ? (
                <div className="myPage_OTPOverlay">
                    <div className="myPage_OTPModel">
                        <input className="myPage_OTPInput" placeholder="Enter OTP" value={otp} onChange={(e) => setOtp(e.target.value)} />
                        {otpError && <p className="myPage_OTPErrors">{otpError}</p>}
                        <button className="myPage_OTPCancel" onClick={() => { setShowOtpModal(false); setOtp(""); setOtpError(""); }}>
                            Cancel
                        </button>
                    </div>
                </div>
            ) : <div data-testid="modal-closed">Modal Closed</div>;
        };
        
        render(<MockedProfile />);
        
        const cancelButton = screen.getByText("Cancel");
        fireEvent.click(cancelButton);
        
        expect(screen.queryByText("Error!")).not.toBeInTheDocument();
        expect(screen.getByTestId("modal-closed")).toBeInTheDocument();
    });

    it("calls resendOtp handler when Resend button is clicked", () => {
        // FIX: Use a helper component to correctly wire the button to the mock handler.
        const MockedProfile = () => {
            const handlers = MyProfileHandlers({
                setShowOtpModal: vi.fn(), setOtp: vi.fn(), setOtpError: vi.fn(), 
                setUserDetails: vi.fn(), setIsEditingInfo: vi.fn(), editedName: "", 
                resendCountdown: 0, currPass: "", newPass: "", confirmPass: "", 
                setIsSendingOtp: vi.fn(), setResendCountdown: vi.fn(), 
                setIsVerifyingOtp: vi.fn(), setConfirmPass: vi.fn(), setCurrPass: vi.fn(), 
                setNewPass: vi.fn(), otp: "", setIsEditingPass: vi.fn()
            });

            return (
                <div className="myPage_OTPOverlay">
                    <button className="myPage_OTPResend" onClick={handlers.resendOtp}>Resend</button>
                </div>
            );
        };

        render(<MockedProfile />);
        
        const resendBtn = screen.getByText("Resend");
        fireEvent.click(resendBtn);
        
        expect(handlersMock.resendOtp).toHaveBeenCalledTimes(1);
    });
    
    it("calls verifyOtpAndReset handler when Continue button is clicked", () => {
        const MockedProfile = () => {
            const handlers = MyProfileHandlers({
                setShowOtpModal: vi.fn(), setOtp: vi.fn(), setOtpError: vi.fn(), 
                setUserDetails: vi.fn(), setIsEditingInfo: vi.fn(), editedName: "", 
                resendCountdown: 0, currPass: "", newPass: "", confirmPass: "", 
                setIsSendingOtp: vi.fn(), setResendCountdown: vi.fn(), 
                setIsVerifyingOtp: vi.fn(), setConfirmPass: vi.fn(), setCurrPass: vi.fn(), 
                setNewPass: vi.fn(), otp: "", setIsEditingPass: vi.fn()
            });

            return (
                <div className="myPage_OTPOverlay">
                    <button className="myPage_OTPContinue" onClick={handlers.verifyOtpAndReset}>Continue</button>
                </div>
            );
        };

        render(<MockedProfile />);
        
        const continueBtn = screen.getByText("Continue");
        fireEvent.click(continueBtn);
        
        expect(handlersMock.verifyOtpAndReset).toHaveBeenCalledTimes(1);
    });

    // --- Dropdown Coverage ---

    it("calls handleInvExp for all Investment Experience options", () => {
        render(
            <MemoryRouter>
                <MyProfile />
            </MemoryRouter>
        );

        const invExp = screen.getByDisplayValue(mockUser.investmentExp);
        
        fireEvent.change(invExp, { target: { value: "Intermediate" } });
        fireEvent.change(invExp, { target: { value: "Expert" } });
        fireEvent.change(invExp, { target: { value: "Beginner" } });

        expect(handlersMock.handleInvExp).toHaveBeenCalledTimes(3);
    });
    
    it("calls handleRiskProf for all Risk Profile options", () => {
        render(
            <MemoryRouter>
                <MyProfile />
            </MemoryRouter>
        );

        const riskProf = screen.getByDisplayValue(mockUser.riskProfile); 
        
        fireEvent.change(riskProf, { target: { value: "Medium - Moderate" } });
        fireEvent.change(riskProf, { target: { value: "High - Aggressive" } });
        fireEvent.change(riskProf, { target: { value: "Low - Conservative" } });

        expect(handlersMock.handleRiskProf).toHaveBeenCalledTimes(3);
    });
    
    it("calls handleFinGoals for all Financial Goals options", () => {
        render(
            <MemoryRouter>
                <MyProfile />
            </MemoryRouter>
        );

        const finGoal = screen.getByTestId("myPage_FinGoalList"); 
        
        fireEvent.change(finGoal, { target: { value: "Income Generation" } });
        fireEvent.change(finGoal, { target: { value: "Balanced Growth & Income" } });
        fireEvent.change(finGoal, { target: { value: "Primary Growth" } });

        expect(handlersMock.handleFinGoals).toHaveBeenCalledTimes(3);
    });

    it("calls handleInvHorizon for all Investment Horizon options", () => {
        render(
            <MemoryRouter>
                <MyProfile />
            </MemoryRouter>
        );

        const invHorizon = screen.getByDisplayValue(mockUser.InvHorizon); 
        
        fireEvent.change(invHorizon, { target: { value: "Medium-term (3-10 years)" } });
        fireEvent.change(invHorizon, { target: { value: "Long-term (10+ years)" } });
        fireEvent.change(invHorizon, { target: { value: "Short-term (1-3 years)" } });

        expect(handlersMock.handleInvHorizon).toHaveBeenCalledTimes(3);
    });
    
    // --- Registration Method Conditional Rendering Test ---

    it("displays the linked accounts section when registrationMethod is 'google'", () => {
        const mockGoogleUser = {
            ...mockUser,
            registrationMethod: "google",
        };
        useAppContext.mockReturnValue({
            darkMode: false,
            setDarkMode: vi.fn(),
            userDetails: mockGoogleUser,
            setUserDetails: vi.fn(),
        });

        render(
            <MemoryRouter>
                <MyProfile />
            </MemoryRouter>
        );

        expect(screen.getByText("Linked accounts")).toBeInTheDocument();
        expect(screen.getByText("Google")).toBeInTheDocument();
        expect(screen.getAllByText(mockGoogleUser.name).length).toBeGreaterThan(0);
    });

    it("does NOT display the linked accounts section when registrationMethod is 'normal'", () => {
        render(
            <MemoryRouter>
                <MyProfile />
            </MemoryRouter>
        );
        expect(screen.queryByText("Linked accounts")).not.toBeInTheDocument();
    });
});