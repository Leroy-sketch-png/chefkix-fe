export const API_PREFIX = '/api/v1'

export const API_ENDPOINTS = {
	AUTH: {
		LOGIN: `${API_PREFIX}/auth/login`,
		REGISTER: `${API_PREFIX}/auth/register`,
		LOGOUT: `${API_PREFIX}/auth/logout`, // No request body required
		SEND_OTP: `${API_PREFIX}/auth/send-otp`,
		// RESEND_OTP: `${API_PREFIX}/auth/resend-otp`, // TODO: Pending backend implementation
		VERIFY_OTP: `${API_PREFIX}/auth/verify-otp-user`,
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
		CREATE: `${API_PREFIX}/post/create`,
		UPDATE: (postId: string) => `${API_PREFIX}/post/update?postId=${postId}`,
		DELETE: (postId: string) => `${API_PREFIX}/post/delete?postId=${postId}`,
		TOGGLE_LIKE: (postId: string) => `${API_PREFIX}/post/toggle-like/${postId}`,
		TOGGLE_SAVE: (postId: string) => `${API_PREFIX}/post/toggle-save/${postId}`,
		GET_ALL: `${API_PREFIX}/post/all`,
		GET_FEED: (userId: string) => `${API_PREFIX}/post/feed?userId=${userId}`,
		GET_COMMENTS: (postId: string) => `${API_PREFIX}/posts/${postId}/comments`,
		CREATE_COMMENT: (postId: string) =>
			`${API_PREFIX}/posts/${postId}/comments`,
		DELETE_COMMENT: (postId: string, commentId: string) =>
			`${API_PREFIX}/posts/${postId}/comments/${commentId}`,
		TOGGLE_LIKE_COMMENT: (postId: string, commentId: string) =>
			`${API_PREFIX}/posts/${postId}/comments/${commentId}/like`,
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
	COMMENT: {
		CREATE: (postId: string) => `${API_PREFIX}/posts/${postId}/comments`,
		GET_ALL: (postId: string) => `${API_PREFIX}/posts/${postId}/comments`,
		TOGGLE_LIKE: (commentId: string) =>
			`${API_PREFIX}/comments/${commentId}/like`,
	},
	REPLY: {
		CREATE: (commentId: string) =>
			`${API_PREFIX}/comments/${commentId}/replies`,
		GET_ALL: (commentId: string) =>
			`${API_PREFIX}/comments/${commentId}/replies`,
	},
	UPLOAD: {
		FILE: `${API_PREFIX}/upload`, // Returns plain text URL, not JSON
	},
} as const
