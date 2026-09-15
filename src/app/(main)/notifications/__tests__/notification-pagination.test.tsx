import fs from 'node:fs'
import path from 'node:path'

describe('notification page pagination lifecycle', () => {
	it('keeps initial and incremental failures separate and appends through ID authority', () => {
		const source = fs.readFileSync(
			path.join(
				process.cwd(),
				'src',
				'app',
				'(main)',
				'notifications',
				'page.tsx',
			),
			'utf8',
		)

		expect(source).toContain('getNotificationPage({')
		expect(source).toContain('appendUniqueById(current, gamified)')
		expect(source).toContain('appendUniqueById(current, social)')
		expect(source).toContain('setLoadMoreError(true)')
		expect(source).toContain("role='alert'")
		expect(source).toContain("t('retryLoadMore')")
		expect(source).toContain('{!isLoading && hasNextPage && (')
		expect(source).not.toContain('pagination.total')
	})
})
