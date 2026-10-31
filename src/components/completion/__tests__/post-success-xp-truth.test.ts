import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const readSource = (relativePath: string) =>
	readFileSync(join(process.cwd(), relativePath), 'utf8')

const composerSource = readSource('src/app/(main)/post/new/page.tsx')
const rewardSource = readSource(
	'src/components/completion/PostSuccessRewards.tsx',
)

describe('post success XP truth', () => {
	it('does not manufacture component attribution from the link endpoint total', () => {
		expect(composerSource).toMatch(/xpRows:\s*\[\]/)
		expect(composerSource).not.toMatch(/xpAwarded\s*\*\s*0\.[46]/)
	})

	it('continues to show the authoritative total and supports real rows when available', () => {
		expect(rewardSource).toContain('xpRows.map((row, i)')
		expect(rewardSource).toContain("{t('totalEarned')}")
		expect(rewardSource).toContain('+{totalXp} XP')
	})

	it('does not render an empty nested card when attribution rows are unavailable', () => {
		expect(rewardSource).toContain("<div className='space-y-1'>")
		expect(rewardSource).not.toContain(
			"<div className='space-y-1 rounded-xl bg-bg-card p-3'>",
		)
	})
})
