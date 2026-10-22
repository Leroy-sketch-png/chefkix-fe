import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const readSource = (path: string) =>
	readFileSync(join(process.cwd(), path), 'utf8')

describe('Cook Together recipe-first host path', () => {
	it('gives hosts a direct path to choose the room recipe', () => {
		const source = readSource('src/app/(main)/cook-together/page.tsx')

		expect(source).toContain("href='/explore?from=cook-together'")
		expect(source).toContain("t('ctChooseRecipe')")
		expect(source).toContain("t('ctHostRoomDesc')")
	})

	it('does not create recipe-less rooms or loop hosts back to the lobby', () => {
		const source = readSource('src/app/(main)/cook-together/page.tsx')
		const hostSection = source.slice(
			source.indexOf('{/* Host a Room */}'),
			source.indexOf('{/* Join a Room Card */}'),
		)

		expect(hostSection).not.toContain('createRoom(')
		expect(hostSection).not.toContain("href='/cook-together'")
	})

	it('explains the same-recipe contract before navigation', () => {
		const messages = JSON.parse(readSource('messages/en.json')) as {
			cooking: Record<string, string>
		}

		expect(messages.cooking.ctHostRoomDesc).toContain(
			'Everyone who joins will cook that same recipe',
		)
	})
})
