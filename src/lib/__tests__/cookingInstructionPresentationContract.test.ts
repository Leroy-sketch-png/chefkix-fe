import fs from 'fs'
import path from 'path'
import { createElement } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { IngredientCheck } from '@/components/cooking/IngredientCheck'
import { StepV2Renderer } from '@/components/cooking/StepV2Renderer'
import type { Step } from '@/lib/types/recipe'

jest.mock('next-intl', () => ({
	useTranslations: () => (key: string) => key,
}))

jest.mock('@/components/providers/RuntimePreferencesProvider', () => ({
	useRuntimePreferences: () => ({
		preferences: { autoPlayVideos: false },
		isReady: true,
	}),
}))

const source = (relativePath: string) =>
	fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8')

describe('cooking instruction presentation contract', () => {
	const renderer = source('src/components/cooking/StepV2Renderer.tsx')
	const player = source('src/components/cooking/CookingPlayer.tsx')
	const ingredientCheck = source('src/components/cooking/IngredientCheck.tsx')

	it('renders essential step fields without staggered entry delays', () => {
		expect(renderer).not.toContain('transition={{ delay:')
		expect(renderer).not.toContain('TRANSITION_SPRING')
		expect(player).not.toContain('transition={{ delay: 0.35 }}')
	})

	it('places all full-mode cooking facts in the initial render', () => {
		const step: Step = {
			stepNumber: 2,
			title: 'Build the sauce',
			description: 'Stir until glossy.',
			goal: 'A smooth sauce',
			microSteps: ['Lower the heat', 'Stir continuously'],
			visualCues: 'The spoon leaves a trail',
			commonMistake: 'Do not let it boil',
			chefTip: 'Use a flexible spatula',
		}

		render(
			createElement(StepV2Renderer, {
				step,
				mode: 'full',
				totalSteps: 5,
				timerComponent: createElement('div', null, 'Timer ready'),
				ingredientChecklistComponent: createElement(
					'div',
					null,
					'Ingredient ready',
				),
			}),
		)

		expect(
			screen.getByRole('heading', { name: /Build the sauce/ }),
		).toBeTruthy()

		for (const fact of [
			'Stir until glossy.',
			'A smooth sauce',
			'Lower the heat',
			'The spoon leaves a trail',
			'Do not let it boil',
			'Use a flexible spatula',
			'Timer ready',
			'Ingredient ready',
		]) {
			expect(screen.getByText(fact)).toBeTruthy()
		}
	})

	it('falls back from video to image and removes a fully failed media frame', () => {
		const step: Step = {
			stepNumber: 1,
			title: 'Toast the spices',
			description: 'Stir until fragrant.',
			videoUrl: 'https://cdn.example.test/step-1.mp4',
			imageUrl: 'https://cdn.example.test/step-1.jpg',
		}

		const { container } = render(
			createElement(StepV2Renderer, {
				step,
				mode: 'full',
				totalSteps: 3,
			}),
		)

		const video = container.querySelector('video')
		expect(video).not.toBeNull()
		expect(screen.queryByRole('img')).toBeNull()

		fireEvent.error(video!)

		const fallbackImage = screen.getByRole('img', {
			name: 'Toast the spices',
		})
		expect(screen.getByTestId('step-media-frame')).toBeTruthy()
		fireEvent.error(fallbackImage)

		expect(screen.queryByTestId('step-media-frame')).toBeNull()
		expect(screen.getByText('Stir until fragrant.')).toBeTruthy()
	})

	it('retries media for a new step and keeps kitchen visual references', () => {
		const failedStep: Step = {
			stepNumber: 1,
			title: 'Failed media',
			description: 'Keep cooking.',
			imageUrl: 'https://cdn.example.test/failed.jpg',
		}
		const healthyStep: Step = {
			stepNumber: 2,
			title: 'Healthy media',
			description: 'Plate the dish.',
			imageUrl: 'https://cdn.example.test/healthy.jpg',
		}

		const { rerender } = render(
			createElement(StepV2Renderer, {
				step: failedStep,
				mode: 'kitchen',
				totalSteps: 2,
			}),
		)

		fireEvent.error(screen.getByRole('img', { name: 'Failed media' }))
		expect(screen.queryByTestId('step-media-frame')).toBeNull()

		rerender(
			createElement(StepV2Renderer, {
				step: healthyStep,
				mode: 'kitchen',
				totalSteps: 2,
			}),
		)

		expect(screen.getByRole('img', { name: 'Healthy media' })).toBeTruthy()
		expect(screen.getByTestId('step-media-frame')).toBeTruthy()
	})

	it('keeps one reduced-motion-aware directional transition at the step owner', () => {
		expect(player).toContain('prefersReducedMotion ? undefined : stepVariants')
		expect(player).toMatch(
			/<motion\.div[\s\S]*variants=\{[\s\S]*stepVariants[\s\S]*<StepV2Renderer/,
		)

		const rendererComponent = renderer.slice(
			renderer.indexOf('const StepV2RendererComponent'),
		)
		expect(rendererComponent).not.toContain('<motion.div')
	})

	it('shows ingredient rows immediately and toggles once per label click', () => {
		const onToggle = jest.fn()

		render(
			createElement(IngredientCheck, {
				ingredient: { name: 'stock', quantity: '1', unit: 'cup' },
				isChecked: false,
				onToggle,
			}),
		)

		fireEvent.click(screen.getByText('1 cup stock'))

		expect(onToggle).toHaveBeenCalledTimes(1)
		expect(ingredientCheck).not.toContain('delay: index')
		expect(ingredientCheck).not.toContain('<motion.label')
		expect(ingredientCheck).toContain('transition={TRANSITION_BOUNCY}')
	})

	it('retains disclosure animation for optional step detail', () => {
		expect(renderer).toContain('<AnimatePresence>')
		expect(renderer).toContain('initial={{ height: 0, opacity: 0 }}')
		expect(renderer).toContain("animate={{ height: 'auto', opacity: 1 }}")
		expect(renderer).toContain('transition={TRANSITION_SMOOTH}')
	})
})
