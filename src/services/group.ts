import { api } from '@/lib/axios'
import { API_ENDPOINTS } from '@/constants/api'
import {
	Group,
	GroupMember,
	CreateGroupRequest,
	UpdateGroupRequest,
	JoinGroupResponse,
	ProcessJoinRequest,
	PendingRequest,
	GroupExploreQuery,
} from '@/lib/types/group'
import { ApiResponse, Post } from '@/lib/types'

// Helper to handle pagination responses
interface PaginatedResponse<T> {
	content: T[]
	totalElements: number
	totalPages: number
	currentPage: number
	pageSize: number
	hasNext: boolean
	hasPrevious: boolean
}

/**
 * Create a new group (owner only)
 */
export const createGroup = async (
	request: CreateGroupRequest
): Promise<Group> => {
	const response = await api.post<ApiResponse<Group>>(
		API_ENDPOINTS.GROUPS.CREATE,
		request
	)
	if (!response.data.data) throw new Error('Failed to create group')
	return response.data.data
}

/**
 * Get group details by ID
 */
export const getGroupDetails = async (groupId: string): Promise<Group> => {
	const response = await api.get<ApiResponse<Group>>(
		API_ENDPOINTS.GROUPS.GET_BY_ID(groupId)
	)
	if (!response.data.data) throw new Error('Group not found')
	return response.data.data
}

/**
 * Update group details (owner/admin only)
 */
export const updateGroup = async (
	groupId: string,
	request: UpdateGroupRequest
): Promise<Group> => {
	const response = await api.patch<ApiResponse<Group>>(
		API_ENDPOINTS.GROUPS.UPDATE(groupId),
		request
	)
	if (!response.data.data) throw new Error('Failed to update group')
	return response.data.data
}

/**
 * Join a group
 * Returns response with status: PENDING (private groups) or ACTIVE (public groups)
 */
export const joinGroup = async (groupId: string): Promise<JoinGroupResponse> => {
	const response = await api.post<ApiResponse<JoinGroupResponse>>(
		API_ENDPOINTS.GROUPS.JOIN(groupId)
	)
	if (!response.data.data) throw new Error('Failed to join group')
	return response.data.data
}

/**
 * Leave a group or cancel pending request
 */
export const leaveGroup = async (groupId: string): Promise<void> => {
	await api.delete(API_ENDPOINTS.GROUPS.LEAVE(groupId))
}

/**
 * Explore groups with optional filters
 */
export const exploreGroups = async (
	query: Partial<GroupExploreQuery>,
	page = 0,
	size = 10
): Promise<PaginatedResponse<Group>> => {
	const params = new URLSearchParams()

	if (query.searchTerm) params.append('searchTerm', query.searchTerm)
	if (query.privacyType) params.append('privacyType', query.privacyType)
	if (query.sortBy) params.append('sortBy', query.sortBy)
	if (query.tags?.length) params.append('tags', query.tags.join(','))

	params.append('page', page.toString())
	params.append('size', size.toString())

	const response = await api.get<ApiResponse<PaginatedResponse<Group>>>(
		`${API_ENDPOINTS.GROUPS.EXPLORE}?${params.toString()}`
	)
	return response.data.data ?? { content: [], totalElements: 0, totalPages: 0, currentPage: 0, pageSize: size, hasNext: false, hasPrevious: false }
}

/**
 * Get user's groups (owned, member of, pending)
 */
export const getMyGroups = async (
	status?: string,
	page = 0,
	size = 20
): Promise<PaginatedResponse<Group>> => {
	const params = new URLSearchParams()
	if (status) params.append('status', status)
	params.append('page', page.toString())
	params.append('size', size.toString())

	const response = await api.get<ApiResponse<PaginatedResponse<Group>>>(
		`${API_ENDPOINTS.GROUPS.MY_GROUPS}?${params.toString()}`
	)
	return response.data.data ?? { content: [], totalElements: 0, totalPages: 0, currentPage: 0, pageSize: size, hasNext: false, hasPrevious: false }
}

