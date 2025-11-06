import { sql } from "./dbConnection.js";

const deleteActiveSessionByToken = async (token) => {
    try {
        const row = await sql`Delete FROM "active_session" WHERE token = ${token}`;
        return row;
    } catch (error) {
        console.log('Database error - deleteAcriveSessionByToken');
        return null;
    }
};

const deleteActiveSessionByEmail = async (email) => {
    try {
        const row = await sql`Delete FROM "active_session" WHERE email = ${email}`;
        return row;
    } catch (error) {
        console.log('Database error - deleteAcriveSessionByEmail');
        return null;
    }
};

export { deleteActiveSessionByToken, deleteActiveSessionByEmail };