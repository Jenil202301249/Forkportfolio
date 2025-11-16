import { sql } from "./dbConnection.js"; 

const insertActiveSession = async ({ token, email, browser_type, os_type}) => {
    try {
        const result = await sql`INSERT INTO "active_session" (token,email,browser_type,os_type) VALUES (${token},${email},${browser_type},${os_type})RETURNING email`;
        return result; 
    } catch (error) {
        console.error('Database Error - insertActiveSession',error);
        return null;
    }
}
export { insertActiveSession };