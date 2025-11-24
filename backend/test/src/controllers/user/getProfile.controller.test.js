import { getProfile } from "../../../../src/controllers/user/getProfile.controller.js";

describe("getProfile", () => {
    let req, res;

    beforeEach(() => {
        // Mock the response object
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
        // Suppress console.log for the error case during testing
        jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
        // Restore console.log implementation
        jest.restoreAllMocks();
    });

    it("should return 200 and all user profile data when req.user is available", async () => {
        // Mock the request object with comprehensive user data
        req = { 
            user: { 
                name: "John Doe",
                email: "john@example.com",
                investmentexperience: "Intermediate",
                riskprofile: "Moderate",
                profileimage: "https://example.com/img.jpg",
                registrationmethod: "Email",
                financialgoals: "Retirement",
                investmenthorizon: "Long-term",
            } 
        };

        await getProfile(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            data: {
                name: "John Doe",
                email: "john@example.com",
                investmentExperience: "Intermediate",
                riskProfile: "Moderate",
                profileImage: "https://example.com/img.jpg",
                registrationMethod: "Email",
                financialGoals: "Retirement",
                investmentHorizon: "Long-term",
            },
        });
    });

    it("should return 500 and an error message if req.user is missing or null", async () => {
        // Mock the request object without a user (simulating missing auth data)
        req = {};

        await getProfile(req, res);

        // The try...catch block will catch the synchronous error (e.g., Cannot read properties of undefined (reading 'name'))
        expect(res.status).toHaveBeenCalledWith(500);
        
        // We expect the JSON body to contain the error message
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: false,
                message: expect.any(String),
            })
        );
    });
});
