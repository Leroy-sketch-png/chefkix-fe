import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const readSource = (relativePath: string) =>
	readFileSync(join(process.cwd(), relativePath), 'utf8')

const pageSource = readSource('src/app/(main)/post/[id]/page.tsx')
const loadingSource = readSource('src/app/(main)/post/[id]/loading.tsx')
const postCardSource = readSource('src/components/social/PostCard.tsx')

describe('post detail action authority', () => {
	it('renders one centered PostCard without duplicate action chrome', () => {
		expect(pageSource.match(/<PostCard\b/g)).toHaveLength(1)
		expect(pageSource).toContain("maxWidth='lg'")
		expect(pageSource).not.toContain('PostDetailCommandDeck')
		expect(pageSource).not.toContain('PostDetailContextRail')
	})

	it('keeps save, share, and report behavior in the surviving PostCard', () => {
		expect(postCardSource).toContain('const handleSave = async')
		expect(postCardSource).toContain('toggleSave(post.id)')
		expect(postCardSource).toContain("trackEvent('POST_SHARED'")
		expect(postCardSource).toContain('<SharePostModal')
		expect(postCardSource).toContain('<ReportModal')
	})

	it('uses one guarded fetch implementation for initial load and retry', () => {
		expect(pageSource.match(/await getPostById\(postId\)/g)).toHaveLength(1)
		expect(pageSource).toContain('requestIdRef')
		expect(pageSource).toContain('void fetchPost()')
		expect(pageSource).toContain('onRetry={fetchPost}')
	})

	it('shares one loading composition between route and client loading', () => {
		expect(pageSource).toContain("from './PostDetailSkeleton'")
		expect(loadingSource).toContain("from './PostDetailSkeleton'")
		expect(pageSource).not.toContain('function PostDetailSkeleton')
		expect(loadingSource).not.toContain('function PostDetailSkeleton')
	})
})
