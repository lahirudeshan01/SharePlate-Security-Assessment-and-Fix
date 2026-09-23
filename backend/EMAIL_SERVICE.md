# 📧 Email Service Integration - SharePlate Backend

## ✅ Third-Party API Integration Complete

The SharePlate backend now includes a complete **Email Service** integration using **SendGrid** and **Nodemailer** (Gmail) as a fallback.

---

## 🎯 Features Implemented

### 1. **Welcome Email** 
Sent automatically when a user registers
- Personalized greeting
- Role-specific information
- Organization details (for restaurants/shelters)
- Professional HTML template

### 2. **Password Reset Email**
Sent when user requests password reset via `/api/auth/forgotpassword`
- Secure reset token (expires in 10 minutes)
- Clickable reset button
- Direct link for manual copying
- Warning about expiration

### 3. **Password Change Confirmation**
Sent when password is updated successfully
- Timestamp of password change
- Security alert to contact support if unauthorized

### 4. **Email Verification** (Ready to use)
Template ready for email verification flow
- 24-hour expiration token
- Verification button

### 5. **Custom Notifications**
Generic notification system for future features
- Customizable subject and message
- Professional template

---

## 📦 Installed Packages

```json
"@sendgrid/mail": "^8.1.6"  // Professional email API
"nodemailer": "^8.0.1"       // Gmail fallback
```

---

## ⚙️ Configuration

### Option 1: SendGrid (Recommended for Production)

1. **Sign up for SendGrid**
   - Go to: https://sendgrid.com/
   - Create free account (100 emails/day)
   
2. **Get API Key**
   - Settings → API Keys → Create API Key
   - Copy the key (you'll only see it once!)

3. **Update `.env` file**
   ```env
   SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxx
   FROM_EMAIL=noreply@shareplate.com
   FROM_NAME=SharePlate Platform
   FRONTEND_URL=http://localhost:3001
   ```

### Option 2: Gmail (For Development/Testing)

1. **Enable 2-Factor Authentication** on your Gmail account

2. **Create App Password**
   - Go to: https://myaccount.google.com/apppasswords
   - Select app: "Mail"
   - Select device: "Other" → Enter "SharePlate"
   - Copy the 16-character password

3. **Update `.env` file**
   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-16-char-app-password
   FROM_EMAIL=your-email@gmail.com
   FROM_NAME=SharePlate Platform
   FRONTEND_URL=http://localhost:3001
   ```

---

## 🚀 Usage

### Test Registration with Welcome Email

**Request:**
```http
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "test@example.com",
  "password": "Test123",
  "role": "restaurant",
  "organizationName": "John's Restaurant"
}
```

**Result:**
- User created in database ✅
- JWT token returned ✅
- Welcome email sent to test@example.com ✅

---

### Test Forgot Password

**Request:**
```http
POST http://localhost:3000/api/auth/forgotpassword
Content-Type: application/json

{
  "email": "test@example.com"
}
```

**Result:**
- Password reset email sent ✅
- Reset token valid for 10 minutes ✅
- Email contains clickable reset link ✅

---

### Test Reset Password

**Request:**
```http
PUT http://localhost:3000/api/auth/resetpassword/YOUR_RESET_TOKEN
Content-Type: application/json

{
  "password": "NewPassword123"
}
```

**Result:**
- Password updated in database ✅
- User automatically logged in ✅
- Confirmation email sent ✅

---

## 📁 Files Created/Modified

### New Files:
- ✅ `src/services/emailService.js` - Email service with all templates

### Modified Files:
- ✅ `src/config/config.js` - Added email configuration
- ✅ `src/models/User.js` - Added reset token fields
- ✅ `src/controllers/authController.js` - Integrated email service
- ✅ `src/routes/authRoutes.js` - Added password reset routes
- ✅ `.env` - Email service configuration
- ✅ `.env.example` - Email service template
- ✅ `package.json` - Added email dependencies

---

## 🧪 Testing the Email Service

### Check Server Logs

When emails are sent, you'll see console logs:
```
✅ Email sent via SendGrid to test@example.com
```
or
```
✅ Email sent via Nodemailer to test@example.com
```

### Manual Testing Steps

1. **Start the server**
   ```bash
   cd backend
   npm run dev
   ```

2. **Register a new user**
   - Use a real email address you can access
   - Check your inbox for welcome email

3. **Test forgot password**
   - Send request to `/api/auth/forgotpassword`
   - Check email for reset link
   - Click the link or copy the token

4. **Reset password**
   - Use the token from email
   - Reset your password
   - Check for confirmation email

---

## 🎨 Email Templates

All emails are fully responsive with:
- Professional HTML design
- Mobile-friendly layout
- Brand colors (green theme)
- Clear call-to-action buttons
- Plain text fallback

---

## 🔒 Security Features

- ✅ Reset tokens are hashed before storage
- ✅ Tokens expire automatically (10 minutes)
- ✅ One-time use tokens
- ✅ Email failures don't break registration
- ✅ Secure token generation using crypto

---

## 📊 API Endpoints Summary

| Method | Endpoint | Description | Email Sent |
|--------|----------|-------------|------------|
| POST | `/api/auth/register` | Register user | Welcome email |
| POST | `/api/auth/forgotpassword` | Request password reset | Reset link |
| PUT | `/api/auth/resetpassword/:token` | Reset password | Confirmation |
| PUT | `/api/auth/updatepassword` | Change password | Confirmation |

---

## 🛠️ Troubleshooting

### Email Not Sending

1. **Check console logs** for error messages
2. **Verify API key** is correct in `.env`
3. **Check spam folder** in your email
4. **Test with different email** providers
5. **Verify SendGrid account** is active

### SendGrid Errors

- `401 Unauthorized` → Check API key
- `403 Forbidden` → Verify sender email
- `Rate limit` → Upgrade plan or wait

### Gmail Errors

- `Invalid credentials` → Regenerate app password
- `Less secure apps` → Use app password, not regular password
- `SMTP error` → Check 2FA is enabled

---

## 🎉 Assignment Requirements Met

✅ **Third-party API Integration** - SendGrid/Nodemailer
✅ **Email notifications** - Welcome, reset, confirmations
✅ **Password reset flow** - Complete implementation
✅ **Error handling** - Graceful email failures
✅ **Security** - Hashed tokens, expiration
✅ **Professional templates** - HTML emails

---

## 📝 Future Enhancements

- Email verification on registration
- Two-factor authentication via email
- Donation notifications
- Weekly/monthly reports
- Admin notifications

---

## 🔗 Resources

- SendGrid Docs: https://docs.sendgrid.com/
- Nodemailer Docs: https://nodemailer.com/
- Gmail App Passwords: https://myaccount.google.com/apppasswords

---

**Email Service successfully integrated! 🎉**
