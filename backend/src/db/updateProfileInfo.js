import { sql } from "./dbConnection.js";

const updateProfileName = async (email, name) => {
    if (email === null || email === undefined || email === "") return null;
    if (name === null || name === undefined || name === "") return null;
    try {
        const result =
            await sql`UPDATE "user" SET name=${name} WHERE email=${email} RETURNING id`;
        return result;
    } catch (error) {
        console.error("Error updating profile name:", error);
        return null;
    }
};

const updateProfileInvestmentExperience = async (
    email,
    investmentExperience
) => {
    if (email === null || email === undefined || email === "") return null;
    if (investmentExperience === null || investmentExperience === undefined || investmentExperience === "") return null;
    try {
        const result =
            await sql`UPDATE "user" SET investmentExperience=${investmentExperience} WHERE email=${email} RETURNING id`;
        return result;
    } catch (error) {
        console.error("Error updating profile investment experience:", error);
        return null;
    }
};

const updateProfileRiskProfile = async (email, riskProfile) => {
    if (email === null || email === undefined || email === "") return null;
    if (riskProfile === null || riskProfile === undefined || riskProfile === "") return null;
    try {
        const result =
            await sql`UPDATE "user" SET riskProfile=${riskProfile} WHERE email=${email} RETURNING id`;
        return result;
    } catch (error) {
        console.error("Error updating profile risk profile:", error);
        return null;
    }
};

const updateProfileFinancialGoals = async (email, financialGoals) => {
    if (email === null || email === undefined || email === "") return null;
    if (financialGoals === null || financialGoals === undefined || financialGoals === "") return null;
    try {
        const result =
            await sql`UPDATE "user" SET financialGoals=${financialGoals} WHERE email=${email} RETURNING id`;
        return result;
    } catch (error) {
        console.error("Error updating profile financial goals:", error);
        return null;
    }
};

const updateProfileInvestmentHorizon = async (email, investmentHorizon) => {
    if (email === null || email === undefined || email === "") return null;
    if (investmentHorizon === null || investmentHorizon === undefined || investmentHorizon === "") return null;
    try {
        const result =
            await sql`UPDATE "user" SET investmentHorizon=${investmentHorizon} WHERE email=${email} RETURNING id`;
        return result;
    } catch (error) {
        console.error("Error updating profile investment horizon:", error);
        return null;
    }
};

export {
    updateProfileName,
    updateProfileInvestmentExperience,
    updateProfileRiskProfile,
    updateProfileFinancialGoals,
    updateProfileInvestmentHorizon,
};
