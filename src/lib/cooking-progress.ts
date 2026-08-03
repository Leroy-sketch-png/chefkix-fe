interface CookingProgressInput {
	currentStep?: number | null
	completedSteps?: number[] | null
	sessionTotalSteps?: number | null
	recipeTotalSteps?: number | null
}

const positiveInteger = (value?: number | null) =>
	Number.isInteger(value) && Number(value) > 0 ? Number(value) : 0

export const deriveCookingProgress = ({
	currentStep,
	completedSteps,
	sessionTotalSteps,
	recipeTotalSteps,
}: CookingProgressInput) => {
	const current = positiveInteger(currentStep) || 1
	const completed = new Set(
		(completedSteps ?? []).filter(step => positiveInteger(step) > 0),
	)
	const highestCompleted = Math.max(0, ...completed)
	const authoritativeTotal =
		positiveInteger(sessionTotalSteps) || positiveInteger(recipeTotalSteps)
	const totalSteps = Math.max(1, authoritativeTotal, current, highestCompleted)
	const completedCount = [...completed].filter(
		step => step <= totalSteps,
	).length
	const progressPercent = Math.min(
		100,
		Math.max(0, Math.round((completedCount / totalSteps) * 100)),
	)

	return {
		currentStep: Math.min(current, totalSteps),
		totalSteps,
		completedCount,
		progressPercent,
	}
}
