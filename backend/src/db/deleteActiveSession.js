import { sql } from "./dbConnection.js";

const deleteActiveSessionByToken = async (token) => {
    try {
        const row = await sql`Delete FROM "active_session" WHERE token = ${token}`;
        return row;
    } catch (error) {
        console.error('Database error - deleteAcriveSessionByToken',error);
        return null;
    }
};

const deleteActiveSessionByEmail = async (email) => {
    try {
        const row = await sql`Delete FROM "active_session" WHERE email = ${email}`;
        return row;
    } catch (error) {
        console.error('Database error - deleteAcriveSessionByEmail',error);
        return null;
    }
};

export { deleteActiveSessionByToken, deleteActiveSessionByEmail };