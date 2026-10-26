/**
 * DIAGNOSTIC LOGGER - For debugging production issues
 *
 * This file provides INVASIVE logging for three scopes:
 * 1. RECIPE FLOW: AI parse, preview edit, draft save, publish
 * 2. COOKING FLOW: Session start, step nav, timer, completion, post creation
 * 3. SOCIAL FLOW: Post creation, comments, replies, likes, moderation
 *
 * ENHANCED CAPABILITIES:
 * - UI State Inspection: What's visible, button states, form values
 * - Local vs Remote Comparison: Fetch and compare data sources
 * - LocalStorage Inspection: What's persisted vs what's displayed
 * - Data Integrity Validation: Check for missing required fields
 *
 * ALL LOGS ARE ACTION-TRIGGERED (no intervals)
 * Remove this file or set ENABLE_DIAGNOSTICS=false for production
 */

import {
	sanitizeDiagnosticText,
	sanitizeDiagnosticValue,
} from './sanitize-diagnostics.mjs'

const ENABLE_DIAGNOSTICS = process.env.NODE_ENV === 'development'
const LOG_PREFIX = '🔍 [DIAG]'

// Color coding for log categories
const COLORS = {
	recipe: 'color: #FF5A36; font-weight: bold', // Coral - Recipe flow
	cooking: 'color: #8B5CF6; font-weight: bold', // Purple - Cooking flow
	social: 'color: #10B981; font-weight: bold', // Green - Social flow
	error: 'color: #EF4444; font-weight: bold', // Red - Errors
	warn: 'color: #F59E0B; font-weight: bold', // Amber - Warnings
	data: 'color: #6B7280; font-weight: normal', // Gray - Data dumps
}

type LogCategory = 'recipe' | 'cooking' | 'social'

export function safeDiagnosticValue(value: unknown) {
	return sanitizeDiagnosticValue(value)
}

function omittedDiagnosticLabel(value: string | number | symbol) {
	return safeDiagnosticValue({ label: String(value) }).label
}

/**
 * Diagnostic logger with structured output
 */
