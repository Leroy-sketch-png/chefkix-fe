import fs from 'fs'
import path from 'path'

const readSource = (relativePath: string) =>
	fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8')

describe('collection detail parent navigation', () => {
	it('returns direct-entry users to the collection library deterministically', () => {
		const page = readSource(
			'src/app/(main)/collections/[collectionId]/page.tsx',
		)
		const messages = readSource('messages/en.json')

		expect(page).toContain("import { PATHS } from '@/constants'")
		expect(page).toContain('onClick={() => router.push(PATHS.COLLECTIONS)}')
		expect(page).toContain("{t('detailBackToCollections')}")
		expect(page).not.toContain('router.back()')
		expect(messages).not.toContain('"detailBack":')
	})
})
