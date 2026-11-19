import fs from 'node:fs'
import path from 'node:path'

const read = (relativePath: string) =>
	fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8')

describe('manual recipe draft lifecycle contract', () => {
	const form = read('src/components/recipe/RecipeFormDetailed.tsx')
	const flow = read('src/components/recipe/RecipeCreateAiFlow.tsx')
	const createPage = read('src/app/(main)/create/page.tsx')
	const messages = JSON.parse(read('messages/en.json')) as Record<
		string,
		Record<string, string>
	>

	it('autosaves with truthful status and restores file previews from owner-scoped storage', () => {
		expect(form).toContain('recipeDraftRepository.save(accountId, snapshot)')
		expect(form).toContain("role='status' aria-live='polite'")
		expect(form).toContain("setLocalDraftStatus('error')")
		expect(form.indexOf('const hasDraftContent')).toBeLessThan(
			form.indexOf('useRef(hasDraftContent)'),
		)
		expect(form).toContain('file={formData.coverImageFile}')
		expect(form).toContain('coverImageFile: initialData?.coverImageFile')
		expect(form).toContain('step.imageFile')
		expect(createPage).toContain('recipeDraftRepository.load(ownerId)')
		expect(createPage).toContain('localDraftOwnerId === ownerId')
		expect(messages.recipe).toMatchObject({
			draftSaving: 'Saving on this device...',
			draftSaved: 'Saved on this device',
			draftSaveFailed: 'Not saved on this device',
		})
	})

	it('uploads all selected manual images before preview or cloud draft save', () => {
		expect(flow).toContain('const prepareManualRecipe = useCallback(')
		expect(flow).toContain(
			'...(data.coverImageFile ? [data.coverImageFile] : [])',
		)
		expect(flow).toContain('...stepFiles.map(item => item.file)')
		expect(flow).toContain('uploadRecipeImages(files)')
		expect(flow).toContain('response.data.length !== files.length')
		expect(flow).toContain('if (parsed) await handleSaveDraft(parsed)')
		expect(flow).not.toContain('saveLocalRecipeDraft(data)')
	})

	it('does not silently adopt an unowned legacy draft or delete it before explicit claim', () => {
		expect(createPage).toContain('legacyDraftNeedsReview')
		expect(createPage).toContain('legacyOwner === ownerId')
		expect(createPage).toContain('claimLegacyDraft')
		expect(createPage).toContain('if (!clearLocalRecipeDraft())')
	})
})
