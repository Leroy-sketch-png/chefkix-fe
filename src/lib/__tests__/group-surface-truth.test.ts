import fs from 'node:fs'
import path from 'node:path'

const readSource = (relativePath: string) =>
	fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8')

describe('group surface truth contracts', () => {
	it('has no inert composer tools or unsupported trending sort', () => {
		const composer = readSource('src/components/groups/GroupCreatePostBox.tsx')
		const explore = readSource('src/components/groups/GroupsExploreGrid.tsx')

		expect(composer).toContain('data-group-post-box')
		expect(composer).not.toContain("t('gpPhoto')")
		expect(composer).not.toContain("t('gpFeeling')")
		expect(composer).not.toContain("t('gpLocation')")
		expect(explore).not.toContain("value='TRENDING'")
	})

	it('wires share and translates workspace state', () => {
		const header = readSource('src/components/groups/GroupHeader.tsx')
		const detail = readSource('src/app/(main)/groups/[id]/page.tsx')

		expect(header).toContain('navigator.share')
		expect(header).toContain('navigator.clipboard.writeText')
		expect(header).toContain('handleShareGroup')
		expect(detail).toContain("t('groupWorkspaceChip')")
		expect(detail).not.toContain("chipText='Collaborative board'")
		expect(detail).not.toContain('chipText={activeTab}')
	})
})
