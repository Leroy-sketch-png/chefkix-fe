'use client'

import React, { useEffect, useRef, type ReactNode } from 'react'

export interface BaseParticle {
	element: HTMLElement | SVGSVGElement
	left: number
	size: number
	top: number
}

export interface BaseParticleOptions {
	particle?: string
	size?: number
}

export interface CoolParticle extends BaseParticle {
	direction: number
	speedHorz: number
	speedUp: number
	spinSpeed: number
	spinVal: number
}

export interface CoolParticleOptions extends BaseParticleOptions {
	particleCount?: number
	speedHorz?: number
	speedUp?: number
}

const SVG_NS = 'http://www.w3.org/2000/svg'

const getContainer = () => {
	const id = '_coolMode_effect'
	const existingContainer = document.getElementById(id)
	if (existingContainer) return existingContainer

	const container = document.createElement('div')
	container.setAttribute('id', id)
	container.setAttribute(
		'style',
		'overflow:hidden; position:fixed; height:100%; top:0; left:0; right:0; bottom:0; pointer-events:none; z-index:2147483647',
	)
	document.body.appendChild(container)
	return container
}

let instanceCounter = 0

const applyParticleEffect = (
	element: HTMLElement,
	options?: CoolParticleOptions,
): (() => void) => {
	instanceCounter++

	const particleType = options?.particle || 'circle'
	const sizes = [15, 20, 25, 35, 45]
	const limit = options?.particleCount ?? 45

	let particles: CoolParticle[] = []
	let autoAddParticle = false
	let mouseX = 0
	let mouseY = 0

	const container = getContainer()

	const appendCircleParticle = (particle: HTMLDivElement, size: number) => {
		const circleSVG = document.createElementNS(SVG_NS, 'svg')
		const circle = document.createElementNS(SVG_NS, 'circle')
		circle.setAttributeNS(null, 'cx', (size / 2).toString())
		circle.setAttributeNS(null, 'cy', (size / 2).toString())
		circle.setAttributeNS(null, 'r', (size / 2).toString())
		circle.setAttributeNS(null, 'fill', `hsl(${Math.random() * 360}, 70%, 50%)`)
		circleSVG.appendChild(circle)
		circleSVG.setAttribute('width', size.toString())
		circleSVG.setAttribute('height', size.toString())
		particle.appendChild(circleSVG)
	}

	const appendImageParticle = (
		particle: HTMLDivElement,
		imageSrc: string,
		size: number,
	) => {
		const image = document.createElement('img')
		image.src = imageSrc
		image.width = size
		image.height = size
		image.alt = ''
		image.style.borderRadius = '50%'
		particle.appendChild(image)
	}

	const appendTextParticle = (
		particle: HTMLDivElement,
		particleContent: string,
		size: number,
	) => {
		const fontSizeMultiplier = 3
		const emojiSize = size * fontSizeMultiplier
		const content = document.createElement('div')
		content.textContent = particleContent
		content.style.fontSize = `${emojiSize}px`
		content.style.lineHeight = '1'
		content.style.textAlign = 'center'
		content.style.width = `${size}px`
		content.style.height = `${size}px`
		content.style.display = 'flex'
		content.style.alignItems = 'center'
		content.style.justifyContent = 'center'
		content.style.transform = `scale(${fontSizeMultiplier})`
		content.style.transformOrigin = 'center'
		particle.appendChild(content)
	}

	function generateParticle() {
		const size =
			options?.size || sizes[Math.floor(Math.random() * sizes.length)]
		const speedHorz = options?.speedHorz || Math.random() * 10
		const speedUp = options?.speedUp || Math.random() * 25
		const spinVal = Math.random() * 360
		const spinSpeed = Math.random() * 35 * (Math.random() <= 0.5 ? -1 : 1)
		const top = mouseY - size / 2
		const left = mouseX - size / 2
		const direction = Math.random() <= 0.5 ? -1 : 1

		const particle = document.createElement('div')

		if (particleType === 'circle') {
			appendCircleParticle(particle, size)
		} else if (
			particleType.startsWith('http') ||
			particleType.startsWith('/')
		) {
			appendImageParticle(particle, particleType, size)
		} else {
			appendTextParticle(particle, particleType, size)
		}

		particle.style.position = 'absolute'
		particle.style.transform = `translate3d(${left}px, ${top}px, 0px) rotate(${spinVal}deg)`

		container.appendChild(particle)
		particles.push({
			direction,
			element: particle,
			left,
			size,
			speedHorz,
			speedUp,
			spinSpeed,
			spinVal,
			top,
		})
	}

	function refreshParticles() {
		particles.forEach(particle => {
			particle.left = particle.left - particle.speedHorz * particle.direction
			particle.top = particle.top - particle.speedUp
			particle.speedUp = Math.min(particle.size, particle.speedUp - 1)
			particle.spinVal = particle.spinVal + particle.spinSpeed

			if (
				particle.top >=
				Math.max(window.innerHeight, document.body.clientHeight) + particle.size
			) {
				particles = particles.filter(other => other !== particle)
				particle.element.remove()
			}

			particle.element.setAttribute(
				'style',
				[
					'position:absolute',
					'will-change:transform',
					`top:${particle.top}px`,
					`left:${particle.left}px`,
					`transform:rotate(${particle.spinVal}deg)`,
				].join(';'),
			)
		})
	}

	let animationFrame: number | undefined
	let lastParticleTimestamp = 0
	const particleGenerationDelay = 30

	function loop() {
		const currentTime = performance.now()
		if (
			autoAddParticle &&
			particles.length < limit &&
			currentTime - lastParticleTimestamp > particleGenerationDelay
		) {
			generateParticle()
			lastParticleTimestamp = currentTime
		}
		refreshParticles()
		animationFrame = requestAnimationFrame(loop)
	}

	loop()

	const isTouchInteraction = 'ontouchstart' in window
	const tap = isTouchInteraction ? 'touchstart' : 'mousedown'
	const tapEnd = isTouchInteraction ? 'touchend' : 'mouseup'
	const move = isTouchInteraction ? 'touchmove' : 'mousemove'

	const updateMousePosition = (event: MouseEvent | TouchEvent) => {
		if ('touches' in event) {
			mouseX = event.touches?.[0].clientX
			mouseY = event.touches?.[0].clientY
		} else {
			mouseX = event.clientX
			mouseY = event.clientY
		}
	}

	const tapHandler = (event: MouseEvent | TouchEvent) => {
		updateMousePosition(event)
		autoAddParticle = true
	}
	const disableAutoAddParticle = () => {
		autoAddParticle = false
	}

	element.addEventListener(move, updateMousePosition as EventListener, {
		passive: true,
	})
	element.addEventListener(tap, tapHandler as EventListener, { passive: true })
	element.addEventListener(tapEnd, disableAutoAddParticle, { passive: true })
	element.addEventListener('mouseleave', disableAutoAddParticle, {
		passive: true,
	})

	return () => {
		element.removeEventListener(move, updateMousePosition as EventListener)
		element.removeEventListener(tap, tapHandler as EventListener)
		element.removeEventListener(tapEnd, disableAutoAddParticle)
		element.removeEventListener('mouseleave', disableAutoAddParticle)

		const interval = setInterval(() => {
			if (animationFrame && particles.length === 0) {
				cancelAnimationFrame(animationFrame)
				clearInterval(interval)
				if (--instanceCounter === 0) container.remove()
			}
		}, 500)
	}
}

