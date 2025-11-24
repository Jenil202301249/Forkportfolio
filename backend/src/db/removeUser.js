import { sql } from "./dbConnection.js";

const deleteUserByEmail = async (email) => {
    if(email === null || email === undefined || email === "") return null;
    try {
        const row = await sql`Delete FROM "user" WHERE email = ${email}`;
        return row;
    } catch (error) {
        console.error('Database error - deleteUserByEmail',error);
        return null;
    }
};
export { deleteUserByEmail };