/**
 * Clipboard & Share Utilities — Copy text and native share API.
 *
 * Adapted from .tmp stash. Centralizes clipboard operations and
 * Web Share API fallback across the app.
 *
 * Dependencies: None
 *
 * @example
 * const ok = await copyToClipboard('Hello!')
 * await shareContent({ title: 'Check this out', url: window.location.href })
 */

/**
 * Copy text to clipboard with graceful fallback for older browsers.
 * Returns true on success, false on failure.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
	if (typeof window === 'undefined') return false

	// Modern API
	if (navigator.clipboard?.writeText) {
		try {
			await navigator.clipboard.writeText(text)
			return true
		} catch {
			// ignored: clipboard API non-critical, fall through to legacy
		}
	}

	// Legacy fallback (execCommand)
	try {
		const textarea = document.createElement('textarea')
		textarea.value = text
		textarea.style.position = 'fixed'
		textarea.style.left = '-9999px'
		textarea.style.top = '-9999px'
		document.body.appendChild(textarea)
		textarea.focus()
		textarea.select()
		const ok = document.execCommand('copy')
		document.body.removeChild(textarea)
		return ok
	} catch {
		return false
	}
}

interface ShareContent {
	title?: string
	text?: string
	url?: string
}

/**
 * Share via native Web Share API (mobile), with clipboard fallback on desktop.
 * Returns 'shared' | 'copied' | 'failed'.
 *
 * @example
 * const result = await shareContent({ title: 'Recipe', url: window.location.href })
 * if (result === 'copied') toast.success('Link copied!')
 */
export async function shareContent(
	content: ShareContent,
): Promise<'shared' | 'copied' | 'failed'> {
	if (typeof window === 'undefined') return 'failed'

	// Try native share (mobile browsers, some desktop)
	if (typeof navigator.share === 'function') {
		try {
			await navigator.share(content)
			return 'shared'
		} catch (err) {
			// User cancelled or not supported — fall through to clipboard
			if ((err as DOMException)?.name === 'AbortError') return 'failed'
		}
	}

	// Fallback: copy URL or text to clipboard
	const textToCopy = content.url || content.text || content.title || ''
	if (textToCopy && (await copyToClipboard(textToCopy))) {
		return 'copied'
	}

	return 'failed'
}
