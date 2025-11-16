const getProfile = async (req, res) => {
    try {
        const user = {
            name: req.user.name,
            email: req.user.email,
            investmentExperience: req.user.investmentexperience,
            riskProfile: req.user.riskprofile,
            profileImage: req.user.profileimage,
            registrationMethod: req.user.registrationmethod,
            financialGoals: req.user.financialgoals,
            investmentHorizon: req.user.investmenthorizon,
        };
        return res.status(200).json({ success: true, data: user });
    } catch (error) {
        console.error("get profile error",error);
        return res.status(500).json({ success: false, message: "Failed to fetch user profile, please try again" });
    }
};

export { getProfile };
