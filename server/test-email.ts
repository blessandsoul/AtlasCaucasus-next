// Test email sending with Resend
// Run with: npx tsx test-email.ts

import { Resend } from "resend";

const resend = new Resend("re_fJjDCfbD_A6t4TUKXKKCHnaWqVTzcMw4K");

async function testEmail() {
    console.log("🧪 Testing Resend email delivery...\n");

    try {
        const { data, error } = await resend.emails.send({
            from: "Tourism Georgia <onboarding@resend.dev>",
            to: "itorn9777@gmail.com",
            subject: "Test Email - Tourism Georgia",
            html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Test Email</title>
        </head>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h1 style="color: #667eea;">✅ Email Delivery Test</h1>
          <p>If you're reading this, your email configuration is working perfectly!</p>
          <p><strong>Sent at:</strong> ${new Date().toISOString()}</p>
          <p><strong>From:</strong> Tourism Georgia Server</p>
        </body>
        </html>
      `,
            text: "Test email from Tourism Georgia. If you received this, email delivery is working!",
        });

        if (error) {
            console.error("❌ Error:", error);
            return;
        }

        console.log("✅ Email sent successfully!");
        console.log("📧 Email ID:", data?.id);
        console.log("📊 Check status at: https://resend.com/emails/" + data?.id);
        console.log("\n💡 Tips:");
        console.log("   1. Check your spam/junk folder");
        console.log("   2. Search Gmail for: from:onboarding@resend.dev");
        console.log("   3. Check Resend dashboard for delivery status");
        console.log("   4. Wait 1-2 minutes for delivery");
    } catch (err) {
        console.error("❌ Exception:", err);
    }
}

testEmail();
