import { sql } from "./dbConnection.js";

const updatePassword = async (email, hashedPassword) => {
    try {
        const result = await sql`UPDATE "user" SET password=${hashedPassword} WHERE email=${email} RETURNING id, email`;
        return result;
    } catch (error) {
        console.error('Error updating password:', error);
        return null;
    }
}
export { updatePassword };