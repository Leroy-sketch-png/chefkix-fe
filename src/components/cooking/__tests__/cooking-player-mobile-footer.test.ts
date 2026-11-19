import fs from 'node:fs'
import path from 'node:path'

const playerSource = fs.readFileSync(
	path.join(process.cwd(), 'src/components/cooking/CookingPlayer.tsx'),
	'utf8',
)

describe('cooking player responsive navigation footer', () => {
	const footerStart = playerSource.indexOf('{/* Navigation */}')
	const footerEnd = playerSource.indexOf('{/* Completion Modal', footerStart)
	const footerSource = playerSource.slice(footerStart, footerEnd)

	it('keeps navigation on one row and kitchen controls on a separate mobile row', () => {
		expect(footerSource).toContain(
			'grid grid-cols-2 items-center gap-x-2 gap-y-3',
		)
		expect(footerSource).toContain('col-start-2 row-start-1')
		expect(footerSource).toContain(
			'col-span-2 row-start-2 flex items-center justify-center gap-3',
		)
		expect(footerSource).toContain('sm:flex sm:justify-between sm:gap-0')
		expect(footerSource).toContain('sm:col-auto sm:row-auto sm:contents')
	})

	it('retains voice, spoken-guidance, messy-hands, back, and next controls', () => {
		expect(footerSource).toContain("interactionMode !== 'PREP'")
		expect(footerSource).toContain('<VoiceModeButton')
		expect(footerSource).toContain('<KitchenAudioControl')
		expect(footerSource).toContain('titleMessyHands')
		expect(footerSource).toContain('onClick={handlePrevStep}')
		expect(footerSource).toContain('onClick={handleNextStep}')
		expect(footerSource).toContain(
			"className={kitchenMode ? 'size-14' : 'size-11'}",
		)
	})
})

describe('cooking player narrow-screen header and progress', () => {
	const headerStart = playerSource.indexOf(
		'{/* AI Assist Button + Mode Indicator */}',
	)
	const headerEnd = playerSource.indexOf('{/* Recipe Info */}', headerStart)
	const headerSource = playerSource.slice(headerStart, headerEnd)
	const progressStart = playerSource.indexOf('{/* Progress Section */}')
	const progressEnd = playerSource.indexOf(
		'{/* Animated Progress Bar */}',
		progressStart,
	)
	const progressSource = playerSource.slice(progressStart, progressEnd)

	it('keeps the AI action accessible without colliding with fixed header controls', () => {
		expect(headerSource).toContain("aria-label={t('aiAssist')}")
		expect(headerSource).toContain('size-10 items-center justify-center')
		expect(headerSource).toContain('hidden min-[360px]:inline')
		expect(headerSource).toContain('hidden min-[440px]:flex')
	})

	it('keeps progress text and the ingredient action from shrinking into wrapped labels', () => {
		expect(progressSource).toContain('shrink-0 whitespace-nowrap font-medium')
		expect(progressSource).toContain('inline-flex shrink-0 items-center')
		expect(progressSource).toContain('gap-2 whitespace-nowrap rounded-lg')
	})
})

describe('cooking player compact PREP overlay', () => {
	const progressStart = playerSource.indexOf('{/* Progress Section */}')
	const progressEnd = playerSource.indexOf(
		'{/* Step Content - Animated */}',
		progressStart,
	)
	const progressSource = playerSource.slice(progressStart, progressEnd)
	const prepOverlayStart = playerSource.indexOf('{/* PREP mode overlay:')
	const prepOverlayEnd = playerSource.indexOf(
		'{/* MONITORING mode hero:',
		prepOverlayStart,
	)
	const prepOverlaySource = playerSource.slice(prepOverlayStart, prepOverlayEnd)

	it('keeps the cook action reachable above the fixed footer on compact screens', () => {
		expect(progressSource).toContain("interactionMode !== 'PREP'")
		expect(prepOverlaySource).toContain('overflow-y-auto')
		expect(prepOverlaySource).toContain('mt-auto')
		expect(prepOverlaySource).toContain('mb-auto')
		expect(prepOverlaySource).toContain('min-h-11')
		expect(prepOverlaySource).toContain("{t('letsCook')}")
	})
})

describe('cooking player PREP lifecycle', () => {
	const transitionStart = playerSource.indexOf(
		'// PREP stays available for review until the cook starts or completes a step.',
	)
	const transitionEnd = playerSource.indexOf(
		'// TRANSITION 2: ACTIVE ↔ MONITORING',
		transitionStart,
	)
	const transitionSource = playerSource.slice(transitionStart, transitionEnd)
	const prepOverlayStart = playerSource.indexOf('{/* PREP mode overlay:')
	const prepOverlayEnd = playerSource.indexOf(
		'{/* MONITORING mode hero:',
		prepOverlayStart,
	)
	const prepOverlaySource = playerSource.slice(prepOverlayStart, prepOverlayEnd)

	it('does not dismiss recipe preparation on an elapsed-time timeout', () => {
		expect(playerSource).not.toContain('prepTimeoutRef')
		expect(transitionSource).not.toMatch(/setTimeout\s*\(/)
	})

	it('keeps an explicit start action and the completed-step transition', () => {
		expect(prepOverlaySource).toContain(
			"onClick={() => setInteractionMode('ACTIVE')}",
		)
		expect(transitionSource).toContain(
			"count > prevCompletedCountRef.current && interactionMode === 'PREP'",
		)
	})
})

describe('cooking player header motion', () => {
	const headerStart = playerSource.indexOf('{/* Header */}')
	const headerEnd = playerSource.indexOf('{/* Active Timers from other steps */}', headerStart)
	const headerSource = playerSource.slice(headerStart, headerEnd)

	it('keeps the cooking header static instead of running a decorative infinite shimmer', () => {
		expect(headerSource).toContain("className='relative overflow-hidden bg-brand p-6 text-white'")
		expect(headerSource).not.toContain('via-white/10')
		expect(headerSource).not.toContain('repeat: Infinity')
	})
})
