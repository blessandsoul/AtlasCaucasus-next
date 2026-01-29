# Chat & Notifications Test Guide

## 🐛 Bug Fixed

**Issue:** Direct chat creation was failing with validation error
**Fix:** Changed `participantId` to `otherUserId` in the API call
**Status:** ✅ Fixed

## 🧪 Testing Instructions

### Step 1: Get Valid User Credentials

The test users need to exist in your database. Here's how to get valid user IDs:

1. **Open Prisma Studio** (if not already running):
   ```bash
   npx prisma studio
   ```

2. **Navigate to the `User` table**

3. **Find or create test users** - you need at least 2 users to test chat

4. **Copy their UUIDs** for testing

### Step 2: Login to Test Interface

1. Open: `http://localhost:3000/test.html`

2. **Default credentials** (if this user exists):
   - Email: `testuser@inquiry.com`
   - Password: `Test123!@#`

3. If login fails, use credentials from a user in your database

### Step 3: Create a Direct Chat

1. After login, you'll see the **WebSocket status** turn green ✓
2. In the left panel, find **"Create Direct Chat"**
3. Enter another user's UUID (from Prisma Studio)
4. Click **"Create Chat"**
5. The chat should appear in the right panel

### Step 4: Test Messaging

1. Click on the chat in the right panel
2. Type a message in the input box
3. Press **Enter** to send (or click Send button)
4. Message should appear immediately

### Step 5: Test Real-Time (Multi-User)

1. **Open test.html in a second browser** (or incognito window)
2. **Login with a different user**
3. **Create a chat** between the two users
4. **Send messages** from one browser
5. **Watch them appear** in the other browser in real-time!

### Step 6: Test Typing Indicators

1. With both browsers open
2. Start typing in one browser
3. Watch "Someone is typing..." appear in the other browser

### Step 7: Test Notifications

1. Click **"Switch"** button in the right panel
2. View will change to **Notifications**
3. Perform actions that trigger notifications (e.g., mentions in chat)
4. Watch notifications appear in real-time

## 🔍 Common Issues & Solutions

### Issue: "Invalid credentials"
**Solution:** 
- Check if the user exists in database (Prisma Studio)
- Verify the password is correct
- Make sure email is verified (set `emailVerified = true` in database)

### Issue: "User not found" when creating chat
**Solution:**
- Make sure you're using a valid UUID from the User table
- Copy the exact UUID from Prisma Studio
- Don't use email or name, only UUID

### Issue: WebSocket shows "Disconnected"
**Solution:**
- Check if server is running (`npm run dev`)
- Verify you're logged in
- Check browser console for errors
- Try refreshing the page

### Issue: Messages not appearing in real-time
**Solution:**
- Ensure WebSocket is connected (green status)
- Check browser console for WebSocket errors
- Verify both users are in the same chat
- Try refreshing both browsers

### Issue: Can't create group chat
**Solution:**
- Make sure you have TOUR_AGENT or COMPANY role
- Regular users can only create direct chats
- Check user roles in Prisma Studio

## 📊 Quick Test Checklist

- [ ] Login successful
- [ ] WebSocket connected (green status)
- [ ] Can create direct chat
- [ ] Can send messages
- [ ] Messages appear in real-time (test with 2 browsers)
- [ ] Typing indicators work
- [ ] Can view notifications
- [ ] Notifications appear in real-time
- [ ] Can mark notifications as read
- [ ] Chat list updates automatically

## 🎯 Test Data Setup (SQL)

If you need to quickly create test users, run this in your MySQL:

```sql
-- Create test user 1
INSERT INTO users (id, email, password, firstName, lastName, roles, emailVerified)
VALUES (
  UUID(),
  'user1@test.com',
  '$argon2id$v=19$m=65536,t=3,p=4$...',  -- You need to hash this
  'Test',
  'User One',
  'USER',
  true
);

-- Create test user 2
INSERT INTO users (id, email, password, firstName, lastName, roles, emailVerified)
VALUES (
  UUID(),
  'user2@test.com',
  '$argon2id$v=19$m=65536,t=3,p=4$...',  -- You need to hash this
  'Test',
  'User Two',
  'USER',
  true
);
```

**Better approach:** Use the registration endpoint to create users, then set `emailVerified = true` in Prisma Studio.

## 🚀 Advanced Testing

### Test Group Chat
1. Login as a user with TOUR_AGENT or COMPANY role
2. Enter group name: "Test Group"
3. Enter participant UUIDs (comma-separated)
4. Click "Create Group"
5. Send messages to the group

### Test Mentions
1. In a message, type `@` followed by text
2. Send the message
3. Mentioned users should receive notifications

### Test Browser Notifications
1. Allow notifications when prompted
2. Send a message or create a notification
3. Browser notification should appear (even if tab is not active)

## 📝 Notes

- **WebSocket auto-reconnects** if connection drops
- **Heartbeat** runs every 25 seconds to keep connection alive
- **Typing indicators** auto-clear after 2 seconds of inactivity
- **Messages** are stored in database and loaded on chat selection
- **Notifications** persist until marked as read

## 🐛 Found a Bug?

Check the browser console and server logs for detailed error messages!
