🧭 Step-by-Step Testing Flow in Postman
You can run through this exact lifecycle in Postman to test all features:

1️⃣ User Registration (Signup)
Request: 1. Signup / Register User
Body: Preconfigured JSON with email, password, full_name.
Action: Click Send.
Verification: Look at your Django server terminal! Since we are using the Console Email backend, the verification email containing the uid and token will be printed right in the terminal, looking like this:
Please click the link below to verify your email address:
http://localhost:3000/verify-email?token=cqs12x-c7117a3a9bf81b1d1f60&uid=Mg
2️⃣ Attempt Login (Blocked)
Request: 4. Login User
Action: Click Send using the registration credentials.
Result: Returns a 403 Forbidden explaining that the email is unverified.
3️⃣ Email Verification
Request: 3. Verify Email Address
Action: Copy the uid (e.g. Mg) and the token (e.g. cqs12x-...) from your terminal output, paste them into the JSON body, and click Send.
Result: Returns Email successfully verified. You can now login.
4️⃣ Successful Login
Request: 4. Login User
Action: Click Send.
Result: Logs you in successfully, returns a Bearer access token, and sets the HTTP-Only refresh_token cookie.
Postman Magic: A built-in Postman test script will automatically capture the access token and store it in your Postman variables for future authenticated requests.
5️⃣ Fetch Authenticated Profile
Request: 8. Retrieve Current User Profile
Action: Click Send.
Result: Returns the current user profile (using the Bearer access token saved automatically from Step 4).
6️⃣ Token Refreshing (HttpOnly Cookie)
Request: 9. Refresh Token Rotation
Action: Click Send.
Result: Rotates your JWT token by reading the HTTP-Only cookie, returning a fresh new access token.
7️⃣ Forgot Password (10-minute expiry)
Request: 6. Request Password Reset Link
Action: Enter your email and click Send.
Console Check: Check the Django terminal for the password reset email and copy the new uid and token.
Request: 7. Confirm Password Reset
Action: Paste the new uid/token and choose a new password. Click Send (must be within 10 minutes of requesting).
8️⃣ Session Logout
Request: 10. Logout User
Action: Click Send.
Result: Blacklists the refresh token and clears your session cookies.