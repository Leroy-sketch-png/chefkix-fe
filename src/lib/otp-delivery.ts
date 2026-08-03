import type { OtpDeliveryTiming } from '@/lib/types'

const STORAGE_KEY = 'chefkix:auth:otp-delivery'

interface StoredOtpDelivery extends OtpDeliveryTiming {
	email: string
}

function isTimestamp(value: unknown): value is string {
	return typeof value === 'string' && Number.isFinite(Date.parse(value))
}

function isStoredDelivery(value: unknown): value is StoredOtpDelivery {
	if (!value || typeof value !== 'object') return false
	const delivery = value as Partial<StoredOtpDelivery>
	return (
		typeof delivery.email === 'string' &&
		isTimestamp(delivery.expiresAt) &&
		isTimestamp(delivery.resendAvailableAt)
	)
}

export function isOtpDeliveryTiming(
	value: unknown,
): value is OtpDeliveryTiming {
	if (!value || typeof value !== 'object') return false
	const delivery = value as Partial<OtpDeliveryTiming>
	return (
		isTimestamp(delivery.expiresAt) && isTimestamp(delivery.resendAvailableAt)
	)
}

export function saveOtpDeliveryTiming(
	email: string,
	delivery: OtpDeliveryTiming,
): boolean {
	if (typeof window === 'undefined' || !isOtpDeliveryTiming(delivery))
		return false
	try {
		sessionStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({ ...delivery, email: email.trim().toLowerCase() }),
		)
		return true
	} catch {
		return false
	}
}

export function readOtpDeliveryTiming(email: string): OtpDeliveryTiming | null {
	if (typeof window === 'undefined') return null
	try {
		const raw = sessionStorage.getItem(STORAGE_KEY)
		if (!raw) return null
		const delivery: unknown = JSON.parse(raw)
		if (
			!isStoredDelivery(delivery) ||
			delivery.email !== email.trim().toLowerCase()
		) {
			return null
		}
		return {
			expiresAt: delivery.expiresAt,
			resendAvailableAt: delivery.resendAvailableAt,
		}
	} catch {
		return null
	}
}

export function clearOtpDeliveryTiming(email: string): void {
	if (typeof window === 'undefined') return
	try {
		if (readOtpDeliveryTiming(email)) sessionStorage.removeItem(STORAGE_KEY)
	} catch {
		// Storage is optional continuity; the server remains authoritative.
	}
}
