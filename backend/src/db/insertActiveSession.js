import { sql } from "./dbConnection.js"; 

const insertActiveSession = async ({ token, email, browser_type, os_type}) => {
    try {
        const result = await sql`INSERT INTO "active_session" (token,email,browser_type,os_type) VALUES (${token},${email},${browser_type},${os_type})RETURNING email`;
        return result; 
    } catch (error) {
<<<<<<< HEAD
        console.log('Database Error - insertActiveSession ',error);
=======
        console.error('Database Error - insertActiveSession',error);
>>>>>>> 2ed7a892d6312e1554e55b060f39dcc9971f8822
        return null;
    }
}
export { insertActiveSession };