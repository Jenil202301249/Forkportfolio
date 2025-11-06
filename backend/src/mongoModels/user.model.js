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
}

export async function addActivityHistory(email, newActivity) {
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
}

export async function getRecentSecurityAlerts(email) {
    const user = await User.findOne(
        { email },
        { securityAlerts: { $slice: 3 } }
    );
    return user?.securityAlerts || [];
}

export async function getRecentActivityHistory(email) {
    const user = await User.findOne(
        { email },
        { activityHistory: { $slice: 4 } }
    );
    return user?.activityHistory || [];
}

export async function getAllSecurityAlerts(email) {
    const user = await User.findOne({ email }, { securityAlerts: 1, _id: 0 });
    return user?.securityAlerts || [];
}

export async function getAllActivityHistory(email) {
    const user = await User.findOne({ email }, { activityHistory: 1, _id: 0 });
    return user?.activityHistory || [];
}

export async function getSecurityAlertsByToken(token) {
    const result = await User.aggregate([
        { $unwind: "$securityAlerts" },
        { $match: { "securityAlerts.token": token } },
        { $replaceRoot: { newRoot: "$securityAlerts" } }
    ]);
    return result;
}

export async function getActivityHistoryByToken(token) {
    const result = await User.aggregate([
        { $unwind: "$activityHistory" },
        { $match: { "activityHistory.token": token } },
        { $replaceRoot: { newRoot: "$activityHistory" } }
    ]);
    return result;
}

export async function deleteSecurityAlertsByEmail(email) {
    return await User.updateOne({ email }, { $set: { securityAlerts: [] } });
}

export async function deleteActivityHistoryByEmail(email) {
    return await User.updateOne({ email }, { $set: { activityHistory: [] } });
}
