import { NextResponse } from 'next/server'

import { runOrchestratorPreflight } from '@/lib/dev/orchestratorRuntime'

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

export async function GET() {
	if (process.env.NODE_ENV === 'production') {
		return jsonFailure('Not found', 404)
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

	return NextResponse.json({
		success: true,
		statusCode: 200,
		data: {
			preflight,
		},
	})
}
