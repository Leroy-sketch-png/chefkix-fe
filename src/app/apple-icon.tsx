import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default async function Icon() {
	return new ImageResponse(
		(
			<div
				style={{
					width: '100%',
					height: '100%',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					background: 'linear-gradient(135deg, #ff5a36 0%, #ff7a5c 100%)',
					borderRadius: 36,
				}}
			>
				<span
					style={{
						fontSize: 80,
						fontWeight: 800,
						color: 'white',
						letterSpacing: '-0.03em',
						fontFamily: 'system-ui, sans-serif',
					}}
				>
					CK
				</span>
			</div>
		),
		{ ...size },
	)
}
