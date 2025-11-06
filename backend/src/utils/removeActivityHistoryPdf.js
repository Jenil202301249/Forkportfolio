import fs from "fs";
import path from "path";

const createRemoveActivityHistoryPdf = () => {
    const portfolioDir = path.join("./public/activityData");
    const removeOldFiles = () => {
        const files = fs.readdirSync(portfolioDir);
        const now = Date.now();

        files.forEach(file => {
            const filePath = path.join(portfolioDir, file);
            const stats = fs.statSync(filePath);
            if (file.endsWith(".pdf"))
            {
                if ((now - stats.ctimeMs) >= 60*1000) {
                    fs.unlinkSync(filePath);
                }
            }
        });
    };
    setInterval(removeOldFiles, 60*1000);

    return removeOldFiles;
};

export const removeActivityHistoryPdf = createRemoveActivityHistoryPdf();
