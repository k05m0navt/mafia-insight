import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string
): Promise<void> {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

  // If no API key is configured, log the email instead (for development)
  if (!process.env.RESEND_API_KEY) {
    console.log(
      '[EMAIL SERVICE] Password reset email (RESEND_API_KEY not configured):',
      {
        to: email,
        resetUrl,
      }
    );
    return;
  }

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@example.com',
      to: email,
      subject: 'Reset your password',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset your password</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f9fafb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
              <h1 style="color: #111827; margin-top: 0; font-size: 24px; font-weight: 600;">
                Reset your password
              </h1>
              <p style="color: #6b7280; margin-bottom: 0;">
                You requested to reset your password. Click the button below to create a new password.
              </p>
            </div>
            
            <div style="text-align: center; margin: 32px 0;">
              <a
                href="${resetUrl}"
                style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 16px;"
              >
                Reset password
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
              If the button doesn't work, copy and paste this link into your browser:
            </p>
            <p style="color: #2563eb; font-size: 14px; word-break: break-all;">
              ${resetUrl}
            </p>
            
            <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                <strong>Security notice:</strong> This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
              </p>
            </div>
          </body>
        </html>
      `,
      text: `
Reset your password

You requested to reset your password. Click the link below to create a new password:

${resetUrl}

This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
      `,
    });
  } catch (error) {
    console.error(
      '[EMAIL SERVICE] Failed to send password reset email:',
      error
    );
    // Don't throw - we still want to return success to prevent account enumeration
    // The error is logged for monitoring
  }
}

/**
 * Send email change verification email
 */
export async function sendEmailChangeVerificationEmail(
  oldEmail: string,
  newEmail: string,
  verificationToken: string
): Promise<void> {
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify-email-change?token=${verificationToken}`;

  // If no API key is configured, log the email instead (for development)
  if (!process.env.RESEND_API_KEY) {
    console.log(
      '[EMAIL SERVICE] Email change verification email (RESEND_API_KEY not configured):',
      {
        to: newEmail,
        verifyUrl,
      }
    );
    return;
  }

  try {
    // Send verification email to new email address
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@example.com',
      to: newEmail,
      subject: 'Verify your new email address',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify your new email address</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f9fafb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
              <h1 style="color: #111827; margin-top: 0; font-size: 24px; font-weight: 600;">
                Verify your new email address
              </h1>
              <p style="color: #6b7280; margin-bottom: 0;">
                You requested to change your email address from <strong>${oldEmail}</strong> to <strong>${newEmail}</strong>. Click the button below to verify your new email address.
              </p>
            </div>
            
            <div style="text-align: center; margin: 32px 0;">
              <a
                href="${verifyUrl}"
                style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 16px;"
              >
                Verify Email Address
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
              If the button doesn't work, copy and paste this link into your browser:
            </p>
            <p style="color: #2563eb; font-size: 14px; word-break: break-all;">
              ${verifyUrl}
            </p>
            
            <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                <strong>Security notice:</strong> This link will expire in 24 hours. If you didn't request this email change, please contact support immediately.
              </p>
            </div>
          </body>
        </html>
      `,
      text: `
Verify your new email address

You requested to change your email address from ${oldEmail} to ${newEmail}. Click the link below to verify your new email address:

${verifyUrl}

This link will expire in 24 hours. If you didn't request this email change, please contact support immediately.
      `,
    });

    // Also send confirmation email to old email address
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@example.com',
      to: oldEmail,
      subject: 'Email change requested',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Email change requested</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f9fafb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
              <h1 style="color: #111827; margin-top: 0; font-size: 24px; font-weight: 600;">
                Email change requested
              </h1>
              <p style="color: #6b7280; margin-bottom: 0;">
                A request was made to change your email address from <strong>${oldEmail}</strong> to <strong>${newEmail}</strong>.
              </p>
            </div>
            
            <p style="color: #6b7280; font-size: 14px;">
              If you made this request, please verify your new email address using the link sent to <strong>${newEmail}</strong>.
            </p>
            
            <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; background-color: #fef3c7; border-radius: 8px; padding: 16px;">
              <p style="color: #92400e; font-size: 12px; margin: 0;">
                <strong>Security notice:</strong> If you didn't request this email change, please contact support immediately to secure your account.
              </p>
            </div>
          </body>
        </html>
      `,
      text: `
Email change requested

A request was made to change your email address from ${oldEmail} to ${newEmail}.

If you made this request, please verify your new email address using the link sent to ${newEmail}.

If you didn't request this email change, please contact support immediately to secure your account.
      `,
    });
  } catch (error) {
    console.error(
      '[EMAIL SERVICE] Failed to send email change verification email:',
      error
    );
    // Don't throw - we still want to return success to prevent account enumeration
    // The error is logged for monitoring
  }
}

