import { api } from '@/lib/axios'
import { API_ENDPOINTS } from '@/constants'
import { mockGraph } from '../data/mockGraph'
import type { GraphData } from '../types'

const useMock = process.env.NEXT_PUBLIC_GRAPH_EXPLORER_MOCK !== 'false'

export async function getGraphData(): Promise<GraphData> {
	if (useMock) return mockGraph
	const response = await api.get(API_ENDPOINTS.KNOWLEDGE.GRAPH)
	return response.data.data
}
