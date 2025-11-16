const createOtpStore = () => {
    const pendingRegistrations = {};
    const cleanupExpiredRegistrations = () => {
        const now = Date.now();
        for (const email in pendingRegistrations) {
            if (pendingRegistrations[email].expiresAt+2*60*1000 < now||pendingRegistrations[email].attempt<=0) {
                delete pendingRegistrations[email];
                console.log(`Cleaned up expired registration for: ${email}`);
            }
        }
    };
    setInterval(cleanupExpiredRegistrations, 60*1000);
    return {
        add: (email, data) => {
            pendingRegistrations[email] = data;
        },
        get: (email) => {
            return pendingRegistrations[email];
        },
        remove: (email) => {
            delete pendingRegistrations[email];
        }
    };
};

export const otpStore = createOtpStore();