export interface ApiResponse<T> {
	data?: T
	message?: string
	success: boolean
	statusCode?: number
	error?: { [key: string]: string[] }
}

export interface ChildrenProps {
	children: React.ReactNode
}
