import { checkNameSyntax } from "../../utils/checkUserSyntax.js";
import { 
    updateProfileName,
    updateProfileInvestmentExperience,
    updateProfileRiskProfile,
    updateProfileFinancialGoals,
    updateProfileInvestmentHorizon } from "../../db/updateProfileInfo.js";
import { addActivityHistory } from "../../mongoModels/user.model.js";

const updateProfileNameController = async (req, res) => {
    try {
        const { name } = req.body;
        
        if (!name) {
            return res.status(400).json({
                success: false,
                message: "name is required.",
            });
        }

        const isValidName = checkNameSyntax(name);

        if (!isValidName.success) {
            return res
                .status(422)
                .json({ success: false, message: result.message });
        }

        const email = req.user.email;
        const prevName = req.user.name;

        if (name === prevName) {
            return res
                .status(200)
                .json({ success: true, message: "Nothing to update." });
        }

        const nameUpdateStatus = await updateProfileName(email, name);

        if (!nameUpdateStatus ) {
            return res.status(503).json({
                success: false,
                message: "Database error occurred while updating profile name.",
            });
        }

        if (nameUpdateStatus.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Error updating profile name.",
            });
        }

        req.user.name = name;

        const newActivity = {
            os_type: req.activeSession.osType,
            browser_type: req.activeSession.browserType,
            type: "name",
            message: `Updated profile name from ${prevName} to ${name}`,
            token: req.cookies.token,
        };

        await addActivityHistory(email, newActivity);

        return res.status(200).json({
            success: true,
            message: "Profile name updated successfully.",
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "failed to update profile name, please try again" });
    }
};

const updateProfileInvestmentExperienceController = async (req, res) => {
    try {
        const { investmentExperience } = req.body;
        if (!investmentExperience) {
            return res.status(400).json({
                success: false,
                message: "investment experience is required.",
            });
        }
        const email = req.user.email;
        const prevInvestmentExperience = req.user.investmentexperience;

        if (investmentExperience === prevInvestmentExperience) {
            return res
                .status(200)
                .json({ success: true, message: "Nothing to update." });
        }

        const investmentExperienceUpdateStatus =
            await updateProfileInvestmentExperience(
                email,
                investmentExperience
            );

        if (!investmentExperienceUpdateStatus) {
            return res.status(503).json({
                success: false,
                message: "Error updating profile investment experience.",
            });
        }

        if (investmentExperienceUpdateStatus.length === 0) {
            return res.status(410).json({
                success: false,
                message: "Error updating profile investment experience.",
            });
        }

        req.user.investmentexperience = investmentExperience;

        const newActivity = {
            os_type: req.activeSession.osType,
            browser_type: req.activeSession.browserType,
            type: "investmentExperience",
            message: `Updated profile investment experience from ${prevInvestmentExperience} to ${investmentExperience}`,
            token: req.cookies.token,
        };

        await addActivityHistory(email, newActivity);

        return res.status(200).json({
            success: true,
            message: "Profile investment experience updated successfully.",
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "failed to update profile investment experience, please try again" });
    }
};

const updateProfileRiskProfileController = async (req, res) => {
    try {
        const { riskProfile } = req.body;
        if (!riskProfile) {
            return res.status(400).json({
                success: false,
                message: "riskProfile is required.",
            });
        }
        const email = req.user.email;
        const prevRiskProfile = req.user.riskprofile;

        if (prevRiskProfile === riskProfile) {
            return res
                .status(200)
                .json({ success: true, message: "Nothing to update." });
        }

        const financialGoalsUpdateStatus = await updateProfileRiskProfile(
            email,
            riskProfile
        );

        if (!financialGoalsUpdateStatus) {
            return res.status(503).json({
                success: false,
                message: "Database error occurred while updating risk profile.",
            });
        }

        if (financialGoalsUpdateStatus.length === 0) {
            return res.status(410).json({
                success: false,
                message: "Error updating risk profile.",
            });
        }

        req.user.riskprofile = riskProfile;

        const newActivity = {
            os_type: req.activeSession.osType,
            browser_type: req.activeSession.browserType,
            type: "riskProfile",
            message: `Updated profile risk profile from ${prevRiskProfile} to ${riskProfile}`,
            token: req.cookies.token,
        };

        await addActivityHistory(email, newActivity);

        return res.status(200).json({
            success: true,
            message: "risk profile updated successfully.",
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "failed to update risk profile, please try again" });
    }
};

const updateProfileFinancialGoalsController = async (req, res) => {
    try {
        const { financialGoals } = req.body;
        if (!financialGoals) {
            return res.status(400).json({
                success: false,
                message: "financialGoals field is required.",
            });
        }
        const email = req.user.email;
        const prevFinancialGoals = req.user.financialgoals;

        if (prevFinancialGoals === financialGoals) {
            return res
                .status(200)
                .json({ success: true, message: "Nothing to update." });
        }

        const financialGoalsUpdateStatus = await updateProfileFinancialGoals(
            email,
            financialGoals
        );

        if (!financialGoalsUpdateStatus) {
            return res.status(503).json({
                success: false,
                message: "Database error occurred while updating financial goals.",
            });
        }

        if (financialGoalsUpdateStatus.length === 0) {
            return res.status(410).json({
                success: false,
                message: "Error updating financial goals.",
            });
        }

        req.user.financialgoals = financialGoals;

        const newActivity = {
            os_type: req.activeSession.osType,
            browser_type: req.activeSession.browserType,
            type: "financialGoals",
            message: `Updated profile financial goals from ${prevFinancialGoals} to ${financialGoals}`,
            token: req.cookies.token,
        };

        await addActivityHistory(email, newActivity);

        return res.status(200).json({
            success: true,
            message: "financial goals updated successfully.",
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "failed to update financial goals, please try again" });
    }
};

const updateProfileInvestmentHorizonController = async (req, res) => {
    try {
        const { investmentHorizon } = req.body;
        if (!investmentHorizon) {
            return res.status(400).json({
                success: false,
                message: "investmentHorizon field is required.",
            });
        }
        const email = req.user.email;
        const prevInvestmentHorizon = req.user.investmenthorizon;

        if (prevInvestmentHorizon === investmentHorizon) {
            return res
                .status(200)
                .json({ success: true, message: "Nothing to update." });
        }

        const investmentHorizonUpdateStatus =
            await updateProfileInvestmentHorizon(email, investmentHorizon);

        if (!investmentHorizonUpdateStatus) {
            return res.status(503).json({
                success: false,
                message: "Database error occurred while updating investment horizon.",
            });
        }

        if (investmentHorizonUpdateStatus.length === 0) {
            return res.status(410).json({
                success: false,
                message: "Error updating investment horizon.",
            });
        }

        req.user.investmenthorizon = investmentHorizon;

        const newActivity = {
            os_type: req.activeSession.osType,
            browser_type: req.activeSession.browserType,
            type: "investmentHorizon",
            message: `Updated profile investment horizon from ${prevInvestmentHorizon} to ${investmentHorizon}`,
            token: req.cookies.token,
        };

        await addActivityHistory(email, newActivity);

        return res.status(200).json({
            success: true,
            message: "investment horizon updated successfully.",
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "failed to update investment horizon, please try again" });
    }
};

export {
    updateProfileNameController,
    updateProfileInvestmentExperienceController,
    updateProfileRiskProfileController,
    updateProfileFinancialGoalsController,
    updateProfileInvestmentHorizonController,
};
