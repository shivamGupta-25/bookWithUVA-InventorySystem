import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Email configuration
const EMAIL_HOST = process.env.EMAIL_HOST;
const EMAIL_PORT = process.env.EMAIL_PORT ? Number(process.env.EMAIL_PORT) : undefined;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM || EMAIL_USER;

// Create transporter
const createTransporter = () => {
	if (!EMAIL_HOST || !EMAIL_PORT || !EMAIL_USER || !EMAIL_PASS) {
		throw new Error("Email configuration missing. Please set EMAIL_HOST, EMAIL_PORT, EMAIL_USER, and EMAIL_PASS.");
	}

	const isSecure = EMAIL_PORT === 465; // true for 465, false for others

	return nodemailer.createTransport({
		host: EMAIL_HOST,
		port: EMAIL_PORT,
		secure: isSecure,
		auth: {
			user: EMAIL_USER,
			pass: EMAIL_PASS,
		},
	});
};

// Send OTP email
export const sendOTPEmail = async (email: string, otp: string, userName: string): Promise<boolean> => {
	try {
		if (!EMAIL_USER || !EMAIL_PASS) {
			console.error("Email configuration not found. Please set EMAIL_USER and EMAIL_PASS environment variables.");
			return false;
		}

		const transporter = createTransporter();

		const mailOptions = {
			from: `"Book with UVA Inventory System" <${EMAIL_FROM}>`,
			to: email,
			subject: "Password Reset - OTP Code",
			html: `
				<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
					<div style="text-align: center; margin-bottom: 30px;">
						<h1 style="color: #2563eb; margin: 0;">Book with UVA</h1>
						<p style="color: #6b7280; margin: 5px 0;">Inventory Management System</p>
					</div>
					
					<div style="background-color: #f8fafc; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
						<h2 style="color: #1f2937; margin-top: 0;">Password Reset Request</h2>
						<p style="color: #374151; line-height: 1.6;">
							Hello ${userName},
						</p>
						<p style="color: #374151; line-height: 1.6;">
							You have requested to reset your password. Please use the following OTP (One-Time Password) to complete the process:
						</p>
						
						<div style="text-align: center; margin: 30px 0;">
							<div style="background-color: #ffffff; border: 2px dashed #d1d5db; padding: 20px; border-radius: 8px; display: inline-block;">
								<span style="font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 8px;">${otp}</span>
							</div>
						</div>
						
						<p style="color: #374151; line-height: 1.6;">
							<strong>Important:</strong>
						</p>
						<ul style="color: #374151; line-height: 1.6;">
							<li>This OTP is valid for 10 minutes only</li>
							<li>Do not share this code with anyone</li>
							<li>If you didn't request this password reset, please ignore this email</li>
						</ul>
					</div>
					
					<div style="text-align: center; color: #6b7280; font-size: 14px;">
						<p>This is an automated message. Please do not reply to this email.</p>
						<p>&copy; ${new Date().getFullYear()} Book with UVA. All rights reserved.</p>
					</div>
				</div>
			`,
		};

		const info = await transporter.sendMail(mailOptions);
		console.log("OTP email sent successfully:", info.messageId);
		return true;
	} catch (error) {
		console.error("Failed to send OTP email:", error);
		return false;
	}
};

// Send password reset success email
export const sendPasswordResetSuccessEmail = async (email: string, userName: string): Promise<boolean> => {
	try {
		if (!EMAIL_USER || !EMAIL_PASS) {
			console.error("Email configuration not found. Please set EMAIL_USER and EMAIL_PASS environment variables.");
			return false;
		}

		const transporter = createTransporter();

		const mailOptions = {
			from: `"Book with UVA Inventory System" <${EMAIL_FROM}>`,
			to: email,
			subject: "Password Reset Successful",
			html: `
				<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
					<div style="text-align: center; margin-bottom: 30px;">
						<h1 style="color: #2563eb; margin: 0;">Book with UVA</h1>
						<p style="color: #6b7280; margin: 5px 0;">Inventory Management System</p>
					</div>
					
					<div style="background-color: #f0fdf4; padding: 30px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #22c55e;">
						<h2 style="color: #1f2937; margin-top: 0;">Password Reset Successful</h2>
						<p style="color: #374151; line-height: 1.6;">
							Hello ${userName},
						</p>
						<p style="color: #374151; line-height: 1.6;">
							Your password has been successfully reset. You can now log in to your account using your new password.
						</p>
						
						<div style="background-color: #ffffff; padding: 20px; border-radius: 8px; margin: 20px 0;">
							<p style="color: #374151; margin: 0; font-weight: 500;">
								If you did not make this change, please contact your administrator immediately.
							</p>
						</div>
					</div>
					
					<div style="text-align: center; color: #6b7280; font-size: 14px;">
						<p>This is an automated message. Please do not reply to this email.</p>
						<p>&copy; ${new Date().getFullYear()} Book with UVA. All rights reserved.</p>
					</div>
				</div>
			`,
		};

		const info = await transporter.sendMail(mailOptions);
		console.log("Password reset success email sent:", info.messageId);
		return true;
	} catch (error) {
		console.error("Failed to send password reset success email:", error);
		return false;
	}
};

export default {
	sendOTPEmail,
	sendPasswordResetSuccessEmail,
};
