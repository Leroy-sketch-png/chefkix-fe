import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const source = readFileSync(
	join(process.cwd(), 'src/components/social/PostCard.tsx'),
	'utf8',
)
const detailSource = readFileSync(
	join(process.cwd(), 'src/app/(main)/post/[id]/page.tsx'),
	'utf8',
)

describe('PostCard navigation semantics', () => {
	it('uses a real permalink without turning the interactive card into a link', () => {
		expect(source).toContain('href={`/post/${post.id}`}')
		expect(source).toContain("aria-label={t('viewPost')}")
		expect(source).not.toContain("role='link'")
		expect(source).not.toContain("className='mb-6 cursor-pointer'")
		expect(source).not.toContain('router.push(`/post/${post.id}`)')
	})

	it('keeps profile and post destinations independently addressable', () => {
		expect(source).toContain(
			"href={post.userId ? `/${post.userId}` : '/dashboard'}",
		)
		expect(source).toContain('href={`/post/${post.id}`}')
	})

	it('defaults cards to caption previews while detail remains complete', () => {
		expect(source).toContain("contentDisplay = 'preview'")
		expect(source).toContain(
			'<PostCaption content={post.content} mode={contentDisplay} />',
		)
		expect(detailSource).toContain("contentDisplay='full'")
	})
})
