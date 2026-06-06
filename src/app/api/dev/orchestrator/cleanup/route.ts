import { NextRequest, NextResponse } from 'next/server'

import { cleanupOrchestratorTasks } from '@/lib/dev/orchestratorRuntime'

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

	let body: { keepLatest?: number } = {}
	try {
		body = (await request.json()) as { keepLatest?: number }
	} catch {
		// Optional body only.
	}

	const keepLatest =
		typeof body.keepLatest === 'number' && Number.isFinite(body.keepLatest)
			? Math.max(0, Math.trunc(body.keepLatest))
			: 10

	const result = cleanupOrchestratorTasks(keepLatest)

	return NextResponse.json({
		success: true,
		statusCode: 200,
		data: {
			keepLatest,
			...result,
		},
	})
}
