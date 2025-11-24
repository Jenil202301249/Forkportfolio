import { sql } from "./dbConnection.js";

const searchUserByEmail = async (email) => {
    if(email === null || email === undefined || email === "") return null;
    try {
        const row = await sql`SELECT * FROM "user" WHERE email = ${email}`;
        return row;
    } catch (error) {
        console.error('Database error - searchUserByEmail',error);
        return null;
    }
};
export { searchUserByEmail };
