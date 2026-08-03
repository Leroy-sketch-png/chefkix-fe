'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AuthLoader } from '@/components/auth/AuthLoader'
import { PATHS } from '@/constants'
import { useAuth } from '@/hooks/useAuth'
import {
	getReferralRedeemPath,
	normalizeReferralCode,
} from '@/lib/referral-intent'

export default function JoinClient() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const { isAuthenticated, isHydrated, isLoading } = useAuth()

	useEffect(() => {
		if (!isHydrated || isLoading) return

		const code = normalizeReferralCode(searchParams.get('ref'))
		if (!code) {
			router.replace(PATHS.AUTH.SIGN_UP)
			return
		}

		const redeemPath = getReferralRedeemPath(code)
		if (isAuthenticated) {
			router.replace(redeemPath)
			return
		}

		router.replace(
			`${PATHS.AUTH.SIGN_UP}?returnTo=${encodeURIComponent(redeemPath)}`,
		)
	}, [isAuthenticated, isHydrated, isLoading, router, searchParams])

	return <AuthLoader />
}
