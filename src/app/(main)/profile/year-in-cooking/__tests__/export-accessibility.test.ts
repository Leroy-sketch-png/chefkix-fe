import fs from 'node:fs'
import path from 'node:path'

const pageSource = fs.readFileSync(path.join(__dirname, '..', 'page.tsx'), 'utf8')
const announcerSource = fs.readFileSync(
	path.resolve(process.cwd(), 'src/components/a11y/LiveAnnouncer.tsx'),
	'utf8',
)
const messages = JSON.parse(
	fs.readFileSync(path.resolve(process.cwd(), 'messages/en.json'), 'utf8'),
) as { profile: Record<string, string> }

describe('Year in Cooking export accessibility contract', () => {
	it('announces share and download progress through the app live announcer', () => {
		expect(pageSource).toContain("announce(t('yicPreparingShare'))")
		expect(pageSource).toContain("announce(t('yicPreparingDownload'))")
		expect(announcerSource).toContain("aria-live='polite'")
		expect(announcerSource).toContain("role='status'")
	})

	it('provides localized progress copy and preserves action-specific busy state', () => {
		expect(messages.profile.yicPreparingShare).toBeTruthy()
		expect(messages.profile.yicPreparingDownload).toBeTruthy()
		expect(pageSource).toContain("aria-busy={generatingAction === 'share'}")
		expect(pageSource).toContain("aria-busy={generatingAction === 'download'}")
	})
})
