import { NextResponse } from 'next/server'

import { stopAllOrchestratorTasks } from '@/lib/dev/orchestratorRuntime'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const jsonFailure = (message: string, status: number) =>
	NextResponse.json(
		{
			success: false,
			message,
			statusCode: status,
		},
		{ status },
	)

export async function POST() {
	if (process.env.NODE_ENV === 'production') {
		return jsonFailure('Not found', 404)
	}

	const result = stopAllOrchestratorTasks()

	return NextResponse.json({
		success: true,
		statusCode: 200,
		data: result,
	})
}
