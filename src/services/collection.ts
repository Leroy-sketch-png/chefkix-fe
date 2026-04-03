import { api } from '@/lib/axios'
import { ApiResponse, Post } from '@/lib/types'
import {
	Collection,
	CreateCollectionRequest,
	UpdateCollectionRequest,
} from '@/lib/types/collection'
import { API_ENDPOINTS } from '@/constants'
import { AxiosError } from 'axios'
import { logDevError } from '@/lib/dev-log'

export const getMyCollections = async (): Promise<
	ApiResponse<Collection[]>
> => {
	try {
		const response = await api.get<ApiResponse<Collection[]>>(
			API_ENDPOINTS.COLLECTIONS.GET_MY,
		)
		return response.data
	} catch (error) {
		logDevError('getMyCollections failed:', error)
		const axiosError = error as AxiosError<ApiResponse<Collection[]>>
		if (axiosError.response) return axiosError.response.data
		return { success: false, message: 'Failed to load collections', statusCode: 500 }
	}
}

export const getCollectionById = async (
	id: string,
): Promise<ApiResponse<Collection>> => {
	try {
		const response = await api.get<ApiResponse<Collection>>(
			API_ENDPOINTS.COLLECTIONS.GET_BY_ID(id),
		)
		return response.data
	} catch (error) {
		logDevError('getCollectionById failed:', error)
		const axiosError = error as AxiosError<ApiResponse<Collection>>
		if (axiosError.response) return axiosError.response.data
		return { success: false, message: 'Failed to load collection', statusCode: 500 }
	}
}

export const getCollectionPosts = async (
	collectionId: string,
): Promise<ApiResponse<Post[]>> => {
	try {
		const response = await api.get<ApiResponse<Post[]>>(
			API_ENDPOINTS.COLLECTIONS.GET_POSTS(collectionId),
		)
		return response.data
	} catch (error) {
		logDevError('getCollectionPosts failed:', error)
		const axiosError = error as AxiosError<ApiResponse<Post[]>>
		if (axiosError.response) return axiosError.response.data
		return { success: false, message: 'Failed to load collection posts', statusCode: 500 }
	}
}

export const getUserPublicCollections = async (
	userId: string,
): Promise<ApiResponse<Collection[]>> => {
	try {
		const response = await api.get<ApiResponse<Collection[]>>(
			API_ENDPOINTS.COLLECTIONS.GET_BY_USER(userId),
		)
		return response.data
	} catch (error) {
		logDevError('getUserPublicCollections failed:', error)
		const axiosError = error as AxiosError<ApiResponse<Collection[]>>
		if (axiosError.response) return axiosError.response.data
		return { success: false, message: 'Failed to load collections', statusCode: 500 }
	}
}

export const createCollection = async (
	data: CreateCollectionRequest,
): Promise<ApiResponse<Collection>> => {
	try {
		const response = await api.post<ApiResponse<Collection>>(
			API_ENDPOINTS.COLLECTIONS.CREATE,
			data,
		)
		return response.data
	} catch (error) {
		logDevError('createCollection failed:', error)
		const axiosError = error as AxiosError<ApiResponse<Collection>>
		if (axiosError.response) return axiosError.response.data
		return { success: false, message: 'Failed to create collection', statusCode: 500 }
	}
}

export const updateCollection = async (
	id: string,
	data: UpdateCollectionRequest,
): Promise<ApiResponse<Collection>> => {
	try {
		const response = await api.put<ApiResponse<Collection>>(
			API_ENDPOINTS.COLLECTIONS.UPDATE(id),
			data,
		)
		return response.data
	} catch (error) {
		logDevError('updateCollection failed:', error)
		const axiosError = error as AxiosError<ApiResponse<Collection>>
		if (axiosError.response) return axiosError.response.data
		return { success: false, message: 'Failed to update collection', statusCode: 500 }
	}
}

export const deleteCollection = async (
	id: string,
): Promise<ApiResponse<void>> => {
	try {
		const response = await api.delete<ApiResponse<void>>(
			API_ENDPOINTS.COLLECTIONS.DELETE(id),
		)
		return response.data
	} catch (error) {
		logDevError('deleteCollection failed:', error)
		const axiosError = error as AxiosError<ApiResponse<void>>
		if (axiosError.response) return axiosError.response.data
		return { success: false, message: 'Failed to delete collection', statusCode: 500 }
	}
}

export const addPostToCollection = async (
	collectionId: string,
	postId: string,
): Promise<ApiResponse<Collection>> => {
	try {
		const response = await api.post<ApiResponse<Collection>>(
			API_ENDPOINTS.COLLECTIONS.ADD_POST(collectionId, postId),
		)
		return response.data
	} catch (error) {
		logDevError('addPostToCollection failed:', error)
		const axiosError = error as AxiosError<ApiResponse<Collection>>
		if (axiosError.response) return axiosError.response.data
		return { success: false, message: 'Failed to add post to collection', statusCode: 500 }
	}
}

export const removePostFromCollection = async (
	collectionId: string,
	postId: string,
): Promise<ApiResponse<Collection>> => {
	try {
		const response = await api.delete<ApiResponse<Collection>>(
			API_ENDPOINTS.COLLECTIONS.REMOVE_POST(collectionId, postId),
		)
		return response.data
	} catch (error) {
		logDevError('removePostFromCollection failed:', error)
		const axiosError = error as AxiosError<ApiResponse<Collection>>
		if (axiosError.response) return axiosError.response.data
		return { success: false, message: 'Failed to remove post from collection', statusCode: 500 }
	}
}
