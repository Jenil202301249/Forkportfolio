import { sql } from "./dbConnection.js";

const toggleAiSuggestion = async (email) => {
    if(email === null || email === undefined || email === "") return null;
    try {
        const result =
            await sql`UPDATE "user" SET aiSuggestion = NOT aiSuggestion WHERE email=${email} RETURNING id`;
        return result;
    } catch (error) {
        console.error("Error updating password:", error);
        return null;
    }
};
export { toggleAiSuggestion };
