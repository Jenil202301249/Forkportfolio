import XlsxPopulate from "xlsx-populate";
import fs from "fs";
import path from "path";
import { randomBytes } from "crypto";
import { getPortfolioStockSummary } from "../../db/stockSummary.js";
import { getPortfolioTransactions } from "../../db/userTransactions.js";
import { sendMail } from "../../utils/nodemailer.js";
import { getPortfolioDownloadEmailTemplate } from "../../utils/mailPortfolioDataDownloadTemplate.js";
import { addActivityHistory } from "../../mongoModels/user.model.js";

const createExcel = async (req, res) => {
    let filePath = "";

    try {
        const email = req.user.email;
        const userName = req.user.name;

        const userData = [
            {
                name: req.user.name,
                email: req.user.email,
                investmentExperience: req.user.investmentexperience,
                riskProfile: req.user.riskprofile,
                financialGoals: req.user.financialgoals,
                investmentHorizon: req.user.investmenthorizon,
            },
        ];

        if (!userData) {
            return res
                .status(500)
                .json({ success: false, message: "Internal server error" });
        }

        if (userData.length === 0) {
            return res
                .status(400)
                .json({ success: false, message: "unauthorized request" });
        }

        const userStockSummary = await getPortfolioStockSummary(email);
        if (!userStockSummary) {
            return res
                .status(500)
                .json({ success: false, message: "Database error" });
        }

        const userTransactions = await getPortfolioTransactions(email);
        if (!userTransactions) {
            return res
                .status(500)
                .json({ success: false, message: "Database error" });
        }

        const length = 8;
        const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const bytes = randomBytes(length);
        let password = "";

        for (let i = 0; i < length; i++) {
            password += chars[bytes[i] % chars.length];
        }

        const workbook = await XlsxPopulate.fromBlankAsync();

        const sheet1 = workbook.sheet(0);
        sheet1.name("userData");
        if (Array.isArray(userData) && userData.length == 1) {
            const header1 = Object.keys(userData[0]);
            header1.forEach((h, i) => sheet1.cell(1, i + 1).value(h));

            userData.forEach((row, r) => {
                header1.forEach((h, c) =>
                    sheet1.cell(r + 2, c + 1).value(row[h])
                );
            });
        }

        const sheet2 = workbook.addSheet("StockSummary");
        if (Array.isArray(userStockSummary) && userStockSummary.length > 0) {
            const header2 = Object.keys(userStockSummary[0]);
            header2.forEach((h, i) => sheet2.cell(1, i + 1).value(h));

            userStockSummary.forEach((row, r) => {
                header2.forEach((h, c) =>
                    sheet2.cell(r + 2, c + 1).value(row[h])
                );
            });
        }

        const sheet3 = workbook.addSheet("TransactionHistory");
        if (Array.isArray(userTransactions) && userTransactions.length > 0) {
            const header3 = Object.keys(userTransactions[0]);
            header3.forEach((h, i) => sheet3.cell(1, i + 1).value(h));

            userTransactions.forEach((row, r) => {
                header3.forEach((h, c) => {
                    if (row[h] instanceof Date) {
                        sheet3
                            .cell(r + 2, c + 1)
                            .value(row[h])
                            .style("numberFormat", "dd-mm-yyyy");
                    } else {
                        sheet3.cell(r + 2, c + 1).value(row[h]);
                    }
                });
            });
        }
        const fileName = `${userName}_portfolio_data.xlsx`;
        const saveDir = path.join("./public/portfolioData");
        const filePath = path.join(saveDir, fileName);
        const buffer = await workbook.outputAsync({ password });
        fs.writeFileSync(filePath, buffer);

        const now = new Date();

        const options = {
            day: "2-digit",
            month: "2-digit",
            year: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
        };

        const formatted = new Intl.DateTimeFormat("en-GB", options).format(now);

        const mailOptions = {
            from: process.env.GOOGLE_USER_EMAIL,
            to: email,
            subject: "Your Complete Portfolio Data",
            html: getPortfolioDownloadEmailTemplate(
                userName,
                formatted,
                password
            ),
            attachments: [
                {
                    filename: fileName,
                    path: filePath,
                },
            ],
        };

        await sendMail(mailOptions);

        const newActivity = {
            os_type: req.activeSession.osType,
            browser_type: req.activeSession.browserType,
            type: "Downloaded Portfolio Data",
            message: "Downloaded Portfolio Data",
            token: req.cookies.token,
        };
        await addActivityHistory(email, newActivity);

        await fs.unlink(filePath, (err) => {
            if (err) console.log("file was opened by another process");
        });

        return res.status(200).json({
            success: true,
            message: "Excel file sent to your email successfully",
        });
    } catch (error) {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        return res.status(500).json({ success: false, message: error.message });
    }
};

export { createExcel };
