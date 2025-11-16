import { updateTheme,updateDashboardLayout } from "../../db/updatePreferencesAndPersonalisation.js";

const updateThemeController = async (req, res) => {
    try {
        const { theme } = req.body;
        if (!theme) {
            return res
                .status(400)
                .json({ success: false, message: "theme is required" });
        }

        const email = req.user.email;
        const prevTheme = req.user.theme;

        if (theme === prevTheme) {
            return res
                .status(200)
                .json({ success: true, message: "Nothing to update" });
        }

        const result = await updateTheme(email, theme);

        if (!result) {
            return res.status(503).json({
                success: false,
                message: "Database error while updating theme",
            });
        }

        if (result.length === 0) {
            return res
                .status(410)
                .json({ success: false, message: "User not found" });
        }

        req.user.theme = theme;

        return res
            .status(200)
            .json({ success: true, message: "Theme updated successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "failed to update theme, please try again" });
    }
};

const updateDashboardLayoutController = async (req, res) => {
    try {
        const { dashboardlayout } = req.body;
        if (!dashboardlayout) {
            return res.status(400).json({
                success: false,
                message: "dashboardlayout is required",
            });
        }

        const email = req.user.email;
        const prevDashboardLayout = req.user.dashboardlayout;

        if (dashboardlayout === prevDashboardLayout) {
            return res
                .status(200)
                .json({ success: true, message: "Nothing to update" });
        }

        const result = await updateDashboardLayout(email, dashboardlayout);

        if (!result) {
            return res.status(503).json({
                success: false,
                message: "Database error while updating dashboard layout",
            });
        }

        if (result.length === 0) {
            return res
                .status(410)
                .json({ success: false, message: "User not found" });
        }

        req.user.dashboardlayout = dashboardlayout;

        return res.status(200).json({
            success: true,
            message: "Dashboard layout updated successfully",
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "failed to update dashboard layout, please try again" });
    }
};

export { updateThemeController, updateDashboardLayoutController };
