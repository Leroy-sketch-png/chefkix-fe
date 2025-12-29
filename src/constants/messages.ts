/**
 * Centralized UI/UX Messages
 * Single source of truth for all user-facing strings
 */

// ============ AUTH MESSAGES ============
export const AUTH_MESSAGES = {
	UNKNOWN_ERROR: 'An unexpected error occurred. Please try again later.',
	GOOGLE_SIGN_IN_FAILED: 'Google sign-in failed.',
	SESSION_EXPIRED: 'Session expired. Please sign in again.',
	GOOGLE_UNAVAILABLE:
		'Google Sign-In is temporarily unavailable. Please use email/password.',
	LOGOUT_ERROR: 'Logout failed, but your session has been cleared locally.',
} as const

export const SIGN_UP_MESSAGES = {
	ERROR: 'An error occurred.',
	FAILED: 'Sign-up failed.',
	PAGE_TITLE: 'Create an Account',
	PAGE_SUBTITLE: 'Join ChefKix and start your culinary journey',
	FORM_TITLE: 'Get Started',
	ALREADY_HAVE_ACCOUNT: 'Already have an account?',
} as const

export const SIGN_IN_MESSAGES = {
	PAGE_TITLE: 'Welcome Back',
	PAGE_SUBTITLE: 'Sign in to continue your culinary adventure',
	NO_ACCOUNT: "Don't have an account?",
	FORGOT_PASSWORD: 'Forgot your password?',
} as const

export const FORGOT_PASSWORD_MESSAGES = {
	PAGE_TITLE: 'Reset your password',
	PAGE_SUBTITLE:
		"Enter the email associated with your account and we'll send a verification code.",
	FORM_TITLE: 'Send reset code',
	SUCCESS: 'Reset instructions sent! Check your inbox for the OTP.',
	EMAIL_LABEL: 'Email address',
	BACK_TO_SIGN_IN: 'Back to sign in',
} as const

export const RESET_PASSWORD_MESSAGES = {
	PAGE_TITLE: 'Enter the reset code',
	PAGE_SUBTITLE: 'Use the OTP from your email and choose a new password.',
	OTP_LABEL: 'Verification code',
	NEW_PASSWORD_LABEL: 'New password',
	CONFIRM_PASSWORD_LABEL: 'Confirm password',
	SUBMIT_TEXT: 'Update password',
	SUCCESS: 'Password updated! Redirecting to sign-in...',
	RESEND_SUCCESS: 'A new reset code has been sent to your email.',
	MISSING_EMAIL:
		'No email provided. Please start from the Forgot Password flow.',
	RESEND_PROMPT: "Didn't receive the code?",
	RESEND_BUTTON: 'Resend code',
} as const

export const VERIFY_OTP_MESSAGES = {
	EMAIL_NOT_FOUND: 'Email not found. Please try signing up again.',
	VERIFICATION_SUCCESS:
		'Email verified successfully! Redirecting to sign-in...',
	INVALID_OTP: 'Invalid OTP. Please try again.',
	EMAIL_NOT_FOUND_FOR_RESEND: 'Email not found. Cannot resend OTP.',
	RESEND_SUCCESS: 'A new OTP has been sent to your email.',
	RESEND_FAILED: 'Failed to resend OTP.',
	NO_EMAIL_PROVIDED:
		'No email address was provided. Please return to the sign-up page and try again.',
	PAGE_TITLE: 'Verify Your Email',
	PAGE_SUBTITLE: 'Enter the verification code sent to your email',
} as const

// ============ PROFILE MESSAGES ============
export const PROFILE_MESSAGES = {
	NOT_FOUND: 'Profile not found',
	NOT_FOUND_DESCRIPTION: 'The user you are looking for does not exist.',
	LOADING: 'Loading profile...',
} as const

// ============ POST MESSAGES ============
export const POST_MESSAGES = {
	DELETE_CONFIRM: 'Are you sure you want to delete this post?',
	DELETE_SUCCESS: 'Post deleted successfully',
	DELETE_FAILED: 'Failed to delete post',
	UPDATE_SUCCESS: 'Post updated successfully',
	UPDATE_FAILED: 'Failed to update post',
	LIKE_FAILED: 'Failed to like post',
	SAVE_SUCCESS: 'Saved successfully!',
	REMOVE_SAVED: 'Removed from saved',
	EDIT_POST: 'Edit post',
	DELETE_POST: 'Delete post',
	CANCEL: 'Cancel',
	SAVE: 'Save',
	EDIT_TIME_LIMIT: 'You can only edit within 1 hour of posting',
	CONTENT_EMPTY: 'Content cannot be empty',
	CREATE_SUCCESS: 'Post created successfully!',
	CREATE_EMPTY: 'Please write something!',
} as const

// ============ RECIPE MESSAGES ============
export const RECIPE_MESSAGES = {
	LIKE_FAILED: 'Failed to like recipe',
	SAVE_FAILED: 'Failed to save recipe',
	LINK_COPIED: 'Link copied to clipboard!',
} as const

// ============ SOCIAL MESSAGES ============
export const SOCIAL_MESSAGES = {
	FOLLOW_SUCCESS: 'Now following!',
	UNFOLLOW_SUCCESS: 'Unfollowed',
	MUTUAL_FOLLOW: "You're now friends!", // Instagram model: mutual follow
	BLOCK_SUCCESS: 'User blocked',
	UNBLOCK_SUCCESS: 'User unblocked',
} as const

// ============ COMMON MESSAGES ============
export const COMMON_MESSAGES = {
	LOADING: 'Loading...',
	ERROR: 'An error occurred',
	SUCCESS: 'Success!',
	TRY_AGAIN: 'Please try again',
	BACK_HOME: 'Back to Home',
} as const

// ============ CHAT MESSAGES ============
export const CHAT_MESSAGES = {
	SHARE_SUCCESS: 'Post shared successfully! 🎉',
	SHARE_FAILED: 'Failed to share post',
	SELECT_CONVERSATION: 'Please select at least one conversation',
	LOAD_CONVERSATIONS_FAILED: 'Failed to load conversations',
	SHARE_MULTIPLE_SUCCESS: (count: number) =>
		`Post shared to ${count} conversation${count > 1 ? 's' : ''}! 🎉`,
	SHARE_PARTIAL_FAIL: (failCount: number) =>
		`Failed to share to ${failCount} conversation(s)`,
} as const
