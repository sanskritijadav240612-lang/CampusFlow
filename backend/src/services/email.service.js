import { Resend } from 'resend';
import { env } from '../config/env.js';

let resendClient = null;
if (env.RESEND_API_KEY && env.RESEND_API_KEY.trim().length > 0) {
  resendClient = new Resend(env.RESEND_API_KEY);
}

/**
 * Formats a Date into a clean date string in the configured campus timezone
 */
const formatDate = (dateObj) => {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: env.CAMPUS_TIMEZONE || 'Asia/Kolkata',
    dateStyle: 'full',
  }).format(new Date(dateObj));
};

/**
 * Formats a Date into a clean time string in the configured campus timezone
 */
const formatTime = (dateObj) => {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: env.CAMPUS_TIMEZONE || 'Asia/Kolkata',
    timeStyle: 'short',
  }).format(new Date(dateObj));
};

/**
 * HTML Email template for Approved Event Requests
 */
export const renderApprovalEmail = ({ studentName, eventTitle, startAt, endAt, resources, decisionRemark }) => {
  const formattedDate = formatDate(startAt);
  const startTime = formatTime(startAt);
  const endTime = formatTime(endAt);

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
          Your event request for <strong>${eventTitle}</strong> has been officially approved by the faculty administration. All requested campus resources have been reserved for your session.
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
export const renderRejectionEmail = ({ studentName, eventTitle, startAt, endAt, decisionRemark }) => {
  const formattedDate = formatDate(startAt);
  const startTime = formatTime(startAt);
  const endTime = formatTime(endAt);

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
        <h2 style="color: #0f172a; margin: 12px 0 8px; font-size: 20px;">Event Request Update</h2>
        <p style="font-size: 15px; line-height: 1.5; color: #475569; margin: 0 0 20px;">
          Dear ${studentName}, your event request for <strong>${eventTitle}</strong> scheduled for ${formattedDate} (${startTime} – ${endTime}) could not be approved at this time.
        </p>

        ${remarkSection}

        <p style="font-size: 14px; color: #475569; line-height: 1.5; margin: 16px 0;">
          You are welcome to submit a revised request for another date or venue using the CampusFlow portal.
        </p>

        <p style="font-size: 13px; color: #64748b; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
          Thank you for your understanding. If you have any questions regarding this decision, please reach out to the faculty coordinator.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

/**
 * Sends decision email through Resend SDK safely
 */
export const sendDecisionEmail = async ({ to, subject, html }) => {
  if (!resendClient) {
    return {
      success: false,
      error: 'Email delivery skipped: RESEND_API_KEY is not configured on this server.',
    };
  }

  try {
    const { data, error } = await resendClient.emails.send({
      from: env.RESEND_FROM_EMAIL,
      to,
      subject,
      html,
    });

    if (error) {
      console.error('Resend provider returned an error:', error.message || error);
      return {
        success: false,
        error: error.message || 'Resend provider error',
      };
    }

    return {
      success: true,
      messageId: data.id,
    };
  } catch (err) {
    console.error('Resend SDK call exception:', err.message || err);
    return {
      success: false,
      error: err.message || 'Network error communicating with Resend',
    };
  }
};
