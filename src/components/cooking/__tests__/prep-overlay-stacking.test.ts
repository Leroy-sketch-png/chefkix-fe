import fs from 'node:fs'
import path from 'node:path'

const playerSource = fs.readFileSync(
	path.join(process.cwd(), 'src/components/cooking/CookingPlayer.tsx'),
	'utf8',
)

describe('cooking mode overlay stacking', () => {
	it('keeps animated step content below PREP and monitoring overlays', () => {
		expect(playerSource).toContain(
			"className='absolute inset-0 z-10 flex flex-col items-center justify-start gap-1 overflow-y-auto bg-bg-card p-2 sm:gap-6 sm:p-6'",
		)
		expect(playerSource).toContain(
			"className='absolute inset-0 z-0 flex flex-col overflow-y-auto p-6'",
		)
		expect(playerSource).toContain(
			"className='absolute left-0 right-0 top-0 z-10",
		)
		expect(playerSource).toContain("interactionMode === 'PREP' && (")
	})
})
