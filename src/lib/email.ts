import nodemailer from 'nodemailer';

// Use a mock transport for development/testing if no SMTP config is provided
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.SMTP_PORT || '587'),
    auth: {
        user: process.env.SMTP_USER || 'ethereal.user@ethereal.email',
        pass: process.env.SMTP_PASS || 'ethereal.pass',
    },
});

export async function sendOtpEmail(to: string, otp: string) {
    const isMock = !process.env.SMTP_HOST || process.env.SMTP_HOST === 'smtp.example.com' || process.env.SMTP_HOST.trim() === '';

    // In actual production, this would send an email. For now, we just log it
    // if we don't have explicit SMTP settings.
    if (isMock) {
        console.log(`\n========================================`);
        console.log(`MOCK EMAIL SENT TO: ${to}`);
        console.log(`YOUR OTP IS: ${otp}`);
        console.log(`========================================\n`);
        return true;
    }

    try {
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || '"FMS System" <noreply@example.com>',
            to,
            subject: 'Your Verification Code',
            text: `Your verification code is: ${otp}. It expires in 10 minutes.`,
            html: `<p>Your verification code is: <strong>${otp}</strong>. It expires in 10 minutes.</p>`,
        });
        console.log('Message sent: %s', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Failed to send email');
    }
}
