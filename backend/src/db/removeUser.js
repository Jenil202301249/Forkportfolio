import { sql } from "./dbConnection.js";

const deleteUserByEmail = async (email) => {
    try {
        const row = await sql`Delete FROM "user" WHERE email = ${email}`;
        return row;
    } catch (error) {
        console.error('Database error - deleteUserByEmail');
        return null;
    }
};
export { deleteUserByEmail };
