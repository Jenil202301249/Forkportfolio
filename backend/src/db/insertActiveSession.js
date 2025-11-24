import { sql } from "./dbConnection.js"; 

const insertActiveSession = async ({ token, email, browser_type, os_type}) => {
    if(token === null || token === undefined || token === "") return null;
    if(email === null || email === undefined || email === "") return null;
    if(browser_type === null || browser_type === undefined || browser_type === "") return null;
    if(os_type === null || os_type === undefined || os_type === "") return null;
    try {
        const result = await sql`INSERT INTO "active_session" (token,email,browser_type,os_type) VALUES (${token},${email},${browser_type},${os_type})RETURNING email`;
        return result; 
    } catch (error) {
        console.error('Database Error - insertActiveSession',error);
        return null;
    }
}
export { insertActiveSession };