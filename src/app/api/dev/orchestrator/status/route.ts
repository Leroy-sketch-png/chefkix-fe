import { NextRequest, NextResponse } from 'next/server'

import { getOrchestratorTask } from '@/lib/dev/orchestratorRuntime'

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

export async function GET(request: NextRequest) {
	if (process.env.NODE_ENV === 'production') {
		return jsonFailure('Not found', 404)
	}

	const taskId = request.nextUrl.searchParams.get('taskId')
	if (!taskId) {
		return jsonFailure('taskId is required', 400)
	}

	const result = await getOrchestratorTask(taskId)
	if (!result) {
		return jsonFailure('Task not found', 404)
	}

	return NextResponse.json({
		success: true,
		statusCode: 200,
		data: result,
	})
}
