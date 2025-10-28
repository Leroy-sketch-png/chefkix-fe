export const API_ENDPOINTS = {
	AUTH: {
		LOGIN: '/api/auth/login',
		REGISTER: '/api/auth/register',
		INTROSPECT: '/api/auth/introspect',
		SEND_OTP: '/api/auth/send-otp',
		VERIFY_OTP: '/api/auth/verify-otp',
		GOOGLE: '/api/auth/google',
	},
	PROFILE: {
		GET_BY_USERNAME: (username: string) => `/api/profiles/${username}`,
		GET_ME: '/api/profiles/me',
	},
} as const
