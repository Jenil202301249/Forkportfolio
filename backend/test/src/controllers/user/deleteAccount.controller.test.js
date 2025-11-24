jest.mock("../../../../src/utils/removeOldProfile.js", () => ({
  removeOldProfileImagesFromCloudionary: {
    add: jest.fn()
  }
}));
jest.mock("../../../../src/db/removeUser.js");
jest.mock("../../../../src/mongoModels/user.model.js");
jest.mock("../../../../src/utils/removeOldProfile.js");
jest.mock("../../../../src/utils/cloudinary.js");
jest.mock("../../../../src/db/dbConnection.js", () => ({
  sql: jest.fn()
}));
import { defaultProfileImage } from "../../../../constants.js";
import { deleteUserByEmail } from "../../../../src/db/removeUser.js";
import { deleteActivityHistoryByEmail, deleteSecurityAlertsByEmail } from "../../../../src/mongoModels/user.model.js";
import { deleteFromCloudinary } from "../../../../src/utils/cloudinary.js";
import { removeOldProfileImagesFromCloudionary } from "../../../../src/utils/removeOldProfile.js";
import { deleteAccount } from '../../../../src/controllers/user/deleteAccount.controller';


describe('deleteAccount() deleteAccount method', () => {
    let req, res;

    beforeEach(() => {
        req = {
            user: {
                email: 'test@example.com',
                profileimage: "https://res.cloudinary.com/happy.jpg"
            }
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            clearCookie: jest.fn().mockReturnThis()
        };
    });

    describe('Happy paths', () => {
        it('should delete user account and related data successfully', async () => {
            // Arrange
            deleteUserByEmail.mockResolvedValue(true);
            deleteActivityHistoryByEmail.mockResolvedValue(true);
            deleteSecurityAlertsByEmail.mockResolvedValue(true);
            deleteFromCloudinary.mockResolvedValue(true);

            // Act
            await deleteAccount(req, res);

            // Assert
            expect(deleteUserByEmail).toHaveBeenCalledWith(req.user.email);
            expect(deleteActivityHistoryByEmail).toHaveBeenCalledWith(req.user.email);
            expect(deleteSecurityAlertsByEmail).toHaveBeenCalledWith(req.user.email);
            expect(deleteFromCloudinary).toHaveBeenCalledWith('happy');
            expect(removeOldProfileImagesFromCloudionary.add).not.toHaveBeenCalledWith('happy');
            expect(res.clearCookie).toHaveBeenCalledWith('token', {
                httpOnly: true,
                secure: true,
                sameSite: 'none',
                path: '/'
            });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Account deleted successfully' });
        });

        it('should not attempt to delete default profile image', async () => {
            // Arrange
            req.user.profileimage = defaultProfileImage;
            deleteUserByEmail.mockResolvedValue(true);

            // Act
            await deleteAccount(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Account deleted successfully' });
        });
    });

    describe('Edge cases', () => {
        it('should handle database error when deleting user', async () => {
            // Arrange
            deleteUserByEmail.mockResolvedValue(false);

            // Act
            await deleteAccount(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(503);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Database error while deleting account. Please try again later'
            });
        });

        it('should handle error when deleting profile image from Cloudinary', async () => {
            // Arrange
            deleteUserByEmail.mockResolvedValue(true);
            deleteActivityHistoryByEmail.mockResolvedValue(true);
            deleteSecurityAlertsByEmail.mockResolvedValue(true);
            deleteFromCloudinary.mockResolvedValue(false);

            // Act
            await deleteAccount(req, res);

            // Assert
            expect(removeOldProfileImagesFromCloudionary.add).toHaveBeenCalledWith('happy');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Account deleted successfully' });
        });

        it('should handle unexpected errors gracefully', async () => {
            // Arrange
            deleteUserByEmail.mockRejectedValue(new Error('Unexpected error'));

            // Act
            await deleteAccount(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'failed to delete account, please try again'
            });
        });
    });
});