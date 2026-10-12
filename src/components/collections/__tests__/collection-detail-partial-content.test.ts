import fs from 'fs'
import path from 'path'

const readSource = (relativePath: string) =>
	fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8')

describe('collection detail partial-content truth contract', () => {
	it('keeps available content and exposes independent recovery state', () => {
		const page = readSource(
			'src/app/(main)/collections/[collectionId]/page.tsx',
		)
		const messages = readSource('messages/en.json')

		expect(page).toContain(
			'const [postsLoadFailed, setPostsLoadFailed] = useState(false)',
		)
		expect(page).toContain(
			'const [recipesLoadFailed, setRecipesLoadFailed] = useState(false)',
		)
		expect(page).toContain('failedCount: recipeIds.length - recipes.length')
		expect(page).toContain('setPostsLoadFailed(!postsRes.success)')
		expect(page).toContain('setRecipesLoadFailed(recipeLoad.failedCount > 0)')
		expect(page).toContain('{(postsLoadFailed || recipesLoadFailed) && (')
		expect(page).toContain('onClick={fetchData}')
		expect(messages).toContain('"detailPartialLoad"')
		expect(messages).toContain('"detailRetryContent"')
	})
})
