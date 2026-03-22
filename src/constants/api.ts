export const API_PREFIX = '/api/v1'

const AUTH_PREFIX = `${API_PREFIX}/auth`
const POST_SERVICE_PREFIX = `${API_PREFIX}/posts`
const POST_COMMENTS_BASE = `${POST_SERVICE_PREFIX}` // No extra prefix, comments are under /posts/{postId}/comments
const POST_REPLIES_BASE = `${API_PREFIX}/posts` // Replies are under /posts/comments/{commentId}/replies
const RECIPE_SERVICE_PREFIX = `${API_PREFIX}/recipes`
const SOCIAL_PREFIX = `${API_PREFIX}/social`

export const API_ENDPOINTS = {
	AUTH: {
		LOGIN: `${API_PREFIX}/auth/login`,
		REGISTER: `${API_PREFIX}/auth/register`,
		LOGOUT: `${API_PREFIX}/auth/logout`, // No request body required
		/** Resend OTP for email verification during signup */
		RESEND_OTP: `${API_PREFIX}/auth/resend-otp`,
		/** Verify OTP and create user account */
		VERIFY_OTP_USER: `${API_PREFIX}/auth/verify-otp-user`,
		/** Verify OTP for password reset (with new password) */
		VERIFY_OTP_PASSWORD: `${API_PREFIX}/auth/verify-otp-password`,
		FORGOT_PASSWORD: `${API_PREFIX}/auth/forgot-password`,
		CHANGE_PASSWORD: `${API_PREFIX}/auth/change-password`,
		GOOGLE: `${API_PREFIX}/auth/google`, // Future: Requires Keycloak Google IdP setup + backend OAuth callback
		REFRESH_TOKEN: `${API_PREFIX}/auth/refresh-token`, // Public endpoint, no auth header needed
		ME: `${API_PREFIX}/auth/me`,
	} as const,
	PROFILE: {
		GET_BY_USER_ID: (userId: string) => `${API_PREFIX}/auth/${userId}`,
		GET_ALL: `${API_PREFIX}/auth/profiles`,
		GET_ALL_PAGINATED: `${API_PREFIX}/auth/profiles/paginated`,
		UPDATE: `${AUTH_PREFIX}/update`,
		GET_PROFILE_ONLY: (userId: string) =>
			`${AUTH_PREFIX}/profile-only/${userId}`,
	},
	// Social endpoints per spec (03-social.txt): /api/v1/social/*
	// Instagram Model: Follow-only system, mutual follows = friends
	SOCIAL: {
		// Core: Follow system
		TOGGLE_FOLLOW: (userId: string) =>
			`${SOCIAL_PREFIX}/toggle-follow/${userId}`,
		GET_FOLLOWING: `${SOCIAL_PREFIX}/following`,
		GET_FOLLOWERS: `${SOCIAL_PREFIX}/followers`,
		// Friends = Mutual follows (no explicit friend requests)
		GET_FRIENDS: `${SOCIAL_PREFIX}/friends`,
		IS_MUTUAL: (userId: string) => `${SOCIAL_PREFIX}/is-mutual/${userId}`,
		// Block system
		BLOCK: (userId: string) => `${SOCIAL_PREFIX}/block/${userId}`,
		UNBLOCK: (userId: string) => `${SOCIAL_PREFIX}/block/${userId}`, // DELETE method
		GET_BLOCKED: `${SOCIAL_PREFIX}/blocked-users`,
		IS_BLOCKED: (userId: string) => `${SOCIAL_PREFIX}/is-blocked/${userId}`,
	},
	POST: {
		CREATE: POST_SERVICE_PREFIX,
		GET_BY_ID: (postId: string) => `${POST_SERVICE_PREFIX}/${postId}`,
		UPDATE: (postId: string) => `${POST_SERVICE_PREFIX}/${postId}`,
		DELETE: (postId: string) => `${POST_SERVICE_PREFIX}/${postId}`,
		TOGGLE_LIKE: (postId: string) =>
			`${POST_SERVICE_PREFIX}/toggle-like/${postId}`,
		TOGGLE_SAVE: (postId: string) =>
			`${POST_SERVICE_PREFIX}/toggle-save/${postId}`,
		GET_ALL: `${POST_SERVICE_PREFIX}/all`,
		GET_FOLLOWING: `${POST_SERVICE_PREFIX}/following`,
		GET_FEED: (userId: string) =>
			`${POST_SERVICE_PREFIX}/feed?userId=${userId}`,
		GET_SAVED: `${POST_SERVICE_PREFIX}/saved`,
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
			`${POST_REPLIES_BASE}/comments/${commentId}/replies`,
		CREATE_REPLY: (commentId: string) =>
			`${POST_REPLIES_BASE}/comments/${commentId}/replies`,
		DELETE_REPLY: (commentId: string, replyId: string) =>
			`${POST_REPLIES_BASE}/comments/${commentId}/replies/${replyId}`,
		TOGGLE_LIKE_REPLY: (commentId: string, replyId: string) =>
			`${POST_REPLIES_BASE}/comments/${commentId}/replies/${replyId}/like`,
		SEARCH: `${POST_SERVICE_PREFIX}/search`,
		// Reports per spec (13-moderation.txt)
		REPORT: `${POST_SERVICE_PREFIX}/report`,
	},
	// Recipe endpoints per spec (07-recipes.txt): /api/v1/recipe/* (singular)
	RECIPES: {
		BASE: RECIPE_SERVICE_PREFIX,
		GET_BY_ID: (id: string) => `${RECIPE_SERVICE_PREFIX}/${id}`,
		GET_BY_USER: (userId: string) => `${RECIPE_SERVICE_PREFIX}/user/${userId}`,
		FEED: `${RECIPE_SERVICE_PREFIX}/feed`,
		TRENDING: `${RECIPE_SERVICE_PREFIX}/trending`,
		SEARCH: `${RECIPE_SERVICE_PREFIX}/search`,
		// Draft management (spec 07-recipes.txt)
		DRAFTS: `${RECIPE_SERVICE_PREFIX}/drafts`,
		CREATE_DRAFT: `${RECIPE_SERVICE_PREFIX}/draft`,
		SAVE_DRAFT: (id: string) => `${RECIPE_SERVICE_PREFIX}/${id}`,
		DISCARD_DRAFT: (id: string) => `${RECIPE_SERVICE_PREFIX}/${id}`,
		CREATE: RECIPE_SERVICE_PREFIX,
		UPDATE: (id: string) => `${RECIPE_SERVICE_PREFIX}/${id}`,
		DELETE: (id: string) => `${RECIPE_SERVICE_PREFIX}/${id}`,
		TOGGLE_LIKE: (id: string) => `${RECIPE_SERVICE_PREFIX}/${id}/like`,
		TOGGLE_SAVE: (id: string) => `${RECIPE_SERVICE_PREFIX}/${id}/save`,
		PUBLISH: (id: string) => `${RECIPE_SERVICE_PREFIX}/${id}/publish`,
		DUPLICATE: (id: string) => `${RECIPE_SERVICE_PREFIX}/${id}/duplicate`,
		UPLOAD: `${RECIPE_SERVICE_PREFIX}/uploads`,
		UPLOAD_VIDEO: `${RECIPE_SERVICE_PREFIX}/uploads/video`,
		SAVED: `${RECIPE_SERVICE_PREFIX}/saved`,
		LIKED: `${RECIPE_SERVICE_PREFIX}/liked`,
		SOCIAL_PROOF: (id: string) => `${RECIPE_SERVICE_PREFIX}/${id}/social-proof`,
	},
	// Statistics: XP is awarded via Kafka (xp-delivery topic), not REST. No FE endpoints needed.
	// Cooking Sessions per spec (08-cooking-sessions.txt)
	COOKING_SESSIONS: {
		BASE: `${API_PREFIX}/cooking-sessions`,
		CURRENT: `${API_PREFIX}/cooking-sessions/current`,
		GET_BY_ID: (sessionId: string) =>
			`${API_PREFIX}/cooking-sessions/${sessionId}`,
		NAVIGATE: (sessionId: string) =>
			`${API_PREFIX}/cooking-sessions/${sessionId}/navigate`,
		COMPLETE_STEP: (sessionId: string) =>
			`${API_PREFIX}/cooking-sessions/${sessionId}/complete-step`,
		TIMER_EVENT: (sessionId: string) =>
			`${API_PREFIX}/cooking-sessions/${sessionId}/timer-event`,
		PAUSE: (sessionId: string) =>
			`${API_PREFIX}/cooking-sessions/${sessionId}/pause`,
		RESUME: (sessionId: string) =>
			`${API_PREFIX}/cooking-sessions/${sessionId}/resume`,
		COMPLETE: (sessionId: string) =>
			`${API_PREFIX}/cooking-sessions/${sessionId}/complete`,
		ABANDON: (sessionId: string) =>
			`${API_PREFIX}/cooking-sessions/${sessionId}/abandon`,
		LINK_POST: (sessionId: string) =>
			`${API_PREFIX}/cooking-sessions/${sessionId}/link-post`,
		FRIENDS_ACTIVE: `${API_PREFIX}/cooking-sessions/friends-active`,
	},
	// Co-Cooking Rooms per spec (18-co-cooking.txt, 24-advanced-multiplayer.txt)
	COOKING_ROOMS: {
		BASE: `${API_PREFIX}/cooking-rooms`,
		JOIN: `${API_PREFIX}/cooking-rooms/join`,
		GET: (roomCode: string) => `${API_PREFIX}/cooking-rooms/${roomCode}`,
		LEAVE: (roomCode: string) =>
			`${API_PREFIX}/cooking-rooms/${roomCode}/leave`,
		INVITE: (roomCode: string) =>
			`${API_PREFIX}/cooking-rooms/${roomCode}/invite`,
		FRIENDS_ACTIVE: `${API_PREFIX}/cooking-rooms/friends-active`,
	},
	// Daily, Weekly, Community & Seasonal Challenges
	CHALLENGES: {
		TODAY: `${API_PREFIX}/challenges/today`,
		WEEKLY: `${API_PREFIX}/challenges/weekly`,
		HISTORY: `${API_PREFIX}/challenges/history`,
		COMMUNITY: `${API_PREFIX}/challenges/community`,
		SEASONAL: `${API_PREFIX}/challenges/seasonal`,
	},
	// Chat / Messaging per spec (09-chat.txt)
	CHAT: {
		CREATE_CONVERSATION: `${API_PREFIX}/chat/conversations/create`,
		MY_CONVERSATIONS: `${API_PREFIX}/chat/conversations/my-conversations`,
		CREATE_MESSAGE: `${API_PREFIX}/chat/messages/create`,
		GET_MESSAGES: `${API_PREFIX}/chat/messages`,
		GET_MESSAGES_PAGINATED: `${API_PREFIX}/chat/messages/paginated`,
	},
	// AI Integration per spec (14-ai-integration.txt)
	AI: {
		PROCESS_RECIPE: `${API_PREFIX}/process_recipe`,
		CALCULATE_METAS: `${API_PREFIX}/calculate_metas`,
		VALIDATE_RECIPE: `${API_PREFIX}/validate_recipe`,
		COOKING_ASSISTANT: `${API_PREFIX}/cooking_assistant`,
		MODERATE: `${API_PREFIX}/moderate`,
		SUGGEST_SUBSTITUTIONS: `${API_PREFIX}/suggest_substitutions`,
		REMIX_RECIPE: `${API_PREFIX}/remix_recipe`,
	},
	// Leaderboard (identity module)
	LEADERBOARD: {
		GET: `${AUTH_PREFIX}/leaderboard`,
		MY_RANK: `${AUTH_PREFIX}/leaderboard/my-rank`,
	},
	// Creator stats per spec (03-social.txt)
	// BE: StatisticController.java -> /auth/me/creator-stats
	CREATOR: {
		STATS: `${AUTH_PREFIX}/me/creator-stats`,
		PERFORMANCE: `${RECIPE_SERVICE_PREFIX}/creator/performance`,
		RECENT_COOKS: `${RECIPE_SERVICE_PREFIX}/creator/recent-cooks`,
	},
	// Notifications (notification module)
	NOTIFICATIONS: {
		GET: `${API_PREFIX}/notification`,
		UNREAD_COUNT: `${API_PREFIX}/notification/unread-count`,
		// PUT /notification with body { notificationIds: [], read: true }
		UPDATE_READ_STATUS: `${API_PREFIX}/notification`,
		MARK_READ: (id: string) => `${API_PREFIX}/notification/${id}/read`,
		MARK_ALL_READ: `${API_PREFIX}/notification/read-all`,
		SUMMARY_SINCE: `${API_PREFIX}/notification/summary-since`,
		// Push notification token management (matches BE DeviceController at /devices/push-token)
		REGISTER_PUSH_TOKEN: `${API_PREFIX}/devices/push-token`,
		UNREGISTER_PUSH_TOKEN: `${API_PREFIX}/devices/push-token`,
	},
	// Pantry Management per spec (23-pantry-and-meal-planning.txt)
	PANTRY: {
		BASE: `${API_PREFIX}/pantry`,
		BULK_ADD: `${API_PREFIX}/pantry/bulk`,
		UPDATE: (id: string) => `${API_PREFIX}/pantry/${id}`,
		DELETE: (id: string) => `${API_PREFIX}/pantry/${id}`,
		CLEAR_EXPIRED: `${API_PREFIX}/pantry/expired`,
		MATCH_RECIPES: `${API_PREFIX}/pantry/recipes`,
	},
	// Meal Planning per spec (23-pantry-and-meal-planning.txt)
	MEAL_PLANS: {
		GENERATE: `${API_PREFIX}/meal-plans/generate`,
		CURRENT: `${API_PREFIX}/meal-plans/current`,
		GET: (id: string) => `${API_PREFIX}/meal-plans/${id}`,
		DELETE: (id: string) => `${API_PREFIX}/meal-plans/${id}`,
		SWAP_MEAL: (id: string, day: string, type: string) =>
			`${API_PREFIX}/meal-plans/${id}/meals/${day}/${type}`,
		SHOPPING_LIST: (id: string) =>
			`${API_PREFIX}/meal-plans/${id}/shopping-list`,
	},
	// Shopping Lists (standalone persistent lists)
	SHOPPING_LISTS: {
		BASE: `${API_PREFIX}/shopping-lists`,
		FROM_MEAL_PLAN: `${API_PREFIX}/shopping-lists/from-meal-plan`,
		FROM_RECIPE: `${API_PREFIX}/shopping-lists/from-recipe`,
		CUSTOM: `${API_PREFIX}/shopping-lists/custom`,
		GET: (id: string) => `${API_PREFIX}/shopping-lists/${id}`,
		SHARED: (token: string) => `${API_PREFIX}/shopping-lists/shared/${token}`,
		TOGGLE_ITEM: (id: string, itemId: string) =>
			`${API_PREFIX}/shopping-lists/${id}/items/${itemId}/toggle`,
		ADD_ITEM: (id: string) => `${API_PREFIX}/shopping-lists/${id}/items`,
		REMOVE_ITEM: (id: string, itemId: string) =>
			`${API_PREFIX}/shopping-lists/${id}/items/${itemId}`,
		DELETE: (id: string) => `${API_PREFIX}/shopping-lists/${id}`,
		SHARE: (id: string) => `${API_PREFIX}/shopping-lists/${id}/share`,
	},
	// User Settings (identity module)
	SETTINGS: {
		GET_ALL: `${AUTH_PREFIX}/settings`,
		PRIVACY: `${AUTH_PREFIX}/settings/privacy`,
		NOTIFICATIONS: `${AUTH_PREFIX}/settings/notifications`,
		COOKING: `${AUTH_PREFIX}/settings/cooking`,
		APP: `${AUTH_PREFIX}/settings/app`,
	},
	ADMIN: {
		GET_PENDING_REPORTS: `${API_PREFIX}/admin/reports`,
		GET_ALL_REPORTS: `${API_PREFIX}/admin/reports/all`,
		REVIEW_REPORT: (reportId: string) =>
			`${API_PREFIX}/admin/reports/${reportId}/review`,
		BAN_USER: (userId: string) => `${API_PREFIX}/admin/users/${userId}/ban`,
		GET_USER_BANS: (userId: string) =>
			`${API_PREFIX}/admin/users/${userId}/bans`,
		REVOKE_BAN: (banId: string) => `${API_PREFIX}/admin/bans/${banId}`,
		GET_PENDING_APPEALS: `${API_PREFIX}/admin/appeals`,
		REVIEW_APPEAL: (appealId: string) =>
			`${API_PREFIX}/admin/appeals/${appealId}/review`,
	},
	EVENTS: {
		TRACK: `${API_PREFIX}/events`,
	},
	SEARCH: {
		UNIFIED: `${API_PREFIX}/search`,
		AUTOCOMPLETE: `${API_PREFIX}/search/autocomplete`,
	},
	KNOWLEDGE: {
		INGREDIENTS: `${API_PREFIX}/knowledge/ingredients`,
		INGREDIENT: (name: string) => `${API_PREFIX}/knowledge/ingredients/${name}`,
		SUBSTITUTIONS: (name: string) =>
			`${API_PREFIX}/knowledge/ingredients/${name}/substitutions`,
		TECHNIQUES: `${API_PREFIX}/knowledge/techniques`,
		TECHNIQUE: (name: string) => `${API_PREFIX}/knowledge/techniques/${name}`,
	},
} as const
