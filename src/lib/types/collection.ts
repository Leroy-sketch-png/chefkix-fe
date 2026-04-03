export interface Collection {
	id: string
	userId: string
	name: string
	description?: string
	coverImageUrl?: string
	isPublic: boolean
	itemCount: number
	postIds: string[]
	createdAt: string
	updatedAt: string
}

export interface CreateCollectionRequest {
	name: string
	description?: string
	isPublic: boolean
}

export interface UpdateCollectionRequest {
	name: string
	description?: string
	isPublic: boolean
}
