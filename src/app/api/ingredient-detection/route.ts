import { NextResponse } from 'next/server'

const MOCK_DETECTIONS = [
	{
		id: 'tomato-1',
		name: 'Tomato',
		confidence: 0.97,
		boundingBox: { x: 0.12, y: 0.2, width: 0.24, height: 0.28 },
	},
	{
		id: 'onion-1',
		name: 'Onion',
		confidence: 0.94,
		boundingBox: { x: 0.58, y: 0.16, width: 0.24, height: 0.3 },
	},
	{
		id: 'olive-oil-1',
		name: 'Olive oil',
		confidence: 0.91,
		boundingBox: { x: 0.34, y: 0.54, width: 0.2, height: 0.3 },
	},
	{
		id: 'basil-1',
		name: 'Basil',
		confidence: 0.88,
		boundingBox: { x: 0.7, y: 0.58, width: 0.18, height: 0.2 },
	},
] as const

export async function POST(request: Request) {
	const formData = await request.formData()
	const image = formData.get('image')

	if (!(image instanceof File) || !image.type.startsWith('image/')) {
		return NextResponse.json(
			{ success: false, message: 'Please provide an image to scan.' },
			{ status: 400 },
		)
	}

	if (image.size === 0) {
		return NextResponse.json(
			{ success: false, message: 'The selected image is empty.' },
			{ status: 400 },
		)
	}

	return NextResponse.json({
		success: true,
		data: { detections: MOCK_DETECTIONS },
		meta: { source: 'mock', replaceWith: 'YOLOv8 ingredient detector' },
	})
}
