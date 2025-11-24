const getPreferencesAndPersonalisation = async (req, res) => {
    try {
        const data = {
            theme: req?.user?.theme,
            dashboardlayout: req?.user?.dashboardlayout,

        };
        return res.status(200).json({ success: true, data: data });
    } catch (error) {
        console.error("get preferences and personalisation error",error);
        return res.status(500).json({ success: false, message: "failed to fetch data, please try again" });
    }
};

export { getPreferencesAndPersonalisation };
