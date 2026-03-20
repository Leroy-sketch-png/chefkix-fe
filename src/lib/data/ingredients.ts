/**
 * Common cooking ingredients organized by category.
 * Used for autocomplete/suggestions in pantry and recipe inputs.
 */

interface IngredientEntry {
	name: string
	category: string
}

const INGREDIENTS: IngredientEntry[] = [
	// Produce - Vegetables
	{ name: 'Tomatoes', category: 'produce' },
	{ name: 'Onions', category: 'produce' },
	{ name: 'Garlic', category: 'produce' },
	{ name: 'Potatoes', category: 'produce' },
	{ name: 'Carrots', category: 'produce' },
	{ name: 'Bell Peppers', category: 'produce' },
	{ name: 'Broccoli', category: 'produce' },
	{ name: 'Spinach', category: 'produce' },
	{ name: 'Mushrooms', category: 'produce' },
	{ name: 'Zucchini', category: 'produce' },
	{ name: 'Celery', category: 'produce' },
	{ name: 'Cucumber', category: 'produce' },
	{ name: 'Lettuce', category: 'produce' },
	{ name: 'Kale', category: 'produce' },
	{ name: 'Sweet Potatoes', category: 'produce' },
	{ name: 'Corn', category: 'produce' },
	{ name: 'Green Beans', category: 'produce' },
	{ name: 'Peas', category: 'produce' },
	{ name: 'Cauliflower', category: 'produce' },
	{ name: 'Cabbage', category: 'produce' },
	{ name: 'Eggplant', category: 'produce' },
	{ name: 'Asparagus', category: 'produce' },
	{ name: 'Avocado', category: 'produce' },
	{ name: 'Jalapeños', category: 'produce' },
	{ name: 'Ginger', category: 'produce' },
	{ name: 'Green Onions', category: 'produce' },
	{ name: 'Shallots', category: 'produce' },
	{ name: 'Leeks', category: 'produce' },
	{ name: 'Radishes', category: 'produce' },
	{ name: 'Beets', category: 'produce' },

	// Produce - Fruits
	{ name: 'Lemons', category: 'produce' },
	{ name: 'Limes', category: 'produce' },
	{ name: 'Oranges', category: 'produce' },
	{ name: 'Apples', category: 'produce' },
	{ name: 'Bananas', category: 'produce' },
	{ name: 'Berries', category: 'produce' },
	{ name: 'Strawberries', category: 'produce' },
	{ name: 'Blueberries', category: 'produce' },
	{ name: 'Mangoes', category: 'produce' },
	{ name: 'Pineapple', category: 'produce' },

	// Protein
	{ name: 'Chicken Breast', category: 'protein' },
	{ name: 'Chicken Thighs', category: 'protein' },
	{ name: 'Ground Beef', category: 'protein' },
	{ name: 'Beef Steak', category: 'protein' },
	{ name: 'Pork Chops', category: 'protein' },
	{ name: 'Ground Pork', category: 'protein' },
	{ name: 'Bacon', category: 'protein' },
	{ name: 'Salmon', category: 'protein' },
	{ name: 'Shrimp', category: 'protein' },
	{ name: 'Tuna', category: 'protein' },
	{ name: 'Cod', category: 'protein' },
	{ name: 'Tofu', category: 'protein' },
	{ name: 'Eggs', category: 'protein' },
	{ name: 'Sausage', category: 'protein' },
	{ name: 'Turkey', category: 'protein' },
	{ name: 'Lamb', category: 'protein' },
	{ name: 'Ground Turkey', category: 'protein' },
	{ name: 'Tempeh', category: 'protein' },
	{ name: 'Crab', category: 'protein' },
	{ name: 'Scallops', category: 'protein' },

	// Dairy
	{ name: 'Butter', category: 'dairy' },
	{ name: 'Milk', category: 'dairy' },
	{ name: 'Heavy Cream', category: 'dairy' },
	{ name: 'Cheddar Cheese', category: 'dairy' },
	{ name: 'Mozzarella', category: 'dairy' },
	{ name: 'Parmesan', category: 'dairy' },
	{ name: 'Cream Cheese', category: 'dairy' },
	{ name: 'Sour Cream', category: 'dairy' },
	{ name: 'Greek Yogurt', category: 'dairy' },
	{ name: 'Feta Cheese', category: 'dairy' },
	{ name: 'Ricotta', category: 'dairy' },
	{ name: 'Swiss Cheese', category: 'dairy' },
	{ name: 'Goat Cheese', category: 'dairy' },
	{ name: 'Whipped Cream', category: 'dairy' },
	{ name: 'Buttermilk', category: 'dairy' },
	{ name: 'Half and Half', category: 'dairy' },

	// Grains & Pasta
	{ name: 'Rice', category: 'grain' },
	{ name: 'Pasta', category: 'grain' },
	{ name: 'Spaghetti', category: 'grain' },
	{ name: 'Penne', category: 'grain' },
	{ name: 'Bread', category: 'grain' },
	{ name: 'Flour', category: 'grain' },
	{ name: 'Breadcrumbs', category: 'grain' },
	{ name: 'Oats', category: 'grain' },
	{ name: 'Quinoa', category: 'grain' },
	{ name: 'Couscous', category: 'grain' },
	{ name: 'Tortillas', category: 'grain' },
	{ name: 'Noodles', category: 'grain' },
	{ name: 'Rice Noodles', category: 'grain' },
	{ name: 'Cornstarch', category: 'grain' },
	{ name: 'Panko', category: 'grain' },
	{ name: 'Pita Bread', category: 'grain' },
	{ name: 'Basmati Rice', category: 'grain' },
	{ name: 'Brown Rice', category: 'grain' },

	// Spices & Herbs
	{ name: 'Salt', category: 'spice' },
	{ name: 'Black Pepper', category: 'spice' },
	{ name: 'Paprika', category: 'spice' },
	{ name: 'Cumin', category: 'spice' },
	{ name: 'Chili Powder', category: 'spice' },
	{ name: 'Oregano', category: 'spice' },
	{ name: 'Basil', category: 'spice' },
	{ name: 'Thyme', category: 'spice' },
	{ name: 'Rosemary', category: 'spice' },
	{ name: 'Cinnamon', category: 'spice' },
	{ name: 'Turmeric', category: 'spice' },
	{ name: 'Cayenne Pepper', category: 'spice' },
	{ name: 'Italian Seasoning', category: 'spice' },
	{ name: 'Bay Leaves', category: 'spice' },
	{ name: 'Nutmeg', category: 'spice' },
	{ name: 'Coriander', category: 'spice' },
	{ name: 'Red Pepper Flakes', category: 'spice' },
	{ name: 'Garlic Powder', category: 'spice' },
	{ name: 'Onion Powder', category: 'spice' },
	{ name: 'Smoked Paprika', category: 'spice' },
	{ name: 'Garam Masala', category: 'spice' },
	{ name: 'Curry Powder', category: 'spice' },
	{ name: 'Fresh Parsley', category: 'spice' },
	{ name: 'Fresh Cilantro', category: 'spice' },
	{ name: 'Fresh Basil', category: 'spice' },
	{ name: 'Fresh Mint', category: 'spice' },
	{ name: 'Fresh Dill', category: 'spice' },
	{ name: 'Saffron', category: 'spice' },

	// Condiments & Sauces
	{ name: 'Olive Oil', category: 'other' },
	{ name: 'Vegetable Oil', category: 'other' },
	{ name: 'Sesame Oil', category: 'other' },
	{ name: 'Coconut Oil', category: 'other' },
	{ name: 'Soy Sauce', category: 'other' },
	{ name: 'Vinegar', category: 'other' },
	{ name: 'Balsamic Vinegar', category: 'other' },
	{ name: 'Rice Vinegar', category: 'other' },
	{ name: 'Apple Cider Vinegar', category: 'other' },
	{ name: 'Tomato Sauce', category: 'other' },
	{ name: 'Tomato Paste', category: 'other' },
	{ name: 'Ketchup', category: 'other' },
	{ name: 'Mustard', category: 'other' },
	{ name: 'Dijon Mustard', category: 'other' },
	{ name: 'Mayonnaise', category: 'other' },
	{ name: 'Hot Sauce', category: 'other' },
	{ name: 'Worcestershire Sauce', category: 'other' },
	{ name: 'Fish Sauce', category: 'other' },
	{ name: 'Oyster Sauce', category: 'other' },
	{ name: 'Hoisin Sauce', category: 'other' },
	{ name: 'Sriracha', category: 'other' },
	{ name: 'Honey', category: 'other' },
	{ name: 'Maple Syrup', category: 'other' },
	{ name: 'Sugar', category: 'other' },
	{ name: 'Brown Sugar', category: 'other' },
	{ name: 'Vanilla Extract', category: 'other' },
	{ name: 'Baking Powder', category: 'other' },
	{ name: 'Baking Soda', category: 'other' },
	{ name: 'Coconut Milk', category: 'other' },
	{ name: 'Chicken Broth', category: 'other' },
	{ name: 'Vegetable Broth', category: 'other' },
	{ name: 'Beef Broth', category: 'other' },
	{ name: 'Mirin', category: 'other' },
	{ name: 'Tahini', category: 'other' },
	{ name: 'Peanut Butter', category: 'other' },

	// Nuts & Seeds
	{ name: 'Almonds', category: 'other' },
	{ name: 'Walnuts', category: 'other' },
	{ name: 'Cashews', category: 'other' },
	{ name: 'Peanuts', category: 'other' },
	{ name: 'Pine Nuts', category: 'other' },
	{ name: 'Sesame Seeds', category: 'other' },
	{ name: 'Sunflower Seeds', category: 'other' },
	{ name: 'Chia Seeds', category: 'other' },
	{ name: 'Flax Seeds', category: 'other' },

	// Canned & Dried
	{ name: 'Canned Tomatoes', category: 'other' },
	{ name: 'Canned Beans', category: 'other' },
	{ name: 'Chickpeas', category: 'other' },
	{ name: 'Black Beans', category: 'other' },
	{ name: 'Kidney Beans', category: 'other' },
	{ name: 'Lentils', category: 'other' },
	{ name: 'Canned Corn', category: 'other' },
	{ name: 'Canned Tuna', category: 'other' },
	{ name: 'Olives', category: 'other' },
	{ name: 'Capers', category: 'other' },
	{ name: 'Sun-Dried Tomatoes', category: 'other' },
	{ name: 'Raisins', category: 'other' },
	{ name: 'Dried Cranberries', category: 'other' },
]

