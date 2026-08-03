import fs from 'node:fs'
import path from 'node:path'

const readSource = (relativePath: string) =>
	fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8')

describe('creator publish truth contracts', () => {
	it('does not invent validation confidence or zero-reward fallback previews', () => {
		const source = readSource('src/components/recipe/RecipeCreateAiFlow.tsx')

		expect(source).not.toContain('confidence: 95')
		expect(source).not.toContain('confidence: 1')
		expect(source).not.toMatch(
			/setXpBreakdown\(\{\s*base:\s*0,[\s\S]*?setStep\('xp-preview'\)/,
		)
		expect(source).toContain("method === 'ai'")
		expect(source).toContain("t('aiFlowReadyForReview')")
	})

	it('submits an editable difficulty and protects manual intent from AI', () => {
		const source = readSource('src/components/recipe/RecipeFormDetailed.tsx')

		expect(source).toContain('value={formData.difficulty}')
		expect(source).toContain("updateField('difficulty', value)")
		expect(source).toContain('difficultyManuallyEditedRef.current = true')
		expect(source).toContain('useRef(Boolean(initialData?.difficulty))')
		expect(source).toContain('if (!difficultyManuallyEditedRef.current)')
		expect(source).not.toContain("t('formDeterminedByAi')")
	})

	it('keeps the real creator bonus without a fixed audience projection', () => {
		const source = readSource('src/components/recipe/XpPreviewModal.tsx')

		expect(source).toContain("t('creatorXpWhenOthersCook')")
		expect(source).not.toContain("t('creatorXpProjection'")
		expect(source).not.toContain('* 100')
		expect(source).not.toContain('xp: xpBreakdown.total')
	})
})
