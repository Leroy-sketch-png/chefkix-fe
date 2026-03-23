export interface CookCardData {
  sessionId: string
  completedAt: string | null
  xpEarned: number
  stepsCompleted: number
  totalSteps: number | null
  cookingTimeMinutes: number | null
  rating: number | null
  recipeId: string
  recipeTitle: string
  coverImageUrl: string[] | null
  difficulty: string | null
  userId: string
  displayName: string | null
  avatarUrl: string | null
  shareUrl: string
}