export type { IngredientEntry }

/**
 * Get ingredient suggestions as ComboboxOption[].
 * Merges the static vocabulary with the user's existing pantry items
 * to provide "recently used" items at the top.
 */
export function getIngredientOptions(
	existingItems?: string[],
): { value: string; label: string; secondary?: string }[] {
	const seen = new Set<string>()
	const results: { value: string; label: string; secondary?: string }[] = []

	// Add existing pantry items first (user's history)
	if (existingItems) {
		for (const item of existingItems) {
			const key = item.toLowerCase()
			if (!seen.has(key)) {
				seen.add(key)
				results.push({
					value: key,
					label: item,
					secondary: 'in your pantry',
				})
			}
		}
	}

	// Add vocabulary items
	for (const ingredient of INGREDIENTS) {
		const key = ingredient.name.toLowerCase()
		if (!seen.has(key)) {
			seen.add(key)
			results.push({
				value: key,
				label: ingredient.name,
				secondary: ingredient.category,
			})
		}
	}

	return results
}

/**
 * Get category suggestion for an ingredient name.
 * Returns the mapped category if found, otherwise 'other'.
 */
export function suggestCategory(name: string): string {
	const lower = name.toLowerCase().trim()
	const match = INGREDIENTS.find(i => i.name.toLowerCase() === lower)
	return match?.category ?? 'other'
}
