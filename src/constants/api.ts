export const API_PREFIX = '/api/v1'

const POST_SERVICE_PREFIX = `${API_PREFIX}/post`
const POST_COMMENTS_BASE = `${POST_SERVICE_PREFIX}/api/v1/posts`
const POST_REPLIES_BASE = `${POST_SERVICE_PREFIX}/api/v1/comments`
// Recipe service uses singular 'recipe' per spec (07-recipes.txt)
const RECIPE_SERVICE_PREFIX = `${API_PREFIX}/recipe`
// Social endpoints go through auth gateway per spec (03-social.txt)
const SOCIAL_PREFIX = `${API_PREFIX}/auth/api/social`

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
	// Social endpoints per spec (03-social.txt): /api/v1/auth/api/social/*
	SOCIAL: {
		TOGGLE_FOLLOW: (userId: string) =>
			`${SOCIAL_PREFIX}/toggle-follow/${userId}`,
		TOGGLE_FRIEND_REQUEST: (userId: string) =>
			`${SOCIAL_PREFIX}/toggle-friend-request/${userId}`,
		ACCEPT_FRIEND: (userId: string) =>
			`${SOCIAL_PREFIX}/accept-friend/${userId}`,
		REJECT_FRIEND: (userId: string) =>
			`${SOCIAL_PREFIX}/reject-friend/${userId}`,
		UNFRIEND: (userId: string) => `${SOCIAL_PREFIX}/unfriend/${userId}`,
		GET_FRIENDS: `${SOCIAL_PREFIX}/friends`,
		GET_FRIEND_REQUESTS: `${SOCIAL_PREFIX}/friend-requests`,
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
		// Comments per spec (06-comments.txt)
		GET_COMMENTS: (postId: string) =>
			`${POST_COMMENTS_BASE}/${postId}/comments`,
		CREATE_COMMENT: (postId: string) =>
			`${POST_COMMENTS_BASE}/${postId}/comments`,
		DELETE_COMMENT: (postId: string, commentId: string) =>
			`${POST_COMMENTS_BASE}/${postId}/comments/${commentId}`,
		TOGGLE_LIKE_COMMENT: (postId: string, commentId: string) =>
			`${POST_COMMENTS_BASE}/${postId}/comments/${commentId}/like`,
		// Replies per spec (06-comments.txt)
		GET_REPLIES: (commentId: string) =>
			`${POST_REPLIES_BASE}/${commentId}/replies`,
		CREATE_REPLY: (commentId: string) =>
			`${POST_REPLIES_BASE}/${commentId}/replies`,
	},
	// Recipe endpoints per spec (07-recipes.txt): /api/v1/recipe/* (singular)
	RECIPES: {
		BASE: RECIPE_SERVICE_PREFIX,
		GET_BY_ID: (id: string) => `${RECIPE_SERVICE_PREFIX}/${id}`,
		GET_BY_USER: (userId: string) => `${RECIPE_SERVICE_PREFIX}/user/${userId}`,
		FEED: `${RECIPE_SERVICE_PREFIX}/feed`,
		TRENDING: `${RECIPE_SERVICE_PREFIX}/trending`,
		SEARCH: `${RECIPE_SERVICE_PREFIX}/search`,
		DRAFTS: `${RECIPE_SERVICE_PREFIX}/drafts`,
		CREATE: RECIPE_SERVICE_PREFIX,
		UPDATE: (id: string) => `${RECIPE_SERVICE_PREFIX}/${id}`,
		DELETE: (id: string) => `${RECIPE_SERVICE_PREFIX}/${id}`,
		TOGGLE_LIKE: (id: string) => `${RECIPE_SERVICE_PREFIX}/${id}/like`,
		TOGGLE_SAVE: (id: string) => `${RECIPE_SERVICE_PREFIX}/${id}/save`,
		COMPLETE: (id: string) => `${RECIPE_SERVICE_PREFIX}/${id}/complete`,
		MASTERY: (id: string) => `${RECIPE_SERVICE_PREFIX}/${id}/mastery`,
		PUBLISH: (id: string) => `${RECIPE_SERVICE_PREFIX}/${id}/publish`,
		PREVIEW: (id: string) => `${RECIPE_SERVICE_PREFIX}/${id}/preview`,
		REGENERATE: (id: string) => `${RECIPE_SERVICE_PREFIX}/${id}/regenerate`,
		REVERT: (id: string) => `${RECIPE_SERVICE_PREFIX}/${id}/revert`,
		UPLOAD: `${RECIPE_SERVICE_PREFIX}/uploads`,
		SAVED: `${RECIPE_SERVICE_PREFIX}/saved`,
		LIKED: `${RECIPE_SERVICE_PREFIX}/liked`,
	},
	// Statistics per spec (04-statistics.txt)
	STATISTICS: {
		ADD_XP: `${API_PREFIX}/auth/statistic/add_xp`,
	},
	UPLOAD: {
		FILE: `${POST_SERVICE_PREFIX}/api/upload`, // Returns plain text URL, not JSON
	},
	// Cooking Sessions per spec (08-cooking-sessions.txt)
	COOKING_SESSIONS: {
		BASE: `${API_PREFIX}/cooking-sessions`,
		CURRENT: `${API_PREFIX}/cooking-sessions/current`,
		GET_BY_ID: (sessionId: string) =>
			`${API_PREFIX}/cooking-sessions/${sessionId}`,
		NAVIGATE: (sessionId: string) =>
			`${API_PREFIX}/cooking-sessions/${sessionId}/navigate`,
		TIMER_EVENT: (sessionId: string) =>
			`${API_PREFIX}/cooking-sessions/${sessionId}/timer-event`,
		PAUSE: (sessionId: string) =>
			`${API_PREFIX}/cooking-sessions/${sessionId}/pause`,
		RESUME: (sessionId: string) =>
			`${API_PREFIX}/cooking-sessions/${sessionId}/resume`,
		COMPLETE: (sessionId: string) =>
			`${API_PREFIX}/cooking-sessions/${sessionId}/complete`,
		LINK_POST: (sessionId: string) =>
			`${API_PREFIX}/cooking-sessions/${sessionId}/link-post`,
	},
	// Daily Challenges per spec (12-challenges.txt)
	CHALLENGES: {
		TODAY: `${API_PREFIX}/challenges/today`,
		HISTORY: `${API_PREFIX}/challenges/history`,
	},
	// Chat / Messaging per spec (09-chat.txt)
	CHAT: {
		CREATE_CONVERSATION: `${API_PREFIX}/chat/conversations/create`,
		MY_CONVERSATIONS: `${API_PREFIX}/chat/conversations/my-conversations`,
		CREATE_MESSAGE: `${API_PREFIX}/chat/messages/create`,
		GET_MESSAGES: `${API_PREFIX}/chat/messages`,
	},
	// AI Integration per spec (14-ai-integration.txt)
	AI: {
		PROCESS_RECIPE: `${API_PREFIX}/process_recipe`,
		CALCULATE_METAS: `${API_PREFIX}/calculate_metas`,
		VALIDATE_RECIPE: `${API_PREFIX}/validate_recipe`,
		COOKING_ASSISTANT: `${API_PREFIX}/cooking_assistant`,
		MODERATE: `${API_PREFIX}/moderate`,
	},
	// Leaderboard per spec (03-social.txt)
	LEADERBOARD: {
		GET: `${API_PREFIX}/leaderboard`,
	},
	// Creator stats per spec (03-social.txt)
	CREATOR: {
		STATS: `${API_PREFIX}/users/me/creator-stats`,
	},
	// Notifications per spec (10-notifications.txt)
	NOTIFICATIONS: {
		GET: `${API_PREFIX}/notifications`,
		MARK_READ: (id: string) => `${API_PREFIX}/notifications/${id}/read`,
		MARK_ALL_READ: `${API_PREFIX}/notifications/read-all`,
		REGISTER_DEVICE: `${API_PREFIX}/notifications/devices`,
		UNREGISTER_DEVICE: (token: string) =>
			`${API_PREFIX}/notifications/devices/${token}`,
	},
} as const
