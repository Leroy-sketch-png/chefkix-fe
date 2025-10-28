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
		GET_ALL: '/api/profiles',
	},
	SOCIAL: {
		TOGGLE_FOLLOW: (userId: string) => `/api/social/toggle-follow/${userId}`,
		TOGGLE_FRIEND_REQUEST: (userId: string) =>
			`/api/social/toggle-friend-request/${userId}`,
		ACCEPT_FRIEND_REQUEST: (userId: string) =>
			`/api/social/accept-friend-request/${userId}`,
		DECLINE_FRIEND_REQUEST: (userId: string) =>
			`/api/social/decline-friend-request/${userId}`,
		UNFRIEND: (userId: string) => `/api/social/unfriend/${userId}`,
	},
} as const