/**
 * Get group members
 */
export const getGroupMembers = async (
	groupId: string,
	page = 0,
	size = 20
): Promise<PaginatedResponse<GroupMember>> => {
	const params = new URLSearchParams()
	params.append('page', page.toString())
	params.append('size', size.toString())

	const response = await api.get<ApiResponse<PaginatedResponse<GroupMember>>>(
		`${API_ENDPOINTS.GROUPS.GET_MEMBERS(groupId)}?${params.toString()}`
	)
	return response.data.data ?? { content: [], totalElements: 0, totalPages: 0, currentPage: 0, pageSize: size, hasNext: false, hasPrevious: false }
}

/**
 * Get pending join requests (admin/owner only)
 */
export const getPendingRequests = async (
	groupId: string,
	page = 0,
	size = 20
): Promise<PaginatedResponse<PendingRequest>> => {
	const params = new URLSearchParams()
	params.append('page', page.toString())
	params.append('size', size.toString())

	const response = await api.get<ApiResponse<PaginatedResponse<PendingRequest>>>(
		`${API_ENDPOINTS.GROUPS.GET_PENDING_REQUESTS(groupId)}?${params.toString()}`
	)
	return response.data.data ?? { content: [], totalElements: 0, totalPages: 0, currentPage: 0, pageSize: size, hasNext: false, hasPrevious: false }
}

/**
 * Process join request (APPROVE or REJECT)
 */
export const processJoinRequest = async (
	groupId: string,
	userId: string,
	action: 'APPROVE' | 'REJECT'
): Promise<void> => {
	await api.patch(
		API_ENDPOINTS.GROUPS.PROCESS_REQUEST(groupId, userId),
		{ action }
	)
}

/**
 * Kick a member from group (admin/owner only)
 */
export const kickMember = async (
	groupId: string,
	userId: string
): Promise<void> => {
	await api.delete(API_ENDPOINTS.GROUPS.KICK_MEMBER(groupId, userId))
}

/**
 * Transfer ownership to another member (owner only)
 */
export const transferOwnership = async (
	groupId: string,
	targetUserId: string,
	password: string
): Promise<void> => {
	await api.put(API_ENDPOINTS.GROUPS.TRANSFER_OWNERSHIP(groupId), {
		targetUserId,
		password,
	})
}

/**
 * Change group privacy (PUBLIC/PRIVATE)
 */
export const changeGroupPrivacy = async (
	groupId: string,
	privacyType: 'PUBLIC' | 'PRIVATE'
): Promise<Group> => {
	const response = await api.patch<ApiResponse<Group>>(
		API_ENDPOINTS.GROUPS.CHANGE_PRIVACY(groupId),
		{ privacyType }
	)
	if (!response.data.data) throw new Error('Failed to change group privacy')
	return response.data.data
}

/**
 * Get posts in a group
 * Filters all posts by postType='GROUP' and groupId
 * @param groupId - Group ID
 * @param page - Page number (0-indexed)
 * @param size - Page size
 * @returns Paginated posts for the group
 */
export const getGroupPosts = async (
	groupId: string,
	page: number = 0,
	size: number = 10
): Promise<{ content: Post[], totalElements: number, totalPages: number }> => {
	try {
		// Fetch all posts with pagination
		const response = await api.get<ApiResponse<{ content: Post[], totalElements: number, totalPages: number, number: number, size: number }>>(
			`${API_ENDPOINTS.POST.GET_ALL}?page=${page}&size=${size}`,
		)
		
		if (!response.data.success || !response.data.data) {
			return { content: [], totalElements: 0, totalPages: 0 }
		}
		
		// Filter to only GROUP posts
		const groupPosts = response.data.data.content.filter(
			(post: Post) => post.postType === 'GROUP'
		)
		
		return {
			content: groupPosts,
			totalElements: response.data.data.totalElements,
			totalPages: response.data.data.totalPages,
		}
	} catch {
		return { content: [], totalElements: 0, totalPages: 0 }
	}
}

