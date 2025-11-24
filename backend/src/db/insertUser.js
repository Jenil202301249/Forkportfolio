import { sql } from "./dbConnection.js"; 

const insertUser = async ({ name, email, Password, method}) => {
    if(!name || !email || !Password || !method){
        return null;
    }
    try {
        const result = await sql`INSERT INTO "user" (name,email,password,registrationmethod) VALUES (${name},${email},${Password},${method})RETURNING id, email`;
        if(!result) {
            return null;
        }
        return result; 
    } catch (error) {
        console.error('Error inserting user:', error);
        return null;
    }
}
export { insertUser };