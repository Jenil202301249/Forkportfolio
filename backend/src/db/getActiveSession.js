import { sql } from "./dbConnection.js";

const getAllActiveSessionOfUser = async (email) => {
    try {
        const result =
            await sql`SELECT token,browser_type,os_type,last_active_time FROM "active_session" WHERE email = ${email}`;
        return result;
    } catch (error) {
        console.error("Database Error - getAllActiveSessionOfUser",error);
        return null;
    }
};

const getActiveSessionByToken = async (token) => {
    try {
        const result =
            await sql`SELECT email,browser_type,os_type,last_active_time FROM "active_session" WHERE token = ${token}`;
        return result;
    } catch (error) {
        console.error("Database Error - getActiveSessionByToken",error);
        return null;
    }
};

export { getAllActiveSessionOfUser, getActiveSessionByToken };
