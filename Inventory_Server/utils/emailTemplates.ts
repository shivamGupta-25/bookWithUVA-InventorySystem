// Centralized HTML templates for transactional emails

export function otpEmailHtml(params: { userName: string; otp: string }): string {
  const { userName, otp } = params;
  return `
		<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
			<div style="text-align: center; margin-bottom: 30px;">
				<h1 style="color: #2563eb; margin: 0;">Book with UVA</h1>
				<p style="color: #6b7280; margin: 5px 0;">Inventory Management System</p>
			</div>
			<div style="background-color: #f8fafc; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
				<h2 style="color: #1f2937; margin-top: 0;">Password Reset Request</h2>
				<p style="color: #374151; line-height: 1.6;">Hello ${userName},</p>
				<p style="color: #374151; line-height: 1.6;">You have requested to reset your password. Please use the following OTP (One-Time Password) to complete the process:</p>
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
	`;
}

export function passwordResetSuccessHtml(params: { userName: string }): string {
  const { userName } = params;
  return `
		<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
			<div style="text-align: center; margin-bottom: 30px;">
				<h1 style="color: #2563eb; margin: 0;">Book with UVA</h1>
				<p style="color: #6b7280; margin: 5px 0;">Inventory Management System</p>
			</div>
			<div style="background-color: #f0fdf4; padding: 30px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #22c55e;">
				<h2 style="color: #1f2937; margin-top: 0;">Password Reset Successful</h2>
				<p style="color: #374151; line-height: 1.6;">Hello ${userName},</p>
				<p style="color: #374151; line-height: 1.6;">Your password has been successfully reset. You can now log in to your account using your new password.</p>
				<div style="background-color: #ffffff; padding: 20px; border-radius: 8px; margin: 20px 0;">
					<p style="color: #374151; margin: 0; font-weight: 500;">If you did not make this change, please contact your administrator immediately.</p>
				</div>
			</div>
			<div style="text-align: center; color: #6b7280; font-size: 14px;">
				<p>This is an automated message. Please do not reply to this email.</p>
				<p>&copy; ${new Date().getFullYear()} Book with UVA. All rights reserved.</p>
			</div>
		</div>
	`;
}