export const diag = {
	/**
	 * Log a user action with context
	 */
	action: (category: LogCategory, action: string, data?: unknown) => {
		if (!ENABLE_DIAGNOSTICS) return

		const timestamp = new Date().toISOString().split('T')[1].slice(0, 12)
		console.group(
			`%c${LOG_PREFIX} [${timestamp}] ${omittedDiagnosticLabel(action)}`,
			COLORS[category],
		)
		if (data !== undefined) {
			console.log('%cData:', COLORS.data, safeDiagnosticValue(data))
		}
		console.groupEnd()
	},

	/**
	 * Log API request going out
	 */
	request: (category: LogCategory, endpoint: string, payload?: unknown) => {
		if (!ENABLE_DIAGNOSTICS) return

		console.group(
			`%c${LOG_PREFIX} → API: ${sanitizeDiagnosticText(endpoint)}`,
			COLORS[category],
		)
		if (payload !== undefined) {
			console.log('%cPayload:', COLORS.data, safeDiagnosticValue(payload))
		}
		console.groupEnd()
	},

	/**
	 * Log API response received
	 */
	response: (
		category: LogCategory,
		endpoint: string,
		response: unknown,
		success: boolean,
	) => {
		if (!ENABLE_DIAGNOSTICS) return

		const color = success ? COLORS[category] : COLORS.error
		const icon = success ? '✓' : '✗'
		console.group(
			`%c${LOG_PREFIX} ← API ${icon}: ${sanitizeDiagnosticText(endpoint)}`,
			color,
		)
		console.log('%cResponse:', COLORS.data, safeDiagnosticValue(response))
		console.groupEnd()
	},

	/**
	 * Log state change
	 */
	state: (
		category: LogCategory,
		description: string,
		before: unknown,
		after: unknown,
	) => {
		if (!ENABLE_DIAGNOSTICS) return

		console.group(
			`%c${LOG_PREFIX} State: ${omittedDiagnosticLabel(description)}`,
			COLORS[category],
		)
		console.log('%cBefore:', COLORS.data, safeDiagnosticValue(before))
		console.log('%cAfter:', COLORS.data, safeDiagnosticValue(after))
		console.groupEnd()
	},

	/**
	 * Log a warning
	 */
	warn: (category: LogCategory, message: string, data?: unknown) => {
		if (!ENABLE_DIAGNOSTICS) return

		console.group(
			`%c${LOG_PREFIX} ⚠️ ${safeDiagnosticValue({ message }).message}`,
			COLORS.warn,
		)
		if (data !== undefined) {
			console.log('%cData:', COLORS.data, safeDiagnosticValue(data))
		}
		console.groupEnd()
	},

	/**
	 * Log an error
	 */
	error: (category: LogCategory, message: string, error?: unknown) => {
		if (!ENABLE_DIAGNOSTICS) return

		console.group(
			`%c${LOG_PREFIX} ❌ ${safeDiagnosticValue({ message }).message}`,
			COLORS.error,
		)
		if (error !== undefined) {
			console.error(safeDiagnosticValue(error))
		}
		console.groupEnd()
	},

	/**
	 * Log modal open/close
	 */
	modal: (
		category: LogCategory,
		modalName: string,
		isOpen: boolean,
		reason?: string,
	) => {
		if (!ENABLE_DIAGNOSTICS) return

		const action = isOpen ? 'OPENED' : 'CLOSED'
		console.log(
			`%c${LOG_PREFIX} Modal ${action}: ${omittedDiagnosticLabel(modalName)}${reason ? ` (${omittedDiagnosticLabel(reason)})` : ''}`,
			COLORS[category],
		)
	},

	/**
	 * Log navigation/step change
	 */
	nav: (
		category: LogCategory,
		from: string | number,
		to: string | number,
		trigger: string,
	) => {
		if (!ENABLE_DIAGNOSTICS) return

		console.log(
			`%c${LOG_PREFIX} Nav: ${typeof from === 'number' ? String(from) : omittedDiagnosticLabel(from)} → ${typeof to === 'number' ? String(to) : omittedDiagnosticLabel(to)} [${omittedDiagnosticLabel(trigger)}]`,
			COLORS[category],
		)
	},

	/**
	 * Log image upload flow
	 */
	image: (
		category: LogCategory,
		action:
			| 'select'
			| 'upload-start'
			| 'upload-success'
			| 'upload-fail'
			| 'remove',
		details: unknown,
	) => {
		if (!ENABLE_DIAGNOSTICS) return

		const icons: Record<string, string> = {
			select: '📷',
			'upload-start': '⬆️',
			'upload-success': '✅',
			'upload-fail': '❌',
			remove: '🗑️',
		}
		console.log(
			`%c${LOG_PREFIX} ${icons[action]} Image ${action}:`,
			COLORS[category],
			safeDiagnosticValue(details),
		)
	},

	/**
	 * Log data snapshot at key moments
	 */
	snapshot: (category: LogCategory, label: string, data: unknown) => {
		if (!ENABLE_DIAGNOSTICS) return

		console.group(
			`%c${LOG_PREFIX} 📸 Snapshot: ${omittedDiagnosticLabel(label)}`,
			COLORS[category],
		)
		console.log(JSON.stringify(safeDiagnosticValue(data), null, 2))
		console.groupEnd()
	},

	// ============================================
	// NEW: INVASIVE DIAGNOSTICS
	// ============================================

	/**
	 * Inspect UI element state - what buttons are visible, their text, disabled state
	 */
	inspectUI: (
		category: LogCategory,
		componentName: string,
		elements: Record<
			string,
			{
				visible?: boolean
				text?: string
				disabled?: boolean
				value?: unknown
			}
		>,
	) => {
		if (!ENABLE_DIAGNOSTICS) return

		console.group(
			`%c${LOG_PREFIX} 🖥️ UI Inspection: ${omittedDiagnosticLabel(componentName)}`,
			COLORS[category],
		)
		Object.entries(elements).forEach(([name, state]) => {
			const flags = []
			if (state.visible === false) flags.push('HIDDEN')
			if (state.disabled) flags.push('DISABLED')
			const flagStr = flags.length > 0 ? ` [${flags.join(', ')}]` : ''
			const valueStr =
				state.value !== undefined
					? ` = ${JSON.stringify(safeDiagnosticValue(state.value))}`
					: ''
			const textStr = state.text ? ' [text omitted]' : ''
			console.log(`  • ${omittedDiagnosticLabel(name)}${textStr}${valueStr}${flagStr}`)
		})
		console.groupEnd()
	},

	/**
	 * Compare local state with remote source
	 */
	compareLocalRemote: async <T>(
		category: LogCategory,
		label: string,
		localData: T,
		fetchRemote: () => Promise<T>,
	) => {
		if (!ENABLE_DIAGNOSTICS) return

		console.group(
			`%c${LOG_PREFIX} 🔄 Local vs Remote: ${omittedDiagnosticLabel(label)}`,
			COLORS[category],
		)
		console.log('%cLocal:', COLORS.data, safeDiagnosticValue(localData))

		try {
			const remoteData = await fetchRemote()
			console.log('%cRemote:', COLORS.data, safeDiagnosticValue(remoteData))

			// Deep compare
			const localStr = JSON.stringify(localData)
			const remoteStr = JSON.stringify(remoteData)
			if (localStr === remoteStr) {
				console.log('%c✓ MATCH', 'color: #10B981; font-weight: bold')
			} else {
				console.log('%c⚠️ MISMATCH DETECTED', COLORS.error)
				// Find specific differences
				if (typeof localData === 'object' && typeof remoteData === 'object') {
					const localObj = localData as Record<string, unknown>
					const remoteObj = remoteData as Record<string, unknown>
					const allKeys = new Set([
						...Object.keys(localObj || {}),
						...Object.keys(remoteObj || {}),
					])
					allKeys.forEach(key => {
						const localVal = JSON.stringify(localObj?.[key])
						const remoteVal = JSON.stringify(remoteObj?.[key])
						if (localVal !== remoteVal) {
							console.log(
								`  ❌ ${sanitizeDiagnosticText(key)}: local=${JSON.stringify(safeDiagnosticValue(localObj?.[key]))} vs remote=${JSON.stringify(safeDiagnosticValue(remoteObj?.[key]))}`,
							)
						}
					})
				}
			}
		} catch (err) {
			console.log('%c❌ Failed to fetch remote', COLORS.error, safeDiagnosticValue(err))
		}
		console.groupEnd()
	},

	/**
	 * Inspect localStorage state for a specific key
	 */
	inspectLocalStorage: (category: LogCategory, storeKey: string) => {
		if (!ENABLE_DIAGNOSTICS) return

		console.group(
			`%c${LOG_PREFIX} 💾 LocalStorage: ${omittedDiagnosticLabel(storeKey)}`,
			COLORS[category],
		)
		try {
			const rawData = localStorage.getItem(storeKey)
			if (rawData) {
				const parsed = JSON.parse(rawData)
				console.log('%cRaw length:', COLORS.data, rawData.length, 'bytes')
				console.log('%cParsed data:', COLORS.data, safeDiagnosticValue(parsed))
				// Check for state key (Zustand format)
				if (parsed.state) {
					console.log('%cState keys:', COLORS.data, Object.keys(parsed.state).map(omittedDiagnosticLabel))
				}
			} else {
				console.log('%c(empty - no data stored)', COLORS.warn)
			}
		} catch (err) {
			console.log('%c❌ Failed to parse localStorage', COLORS.error, safeDiagnosticValue(err))
		}
		console.groupEnd()
	},

	/**
	 * Validate data integrity - check for missing required fields
	 */
	validateData: <T extends Record<string, unknown>>(
		category: LogCategory,
		label: string,
		data: T | null | undefined,
		requiredFields: (keyof T)[],
	) => {
		if (!ENABLE_DIAGNOSTICS) return

		console.group(`%c${LOG_PREFIX} ✅ Validate: ${omittedDiagnosticLabel(label)}`, COLORS[category])

		if (!data) {
			console.log('%c❌ DATA IS NULL/UNDEFINED', COLORS.error)
			console.groupEnd()
			return
		}

		const missing: string[] = []
		const empty: string[] = []
		const present: string[] = []

		requiredFields.forEach(field => {
			const value = data[field]
			if (value === undefined) {
				missing.push(omittedDiagnosticLabel(field))
			} else if (
				value === null ||
				value === '' ||
				(Array.isArray(value) && value.length === 0)
			) {
				empty.push(omittedDiagnosticLabel(field))
			} else {
				present.push(omittedDiagnosticLabel(field))
			}
		})

		if (missing.length > 0) {
			console.log('%c❌ MISSING fields:', COLORS.error, missing.join(', '))
		}
		if (empty.length > 0) {
			console.log('%c⚠️ EMPTY fields:', COLORS.warn, empty.join(', '))
		}
		if (present.length > 0) {
			console.log('%c✓ Present fields:', 'color: #10B981', present.join(', '))
		}

		// Overall verdict
		if (missing.length === 0 && empty.length === 0) {
			console.log('%c✓ ALL FIELDS VALID', 'color: #10B981; font-weight: bold')
		} else {
			console.log('%c❌ VALIDATION FAILED', COLORS.error)
		}

		console.groupEnd()
	},

	/**
	 * Full page health check - runs all inspections
	 */
	healthCheck: async (
		category: LogCategory,
		pageName: string,
		checks: {
			localStorage?: string[]
			uiElements?: Record<
				string,
				{ visible?: boolean; text?: string; disabled?: boolean }
			>
			stateData?: { label: string; data: unknown; requiredFields: string[] }[]
		},
	) => {
		if (!ENABLE_DIAGNOSTICS) return

		console.group(
			`%c${LOG_PREFIX} 🏥 HEALTH CHECK: ${omittedDiagnosticLabel(pageName)}`,
			'color: #EC4899; font-weight: bold; font-size: 14px',
		)
		console.log(`Timestamp: ${new Date().toISOString()}`)
		console.log(`URL: ${sanitizeDiagnosticText(window.location.href)}`)

		// Check localStorage
		if (checks.localStorage) {
			checks.localStorage.forEach(key => {
				diag.inspectLocalStorage(category, key)
			})
		}

		// Check UI elements
		if (checks.uiElements) {
			diag.inspectUI(category, pageName, checks.uiElements)
		}

		// Validate state data
		if (checks.stateData) {
			checks.stateData.forEach(({ label, data, requiredFields }) => {
				diag.validateData(
					category,
					label,
					data as Record<string, unknown>,
					requiredFields,
				)
			})
		}

		console.groupEnd()
	},
}

export default diag
