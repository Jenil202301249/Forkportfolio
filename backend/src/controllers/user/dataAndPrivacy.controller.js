const dataAndPrivacy = async (req, res) => {
    try {
        const data = {
            aisuggestion: req.user.aisuggestion,
        };
        return res.status(200).json({ success: true, data: data });
    } catch (error) {
        console.error("data and privacy error",error);
        return res.status(500).json({ success: false, message: "failed to fetch data, please try again" });
    }
};

export { dataAndPrivacy };
