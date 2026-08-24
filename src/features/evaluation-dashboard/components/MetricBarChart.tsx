'use client'

import { useRef } from 'react'
import { ChartExportButton } from './ChartExportButton'

export interface MetricBarDatum {
	id: string
	label: string
	value?: number
	status?: string
}

interface MetricBarChartProps {
	data: MetricBarDatum[]
	ariaLabel: string
	fileName: string
	valueLabel: string
	maxValue?: number
}

const CHART_WIDTH = 720
const CHART_HEIGHT = 320
const PLOT_LEFT = 58
const PLOT_TOP = 28
const PLOT_WIDTH = 620
const PLOT_HEIGHT = 220

function safeValue(value: number | undefined, maxValue: number) {
	if (value === undefined || !Number.isFinite(value)) return 0
	return Math.max(0, Math.min(maxValue, value))
}

function barColor(status: string | undefined) {
	if (status === 'published' || status === 'complete') return '#059669'
	if (status === 'placeholder') return '#f59e0b'
	return '#94a3b8'
}

function createPngDownload(
	svg: SVGSVGElement,
	fileName: string,
): Promise<void> {
	return new Promise((resolve, reject) => {
		const clone = svg.cloneNode(true) as SVGSVGElement
		clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
		clone.setAttribute('width', String(CHART_WIDTH))
		clone.setAttribute('height', String(CHART_HEIGHT))
		const serialized = new XMLSerializer().serializeToString(clone)
		const image = new Image()
		image.onload = () => {
			const canvas = document.createElement('canvas')
			canvas.width = CHART_WIDTH * 2
			canvas.height = CHART_HEIGHT * 2
			const context = canvas.getContext('2d')
			if (!context) {
				reject(new Error('Canvas export is unavailable.'))
				return
			}
			context.scale(2, 2)
			context.fillStyle = '#ffffff'
			context.fillRect(0, 0, CHART_WIDTH, CHART_HEIGHT)
			context.drawImage(image, 0, 0, CHART_WIDTH, CHART_HEIGHT)
			canvas.toBlob(blob => {
				if (!blob) {
					reject(new Error('The chart image could not be created.'))
					return
				}
				const url = URL.createObjectURL(blob)
				const link = document.createElement('a')
				link.href = url
				link.download = `${fileName}.png`
				link.click()
				URL.revokeObjectURL(url)
				resolve()
			}, 'image/png')
		}
		image.onerror = () =>
			reject(new Error('The chart image could not be loaded.'))
		image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(serialized)}`
	})
}

/** Accessible SVG bar chart with deterministic PNG export and pending-state support. */
export function MetricBarChart({
	data,
	ariaLabel,
	fileName,
	valueLabel,
	maxValue = 100,
}: MetricBarChartProps) {
	const svgRef = useRef<SVGSVGElement>(null)
	const step = data.length > 0 ? PLOT_WIDTH / data.length : PLOT_WIDTH

	return (
		<div className='space-y-3'>
			<div className='flex flex-wrap items-center justify-between gap-3'>
				<div className='flex flex-wrap items-center gap-3 text-xs text-text-muted'>
					<span className='inline-flex items-center gap-1.5'>
						<span className='size-2.5 rounded-sm bg-emerald-600' /> Published /
						complete
					</span>
					<span className='inline-flex items-center gap-1.5'>
						<span className='size-2.5 rounded-sm bg-amber-500' /> Illustrative
						placeholder
					</span>
					<span className='inline-flex items-center gap-1.5'>
						<span className='size-2.5 rounded-sm bg-slate-400' /> Pending
					</span>
					<span>Scale: 0–{maxValue}%</span>
				</div>
				<ChartExportButton
					onExport={async () => {
						if (!svgRef.current) throw new Error('Chart is not ready.')
						await createPngDownload(svgRef.current, fileName)
					}}
				/>
			</div>
			<div className='overflow-x-auto rounded-xl border border-border-subtle bg-white p-2'>
				<svg
					ref={svgRef}
					viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
					role='img'
					aria-label={ariaLabel}
					className='min-w-[36rem] w-full'
				>
					<text x='14' y='18' fill='#64748b' fontSize='11' fontWeight='600'>
						{valueLabel} (%)
					</text>
					{[0, 25, 50, 75, 100].map(tick => {
						const y = PLOT_TOP + PLOT_HEIGHT - (tick / 100) * PLOT_HEIGHT
						return (
							<g key={tick}>
								<line
									x1={PLOT_LEFT}
									x2={PLOT_LEFT + PLOT_WIDTH}
									y1={y}
									y2={y}
									stroke='#e2e8f0'
								/>
								<text
									x={PLOT_LEFT - 10}
									y={y + 4}
									fill='#64748b'
									fontSize='10'
									textAnchor='end'
								>
									{Math.round((tick / 100) * maxValue)}
								</text>
							</g>
						)
					})}
					{data.map((item, index) => {
						const value = safeValue(item.value, maxValue)
						const height = (value / maxValue) * PLOT_HEIGHT
						const x = PLOT_LEFT + index * step + step * 0.2
						const width = step * 0.6
						const y = PLOT_TOP + PLOT_HEIGHT - height
						return (
							<g key={item.id}>
								<rect
									x={x}
									y={PLOT_TOP}
									width={width}
									height={PLOT_HEIGHT}
									rx='6'
									fill='#f1f5f9'
								/>
								{item.value !== undefined && (
									<rect
										x={x}
										y={y}
										width={width}
										height={height}
										rx='6'
										fill={barColor(item.status)}
									/>
								)}
								<text
									x={x + width / 2}
									y={item.value === undefined ? PLOT_TOP + 18 : y - 8}
									fill={item.value === undefined ? '#94a3b8' : '#334155'}
									fontSize='11'
									fontWeight='700'
									textAnchor='middle'
								>
									{item.value === undefined
										? 'Pending'
										: `${item.value.toFixed(2)}%`}
								</text>
								<text
									x={x + width / 2}
									y={PLOT_TOP + PLOT_HEIGHT + 22}
									fill='#334155'
									fontSize='11'
									textAnchor='middle'
								>
									{item.label.length > 16
										? `${item.label.slice(0, 15)}…`
										: item.label}
								</text>
							</g>
						)
					})}
				</svg>
			</div>
		</div>
	)
}
