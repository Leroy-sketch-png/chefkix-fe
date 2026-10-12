import fs from 'fs'
import path from 'path'

const readSource = (relativePath: string) =>
	fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8')

describe('collection detail load truth contract', () => {
	it('reserves not-found for 404 and makes other failures retryable', () => {
		const page = readSource(
			'src/app/(main)/collections/[collectionId]/page.tsx',
		)
		const messages = readSource('messages/en.json')

		expect(page).toContain(
			"const [loadError, setLoadError] = useState<'not-found' | 'failed' | null>(",
		)
		expect(page).toContain("colRes.statusCode === 404 ? 'not-found' : 'failed'")
		expect(page).toContain("setLoadError('failed')")
		expect(page).toContain("if (loadError === 'failed')")
		expect(page).toContain('onRetry={fetchData}')
		expect(page).toContain("if (loadError === 'not-found' || !collection)")
		expect(messages).toContain(
			'"detailLoadFailedMessage": "ChefKix couldn\'t load this collection. Try again."',
		)
	})
})
