import { NextRequest, NextResponse } from 'next/server'

import {
	launchOrchestratorTask,
	type OrchestratorLaunchMode,
} from '@/lib/dev/orchestratorRuntime'

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

	let body: { mode?: string; hostFailover?: boolean } = {}
	try {
		body = (await request.json()) as { mode?: string; hostFailover?: boolean }
	} catch {
		return jsonFailure('Invalid JSON body', 400)
	}

	const mode = body.mode as OrchestratorLaunchMode
	if (mode !== 'single-strict' && mode !== 'certify-strict') {
		return jsonFailure('Invalid launch mode', 400)
	}

	let task
	try {
		task = launchOrchestratorTask(mode, body.hostFailover === true)
	} catch (error) {
		const message =
			error instanceof Error ? error.message : 'Failed to launch orchestrator task'
		return jsonFailure(message, 409)
	}

	return NextResponse.json({
		success: true,
		statusCode: 200,
		data: task,
	})
}
