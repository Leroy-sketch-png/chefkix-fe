export const API_PREFIX = '/api/v1'

const AUTH_PREFIX = `${API_PREFIX}/auth`
const POST_SERVICE_PREFIX = `${API_PREFIX}/posts`
const POST_COMMENTS_BASE = `${POST_SERVICE_PREFIX}` // No extra prefix, comments are under /posts/{postId}/comments
const POST_REPLIES_BASE = `${API_PREFIX}/posts` // Replies are under /posts/comments/{commentId}/replies
const RECIPE_SERVICE_PREFIX = `${API_PREFIX}/recipes`
const SOCIAL_PREFIX = `${API_PREFIX}/social`
const COLLECTIONS_PREFIX = `${API_PREFIX}/collections`
const TIPS_PREFIX = `${API_PREFIX}/tips`
const STORIES_PREFIX = `${API_PREFIX}/stories`

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
		GOOGLE: `${API_PREFIX}/auth/google`,
		REFRESH_TOKEN: `${API_PREFIX}/auth/refresh-token`, // Public endpoint, no auth header needed
		ME: `${API_PREFIX}/auth/me`,
		/** Check if username is available for registration */
		CHECK_USERNAME: `${API_PREFIX}/auth/check-username`,
	} as const,
	PROFILE: {
		GET_BY_USER_ID: (userId: string) => `${API_PREFIX}/auth/${userId}`,
		GET_ALL: `${API_PREFIX}/auth/profiles`,
		GET_ALL_PAGINATED: `${API_PREFIX}/auth/profiles/paginated`,
		UPDATE: `${AUTH_PREFIX}/update`,
		GET_PROFILE_ONLY: (userId: string) =>
			`${AUTH_PREFIX}/profile-only/${userId}`,
		DELETE_ACCOUNT: `${AUTH_PREFIX}/delete-account`,
		EXPORT_DATA: `${AUTH_PREFIX}/export-data`,
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
		// Suggested follows
		GET_SUGGESTED: `${SOCIAL_PREFIX}/suggested`,
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
		VOTE_POLL: (postId: string) => `${POST_SERVICE_PREFIX}/${postId}/vote`,
		RATE_PLATE: (postId: string) =>
			`${POST_SERVICE_PREFIX}/${postId}/rate-plate`,
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
		// Reports per spec (13-moderation.txt)
		REPORT: `${POST_SERVICE_PREFIX}/report`,
		// Recipe Reviews
		GET_REVIEWS_FOR_RECIPE: (recipeId: string) =>
			`${POST_SERVICE_PREFIX}/reviews/recipe/${recipeId}`,
		GET_REVIEW_STATS: (recipeId: string) =>
			`${POST_SERVICE_PREFIX}/reviews/recipe/${recipeId}/stats`,
		// Recipe Battles
		VOTE_BATTLE: (postId: string) =>
			`${POST_SERVICE_PREFIX}/battles/${postId}/vote`,
		GET_ACTIVE_BATTLES: `${POST_SERVICE_PREFIX}/battles/active`,
		// Taste Profile (Sprint 7)
		TASTE_PROFILE: `${POST_SERVICE_PREFIX}/taste-profile`,
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
		TONIGHT_PICK: `${RECIPE_SERVICE_PREFIX}/tonight-pick`,
		SIMILAR: (id: string) => `${RECIPE_SERVICE_PREFIX}/${id}/similar`,
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
		COOK_CARD: (sessionId: string) =>
			`${API_PREFIX}/cooking-sessions/${sessionId}/cook-card`,
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
	// Cooking Duels (1v1 friend challenges)
	DUELS: {
		CREATE: `${API_PREFIX}/duels`,
		ACCEPT: (duelId: string) => `${API_PREFIX}/duels/${duelId}/accept`,
		DECLINE: (duelId: string) => `${API_PREFIX}/duels/${duelId}/decline`,
		CANCEL: (duelId: string) => `${API_PREFIX}/duels/${duelId}/cancel`,
		GET: (duelId: string) => `${API_PREFIX}/duels/${duelId}`,
		MY: `${API_PREFIX}/duels/my`,
		ACTIVE: `${API_PREFIX}/duels/active`,
		INVITES: `${API_PREFIX}/duels/invites`,
	},
	// Achievements / Skill Tree
	ACHIEVEMENTS: {
		ALL: `${API_PREFIX}/achievements`,
		MY_SKILL_TREE: `${API_PREFIX}/achievements/my-skill-tree`,
		USER_SKILL_TREE: (userId: string) =>
			`${API_PREFIX}/achievements/user/${userId}`,
		MY_UNLOCKED: `${API_PREFIX}/achievements/my-unlocked`,
	},
	// Referral System
	REFERRALS: {
		MY_CODE: `${API_PREFIX}/referrals/my-code`,
		REDEEM: `${API_PREFIX}/referrals/redeem`,
		STATS: `${API_PREFIX}/referrals/stats`,
	},
	// Subscription / Premium
	SUBSCRIPTION: {
		MY: `${API_PREFIX}/subscription/my`,
		PREMIUM_STATUS: `${API_PREFIX}/subscription/premium-status`,
		ACTIVATE: `${API_PREFIX}/subscription/activate`,
		TRIAL: `${API_PREFIX}/subscription/trial`,
		CANCEL: `${API_PREFIX}/subscription/cancel`,
	},
	// Chat / Messaging per spec (09-chat.txt)
	CHAT: {
		CREATE_CONVERSATION: `${API_PREFIX}/chat/conversations/create`,
		MY_CONVERSATIONS: `${API_PREFIX}/chat/conversations/my-conversations`,
		CREATE_MESSAGE: `${API_PREFIX}/chat/messages/create`,
		GET_MESSAGES: `${API_PREFIX}/chat/messages`,
		GET_MESSAGES_PAGINATED: `${API_PREFIX}/chat/messages/paginated`,
		SHARE_SUGGESTIONS: `${API_PREFIX}/chat/conversations/share-suggestions`,
		REACT_MESSAGE: (messageId: string) =>
			`${API_PREFIX}/chat/messages/${messageId}/react`,
		DELETE_MESSAGE: (messageId: string) =>
			`${API_PREFIX}/chat/messages/${messageId}`,
		VIDEO_SIGNALING_WS: `${API_PREFIX}/ws/video-signaling`,
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
		STEP_HEATMAP: (id: string) => `${RECIPE_SERVICE_PREFIX}/${id}/step-heatmap`,
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
		UNREGISTER_ALL_PUSH_TOKENS: `${API_PREFIX}/devices/push-tokens`,
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
		INGREDIENT_LINKS: `${API_PREFIX}/shopping-lists/ingredient-links`,
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
		DELETE_MY_DATA: `${API_PREFIX}/events/my-data`,
	},
	SEARCH: {
		UNIFIED: `${API_PREFIX}/search`,
		AUTOCOMPLETE: `${API_PREFIX}/search/autocomplete`,
		TRENDING: `${API_PREFIX}/search/trending`,
	},
	KNOWLEDGE: {
		INGREDIENTS: `${API_PREFIX}/knowledge/ingredients`,
		INGREDIENT: (name: string) => `${API_PREFIX}/knowledge/ingredients/${name}`,
		SUBSTITUTIONS: (name: string) =>
			`${API_PREFIX}/knowledge/ingredients/${name}/substitutions`,
		TECHNIQUES: `${API_PREFIX}/knowledge/techniques`,
		TECHNIQUE: (name: string) => `${API_PREFIX}/knowledge/techniques/${name}`,
	},
	// ── Wave 5: Intelligence + Commerce ──
	PRESENCE: {
		HEARTBEAT: `${API_PREFIX}/presence/heartbeat`,
		FRIENDS: `${API_PREFIX}/presence/friends`,
		FRIENDS_COOKING: `${API_PREFIX}/presence/friends/cooking`,
		OFFLINE: `${API_PREFIX}/presence/offline`,
		GET_USER: (userId: string) => `${API_PREFIX}/presence/${userId}`,
	},
	VERIFICATION: {
		APPLY: `${API_PREFIX}/verification/apply`,
		STATUS: `${API_PREFIX}/verification/status`,
		ADMIN_APPROVE: (requestId: string) =>
			`${API_PREFIX}/verification/${requestId}/approve`,
		ADMIN_REJECT: (requestId: string) =>
			`${API_PREFIX}/verification/${requestId}/reject`,
	},
	// AI ML endpoints (direct to AI service on port 8000)
	ML: {
		NER_EXTRACT: '/api/v1/ner/extract',
		CALIBRATE_DIFFICULTY: '/api/v1/ml/calibrate-difficulty',
		CONTENT_GUARD: '/api/v1/ml/content-guard',
	},
	GROUPS: {
		BASE: `${API_PREFIX}/group`,
		CREATE: `${API_PREFIX}/group`,
		GET_BY_ID: (groupId: string) => `${API_PREFIX}/group/${groupId}`,
		UPDATE: (groupId: string) => `${API_PREFIX}/group/${groupId}`,
		JOIN: (groupId: string) => `${API_PREFIX}/group/${groupId}/join`,
		LEAVE: (groupId: string) => `${API_PREFIX}/group/${groupId}/leave`,
		EXPLORE: `${API_PREFIX}/group/explore`,
		MY_GROUPS: `${API_PREFIX}/group/me`,
		GET_MEMBERS: (groupId: string) => `${API_PREFIX}/group/${groupId}/members`,
		GET_PENDING_REQUESTS: (groupId: string) =>
			`${API_PREFIX}/group/${groupId}/requests`,
		PROCESS_REQUEST: (groupId: string, userId: string) =>
			`${API_PREFIX}/group/${groupId}/requests/${userId}`,
		KICK_MEMBER: (groupId: string, userId: string) =>
			`${API_PREFIX}/group/${groupId}/members/${userId}`,
		TRANSFER_OWNERSHIP: (groupId: string) =>
			`${API_PREFIX}/group/${groupId}/transfer`,
		CHANGE_PRIVACY: (groupId: string) =>
			`${API_PREFIX}/group/${groupId}/privacy`,
		CREATE_POST: (groupId: string) =>
			`${API_PREFIX}/posts/groups/${groupId}/posts`,
		GET_POSTS: (groupId: string) =>
			`${API_PREFIX}/posts/groups/${groupId}/posts`,
	},
	COLLECTIONS: {
		BASE: COLLECTIONS_PREFIX,
		GET_MY: COLLECTIONS_PREFIX,
		GET_BY_ID: (id: string) => `${COLLECTIONS_PREFIX}/${id}`,
		GET_POSTS: (id: string) => `${COLLECTIONS_PREFIX}/${id}/posts`,
		GET_BY_USER: (userId: string) => `${COLLECTIONS_PREFIX}/user/${userId}`,
		CREATE: COLLECTIONS_PREFIX,
		UPDATE: (id: string) => `${COLLECTIONS_PREFIX}/${id}`,
		DELETE: (id: string) => `${COLLECTIONS_PREFIX}/${id}`,
		ADD_POST: (collectionId: string, postId: string) =>
			`${COLLECTIONS_PREFIX}/${collectionId}/posts/${postId}`,
		REMOVE_POST: (collectionId: string, postId: string) =>
			`${COLLECTIONS_PREFIX}/${collectionId}/posts/${postId}`,
		// Learning Path V2 endpoints
		ENROLL: (id: string) => `${COLLECTIONS_PREFIX}/${id}/enroll`,
		GET_PROGRESS: (id: string) => `${COLLECTIONS_PREFIX}/${id}/progress`,
		UPDATE_PROGRESS: (id: string, recipeId: string, xpEarned: number = 0) =>
			`${COLLECTIONS_PREFIX}/${id}/progress?recipeId=${recipeId}&xpEarned=${xpEarned}`,
		// Featured / Seasonal
		FEATURED: `${COLLECTIONS_PREFIX}/featured`,
	},
	TIPS: {
		MY_SETTINGS: `${TIPS_PREFIX}/settings`,
		UPDATE_SETTINGS: `${TIPS_PREFIX}/settings`,
		CREATOR_SETTINGS: (creatorId: string) =>
			`${TIPS_PREFIX}/creator/${creatorId}`,
		SEND: `${TIPS_PREFIX}/send`,
		RECEIVED: `${TIPS_PREFIX}/received`,
		SENT: `${TIPS_PREFIX}/sent`,
	},
	STORIES: {
		BASE: STORIES_PREFIX,
		CREATE: STORIES_PREFIX,
		FEED: `${STORIES_PREFIX}/feed`,
		HIGHLIGHTS: `${STORIES_PREFIX}/highlights`,
		INTERACTIONS: `${STORIES_PREFIX}/interactions`,
	},
} as const
