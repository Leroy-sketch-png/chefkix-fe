/**
 * Legacy edit route — redirects to unified creator studio.
 *
 * /recipes/{id}/edit → /create?draftId={id}
 *
 * Kept as a thin redirect so bookmarks and deep links still work.
 */
import { redirect } from 'next/navigation'

interface EditRecipePageProps {
	params: Promise<{ id: string }>
}

export default async function EditRecipePage({ params }: EditRecipePageProps) {
	const { id } = await params
	redirect(`/create?draftId=${id}`)
}
