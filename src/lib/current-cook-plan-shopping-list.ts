import { createFromCookPlan } from '@/services/shoppingList'
import { getCurrentCookPlan } from '@/services/cookplan'

export async function createShoppingListFromCurrentCookPlan(planDate: string) {
	const plan = await getCurrentCookPlan(planDate)
	if (!plan?.id) return null
	return createFromCookPlan({ cookPlanId: plan.id })
}
