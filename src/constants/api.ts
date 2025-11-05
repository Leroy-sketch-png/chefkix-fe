export const API_PREFIX = '/api/v1'

export const API_ENDPOINTS = {
	AUTH: {
		LOGIN: `${API_PREFIX}/auth/login`,
		REGISTER: `${API_PREFIX}/auth/register`,
		INTROSPECT: `${API_PREFIX}/auth/introspect`,
		SEND_OTP: `${API_PREFIX}/auth/send-otp`,
		VERIFY_OTP: `${API_PREFIX}/auth/verify-otp-user`,
		GOOGLE: `${API_PREFIX}/auth/google`,
		REFRESH_TOKEN: `${API_PREFIX}/auth/refresh-token`,
		ME: `${API_PREFIX}/auth/me`,
	},
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
	},
	POST: {
		CREATE: `${API_PREFIX}/post/create`,
		UPDATE: (postId: string) => `${API_PREFIX}/post/update?postId=${postId}`,
		DELETE: (postId: string) => `${API_PREFIX}/post/delete?postId=${postId}`,
		TOGGLE_LIKE: (postId: string) => `${API_PREFIX}/post/toggle-like/${postId}`,
		GET_ALL: `${API_PREFIX}/post/all`,
		GET_FEED: (userId: string) => `${API_PREFIX}/post/feed?userId=${userId}`,
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
} as const
