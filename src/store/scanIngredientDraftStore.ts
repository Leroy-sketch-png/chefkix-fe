import { create } from 'zustand'

export const MAX_SCAN_INGREDIENTS = 30
export const MAX_SCAN_INGREDIENT_NAME_LENGTH = 120

const normalizeName = (value: unknown): string | null => {
	if (typeof value !== 'string') return null
	const name = value.trim().replace(/\s+/g, ' ')
	if (
		!name ||
		name.length > MAX_SCAN_INGREDIENT_NAME_LENGTH ||
		/[\u0000-\u001f\u007f]/.test(name)
	) {
		return null
	}
	return name
}

const uniqueNames = (values: unknown): string[] => {
	if (!Array.isArray(values)) return []
	const seen = new Set<string>()
	const names: string[] = []
	for (const value of values) {
		const name = normalizeName(value)
		if (!name) continue
		const key = name.toLowerCase()
		if (seen.has(key)) continue
		seen.add(key)
		names.push(name)
	}
	return names
}

const totalUnique = (...groups: string[][]) =>
	new Set(groups.flat().map(name => name.toLocaleLowerCase())).size

interface ScanIngredientDraftState {
	ownerId: string | null
	confirmedScanIngredients: string[]
	manualIngredients: string[]
	setOwnerId: (ownerId: string | null) => void
	setConfirmedScanIngredients: (ownerId: string | null, values: unknown) => void
	addManualIngredient: (ownerId: string | null, value: unknown) => boolean
	removeConfirmedScanIngredient: (ownerId: string | null, value: string) => void
	removeManualIngredient: (ownerId: string | null, value: string) => void
	clearSelection: (ownerId: string | null) => void
	clear: () => void
}

const emptyState = {
	ownerId: null,
	confirmedScanIngredients: [] as string[],
	manualIngredients: [] as string[],
}

export const useScanIngredientDraftStore = create<ScanIngredientDraftState>(
	(set, get) => {
		const ensureOwner = (ownerId: string | null) => {
			if (get().ownerId !== ownerId) {
				set({
					ownerId,
					confirmedScanIngredients: [],
					manualIngredients: [],
				})
			}
		}

		return {
			...emptyState,
			setOwnerId: ownerId => ensureOwner(ownerId),
			setConfirmedScanIngredients: (ownerId, values) => {
				ensureOwner(ownerId)
				const current = get()
				const accepted: string[] = []
				const reserved = new Set(
					current.manualIngredients.map(name => name.toLowerCase()),
				)
				for (const name of uniqueNames(values)) {
					const key = name.toLowerCase()
					if (!reserved.has(key) && reserved.size >= MAX_SCAN_INGREDIENTS) {
						continue
					}
					reserved.add(key)
					accepted.push(name)
				}
				set({ confirmedScanIngredients: accepted })
			},
			addManualIngredient: (ownerId, value) => {
				ensureOwner(ownerId)
				const name = normalizeName(value)
				if (!name) return false
				const current = get()
				if (
					current.manualIngredients.some(
						item => item.toLowerCase() === name.toLowerCase(),
					)
				) {
					return true
				}
				if (
					totalUnique(
						current.confirmedScanIngredients,
						current.manualIngredients,
						[name],
					) > MAX_SCAN_INGREDIENTS
				) {
					return false
				}
				set({ manualIngredients: [...current.manualIngredients, name] })
				return true
			},
			removeConfirmedScanIngredient: (ownerId, value) => {
				ensureOwner(ownerId)
				set(state => ({
					confirmedScanIngredients: state.confirmedScanIngredients.filter(
						item => item !== value,
					),
				}))
			},
			removeManualIngredient: (ownerId, value) => {
				ensureOwner(ownerId)
				set(state => ({
					manualIngredients: state.manualIngredients.filter(
						item => item !== value,
					),
				}))
			},
			clearSelection: ownerId => {
				ensureOwner(ownerId)
				set({ confirmedScanIngredients: [], manualIngredients: [] })
			},
			clear: () => set(emptyState),
		}
	},
)
