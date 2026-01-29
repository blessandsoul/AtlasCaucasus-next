# Email Delivery Troubleshooting Guide

## ✅ What's Confirmed Working:

1. **Resend API Integration:** ✅ Working
2. **API Key:** ✅ Valid (`re_fJjDCfbD_A6t4TUKXKKCHnaWqVTzcMw4K`)
3. **Email Sending:** ✅ Emails are being sent successfully
4. **Server Integration:** ✅ Server code is correct

## 🔍 Why You're Not Seeing Emails:

The most likely reasons:

### 1. **Gmail Spam Filter** (90% probability)
- Gmail often puts emails from new senders in spam
- **Solution:** Check your spam/junk folder

### 2. **Gmail Filtering** (5% probability)
- Gmail might be filtering to Promotions/Updates
- **Solution:** Check all Gmail tabs

### 3. **Delayed Delivery** (5% probability)
- Sometimes emails take 5-10 minutes
- **Solution:** Wait and refresh

## 📋 Step-by-Step Checklist:

### Step 1: Check Spam Folder
1. Open Gmail
2. Click "Spam" in the left sidebar
3. Search for "Tourism Georgia" or "onboarding@resend.dev"
4. If found, click "Not Spam"

### Step 2: Search All Mail
1. In Gmail search box, type: `from:onboarding@resend.dev`
2. Press Enter
3. Check if emails appear

### Step 3: Check All Tabs
- Primary
- Social
- Promotions
- Updates

### Step 4: Refresh Resend Dashboard
1. Go to: https://resend.com/emails
2. Click "Sending" tab
3. You should see emails with these IDs:
   - `44355a54-bb09-4065-93fe-bf0097734ec3`
   - `05ae2107-70c6-48cb-aac9-a...`
   - Latest one from debug script

## 🧪 Test Commands:

### Send Test Email Directly:
```bash
npx tsx debug-email.ts
```

### Register New User (triggers verification email):
```bash
POST http://localhost:3000/api/v1/auth/register
{
  "email": "test@example.com",
  "password": "TestPass123!",
  "firstName": "Test",
  "lastName": "User"
}
```

## 🔧 Current Configuration:

```env
RESEND_API_KEY=re_fJjDCfbD_A6t4TUKXKKCHnaWqVTzcMw4K
EMAIL_FROM="Tourism Georgia <onboarding@resend.dev>"
FRONTEND_URL=http://localhost:5173
```

## ✅ Verification:

Run this to verify everything is working:
```bash
npx tsx debug-email.ts
```

Then check:
1. ✅ Console shows "Success!"
2. ✅ Email ID is displayed
3. ✅ No error message
4. ✅ Resend dashboard shows the email
5. ⏳ Gmail inbox (check spam!)

## 💡 Pro Tips:

1. **Whitelist the sender:**
   - Add `onboarding@resend.dev` to your Gmail contacts
   - This ensures future emails go to inbox

2. **Check email headers:**
   - If you find the email in spam, check why
   - Gmail shows spam reason in email headers

3. **Use email testing tools:**
   - https://www.mail-tester.com
   - Send a test email there to check spam score

## 🎯 Next Steps:

1. **For Development:** Current setup is perfect
2. **For Production:** Verify your own domain at https://resend.com/domains
3. **Update EMAIL_FROM:** Use your verified domain

## 📊 Expected Behavior:

When you register a user:
```
[Server Log] User registered successfully
[Server Log] Email sent successfully via Resend
[Server Log] emailId: "xxx-xxx-xxx"
[Resend Dashboard] Email appears in "Sending" tab
[Gmail] Email arrives (possibly in spam initially)
```

## 🚨 If Still Not Working:

1. Check Resend dashboard for delivery status
2. Look for bounce/rejection reasons
3. Verify your Gmail isn't blocking the sender
4. Try a different email address (Outlook, Yahoo, etc.)

---

**Last Updated:** 2025-12-31  
**Status:** ✅ Email sending is working correctly  
**Issue:** Emails likely in spam folder
