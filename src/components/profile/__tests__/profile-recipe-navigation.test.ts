import fs from 'node:fs'
import path from 'node:path'

const source = fs.readFileSync(
	path.resolve(process.cwd(), 'src/components/profile/UserProfile.tsx'),
	'utf8',
)

describe('profile recipe navigation contract', () => {
	it('exposes created recipes as keyboard links with an honest view action', () => {
		expect(source).toMatch(
			/userRecipes\.map\(recipe => \(\s*<Link[\s\S]*?href=\{`\/recipes\/\$\{recipe\.id\}`\}[\s\S]*?t\('viewRecipe'\)[\s\S]*?\)\)\}/,
		)
		expect(source).toContain(
			"aria-label={`${t('viewRecipe')}: ${recipe.title}`}",
		)
		expect(source).toContain('focus-visible:ring-2 focus-visible:ring-brand')
		expect(source).not.toMatch(
			/userRecipes\.map\(recipe => \([\s\S]*?t\('cookNow'\)[\s\S]*?\)\)\}/,
		)
	})

	it('uses keyboard-native links for saved and liked recipe cards', () => {
		for (const collection of ['savedRecipes', 'likedRecipes']) {
			expect(source).toMatch(
				new RegExp(
					`${collection}\\.map\\(recipe => \\(\\s*<Link[\\s\\S]*?href=\\{\x60/recipes/\\$\\{recipe\\.id\\}\\x60\\}`,
				),
			)
		}
		expect(source).not.toMatch(
			/(?:savedRecipes|likedRecipes)\.map\(recipe => \([\s\S]*?onClick=\{\(\) => router\.push\(`\/recipes\//,
		)
	})
})
