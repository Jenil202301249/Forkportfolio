import { sql } from "./dbConnection.js";

const updateTheme = async (email, theme) => {
    try {
        const result =
            await sql`UPDATE "user" SET theme=${theme} WHERE email=${email} RETURNING id`;
        return result;
    } catch (error) {
        console.error("Error updating theme:", error);
        return null;
    }
};

const updateDashboardLayout = async (email, dashboardlayout) => {
    try {
        const result =
            await sql`UPDATE "user" SET dashboardlayout=${dashboardlayout} WHERE email=${email} RETURNING id`;
        return result;
    } catch (error) {
        console.error("Error updating dashboard layout:", error);
        return null;
    }
};

export { updateTheme, updateDashboardLayout };
