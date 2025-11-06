import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { insightStoxLogo } from "../../constants.js";
export const getPortfolioDownloadEmailTemplate = (username, date, password) => {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const templatePath = path.join(__dirname, "portfolioDataDownloadTemplate.html");

    let htmlTemplate = fs.readFileSync(templatePath, "utf8");
    htmlTemplate = htmlTemplate
        .replace("{USERNAME}", username)
        .replace("{DATE}", date)
        .replace("{LOGO}", insightStoxLogo)
        .replace("{PASSWORD}", password);

    return htmlTemplate;
};
