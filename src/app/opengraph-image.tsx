import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'ChefKix - Gamified Cooking Recipes & Community'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
	return new ImageResponse(
		(
			<div
				style={{
					width: '100%',
					height: '100%',
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					justifyContent: 'center',
					background: 'linear-gradient(135deg, #f8f4ef 0%, #fdfbf8 40%, #fff5f2 100%)',
					fontFamily: 'system-ui, sans-serif',
					position: 'relative',
					overflow: 'hidden',
				}}
			>
				{/* Decorative circles */}
				<div
					style={{
						position: 'absolute',
						top: -80,
						right: -80,
						width: 300,
						height: 300,
						borderRadius: '50%',
						background: 'rgba(255, 90, 54, 0.08)',
					}}
				/>
				<div
					style={{
						position: 'absolute',
						bottom: -60,
						left: -60,
						width: 250,
						height: 250,
						borderRadius: '50%',
						background: 'rgba(255, 90, 54, 0.06)',
					}}
				/>

				{/* Chef hat icon */}
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						width: 96,
						height: 96,
						borderRadius: 24,
						background: 'linear-gradient(135deg, #ff5a36 0%, #ff7a5c 100%)',
						marginBottom: 24,
						boxShadow: '0 8px 32px rgba(255, 90, 54, 0.3)',
					}}
				>
					<svg
						width='56'
						height='56'
						viewBox='0 0 24 24'
						fill='none'
						stroke='white'
						strokeWidth='2'
						strokeLinecap='round'
						strokeLinejoin='round'
					>
						<path d='M17 21a1 1 0 0 0 1-1v-5.35c0-.457.316-.844.727-1.041a4 4 0 0 0-2.134-7.589 5 5 0 0 0-9.186 0 4 4 0 0 0-2.134 7.588c.411.198.727.585.727 1.041V20a1 1 0 0 0 1 1Z' />
						<path d='M6 17h12' />
					</svg>
				</div>

				{/* Brand name */}
				<div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
					<span
						style={{
							fontSize: 64,
							fontWeight: 800,
							color: '#2c2420',
							letterSpacing: '-0.02em',
						}}
					>
						Chef
					</span>
					<span
						style={{
							fontSize: 64,
							fontWeight: 800,
							color: '#ff5a36',
							letterSpacing: '-0.02em',
						}}
					>
						kix
					</span>
				</div>

				{/* Tagline */}
				<p
					style={{
						fontSize: 24,
						color: '#8b7355',
						marginTop: 12,
						fontWeight: 500,
						letterSpacing: '0.02em',
					}}
				>
					Cook. Play. Share. Level Up.
				</p>

				{/* Feature pills */}
				<div
					style={{
						display: 'flex',
						gap: 16,
						marginTop: 32,
					}}
				>
					{['Step-by-Step Recipes', 'XP & Badges', 'Food Community'].map(
						(label) => (
							<div
								key={label}
								style={{
									display: 'flex',
									padding: '8px 20px',
									borderRadius: 999,
									background: 'rgba(255, 90, 54, 0.08)',
									border: '1px solid rgba(255, 90, 54, 0.15)',
									fontSize: 16,
									fontWeight: 600,
									color: '#ff5a36',
								}}
							>
								{label}
							</div>
						),
					)}
				</div>
			</div>
		),
		{ ...size },
	)
}
