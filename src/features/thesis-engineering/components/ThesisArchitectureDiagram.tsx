export function ThesisArchitectureDiagram() {
	return (
		<section className='rounded-2xl border border-border-subtle bg-bg-card p-5 shadow-card'>
			<div className='mb-5'>
				<p className='text-[11px] font-semibold uppercase tracking-[0.18em] text-primary'>
					Chapter 10 · System architecture
				</p>
				<h2 className='mt-1 text-lg font-bold text-text-primary'>
					IRON CHEF v3 evidence map
				</h2>
				<p className='mt-1 text-sm leading-6 text-text-muted'>
					A thesis-safe view of the boundaries that carry evidence from user
					input to model reasoning and back to the UI.
				</p>
			</div>
			<div className='overflow-x-auto rounded-xl border border-border-subtle bg-bg-elevated/40 p-3'>
				<svg
					viewBox='0 0 960 300'
					role='img'
					aria-label='IRON CHEF version 3 system architecture diagram'
					className='min-w-[54rem] w-full'
				>
					<defs>
						<marker
							id='thesis-arrow'
							markerWidth='8'
							markerHeight='8'
							refX='7'
							refY='4'
							orient='auto'
						>
							<path d='M0,0 L8,4 L0,8 Z' fill='#f97316' />
						</marker>
					</defs>
					<line
						x1='174'
						y1='105'
						x2='276'
						y2='105'
						stroke='#f97316'
						strokeWidth='2'
						markerEnd='url(#thesis-arrow)'
					/>
					<line
						x1='414'
						y1='105'
						x2='516'
						y2='105'
						stroke='#f97316'
						strokeWidth='2'
						markerEnd='url(#thesis-arrow)'
					/>
					<line
						x1='654'
						y1='105'
						x2='756'
						y2='105'
						stroke='#f97316'
						strokeWidth='2'
						markerEnd='url(#thesis-arrow)'
					/>
					<line
						x1='585'
						y1='142'
						x2='585'
						y2='218'
						stroke='#94a3b8'
						strokeWidth='2'
						strokeDasharray='5 5'
						markerEnd='url(#thesis-arrow)'
					/>
					{[
						{
							x: 34,
							label: 'FE surfaces',
							detail: 'scan · cook · graph · eval',
						},
						{
							x: 274,
							label: 'Monolith API',
							detail: 'auth · sessions · knowledge',
						},
						{ x: 514, label: 'AI service', detail: 'HGAT · vision · copilot' },
						{ x: 754, label: 'Evidence UI', detail: 'trusted explanations' },
					].map(box => (
						<g key={box.label}>
							<rect
								x={box.x}
								y='64'
								width='140'
								height='82'
								rx='14'
								fill='#fff7ed'
								stroke='#fdba74'
							/>
							<text
								x={box.x + 70}
								y='92'
								textAnchor='middle'
								fill='#334155'
								fontSize='14'
								fontWeight='700'
							>
								{box.label}
							</text>
							<text
								x={box.x + 70}
								y='116'
								textAnchor='middle'
								fill='#64748b'
								fontSize='10'
							>
								{box.detail}
							</text>
						</g>
					))}
					<rect
						x='430'
						y='218'
						width='310'
						height='48'
						rx='12'
						fill='#f8fafc'
						stroke='#cbd5e1'
					/>
					<text
						x='585'
						y='239'
						textAnchor='middle'
						fill='#334155'
						fontSize='12'
						fontWeight='700'
					>
						Leader exports + model registry
					</text>
					<text
						x='585'
						y='255'
						textAnchor='middle'
						fill='#64748b'
						fontSize='10'
					>
						benchmark · graph · compounds · safety · behavior
					</text>
				</svg>
			</div>
			<div className='mt-4 grid gap-3 text-xs sm:grid-cols-3'>
				<div className='rounded-xl bg-bg-elevated/60 p-3'>
					<p className='font-semibold text-text-primary'>Deployment boundary</p>
					<p className='mt-1 leading-5 text-text-muted'>
						Browser, API, and AI runtime remain independently replaceable.
					</p>
				</div>
				<div className='rounded-xl bg-bg-elevated/60 p-3'>
					<p className='font-semibold text-text-primary'>Evidence boundary</p>
					<p className='mt-1 leading-5 text-text-muted'>
						Every thesis figure carries dataset version and provenance.
					</p>
				</div>
				<div className='rounded-xl bg-amber-500/5 p-3'>
					<p className='font-semibold text-amber-700'>Cost claim</p>
					<p className='mt-1 leading-5 text-text-muted'>
						Free-tier / $0 hosting assumptions remain pending infrastructure
						verification.
					</p>
				</div>
			</div>
		</section>
	)
}
