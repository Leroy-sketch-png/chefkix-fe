import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const postCard = readFileSync(
	join(process.cwd(), 'src/components/social/PostCard.tsx'),
	'utf8',
)
const comment = readFileSync(
	join(process.cwd(), 'src/components/social/Comment.tsx'),
	'utf8',
)
const recipeReviews = readFileSync(
	join(process.cwd(), 'src/components/recipe/RecipeReviews.tsx'),
	'utf8',
)

describe('PostCard engagement proof', () => {
	it('keeps Like and Comment controls stable while suppressing empty proof', () => {
		expect(postCard).toContain("from '@/lib/positive-social-proof'")
		expect(postCard).toContain(
			'const hasLikeProof = isPositiveSocialMetric(post.likes)',
		)
		expect(postCard).toContain(
			'const hasCommentProof = isPositiveSocialMetric(post.commentCount)',
		)
		expect(postCard).toContain('{hasLikeProof ? (')
		expect(postCard).toContain('{hasCommentProof ? (')
		expect(postCard).not.toContain('value={post.likes ?? 0}')
		expect(postCard).not.toContain('value={post.commentCount ?? 0}')
		expect(postCard.match(/className=.*h-10 flex-1/g)).toHaveLength(2)
	})

	it('announces positive engagement without inventing a zero count', () => {
		for (const key of [
			'unlikePostWithCountLabel',
			'likePostWithCountLabel',
			'hideCommentsWithCountLabel',
			'showCommentsWithCountLabel',
		]) {
			expect(postCard).toContain(`t('${key}'`)
		}
		expect(postCard).toContain("t('unlikePostLabel')")
		expect(postCard).toContain("t('likePostLabel')")
		expect(postCard).toContain("t('hideCommentsLabel')")
		expect(postCard).toContain("t('showCommentsLabel')")
	})

	it('uses the existing ICU authority for reply grammar', () => {
		expect(comment).toContain("t('replyCount', { count: replyCount })")
		expect(comment).not.toContain("replyCount === 1 ? t('reply') : t('reply')")
	})

	it('keys recipe-review comment proof to comments, never unrelated likes', () => {
		expect(recipeReviews).toContain(
			'isPositiveSocialMetric(review.commentCount)',
		)
		expect(recipeReviews).toContain(
			"t('commentsCount', { count: review.commentCount })",
		)
		expect(recipeReviews).not.toContain(
			'review.likes != null && review.likes > 0',
		)
		expect(recipeReviews).not.toContain('review.commentCount ?? 0')
	})
})
