import nodemailer from "nodemailer";

const sendEmail = async (to, subject, html) => {
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.MAILTRAP_HOST,
            port: Number(process.env.MAILTRAP_PORT),
            auth: {
                user: process.env.MAILTRAP_USER,
                pass: process.env.MAILTRAP_PASS,
            },
        });

        await transporter.verify()

        await transporter.sendMail({
            from: '"Health Vault" <no-reply@healthvault.com>',
            to,
            subject,
            html,
        });
    } catch (error) {
        console.error("Email sending failed:", error);
        throw error;
    }
};

export default sendEmail;