import { sql } from "./dbConnection.js";

const searchUserByEmail = async (email) => {
    try {
        const row = await sql`SELECT * FROM "user" WHERE email = ${email}`;
        return row;
    } catch (error) {
        console.error('Database error - searchUserByEmail',error);
        return null;
    }
};
export { searchUserByEmail };
