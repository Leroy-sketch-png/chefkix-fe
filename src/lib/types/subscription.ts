export type SubscriptionTier = 'Free' | 'Premium'

export type PremiumFeature =
  | 'Ad Free'
  | 'Premium Badges'
  | 'Custom Profile Themes'
  | 'Custom Timer Sounds'
  | 'Advanced Analytics'
  | 'Priority Support'
  | 'Unlimited Saves'
  | 'Early Access Features'
  | 'Exclusive Challenges'
  | 'Premium Cosmetics'

export interface SubscriptionResponse {
  tier: SubscriptionTier
  active: boolean
  premium: boolean
  startDate: string | null
  endDate: string | null
  trialUsed: boolean
  trialActive: boolean
  cancelledAtPeriodEnd: boolean
  cancelledAt: string | null
  availableFeatures: PremiumFeature[]
  createdAt: string | null
}

export interface ActivateSubscriptionRequest {
  paymentProvider: string
  paymentToken: string
}
