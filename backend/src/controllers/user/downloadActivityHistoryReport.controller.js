import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit-table";
import { getAllActivityHistory } from "../../mongoModels/user.model.js";
import { sendMail } from "../../utils/nodemailer.js";
import { getActivityHistoryDownloadEmailTemplate } from "../../utils/mailActivityHistoryReportDownloadTemplate.js";

const downloadActivityHistoryReport = async (req, res) => {
  try {
    const email = req.user.email;
    const name = req.user.name;

    const history = await getAllActivityHistory(email);
    if (!history || history.length === 0) {
      return res.status(404).json({ success: false, message: "No activity found" });
    }

    const filteredData = history.map((item) => ({
      os_type: item.os_type,
      browser_type: item.browser_type,
      type: item.type,
      message: item.message,
      createdAt: new Date(item.createdAt).toLocaleString(),
    }));

    const doc = new PDFDocument({ margin: 40, size: "A4" });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", async () => {
      const pdfBuffer = Buffer.concat(chunks);

      const dirPath = path.join(process.cwd(), "public", "activityData");
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      const fileName = `${name}_activity_report.pdf`;
      const filePath = path.join(dirPath, fileName);
      
      fs.writeFileSync(filePath, pdfBuffer);

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
        subject: "Your Activity History Report",
        html: getActivityHistoryDownloadEmailTemplate(name,formatted),
        attachments: [
          {
            filename: fileName,
            path: filePath,
          },
        ],
      };

      await sendMail(mailOptions);
      
      fs.unlink(filePath, (err) => {
        if (err) console.error("Error deleting PDF file:", err);
      });

      res.status(200).json({
        success: true,
        message: "Activity report emailed successfully",
      });
    });
    
    doc.fontSize(20).text("User Activity History Report", { align: "center" });
    doc.moveDown(0.5);
    doc
      .fontSize(12)
      .text(`Name: ${name}`)
      .text(`Email: ${email}`)
      .text(`Generated on: ${new Date().toLocaleString()}`);
    doc.moveDown(1);

    const table = {
      headers: [
        { label: "OS Type", property: "os_type", width: 80 },
        { label: "Browser", property: "browser_type", width: 80 },
        { label: "Type", property: "type", width: 70 },
        { label: "Message", property: "message", width: 160 },
        { label: "Created At", property: "createdAt", width: 100 },
      ],
      datas: filteredData,
    };

    await doc.table(table, {
      prepareHeader: () => doc.font("Helvetica-Bold").fontSize(12),
      prepareRow: () => doc.font("Helvetica").fontSize(10),
      padding: 5,
      columnSpacing: 10,
    });

    doc.end();
  } catch (err) {
    console.error("Error generating or sending PDF:", err);
    res.status(500).json({
      success: false,
      message: "Error generating or emailing activity report",
    });
  }
};

export { downloadActivityHistoryReport };
