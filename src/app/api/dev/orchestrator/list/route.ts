import { NextResponse } from 'next/server'

import { listOrchestratorTasks } from '@/lib/dev/orchestratorRuntime'

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

export async function GET() {
	if (process.env.NODE_ENV === 'production') {
		return jsonFailure('Not found', 404)
	}

	return NextResponse.json({
		success: true,
		statusCode: 200,
		data: {
			tasks: listOrchestratorTasks(),
		},
	})
}