interface CoolModeProps {
	children: ReactNode
	options?: CoolParticleOptions
	triggerToken?: number | null
}

export function playCoolModeBurst(
	options?: CoolParticleOptions,
	x?: number,
	y?: number,
): void {
	if (typeof window === 'undefined' || typeof document === 'undefined') return

	const particle = options?.particle || 'circle'
	const particleCount = options?.particleCount ?? 16
	const baseSize = options?.size ?? 22
	const speedUp = options?.speedUp ?? 20
	const speedHorz = options?.speedHorz ?? 10

	const originX = x ?? window.innerWidth / 2
	const originY = y ?? window.innerHeight / 2

	const burstLayer = document.createElement('div')
	burstLayer.setAttribute(
		'style',
		'position:fixed;inset:0;pointer-events:none;z-index:2147483647;overflow:hidden',
	)
	document.body.appendChild(burstLayer)

	for (let i = 0; i < particleCount; i++) {
		const node = document.createElement('div')
		node.style.position = 'absolute'
		node.style.left = `${originX}px`
		node.style.top = `${originY}px`
		node.style.transform = 'translate(-50%, -50%) scale(1)'
		node.style.opacity = '1'
		node.style.willChange = 'transform, opacity'
		node.style.transition =
			'transform 650ms cubic-bezier(0.22, 1, 0.36, 1), opacity 650ms ease-out'

		if (particle === 'circle') {
			node.style.width = `${baseSize}px`
			node.style.height = `${baseSize}px`
			node.style.borderRadius = '9999px'
			node.style.background = `hsl(${Math.random() * 360}, 70%, 55%)`
		} else if (particle.startsWith('http') || particle.startsWith('/')) {
			const img = document.createElement('img')
			img.src = particle
			img.alt = ''
			img.width = baseSize
			img.height = baseSize
			node.appendChild(img)
		} else {
			node.textContent = particle
			node.style.fontSize = `${baseSize * 1.35}px`
			node.style.lineHeight = '1'
		}

		burstLayer.appendChild(node)

		const direction = Math.random() * Math.PI * 2
		const horizontal =
			(Math.random() * speedHorz + speedHorz) * (Math.random() > 0.5 ? 1 : -1)
		const vertical = Math.random() * speedUp + speedUp
		const dx = Math.cos(direction) * horizontal * 6
		const dy = Math.sin(direction) * horizontal * 3 - vertical * 5
		const rotation = (Math.random() - 0.5) * 720

		requestAnimationFrame(() => {
			node.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) rotate(${rotation}deg) scale(0.15)`
			node.style.opacity = '0'
		})
	}

	window.setTimeout(() => {
		burstLayer.remove()
	}, 750)
}

export const CoolMode: React.FC<CoolModeProps> = ({
	children,
	options,
	triggerToken,
}) => {
	const ref = useRef<HTMLSpanElement>(null)
	const lastTriggerRef = useRef<number | undefined>(undefined)

	useEffect(() => {
		const element = ref.current
		let cleanup: (() => void) | null = null
		if (element) cleanup = applyParticleEffect(element, options)
		return () => {
			if (cleanup) cleanup()
		}
	}, [options])

	useEffect(() => {
		if (triggerToken == null) return
		if (lastTriggerRef.current === triggerToken) return
		lastTriggerRef.current = triggerToken

		const rect = ref.current?.getBoundingClientRect()
		const centerX = rect ? rect.left + rect.width / 2 : undefined
		const centerY = rect ? rect.top + rect.height / 2 : undefined
		playCoolModeBurst(options, centerX, centerY)
	}, [triggerToken, options])

	return <span ref={ref}>{children}</span>
}
