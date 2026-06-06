import { NextRequest, NextResponse } from 'next/server'

import {
	launchOrchestratorTask,
	runOrchestratorPreflight,
	type OrchestratorLaunchMode,
} from '@/lib/dev/orchestratorRuntime'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const jsonFailure = (
	message: string,
	status: number,
	data?: Record<string, unknown>,
) =>
	NextResponse.json(
		{
			success: false,
			message,
			statusCode: status,
			...(data ? { data } : {}),
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

	const preflight = await runOrchestratorPreflight()
	if (
		!preflight.backendHealthOk ||
		!preflight.authProbeOk ||
		!preflight.launchCapacityAvailable
	) {
		const capacityMessage = !preflight.launchCapacityAvailable
			? `launch capacity exhausted (${preflight.runningTaskCount}/${preflight.maxConcurrentRunningTasks} running)`
			: null
		return jsonFailure(
			`Preflight failed: ${capacityMessage || preflight.errorMessage || 'backend probes failed'}`,
			409,
			{ preflight },
		)
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
		data: {
			task,
			preflight,
		},
	})
}
