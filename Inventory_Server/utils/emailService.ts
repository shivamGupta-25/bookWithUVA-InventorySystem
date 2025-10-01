import dotenv from "dotenv";
import sgMail from "@sendgrid/mail";
import { otpEmailHtml, passwordResetSuccessHtml } from "./emailTemplates.js";

dotenv.config();

// SendGrid configuration
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || process.env.EMAIL_FROM || process.env.EMAIL_USER;

if (!SENDGRID_API_KEY) {
	console.warn("SENDGRID_API_KEY is not set. Email sending will fail until it's configured.");
} else {
	try {
		sgMail.setApiKey(SENDGRID_API_KEY);
	} catch (e) {
		console.error("Failed to initialize SendGrid SDK:", e);
	}
}

// Send OTP email
export const sendOTPEmail = async (email: string, otp: string, userName: string): Promise<boolean> => {
	try {
		if (!SENDGRID_API_KEY) {
			console.error("SendGrid configuration not found. Please set SENDGRID_API_KEY environment variable.");
			return false;
		}
		if (!SENDGRID_FROM_EMAIL) {
			console.error("SENDGRID_FROM_EMAIL is not set. Please set a verified Single Sender email.");
			return false;
		}

		const msg = {
			to: email,
			from: {
				email: String(SENDGRID_FROM_EMAIL),
				name: "Book with UVA Inventory System",
			},
			subject: "Password Reset - OTP Code",
			html: otpEmailHtml({ userName, otp }),
		};

		const [response] = await sgMail.send(msg);
		console.log("OTP email sent successfully:", response?.headers?.["x-message-id"] || response?.statusCode);
		return true;
	} catch (error: any) {
		if (error?.response?.body) {
			console.error("Failed to send OTP email (SendGrid error):", JSON.stringify(error.response.body));
		} else {
			console.error("Failed to send OTP email:", error);
		}
		return false;
	}
};

// Send password reset success email
export const sendPasswordResetSuccessEmail = async (email: string, userName: string): Promise<boolean> => {
	try {
		if (!SENDGRID_API_KEY) {
			console.error("SendGrid configuration not found. Please set SENDGRID_API_KEY environment variable.");
			return false;
		}

		const msg = {
			to: email,
			from: {
				email: String(SENDGRID_FROM_EMAIL),
				name: "Book with UVA Inventory System",
			},
			subject: "Password Reset Successful",
			html: passwordResetSuccessHtml({ userName }),
		};

		const [response] = await sgMail.send(msg);
		console.log("Password reset success email sent:", response?.headers?.["x-message-id"] || response?.statusCode);
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
