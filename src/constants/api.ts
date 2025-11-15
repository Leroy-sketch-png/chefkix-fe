export const API_PREFIX = '/api/v1'

const POST_SERVICE_PREFIX = `${API_PREFIX}/post`
const POST_COMMENTS_BASE = `${POST_SERVICE_PREFIX}/api/v1/posts`

export const API_ENDPOINTS = {
	AUTH: {
		LOGIN: `${API_PREFIX}/auth/login`,
		REGISTER: `${API_PREFIX}/auth/register`,
		LOGOUT: `${API_PREFIX}/auth/logout`, // No request body required
		/** Legacy resend while backend finalizes canonical resend flow */
		SEND_OTP: `${API_PREFIX}/auth/send-otp`,
		VERIFY_OTP_USER: `${API_PREFIX}/auth/verify-otp-user`,
		VERIFY_OTP_PASSWORD: `${API_PREFIX}/auth/verify-otp-password`,
		FORGOT_PASSWORD: `${API_PREFIX}/auth/forgot-password`,
		CHANGE_PASSWORD: `${API_PREFIX}/auth/change-password`,
		GOOGLE: `${API_PREFIX}/auth/google`, // TODO: Pending backend implementation (OAuth flow may change)
		REFRESH_TOKEN: `${API_PREFIX}/auth/refresh-token`, // Public endpoint, no auth header needed
		ME: `${API_PREFIX}/auth/me`,
	} as const,
	PROFILE: {
		GET_BY_USER_ID: (userId: string) => `${API_PREFIX}/auth/${userId}`,
		GET_ALL: `${API_PREFIX}/auth/profiles`,
	},
	SOCIAL: {
		TOGGLE_FOLLOW: (userId: string) =>
			`${API_PREFIX}/social/toggle-follow/${userId}`,
		TOGGLE_FRIEND_REQUEST: (userId: string) =>
			`${API_PREFIX}/social/toggle-friend-request/${userId}`,
		ACCEPT_FRIEND: (userId: string) =>
			`${API_PREFIX}/social/accept-friend/${userId}`,
		REJECT_FRIEND: (userId: string) =>
			`${API_PREFIX}/social/reject-friend/${userId}`,
		UNFRIEND: (userId: string) => `${API_PREFIX}/social/unfriend/${userId}`,
		GET_FRIENDS: `${API_PREFIX}/social/friends`,
		GET_FRIEND_REQUESTS: `${API_PREFIX}/social/friend-requests`,
	},
	POST: {
		CREATE: POST_SERVICE_PREFIX,
		UPDATE: (postId: string) => `${POST_SERVICE_PREFIX}/${postId}`,
		DELETE: (postId: string) => `${POST_SERVICE_PREFIX}/${postId}`,
		TOGGLE_LIKE: (postId: string) =>
			`${POST_SERVICE_PREFIX}/toggle-like/${postId}`,
		TOGGLE_SAVE: (postId: string) =>
			`${POST_SERVICE_PREFIX}/toggle-save/${postId}`,
		GET_ALL: `${POST_SERVICE_PREFIX}/all`,
		GET_FEED: (userId: string) =>
			`${POST_SERVICE_PREFIX}/feed?userId=${userId}`,
		GET_COMMENTS: (postId: string) =>
			`${POST_COMMENTS_BASE}/${postId}/comments`,
		CREATE_COMMENT: (postId: string) =>
			`${POST_COMMENTS_BASE}/${postId}/comments`,
		DELETE_COMMENT: (postId: string, commentId: string) =>
			`${POST_COMMENTS_BASE}/${postId}/comments/${commentId}`,
		TOGGLE_LIKE_COMMENT: (postId: string, commentId: string) =>
			`${POST_COMMENTS_BASE}/${postId}/comments/${commentId}/like`,
	},
	RECIPES: {
		BASE: `${API_PREFIX}/recipes`,
		GET_BY_ID: (id: string) => `${API_PREFIX}/recipes/${id}`,
		GET_BY_USER: (userId: string) => `${API_PREFIX}/recipes/user/${userId}`,
		FEED: `${API_PREFIX}/recipes/feed`,
		TRENDING: `${API_PREFIX}/recipes/trending`,
		CREATE: `${API_PREFIX}/recipes`,
		UPDATE: (id: string) => `${API_PREFIX}/recipes/${id}`,
		DELETE: (id: string) => `${API_PREFIX}/recipes/${id}`,
		TOGGLE_LIKE: (id: string) => `${API_PREFIX}/recipes/${id}/like`,
		TOGGLE_SAVE: (id: string) => `${API_PREFIX}/recipes/${id}/save`,
		SAVED: `${API_PREFIX}/recipes/saved`,
		LIKED: `${API_PREFIX}/recipes/liked`,
	},
	STATISTICS: {
		ADD_XP: `${API_PREFIX}/statistic/add_xp`,
	},
	UPLOAD: {
		FILE: `${POST_SERVICE_PREFIX}/api/upload`, // Returns plain text URL, not JSON
	},
} as const
