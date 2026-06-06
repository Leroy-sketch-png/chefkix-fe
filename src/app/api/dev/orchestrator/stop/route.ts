import { NextRequest, NextResponse } from 'next/server'

import { stopOrchestratorTask } from '@/lib/dev/orchestratorRuntime'

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

export async function POST(request: NextRequest) {
	if (process.env.NODE_ENV === 'production') {
		return jsonFailure('Not found', 404)
	}

	let body: { taskId?: string } = {}
	try {
		body = (await request.json()) as { taskId?: string }
	} catch {
		return jsonFailure('Invalid JSON body', 400)
	}

	if (!body.taskId) {
		return jsonFailure('taskId is required', 400)
	}

	const stopped = stopOrchestratorTask(body.taskId)
	if (!stopped) {
		return jsonFailure('Task not found', 404)
	}

	return NextResponse.json({
		success: true,
		statusCode: 200,
		data: stopped,
	})
}
