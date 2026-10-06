/**
 * ==============================================================================
 * ZAYMERA HAUTE COUTURE — GOOGLE APPS SCRIPT ORDER EMAIL RELAY
 * ==============================================================================
 * 
 * This script runs directly inside your Google Account (zaymerawardrobe@gmail.com).
 * It sends native, authentic emails using Google's mail servers:
 * - 100% Free Forever (100 emails/day on free Gmail, 1,500/day on Google Workspace)
 * - 0% Spam rate (Sent directly from your authorized @gmail.com address)
 * - No third-party branding, no activation links required
 * - Automatically emails both the Customer and zaymerawardrobe@gmail.com
 * 
 * ------------------------------------------------------------------------------
 * 60-SECOND DEPLOYMENT INSTRUCTIONS:
 * ------------------------------------------------------------------------------
 * 1. Open https://script.google.com in your browser while signed into zaymerawardrobe@gmail.com
 * 2. Click "+ New Project" (top left)
 * 3. Delete any code in Code.gs, and PASTE THIS ENTIRE FILE into Code.gs
 * 4. Click the blue "Deploy" button (top right) -> Select "New deployment"
 * 5. Click the gear icon ⚙️ next to "Select type" -> Choose "Web app"
 * 6. Set the fields:
 *    - Description: Zaymera Order Email Relay
 *    - Execute as: Me (zaymerawardrobe@gmail.com)
 *    - Who has access: Anyone  <-- (CRITICAL: Select "Anyone")
 * 7. Click "Deploy"
 * 8. Click "Authorize access" -> Choose your zaymerawardrobe@gmail.com account
 *    (If you see "Google hasn't verified this app", click "Advanced" -> "Go to Zaymera (unsafe)")
 * 9. Copy the "Web app URL" (starts with https://script.google.com/macros/s/...)
 * 10. Paste this URL into:
 *     - Zaymera Admin Dashboard -> Settings -> Email Settings -> Custom Webhook URL
 *     OR .env file as: NEXT_PUBLIC_ORDER_WEBHOOK_URL=https://script.google.com/...
 * ==============================================================================
 */

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService
        .createTextOutput(JSON.stringify({ success: false, error: 'Empty payload received' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var data = JSON.parse(e.postData.contents);
    var customerEmail = (data.to || data.customerEmail || '').trim();
    var storeEmail = (data.storeEmail || 'zaymerawardrobe@gmail.com').trim();
    var subject = data.subject || 'Zaymera Order Notification';
    var htmlBody = data.html || data.htmlContent || '';
    var textBody = data.text || data.textContent || 'New order details from Zaymera Haute Couture.';
    var orderNumber = data.orderNumber || 'ZYM-ORDER';

    // 1. Dispatch native email to store admin inbox (zaymerawardrobe@gmail.com)
    GmailApp.sendEmail(storeEmail, subject, textBody, {
      name: 'ZAYMERA Haute Couture',
      htmlBody: htmlBody
    });

    // 2. Dispatch native email to customer if valid email provided and different from store email
    var customerSent = false;
    if (customerEmail && customerEmail.indexOf('@') !== -1 && customerEmail.toLowerCase() !== storeEmail.toLowerCase()) {
      GmailApp.sendEmail(customerEmail, subject, textBody, {
        name: 'ZAYMERA Haute Couture',
        htmlBody: htmlBody,
        replyTo: storeEmail
      });
      customerSent = true;
    }

    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: 'Order emails sent successfully via Gmail native API',
        orderNumber: orderNumber,
        storeEmail: storeEmail,
        customerEmail: customerSent ? customerEmail : 'not_requested'
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: err.toString(),
        stack: err.stack || ''
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({
      status: 'active',
      service: 'Zaymera Haute Couture Email Relay',
      storeEmail: 'zaymerawardrobe@gmail.com',
      timestamp: new Date().toISOString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
}
