export type AllergenFlag =
	| 'celery'
	| 'cereals_gluten'
	| 'crustaceans'
	| 'eggs'
	| 'fish'
	| 'lupin'
	| 'milk'
	| 'molluscs'
	| 'mustard'
	| 'peanuts'
	| 'sesame'
	| 'soybeans'
	| 'sulphites'
	| 'tree_nuts'

export interface AllergenOption {
	value: AllergenFlag
	label: string
}

export const EU14_ALLERGENS: AllergenOption[] = [
	{ value: 'celery', label: 'Celery' },
	{ value: 'cereals_gluten', label: 'Cereals containing gluten' },
	{ value: 'crustaceans', label: 'Crustaceans' },
	{ value: 'eggs', label: 'Eggs' },
	{ value: 'fish', label: 'Fish' },
	{ value: 'lupin', label: 'Lupin' },
	{ value: 'milk', label: 'Milk' },
	{ value: 'molluscs', label: 'Molluscs' },
	{ value: 'mustard', label: 'Mustard' },
	{ value: 'peanuts', label: 'Peanuts' },
	{ value: 'sesame', label: 'Sesame' },
	{ value: 'soybeans', label: 'Soybeans' },
	{ value: 'sulphites', label: 'Sulphur dioxide / sulphites' },
	{ value: 'tree_nuts', label: 'Tree nuts' },
]

export const FDA_TOP_9_ALLERGENS: AllergenOption[] = [
	{ value: 'milk', label: 'Milk' },
	{ value: 'eggs', label: 'Eggs' },
	{ value: 'fish', label: 'Fish' },
	{ value: 'crustaceans', label: 'Crustacean shellfish' },
	{ value: 'tree_nuts', label: 'Tree nuts' },
	{ value: 'peanuts', label: 'Peanuts' },
	{ value: 'cereals_gluten', label: 'Wheat / gluten cereals' },
	{ value: 'soybeans', label: 'Soybeans' },
	{ value: 'sesame', label: 'Sesame' },
]

const LEGACY_ALIASES: Record<string, AllergenFlag> = {
	nuts: 'tree_nuts',
	dairy: 'milk',
	shellfish: 'crustaceans',
	soy: 'soybeans',
	wheat: 'cereals_gluten',
}

export function normalizeAllergenFlags(
	flags: string[] | null | undefined,
): string[] {
	const unique = new Map<string, string>()
	for (const rawFlag of flags ?? []) {
		const trimmed = rawFlag.trim()
		if (!trimmed) continue
		const key = trimmed.toLowerCase()
		const canonical = LEGACY_ALIASES[key] ?? trimmed
		unique.set(canonical.toLowerCase(), canonical)
	}
	return [...unique.values()]
}

export function allergenLabel(flag: string): string {
	if (flag.startsWith('custom:')) return flag.slice('custom:'.length)
	return EU14_ALLERGENS.find(option => option.value === flag)?.label ?? flag
}
