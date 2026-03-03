# Auth Module - Frontend/Backend Mapping

> **Status**: Audited December 18, 2025
> **Frontend**: chefkix-fe (Next.js)
> **Backend**: chefkix-monolith (Spring Boot + Keycloak)

## Quick Reference

| Feature             | Frontend Endpoint                      | Backend Endpoint                | Status     |
| ------------------- | -------------------------------------- | ------------------------------- | ---------- |
| Login               | `POST /api/v1/auth/login`              | `POST /auth/login`              | ✅ Working |
| Register            | `POST /api/v1/auth/register`           | `POST /auth/register`           | ✅ Working |
| Verify OTP (signup) | `POST /api/v1/auth/verify-otp-user`    | `POST /auth/verify-otp-user`    | ✅ Working |
| Logout              | `POST /api/v1/auth/logout`             | `POST /auth/logout`             | ✅ Working |
| Refresh Token       | `POST /api/v1/auth/refresh-token`      | `POST /auth/refresh-token`      | ✅ Working |
| Get Current User    | `GET /api/v1/auth/me`                  | `GET /auth/me`                  | ✅ Working |
| Forgot Password     | `POST /api/v1/auth/forgot-password`    | `POST /auth/forgot-password`    | ✅ Working |
| Reset Password      | `PUT /api/v1/auth/verify-otp-password` | `PUT /auth/verify-otp-password` | ✅ Working |
| Change Password     | `PUT /api/v1/auth/change-password`     | `PUT /auth/change-password`     | ✅ Working |
| Send OTP (resend)   | `POST /api/v1/auth/send-otp`           | ❌ **NOT IMPLEMENTED**          | 🔴 Missing |
| Google Sign-In      | `POST /api/v1/auth/google`             | ❌ **NOT IMPLEMENTED**          | 🔴 Missing |

## API Gateway Routing

The gateway strips `/api/v1` prefix for the identity route:

```
Frontend: POST /api/v1/auth/login
Gateway:  StripPrefix=2 → POST /auth/login
Backend:  @PostMapping("/auth/login")
```

## Authentication Flow

### 1. Standard Registration Flow

```
┌─────────────┐    POST /register     ┌─────────────┐
│  Frontend   │ ─────────────────────▶│   Backend   │
│  SignUpForm │                       │  Creates    │
└─────────────┘                       │  SignupReq  │
                                      └──────┬──────┘
                                             │
                                             ▼
                                      ┌─────────────┐
                                      │   Kafka     │
                                      │ otp-delivery│
                                      └──────┬──────┘
                                             │
                                             ▼
                                      ┌─────────────┐
                                      │ Notification│
                                      │  Service    │
                                      │ (sends OTP) │
                                      └─────────────┘

┌─────────────┐  POST /verify-otp-user  ┌─────────────┐
│  Frontend   │ ────────────────────────▶│   Backend   │
│  OTP Page   │                          │  Creates    │
└─────────────┘                          │ User+KC User│
      │                                  └─────────────┘
      │
      ▼
 Redirect to /sign-in
```

### 2. Login Flow

```
┌─────────────┐     POST /login       ┌─────────────┐
│  Frontend   │ ─────────────────────▶│   Backend   │
│  SignInForm │                       │             │
└─────────────┘                       └──────┬──────┘
                                             │
                                             ▼
                                      ┌─────────────┐
                                      │  Keycloak   │
                                      │   Token     │
                                      └──────┬──────┘
                                             │
                                             ▼
                                      ┌─────────────┐
                                      │ HttpOnly    │
                                      │ Cookie (RT) │
                                      │ + AT in body│
                                      └─────────────┘
```

### 3. Token Refresh Flow (Automatic)

```
┌─────────────┐     Any API call      ┌─────────────┐
│  Frontend   │ ─────────────────────▶│   Gateway   │
│  (401 err)  │                       └─────────────┘
└──────┬──────┘
       │ Axios interceptor catches 401
       ▼
┌─────────────┐   POST /refresh-token  ┌─────────────┐
│  Frontend   │ ─────────────────────▶│   Backend   │
│ (auto-retry)│   (HttpOnly cookie)   │ (new tokens)│
└─────────────┘                        └─────────────┘
```

## Known Issues & Gaps

### 🔴 Critical: Google OAuth Not Implemented

**Frontend expects:**

- `POST /api/v1/auth/google` with `{ code: string }`
- Returns `{ accessToken, refreshToken }`

**Backend has:**

- `logError` method mentioning Google
- `User.googleId` field in entity
- `UserRepository.findByGoogleId()` method
- **NO ACTUAL ENDPOINT**

**Workaround applied:**

- `GoogleSignInButton` shows "Coming Soon" when `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is empty
- `GoogleOAuthWrapper` conditionally renders provider

### 🔴 Critical: Resend OTP Not Implemented

**Frontend expects:**

- `POST /api/v1/auth/send-otp` with `{ email: string }`

**Backend has:**

- OTP is sent automatically on `/register`
- No explicit resend endpoint

**Workaround needed:**

- Frontend should call `/register` again to resend OTP
- Or backend needs to add `/send-otp` endpoint

### 🟡 Medium: Duplicate OTP Verification Endpoints

Backend has TWO endpoints for OTP verification:

1. `POST /auth/verify-otp-user` (ProfileController) - Creates user
2. `POST /auth/verify-otp` (OtpController) - Also creates user

Frontend uses `verify-otp-user`. The duplicate in OtpController should be removed.

## Security Configuration

### Public Endpoints (no auth required)

```java
"/v3/api-docs/**",
"/swagger-ui/**",
"/swagger-ui.html",
"/auth/**",        // All auth endpoints are public
"/api/user",
"/auth/verify-otp-user",
```

### JWT Configuration

- Keycloak realm: `nottisn`
- Client: `chefkix-be` (confidential)
- Frontend client: `chefkix-frontend` (public)
- Token endpoint: `/realms/nottisn/protocol/openid-connect/token`

### Cookie Configuration

- Refresh token: HttpOnly cookie
- Name: `refresh_token`
- Login expiry: 7 days
- Refresh expiry: 30 days

## Frontend Auth Store (Zustand)

```typescript
// Located: src/store/authStore.ts
interface AuthStore {
	accessToken: string | null
	user: User | null
	isAuthenticated: boolean
	login: (token: string, user?: User) => void
	logout: () => void
	setUser: (user: User) => void
}
```

## Test Credentials

- **Username**: `testuser`
- **Password**: `test123`
- **Email**: `test@chefkix.vn`

## Files Modified (This Audit)

1. `src/app/layout.tsx` - Use GoogleOAuthWrapper
2. `src/components/providers/GoogleOAuthWrapper.tsx` - NEW: Conditional OAuth provider
3. `src/components/auth/GoogleSignInButton.tsx` - Graceful degradation when unconfigured
4. `src/components/ui/social-login-button.tsx` - Added disabled prop
5. `.env.local` - Fixed BASE_URL to point to backend

## Recommendations

1. **Backend**: Implement `/auth/google` endpoint for OAuth
2. **Backend**: Add `/auth/send-otp` for resending verification codes
3. **Backend**: Remove duplicate `OtpController.verifyOtp`
4. **Backend**: Add request validation logging for debugging
5. **Frontend**: Consider showing toast when Google button clicked but unconfigured
