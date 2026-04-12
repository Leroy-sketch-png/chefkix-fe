export interface CreatorTipSettings {
	id: string
	userId: string
	tipsEnabled: boolean
	payoutAccountId: string | null
	currency: string
	suggestedAmounts: number[]
	thankYouMessage: string | null
	createdAt: string
	updatedAt: string
}

export interface Tip {
	id: string
	tipperId: string
	creatorId: string
	recipeId: string | null
	amountCents: number
	currency: string
	message: string | null
	status: 'pending' | 'completed' | 'refunded'
	paymentIntentId: string | null
	createdAt: string
}

export interface SendTipRequest {
	creatorId: string
	recipeId?: string
	amountCents: number
	message?: string
}

export interface UpdateTipSettingsRequest {
	tipsEnabled: boolean
	suggestedAmounts?: number[]
	thankYouMessage?: string | null
}
