import { sql } from "./dbConnection.js";

const updateProfileImage = async (email, profileImage) => {
    if (email === null || email === undefined || email === "") return null;
    if (profileImage === null || profileImage === undefined || profileImage === "") return null;
    try {
        const result =
            await sql`UPDATE "user" SET profileimage=${profileImage} WHERE email=${email} RETURNING id, email, profileimage`;
        return result;
    } catch (error) {
        console.error("Error updating profile image:", error);
        return null;
    }
};

export { updateProfileImage };
