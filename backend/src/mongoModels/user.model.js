import mongoose from "mongoose";

const logSchema = new mongoose.Schema(
    {
        os_type: { type: String, required: true },
        browser_type: { type: String, required: true },
        type: { type: String, required: true },
        message: { type: String, required: true },
        token: { type: String, required: true },
    },
    { _id: false, timestamps: true }
);

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    securityAlerts: { type: [logSchema], default: [] },
    activityHistory: { type: [logSchema], default: [] },
});

export const User = mongoose.model("User", userSchema);

export async function addSecurityAlert(email, newAlert) {
    if(!email || !newAlert) return
    try {
        await User.findOneAndUpdate(
            { email },
            {
                $push: {
                    securityAlerts: {
                        $each: [newAlert],
                        $position: 0,
                        $slice: 50,
                    },
                },
            },
            { upsert: true, new: true }
        );
    } catch (error) {
        console.error("error in addSecurityAlert",error);
    }
}

export async function addActivityHistory(email, newActivity) {
    if(!email || !newActivity) return
    try {
        await User.findOneAndUpdate(
            { email },
            {
                $push: {
                    activityHistory: {
                        $each: [newActivity],
                        $position: 0,
                        $slice: 100,
                    },
                },
            },
            { upsert: true, new: true }
        );
    } catch (error) {
        console.error("error in addActivityHistory",error);
    }
}

export async function getRecentSecurityAlerts(email) {
    if(!email) return
    let user = null;
    try {
        user = await User.findOne({ email }, { securityAlerts: { $slice: 3 } });
    } catch (error) {
        console.error("error in getRecentSecurityAlerts",error);
        throw error;
    }
    return user?.securityAlerts || [];
}

export async function getRecentActivityHistory(email) {
    if(!email) return
    let user = null;
    try {
        user = await User.findOne(
            { email },
            { activityHistory: { $slice: 4 } }
        );
    } catch (error) {
        console.error("error in getRecentActivityHistory",error);
        throw error;
    }
    return user?.activityHistory || [];
}

export async function getAllSecurityAlerts(email) {
    if(!email) return
    let user = null;
    try {
        user = await User.findOne({ email }, { securityAlerts: 1, _id: 0 });
    } catch (error) {
        console.error("error in getAllSecurityAlerts",error);
        throw error;
    }
    return user?.securityAlerts || [];
}

export async function getAllActivityHistory(email) {
    if(!email) return
    let user;
    try {
        user = await User.findOne({ email }, { activityHistory: 1, _id: 0 });
    } catch (error) {
        console.error("error in getAllActivityHistory",error);
        throw error;
    }
    return user?.activityHistory || [];
}

export async function getSecurityAlertsByToken(token) {
    if(!token) return
    let result;
    try {
        result = await User.aggregate([
            { $unwind: "$securityAlerts" },
            { $match: { "securityAlerts.token": token } },
            { $replaceRoot: { newRoot: "$securityAlerts" } },
        ]);
    } catch (error) {
        console.error("error in getSecurityAlertsByToken",error);
        throw error;
    }
    return result;
}

export async function getActivityHistoryByToken(token) {
    if(!token) return
    let result;
    try {
        result = await User.aggregate([
            { $unwind: "$activityHistory" },
            { $match: { "activityHistory.token": token } },
            { $replaceRoot: { newRoot: "$activityHistory" } },
        ]);
    } catch (error) {
        console.error("error in getActivityHistoryByToken",error);
        throw error;
    }
    return result;
}

export async function deleteSecurityAlertsByEmail(email) {
    if(!email) return
    try {
        return await User.updateOne(
            { email },
            { $set: { securityAlerts: [] } }
        );
    } catch (error) {
        console.error(`error in deleting security alerts of ${email}`, error);
    }
}

export async function deleteActivityHistoryByEmail(email) {
    if(!email) return
    try {
        return await User.updateOne(
            { email },
            { $set: { activityHistory: [] } }
        );
    } catch (error) {
        console.error(`error in deleting activity history of ${email}`, error);
    }
}
