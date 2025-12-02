'use client'

import { useRouter } from 'next/navigation'
import { RecipeCreateAiFlow, ParsedRecipe } from '@/components/recipe'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageTransition } from '@/components/layout/PageTransition'

export default function CreateRecipePage() {
	const router = useRouter()

	const handleBack = () => {
		router.back()
	}

	const handlePublish = (recipe: ParsedRecipe) => {
		// TODO: Wire to backend API
		console.log('Publishing recipe:', recipe)
		// Navigate to recipe page or dashboard after publish
		router.push('/dashboard')
	}

	return (
		<PageTransition>
			<PageContainer maxWidth='lg'>
				<RecipeCreateAiFlow onBack={handleBack} onPublish={handlePublish} />
			</PageContainer>
		</PageTransition>
	)
}