/**
 * Send email change confirmation emails to old and new addresses
 * Called after email change is successfully verified and completed
 */
export async function sendEmailChangeConfirmationEmails(
  oldEmail: string,
  newEmail: string
): Promise<void> {
  // If no API key is configured, log the emails instead (for development)
  if (!process.env.RESEND_API_KEY) {
    console.log(
      '[EMAIL SERVICE] Email change confirmation emails (RESEND_API_KEY not configured):',
      {
        oldEmail,
        newEmail,
      }
    );
    return;
  }

  try {
    // Send confirmation email to new email address
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@example.com',
      to: newEmail,
      subject: 'Email address changed successfully',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Email address changed successfully</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f0fdf4; border-radius: 8px; padding: 24px; margin-bottom: 24px; border: 1px solid #86efac;">
              <h1 style="color: #166534; margin-top: 0; font-size: 24px; font-weight: 600;">
                ✓ Email address changed successfully
              </h1>
              <p style="color: #166534; margin-bottom: 0;">
                Your email address has been successfully changed from <strong>${oldEmail}</strong> to <strong>${newEmail}</strong>.
              </p>
            </div>
            
            <p style="color: #6b7280; font-size: 14px;">
              You can now sign in using your new email address: <strong>${newEmail}</strong>
            </p>
            
            <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; background-color: #fef3c7; border-radius: 8px; padding: 16px;">
              <p style="color: #92400e; font-size: 12px; margin: 0;">
                <strong>Security notice:</strong> All your existing sessions have been invalidated for security. You will need to sign in again with your new email address.
              </p>
            </div>
          </body>
        </html>
      `,
      text: `
Email address changed successfully

Your email address has been successfully changed from ${oldEmail} to ${newEmail}.

You can now sign in using your new email address: ${newEmail}

Security notice: All your existing sessions have been invalidated for security. You will need to sign in again with your new email address.
      `,
    });

    // Send confirmation email to old email address
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@example.com',
      to: oldEmail,
      subject: 'Email address changed - confirmation',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Email address changed - confirmation</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f0fdf4; border-radius: 8px; padding: 24px; margin-bottom: 24px; border: 1px solid #86efac;">
              <h1 style="color: #166534; margin-top: 0; font-size: 24px; font-weight: 600;">
                Email address changed
              </h1>
              <p style="color: #166534; margin-bottom: 0;">
                Your email address has been successfully changed from <strong>${oldEmail}</strong> to <strong>${newEmail}</strong>.
              </p>
            </div>
            
            <p style="color: #6b7280; font-size: 14px;">
              This email is being sent to your old email address (<strong>${oldEmail}</strong>) to confirm the change.
            </p>
            
            <p style="color: #6b7280; font-size: 14px;">
              If you made this change, you can safely ignore this email. All future account notifications will be sent to your new email address: <strong>${newEmail}</strong>.
            </p>
            
            <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; background-color: #fee2e2; border-radius: 8px; padding: 16px;">
              <p style="color: #991b1b; font-size: 12px; margin: 0;">
                <strong>Security notice:</strong> If you did not request this email change, please contact support immediately to secure your account.
              </p>
            </div>
          </body>
        </html>
      `,
      text: `
Email address changed

Your email address has been successfully changed from ${oldEmail} to ${newEmail}.

This email is being sent to your old email address (${oldEmail}) to confirm the change.

If you made this change, you can safely ignore this email. All future account notifications will be sent to your new email address: ${newEmail}.

Security notice: If you did not request this email change, please contact support immediately to secure your account.
      `,
    });
  } catch (error) {
    console.error(
      '[EMAIL SERVICE] Failed to send email change confirmation emails:',
      error
    );
    // Don't throw - email change is already complete, this is just a notification
    // The error is logged for monitoring
  }
}
