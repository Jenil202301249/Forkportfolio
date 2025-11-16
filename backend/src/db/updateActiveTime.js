import { sql } from "./dbConnection.js";

const updateActiveTime = async (token) => {
    try {
        const result = await sql`UPDATE "active_session" SET last_active_time=CURRENT_TIMESTAMP WHERE token=${token} RETURNING email`;
        return result;
    } catch (error) {
        console.error('Database Error - updateActiveTime',error);
        return null;
    }
}
export { updateActiveTime };