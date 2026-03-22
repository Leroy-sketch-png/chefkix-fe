export type TrackingEventType =
	| 'RECIPE_VIEWED'
	| 'RECIPE_SEARCH'
	| 'FEED_SCROLLED'
	| 'POST_DWELLED'
	| 'RECIPE_SAVED'
	| 'RECIPE_UNSAVED'
	| 'COOKING_STARTED'
	| 'COOKING_ABANDONED'
	| 'COOKING_COMPLETED'
	| 'POST_LIKED'
	| 'POST_COMMENTED'
	| 'USER_FOLLOWED'
	| 'POST_SHARED'
	| 'SHOPPING_LIST_CREATED'
	| 'INGREDIENT_CHECKED'
	| 'RECIPE_SKIPPED'
	| 'SEARCH_REFINED'
	| 'PAGE_VIEWED'
	| 'POST_CREATED'
	| 'RECIPE_CREATED'

export interface TrackingEvent {
	eventType: TrackingEventType
	entityId?: string
	entityType?: string
	metadata?: Record<string, unknown>
	timestamp?: string
}

export interface EventBatchRequest {
	events: TrackingEvent[]
}

export interface EventBatchResponse {
	accepted: number
	total: number
}
