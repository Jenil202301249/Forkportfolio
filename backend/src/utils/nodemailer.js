import nodemailer from 'nodemailer'
import brevoTransport from 'nodemailer-brevo-transport'
import 'dotenv/config';
export const transporter=nodemailer.createTransport(
    new brevoTransport({
        apiKey: process.env.brevo_API,
    })
);
export const sendMail = async (mailOptions) => {
    try {
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};