import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transporter = null;

export const getTransporter = () => {
  if (transporter) return transporter;

  // If explicit SMTP credentials or host/service are configured
  if (env.SMTP_HOST || env.SMTP_USER || env.SMTP_SERVICE) {
    const transportConfig = {};

    if (env.SMTP_SERVICE) {
      transportConfig.service = env.SMTP_SERVICE;
    } else if (env.SMTP_HOST) {
      transportConfig.host = env.SMTP_HOST;
      transportConfig.port = env.SMTP_PORT || 587;
      transportConfig.secure = env.SMTP_SECURE || (env.SMTP_PORT === 465);
    }

    if (env.SMTP_USER && env.SMTP_PASS) {
      transportConfig.auth = {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      };
    }

    transporter = nodemailer.createTransport(transportConfig);
  } else {
    // Development / test fallback when SMTP credentials are not yet configured
    // jsonTransport allows local testing and CI/test runs without a live SMTP server
    transporter = nodemailer.createTransport({
      jsonTransport: true,
    });
  }

  return transporter;
};

export const setTransporter = (customTransporter) => {
  transporter = customTransporter;
};

/**
 * Masks an email for safe logging and client feedback (e.g. r***h@campus.edu)
 */
export const maskEmail = (email) => {
  if (!email || typeof email !== 'string') return '—';
  const [local, domain] = email.split('@');
  if (!domain) return email;
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local.slice(0, 2)}***${local.slice(-1)}@${domain}`;
};

/**
 * Formats a Date into a clean date string in the configured campus timezone
 */
const formatDate = (dateObj) => {
  if (!dateObj) return '—';
  const d = new Date(dateObj);
  if (isNaN(d.getTime())) return String(dateObj);
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: env.CAMPUS_TIMEZONE || 'Asia/Kolkata',
    dateStyle: 'full',
  }).format(d);
};

/**
 * Formats a Date into a clean time string in the configured campus timezone
 */
const formatTime = (dateObj) => {
  if (!dateObj) return '—';
  const d = new Date(dateObj);
  if (isNaN(d.getTime())) return String(dateObj);
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: env.CAMPUS_TIMEZONE || 'Asia/Kolkata',
    timeStyle: 'short',
  }).format(d);
};

/**
 * HTML Email template for Student Request Submission
 */
export const renderSubmissionEmail = ({ studentName, eventTitle, requestId, startAt, endAt, resources }) => {
  const formattedDate = formatDate(startAt);
  const startTime = formatTime(startAt);
  const endTime = formatTime(endAt);
  const portalUrl = `${env.FRONTEND_URL}/student/requests/${requestId}`;

  const resourceItemsHtml = (resources || [])
    .map((r) => {
      const name = r.resourceId?.name || r.name || 'Campus Resource';
      const qty = r.requestedQuantity ? ` (${r.requestedQuantity} units)` : '';
      return `<li style="margin-bottom: 6px; color: #1e293b;">${name}${qty}</li>`;
    })
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Event Request Submitted</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #334155;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <tr>
      <td style="background-color: #0f172a; padding: 24px 32px; text-align: left;">
        <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700;">CampusFlow</h1>
        <p style="color: #94a3b8; margin: 4px 0 0; font-size: 14px;">Smart Campus Event & Resource Management</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 32px;">
        <span style="display: inline-block; background-color: #fef3c7; color: #b45309; font-weight: 700; font-size: 12px; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.5px;">Under Review</span>
        <h2 style="color: #0f172a; margin: 12px 0 8px; font-size: 20px;">Request Received, ${studentName}!</h2>
        <p style="font-size: 15px; line-height: 1.5; color: #475569; margin: 0 0 20px;">
          Your event request for <strong>${eventTitle}</strong> has been submitted successfully to the faculty administration. It is now queued for administrative review and conflict evaluation.
        </p>

        <table width="100%" cellpadding="8" cellspacing="0" style="background-color: #f8fafc; border-radius: 6px; border: 1px solid #e2e8f0; margin-bottom: 20px; font-size: 14px;">
          <tr>
            <td style="color: #64748b; width: 35%; font-weight: 600;">Request Reference:</td>
            <td style="color: #0f172a; font-family: monospace; font-size: 13px;">${requestId}</td>
          </tr>
          <tr>
            <td style="color: #64748b; font-weight: 600;">Event Date:</td>
            <td style="color: #0f172a; font-weight: 500;">${formattedDate}</td>
          </tr>
          <tr>
            <td style="color: #64748b; font-weight: 600;">Event Timing:</td>
            <td style="color: #0f172a; font-weight: 500;">${startTime} – ${endTime}</td>
          </tr>
        </table>

        ${
          resourceItemsHtml
            ? `
          <h3 style="color: #0f172a; font-size: 15px; margin: 16px 0 8px;">Requested Resources:</h3>
          <ul style="padding-left: 20px; margin: 0 0 24px; font-size: 14px;">
            ${resourceItemsHtml}
          </ul>`
            : ''
        }

        <div style="text-align: center; margin: 28px 0 16px;">
          <a href="${portalUrl}" style="background-color: #0284c7; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 24px; border-radius: 6px; display: inline-block;">
            View Request Status &rarr;
          </a>
        </div>

        <p style="font-size: 13px; color: #64748b; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
          You will receive another notification once a faculty coordinator reviews your request. You can track real-time progress on your student dashboard.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

/**
 * HTML Email template for Approved Event Requests
 */
export const renderApprovalEmail = ({ studentName, eventTitle, requestId, startAt, endAt, resources, decisionRemark, decisionAt }) => {
  const formattedDate = formatDate(startAt);
  const startTime = formatTime(startAt);
  const endTime = formatTime(endAt);
  const formattedDecisionDate = decisionAt ? formatDate(decisionAt) : formatDate(new Date());
  const portalUrl = requestId ? `${env.FRONTEND_URL}/student/requests/${requestId}` : `${env.FRONTEND_URL}/student/requests`;

  const resourceItemsHtml = (resources || [])
    .map((r) => {
      const name = r.resourceId?.name || r.name || 'Campus Resource';
      const qty = r.requestedQuantity ? ` (${r.requestedQuantity} units)` : '';
      return `<li style="margin-bottom: 6px; color: #1e293b;">${name}${qty}</li>`;
    })
    .join('');

  const remarkSection = decisionRemark
    ? `
      <div style="background-color: #f1f5f9; border-left: 4px solid #0284c7; padding: 12px 16px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; font-size: 14px; color: #475569; font-weight: 600;">Faculty Remark:</p>
        <p style="margin: 4px 0 0; font-size: 14px; color: #0f172a;">${decisionRemark}</p>
      </div>`
    : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Event Request Approved</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #334155;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <tr>
      <td style="background-color: #059669; padding: 24px 32px; text-align: left;">
        <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700;">CampusFlow</h1>
        <p style="color: #d1fae5; margin: 4px 0 0; font-size: 14px;">Smart Campus Event & Resource Management</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 32px;">
        <span style="display: inline-block; background-color: #ecfdf5; color: #059669; font-weight: 700; font-size: 12px; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.5px;">Approved</span>
        <h2 style="color: #0f172a; margin: 12px 0 8px; font-size: 20px;">Congratulations, ${studentName}!</h2>
        <p style="font-size: 15px; line-height: 1.5; color: #475569; margin: 0 0 20px;">
          Your event request for <strong>${eventTitle}</strong> has been officially approved on ${formattedDecisionDate}. All requested campus resources have been reserved for your session.
        </p>

        <table width="100%" cellpadding="8" cellspacing="0" style="background-color: #f8fafc; border-radius: 6px; border: 1px solid #e2e8f0; margin-bottom: 20px; font-size: 14px;">
          <tr>
            <td style="color: #64748b; width: 35%; font-weight: 600;">Event Date:</td>
            <td style="color: #0f172a; font-weight: 500;">${formattedDate}</td>
          </tr>
          <tr>
            <td style="color: #64748b; font-weight: 600;">Event Timing:</td>
            <td style="color: #0f172a; font-weight: 500;">${startTime} – ${endTime}</td>
          </tr>
        </table>

        <h3 style="color: #0f172a; font-size: 15px; margin: 16px 0 8px;">Allocated Resources:</h3>
        <ul style="padding-left: 20px; margin: 0 0 20px; font-size: 14px;">
          ${resourceItemsHtml}
        </ul>

        ${remarkSection}

        <div style="text-align: center; margin: 28px 0 16px;">
          <a href="${portalUrl}" style="background-color: #059669; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 24px; border-radius: 6px; display: inline-block;">
            View Allocated Event &rarr;
          </a>
        </div>

        <p style="font-size: 13px; color: #64748b; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
          Please ensure all campus regulations are respected during the event. If you need to make any changes, please coordinate with the faculty administration.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

/**
 * HTML Email template for Rejected Event Requests
 */
export const renderRejectionEmail = ({ studentName, eventTitle, requestId, startAt, endAt, decisionRemark, decisionAt }) => {
  const formattedDate = formatDate(startAt);
  const startTime = formatTime(startAt);
  const endTime = formatTime(endAt);
  const formattedDecisionDate = decisionAt ? formatDate(decisionAt) : formatDate(new Date());
  const portalUrl = requestId ? `${env.FRONTEND_URL}/student/requests/${requestId}` : `${env.FRONTEND_URL}/student/requests`;

  const remarkSection = decisionRemark
    ? `
      <div style="background-color: #fff1f2; border-left: 4px solid #e11d48; padding: 12px 16px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; font-size: 14px; color: #9f1239; font-weight: 600;">Faculty Reason / Feedback:</p>
        <p style="margin: 4px 0 0; font-size: 14px; color: #881337;">${decisionRemark}</p>
      </div>`
    : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Event Request Update</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #334155;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <tr>
      <td style="background-color: #475569; padding: 24px 32px; text-align: left;">
        <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700;">CampusFlow</h1>
        <p style="color: #cbd5e1; margin: 4px 0 0; font-size: 14px;">Smart Campus Event & Resource Management</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 32px;">
        <span style="display: inline-block; background-color: #fef2f2; color: #dc2626; font-weight: 700; font-size: 12px; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.5px;">Rejected</span>
        <h2 style="color: #0f172a; margin: 12px 0 8px; font-size: 20px;">Event Request Decision</h2>
        <p style="font-size: 15px; line-height: 1.5; color: #475569; margin: 0 0 20px;">
          Dear ${studentName}, your event request for <strong>${eventTitle}</strong> scheduled for ${formattedDate} (${startTime} – ${endTime}) could not be approved on ${formattedDecisionDate}.
        </p>

        ${remarkSection}

        <p style="font-size: 14px; color: #475569; line-height: 1.5; margin: 16px 0;">
          You are welcome to submit a revised request for another date or venue using the CampusFlow portal.
        </p>

        <div style="text-align: center; margin: 28px 0 16px;">
          <a href="${portalUrl}" style="background-color: #475569; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 24px; border-radius: 6px; display: inline-block;">
            View Request Record &rarr;
          </a>
        </div>

        <p style="font-size: 13px; color: #64748b; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
          Thank you for your understanding. If you have questions regarding this decision, please reach out to the faculty coordinator.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

/**
 * HTML Email template for Faculty Login OTP
 */
export const renderFacultyOtpEmail = ({ facultyName, otp, expiryMinutes = 5 }) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Faculty Verification Code</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #334155;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e2e8f0;">
    <tr>
      <td style="background-color: #0f172a; padding: 24px 32px; text-align: left;">
        <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700;">CampusFlow Security</h1>
        <p style="color: #94a3b8; margin: 4px 0 0; font-size: 13px;">Institutional Faculty Authentication</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 32px;">
        <h2 style="color: #0f172a; margin: 0 0 8px; font-size: 18px;">Faculty Login Verification</h2>
        <p style="font-size: 14px; line-height: 1.5; color: #475569; margin: 0 0 20px;">
          Hello ${facultyName || 'Faculty Member'}, a sign-in attempt was initiated for your CampusFlow administrative account. Use the one-time verification code below to complete your authentication:
        </p>

        <div style="background-color: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
          <span style="font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #0f172a;">${otp}</span>
          <p style="margin: 8px 0 0; font-size: 12px; color: #64748b; font-weight: 500;">
            Valid for ${expiryMinutes} minutes &bull; Single-use only
          </p>
        </div>

        <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 16px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; font-size: 13px; color: #92400e; font-weight: 600;">Security Reminder:</p>
          <p style="margin: 4px 0 0; font-size: 12px; color: #78350f; line-height: 1.4;">
            Never share this verification code with anyone. CampusFlow administrators will never ask for your code. If you did not initiate this sign-in attempt, please notify campus IT security immediately.
          </p>
        </div>

        <p style="font-size: 12px; color: #94a3b8; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
          This is an automated security transmission. Please do not reply directly to this email.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

/**
 * Universal email dispatcher through Nodemailer safely
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  const fromAddress = env.EMAIL_FROM || 'CampusFlow <noreply@campusflow.edu>';

  try {
    const activeTransporter = getTransporter();
    const info = await activeTransporter.sendMail({
      from: fromAddress,
      to,
      subject,
      html,
      text: text || undefined,
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (err) {
    console.error('Nodemailer dispatch error:', err.message || err);
    return {
      success: false,
      error: err.message || 'Nodemailer dispatch error',
    };
  }
};

/**
 * Sends decision emails (backward compatible alias)
 */
export const sendDecisionEmail = sendEmail;

/**
 * Sends faculty OTP email safely without logging the OTP code
 */
export const sendFacultyOtpEmail = async ({ to, facultyName, otp }) => {
  const subject = 'CampusFlow: Your Faculty Login Verification Code';
  const html = renderFacultyOtpEmail({ facultyName, otp, expiryMinutes: 5 });

  console.log(`[AUTH] Dispatching faculty OTP email via Nodemailer to: ${maskEmail(to)}`);
  return await sendEmail({ to, subject, html });
};
