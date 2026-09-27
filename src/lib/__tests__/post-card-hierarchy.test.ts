import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const readSource = () =>
	readFileSync(
		join(process.cwd(), 'src/components/social/PostCard.tsx'),
		'utf8',
	)

describe('PostCard hierarchy', () => {
	it('keeps the food and primary actions ahead of supporting context', () => {
		const source = readSource()

		expect(source).toContain("'flex flex-col'")
		expect(source).toContain(
			"className='order-2 relative w-full cursor-pointer select-none'",
		)
		expect(source).toContain("className='order-3 flex items-stretch")
		expect(source).toContain(
			"className='order-4 flex items-center justify-between",
		)
		expect(source).toContain("className='order-5 space-y-3")
	})

	it('retains the double-tap contract on photo media', () => {
		const source = readSource()

		expect(source).toContain('onClick={handleDoubleTap}')
		expect(source).toContain("if (e.key === 'Enter') handleDoubleTap()")
	})
})
