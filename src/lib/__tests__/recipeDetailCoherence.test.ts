import fs from 'node:fs'
import path from 'node:path'

const pageSource = fs.readFileSync(
	path.join(process.cwd(), 'src/app/(main)/recipes/[id]/page.tsx'),
	'utf8',
)

const stepCompletionSource = fs.readFileSync(
	path.join(
		process.cwd(),
		'src/components/recipe/RecipeStepCompletionControl.tsx',
	),
	'utf8',
)

const messages = JSON.parse(
	fs.readFileSync(path.join(process.cwd(), 'messages/en.json'), 'utf8'),
) as {
	recipeDetail: Record<string, string>
}

describe('recipe detail coherence contract', () => {
	it('uses one guarded recipe request for initial load and retry', () => {
		expect(pageSource.match(/getRecipeById\(recipeId\)/g)).toHaveLength(1)
		expect(pageSource).toContain('const recipeRequestSequence = useRef(0)')
		expect(pageSource).toContain(
			'requestSequence !== recipeRequestSequence.current',
		)
		expect(pageSource).toContain('void fetchRecipe()')
		expect(pageSource).toContain('onRetry={fetchRecipe}')
	})

	it('keeps visible navigation and completion feedback in the message catalog', () => {
		expect(pageSource).toContain("{ label: t('explore'), href: '/explore' }")
		expect(stepCompletionSource).toContain("{t('done')}")
		expect(pageSource).toContain("toast.success(t('toastAllStepsCompleted')")
		expect(pageSource).not.toContain('Master chef status unlocked')
		expect(pageSource).not.toContain('prepared this recipe beautifully')

		expect(messages.recipeDetail.explore).toBe('Explore')
		expect(messages.recipeDetail.done).toBe('Done')
		expect(messages.recipeDetail.toastAllStepsCompleted).toBe(
			'All steps checked',
		)
		expect(messages.recipeDetail.toastAllStepsCompletedDesc).toBe(
			"You're ready to plate and serve.",
		)
	})

	it('keeps the mobile desire-to-cook action inside the first viewport', () => {
		expect(pageSource).toContain(
			'h-[20rem] w-full overflow-hidden sm:h-[24rem] md:h-[34rem]',
		)
		expect(pageSource).toContain('line-clamp-3 max-w-3xl')
		expect(pageSource).toContain('md:line-clamp-none')
		expect(pageSource).toContain(
			"className='-order-1 mb-6 space-y-3 md:order-none md:mb-0'",
		)
		expect(pageSource).toContain("className='flex flex-col bg-bg-card")
		expect(pageSource).not.toContain('h-[28rem] w-full overflow-hidden')
	})
})
