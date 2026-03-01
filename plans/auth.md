# Authentication Flow (HttpOnly Cookies)

The legacy system used a JWT returned to the client and stored in local storage, which was then attached to the `Authorization` header for every request.

For Next.js App Router (RSC + Server Actions), it is much more secure and ergonomic to use HttpOnly cookies.

## Flow:

1. **Request OTP (Client -> Server Action)**
   - User enters email on `/admin/login`.
   - Client calls `requestOtpAction(email)`.
   - Server Action generates OTP, stores in D1 `otp_codes`, and sends email via Resend.
   
2. **Verify OTP (Client -> Server Action)**
   - User enters OTP on `/admin/login`.
   - Client calls `verifyOtpAction(email, otp)`.
   - Server Action verifies against D1.
   - If valid, Server Action signs a JWT.
   - Server Action calls `cookies().set('saf_admin_session', jwt, { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 86400 })`.
   - Server Action redirects to `/admin/dashboard`.

3. **Route Protection (Middleware)**
   - Create `middleware.ts` at the root.
   - Intercept all requests to `/admin/*` (except `/admin/login`).
   - Read `saf_admin_session` from cookies.
   - Verify JWT. If invalid, redirect to `/admin/login`.
   
4. **Data Fetching (RSC / Server Actions)**
   - In Server Actions targeting `/admin` data, we read `cookies().get('saf_admin_session')` and verify the JWT before executing the DB mutation/query, ensuring the action cannot be called directly without authentication.
