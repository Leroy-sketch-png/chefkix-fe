import fs from 'node:fs'
import path from 'node:path'

describe('learning-path metric truth', () => {
	const view = fs.readFileSync(
		path.join(process.cwd(), 'src/components/collections/LearningPathView.tsx'),
		'utf8',
	)
	const types = fs.readFileSync(
		path.join(process.cwd(), 'src/lib/types/collection.ts'),
		'utf8',
	)

	it('models unknown metrics and renders completion only when measured', () => {
		expect(types).toContain('completionRate?: number | null')
		expect(types).toContain('averageRating?: number | null')
		expect(view.match(/collection\.completionRate != null/g)).toHaveLength(2)
		expect(view).not.toContain('collection.completionRate !== undefined')
	})
})
