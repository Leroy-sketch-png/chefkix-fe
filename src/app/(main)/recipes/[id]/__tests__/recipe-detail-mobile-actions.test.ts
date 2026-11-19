import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const source = readFileSync(
	join(process.cwd(), 'src/app/(main)/recipes/[id]/page.tsx'),
	'utf8',
)

describe('recipe detail mobile actions', () => {
	it('wraps social actions below 440px and preserves the inline layout above it', () => {
		expect(source).toContain(
			"className='grid grid-cols-2 gap-2 min-[440px]:flex'",
		)
	})
})
