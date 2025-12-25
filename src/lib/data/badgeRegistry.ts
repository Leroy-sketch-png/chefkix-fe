/**
 * Badge Registry - Single Source of Truth for Frontend
 *
 * IMPORTANT: This registry mirrors the AI Service's BADGE_CATALOG in enrichment.py
 * The AI service is the authoritative source for badge definitions.
 * Badge names flow: AI Service → Backend → Frontend (unchanged)
 *
 * Categories from AI Service:
 * - DIFFICULTY: First Steps, Home Cook, Skilled Chef, Culinary Artist
 * - CUISINE: Italian Artisan, Sushi Sensei, Wok Master, etc.
 * - DIETARY: Plant Based Pro, Veggie Master, GF Guru, Keto King, Paleo Pro
 * - SEASONAL: Spring Sensation, Summer Sizzle, Autumn Harvest, Winter Warmer
 * - TECHNIQUE: Knife Skills, Searing Specialist, Baking Boss, Sauce Savant, Grill Master
 * - TIME: Speed Demon, Quick Cook, Patient Chef, Slow Food Sage, Lightning Hands
 * - INGREDIENT: Seafood Specialist, Meat Maven, Pasta Perfectionist, Miso Keeper
 * - NUTRITION: Health Hero, Protein Power, Low Cal Champion
 * - SPECIAL: One Pot Wonder, Minimalist Chef, Party Planner, and hidden gems
 */

import type {
	Badge,
	BadgeRarity,
	BadgeCategory,
} from '@/lib/types/gamification'

// ============================================
// BADGE CATEGORY MAPPING (AI Service → FE)
// ============================================

// AI uses lowercase categories, FE uses uppercase
const CATEGORY_MAP: Record<string, BadgeCategory> = {
	difficulty: 'COOKING',
	cuisine: 'CUISINE',
	dietary: 'COOKING',
	seasonal: 'SPECIAL',
	technique: 'COOKING',
	time: 'COOKING',
	ingredient: 'COOKING',
	nutrition: 'COOKING',
	special: 'SPECIAL',
}

// AI uses Title Case rarity, FE uses UPPERCASE
const RARITY_MAP: Record<string, BadgeRarity> = {
	Common: 'COMMON',
	Uncommon: 'UNCOMMON',
	Rare: 'RARE',
	Epic: 'EPIC',
	Legendary: 'LEGENDARY',
}

// ============================================
// BADGE DEFINITIONS
// ============================================

interface BadgeDefinition {
	name: string
	description: string
	icon: string
	rarity: BadgeRarity
	category: BadgeCategory
	unlockCriteria: string
	isHidden?: boolean
	aiCategory?: string // Original category from AI service
}

/**
 * Master badge registry - mirrors AI Service BADGE_CATALOG
 * Keys are normalized badge names (lowercase)
 */
const BADGE_DEFINITIONS: Record<string, BadgeDefinition> = {
	// ============================================
	// DIFFICULTY BADGES (from AI Service enrichment.py)
	// ============================================
	'first steps': {
		name: 'First Steps',
		description: 'Started your cooking journey with a beginner recipe',
		icon: '👶',
		rarity: 'COMMON',
		category: 'COOKING',
		unlockCriteria: 'Complete a beginner-level recipe',
		aiCategory: 'difficulty',
	},
	'home cook': {
		name: 'Home Cook',
		description: 'Tackled an intermediate recipe with confidence',
		icon: '👨‍🍳',
		rarity: 'UNCOMMON',
		category: 'COOKING',
		unlockCriteria: 'Complete an intermediate-level recipe',
		aiCategory: 'difficulty',
	},
	'skilled chef': {
		name: 'Skilled Chef',
		description: 'Mastered an advanced culinary challenge',
		icon: '⚡',
		rarity: 'RARE',
		category: 'COOKING',
		unlockCriteria: 'Complete an advanced-level recipe',
		aiCategory: 'difficulty',
	},
	'culinary artist': {
		name: 'Culinary Artist',
		description: 'Conquered an expert-level masterpiece',
		icon: '✨',
		rarity: 'EPIC',
		category: 'COOKING',
		unlockCriteria: 'Complete an expert-level recipe',
		aiCategory: 'difficulty',
	},

	// ============================================
	// CUISINE BADGES (from AI Service enrichment.py)
	// ============================================
	'italian artisan': {
		name: 'Italian Artisan',
		description: 'Crafted authentic Italian cuisine',
		icon: '🇮🇹',
		rarity: 'COMMON',
		category: 'CUISINE',
		unlockCriteria: 'Cook an Italian recipe',
		aiCategory: 'cuisine',
	},
	'sushi sensei': {
		name: 'Sushi Sensei',
		description: 'Mastered the art of Japanese cuisine',
		icon: '🍣',
		rarity: 'RARE',
		category: 'CUISINE',
		unlockCriteria: 'Cook a Japanese recipe',
		aiCategory: 'cuisine',
	},
	'wok master': {
		name: 'Wok Master',
		description: 'Commanded the flames of Chinese cooking',
		icon: '🥘',
		rarity: 'UNCOMMON',
		category: 'CUISINE',
		unlockCriteria: 'Cook a Chinese recipe',
		aiCategory: 'cuisine',
	},
	'taco titan': {
		name: 'Taco Titan',
		description: 'Embraced the bold flavors of Mexico',
		icon: '🌮',
		rarity: 'COMMON',
		category: 'CUISINE',
		unlockCriteria: 'Cook a Mexican recipe',
		aiCategory: 'cuisine',
	},
	'french finesse': {
		name: 'French Finesse',
		description: 'Achieved the elegance of French cuisine',
		icon: '🇫🇷',
		rarity: 'EPIC',
		category: 'CUISINE',
		unlockCriteria: 'Cook a French recipe',
		aiCategory: 'cuisine',
	},
	'spice master': {
		name: 'Spice Master',
		description: 'Embraced the vibrant spices of India',
		icon: '🌶️',
		rarity: 'UNCOMMON',
		category: 'CUISINE',
		unlockCriteria: 'Cook an Indian recipe',
		aiCategory: 'cuisine',
	},
	'thai expert': {
		name: 'Thai Expert',
		description: 'Balanced the complex flavors of Thailand',
		icon: '🇹🇭',
		rarity: 'RARE',
		category: 'CUISINE',
		unlockCriteria: 'Cook a Thai recipe',
		aiCategory: 'cuisine',
	},
	'mediterranean chef': {
		name: 'Mediterranean Chef',
		description: 'Captured the sun-kissed flavors of the Mediterranean',
		icon: '🫒',
		rarity: 'UNCOMMON',
		category: 'CUISINE',
		unlockCriteria: 'Cook a Mediterranean recipe',
		aiCategory: 'cuisine',
	},
	'rat(atouille)': {
		name: 'Rat(atouille)',
		description: 'Anyone can cook! Advanced French mastery',
		icon: '🐀',
		rarity: 'EPIC',
		category: 'CUISINE',
		unlockCriteria: 'Complete an advanced French recipe',
		aiCategory: 'cuisine',
		isHidden: true,
	},
	'bánh mì engineer': {
		name: 'Bánh Mì Engineer',
		description: 'Mastered the art of Vietnamese sandwich craft',
		icon: '🥖',
		rarity: 'RARE',
		category: 'CUISINE',
		unlockCriteria: 'Cook Vietnamese with baking, pickling, and grilling',
		aiCategory: 'cuisine',
	},

	// ============================================
	// DIETARY BADGES (from AI Service enrichment.py)
	// ============================================
	'plant based pro': {
		name: 'Plant Based Pro',
		description: 'Championed the art of vegan cooking',
		icon: '🌱',
		rarity: 'UNCOMMON',
		category: 'COOKING',
		unlockCriteria: 'Cook a vegan recipe',
		aiCategory: 'dietary',
	},
	'veggie master': {
		name: 'Veggie Master',
		description: 'Celebrated vegetarian cuisine',
		icon: '🥗',
		rarity: 'COMMON',
		category: 'COOKING',
		unlockCriteria: 'Cook a vegetarian recipe',
		aiCategory: 'dietary',
	},
	'gf guru': {
		name: 'GF Guru',
		description: 'Mastered delicious gluten-free cooking',
		icon: '🌾',
		rarity: 'UNCOMMON',
		category: 'COOKING',
		unlockCriteria: 'Cook a gluten-free recipe',
		aiCategory: 'dietary',
	},
	'keto king': {
		name: 'Keto King',
		description: 'Ruled the low-carb kingdom',
		icon: '🥑',
		rarity: 'RARE',
		category: 'COOKING',
		unlockCriteria: 'Cook a keto recipe',
		aiCategory: 'dietary',
	},
	'paleo pro': {
		name: 'Paleo Pro',
		description: 'Embraced ancestral eating patterns',
		icon: '🦴',
		rarity: 'RARE',
		category: 'COOKING',
		unlockCriteria: 'Cook a paleo recipe',
		aiCategory: 'dietary',
	},

	// ============================================
	// SEASONAL BADGES (from AI Service enrichment.py)
	// ============================================
	'spring sensation': {
		name: 'Spring Sensation',
		description: 'Captured the fresh flavors of spring',
		icon: '🌸',
		rarity: 'UNCOMMON',
		category: 'SPECIAL',
		unlockCriteria: 'Cook a spring seasonal recipe',
		aiCategory: 'seasonal',
	},
	'summer sizzle': {
		name: 'Summer Sizzle',
		description: 'Brought the heat of summer to your kitchen',
		icon: '☀️',
		rarity: 'UNCOMMON',
		category: 'SPECIAL',
		unlockCriteria: 'Cook a summer seasonal recipe',
		aiCategory: 'seasonal',
	},
	'autumn harvest': {
		name: 'Autumn Harvest',
		description: 'Celebrated the bounty of fall',
		icon: '🍂',
		rarity: 'UNCOMMON',
		category: 'SPECIAL',
		unlockCriteria: 'Cook a fall seasonal recipe',
		aiCategory: 'seasonal',
	},
	'winter warmer': {
		name: 'Winter Warmer',
		description: 'Created cozy comfort for cold days',
		icon: '❄️',
		rarity: 'UNCOMMON',
		category: 'SPECIAL',
		unlockCriteria: 'Cook a winter seasonal recipe',
		aiCategory: 'seasonal',
	},

	// ============================================
	// TECHNIQUE BADGES (from AI Service enrichment.py)
	// ============================================
	'knife skills': {
		name: 'Knife Skills',
		description: 'Demonstrated precise cutting techniques',
		icon: '🔪',
		rarity: 'COMMON',
		category: 'COOKING',
		unlockCriteria: 'Complete a recipe requiring chopping, dicing, or mincing',
		aiCategory: 'technique',
	},
	'searing specialist': {
		name: 'Searing Specialist',
		description: 'Mastered the art of the perfect sear',
		icon: '🔥',
		rarity: 'UNCOMMON',
		category: 'COOKING',
		unlockCriteria: 'Complete a recipe with searing or pan-frying',
		aiCategory: 'technique',
	},
	'baking boss': {
		name: 'Baking Boss',
		description: 'Conquered the oven with baking mastery',
		icon: '🥖',
		rarity: 'RARE',
		category: 'COOKING',
		unlockCriteria: 'Complete a recipe requiring baking, proofing, or kneading',
		aiCategory: 'technique',
	},
	'sauce savant': {
		name: 'Sauce Savant',
		description: 'Crafted sauces with finesse and precision',
		icon: '🍯',
		rarity: 'RARE',
		category: 'COOKING',
		unlockCriteria: 'Complete a recipe with emulsifying, reducing, or whisking',
		aiCategory: 'technique',
	},
	'grill master': {
		name: 'Grill Master',
		description: 'Commanded the flames of the grill',
		icon: '🍖',
		rarity: 'EPIC',
		category: 'COOKING',
		unlockCriteria: 'Complete a recipe with grilling, smoking, or barbecuing',
		aiCategory: 'technique',
	},
	'wok hei': {
		name: 'Wok Hei',
		description: 'Achieved the breath of the wok - high heat mastery',
		icon: '🔥',
		rarity: 'EPIC',
		category: 'COOKING',
		unlockCriteria: 'Master stir-frying with high heat cooking',
		aiCategory: 'technique',
		isHidden: true,
	},
	'nước chấm architect': {
		name: 'Nước Chấm Architect',
		description: 'Mastered the balance of Vietnamese dipping sauces',
		icon: '🥢',
		rarity: 'UNCOMMON',
		category: 'COOKING',
		unlockCriteria: 'Master sauce making and flavor balancing',
		aiCategory: 'technique',
	},

	// ============================================
	// TIME BADGES (from AI Service enrichment.py)
	// ============================================
	'speed demon': {
		name: 'Speed Demon',
		description: 'Lightning-fast cooking in under 15 minutes',
		icon: '⚡',
		rarity: 'RARE',
		category: 'COOKING',
		unlockCriteria: 'Complete a recipe in 15 minutes or less',
		aiCategory: 'time',
	},
	'quick cook': {
		name: 'Quick Cook',
		description: 'Efficient cooking in 30 minutes or less',
		icon: '⏱️',
		rarity: 'COMMON',
		category: 'COOKING',
		unlockCriteria: 'Complete a recipe in 30 minutes or less',
		aiCategory: 'time',
	},
	'patient chef': {
		name: 'Patient Chef',
		description: 'Demonstrated patience with 2+ hour recipes',
		icon: '⏳',
		rarity: 'UNCOMMON',
		category: 'COOKING',
		unlockCriteria: 'Complete a recipe taking 2+ hours',
		aiCategory: 'time',
	},
	'slow food sage': {
		name: 'Slow Food Sage',
		description: 'Embraced the art of slow cooking (3+ hours)',
		icon: '🐌',
		rarity: 'RARE',
		category: 'COOKING',
		unlockCriteria: 'Complete a recipe taking 3+ hours',
		aiCategory: 'time',
	},
	'lightning hands': {
		name: 'Lightning Hands',
		description: 'Incredible speed - recipe done in 10 minutes',
		icon: '⚡',
		rarity: 'EPIC',
		category: 'COOKING',
		unlockCriteria: 'Complete a recipe in 10 minutes or less',
		aiCategory: 'time',
	},
	'morning phở ritual': {
		name: 'Morning Phở Ritual',
		description: 'Honored the tradition of slow-cooked Vietnamese phở',
		icon: '🍜',
		rarity: 'EPIC',
		category: 'COOKING',
		unlockCriteria: 'Cook Vietnamese with 2+ hour preparation',
		aiCategory: 'time',
		isHidden: true,
	},

	// ============================================
	// INGREDIENT BADGES (from AI Service enrichment.py)
	// ============================================
	'seafood specialist': {
		name: 'Seafood Specialist',
		description: "Mastered the ocean's bounty",
		icon: '🐟',
		rarity: 'UNCOMMON',
		category: 'COOKING',
		unlockCriteria: 'Complete a recipe with fish preparation or filleting',
		aiCategory: 'ingredient',
	},
	'meat maven': {
		name: 'Meat Maven',
		description: 'Expert in meat preparation and cooking',
		icon: '🥩',
		rarity: 'UNCOMMON',
		category: 'COOKING',
		unlockCriteria: 'Complete a recipe with butchering, braising, or roasting',
		aiCategory: 'ingredient',
	},
	'pasta perfectionist': {
		name: 'Pasta Perfectionist',
		description: 'Achieved pasta-making perfection',
		icon: '🍝',
		rarity: 'RARE',
		category: 'COOKING',
		unlockCriteria: 'Complete a recipe with pasta making or shaping',
		aiCategory: 'ingredient',
	},
	'miso keeper': {
		name: 'Miso Keeper',
		description: 'Honored Japanese fermentation traditions',
		icon: '🥣',
		rarity: 'UNCOMMON',
		category: 'COOKING',
		unlockCriteria: 'Cook Japanese with fermentation techniques',
		aiCategory: 'ingredient',
	},
	'rice cooker sage': {
		name: 'Rice Cooker Sage',
		description: 'Mastered the humble art of perfect rice',
		icon: '🍚',
		rarity: 'RARE',
		category: 'COOKING',
		unlockCriteria: 'Master steaming and rice cooking',
		aiCategory: 'special',
		isHidden: true,
	},

	// ============================================
	// NUTRITION BADGES (from AI Service enrichment.py)
	// ============================================
	'health hero': {
		name: 'Health Hero',
		description: 'Created a nutritious meal under 300 calories',
		icon: '💪',
		rarity: 'UNCOMMON',
		category: 'COOKING',
		unlockCriteria: 'Complete a recipe with max 300 calories',
		aiCategory: 'nutrition',
	},
	'protein power': {
		name: 'Protein Power',
		description: 'Fueled up with high-protein cooking',
		icon: '🥚',
		rarity: 'COMMON',
		category: 'COOKING',
		unlockCriteria: 'Complete a high-protein recipe',
		aiCategory: 'nutrition',
	},
	'low cal champion': {
		name: 'Low Cal Champion',
		description: 'Achieved flavor with minimal calories (under 200)',
		icon: '🏆',
		rarity: 'RARE',
		category: 'COOKING',
		unlockCriteria: 'Complete a recipe with max 200 calories',
		aiCategory: 'nutrition',
	},

	// ============================================
	// SPECIAL BADGES (from AI Service enrichment.py)
	// ============================================
	'one pot wonder': {
		name: 'One Pot Wonder',
		description: 'Simple elegance with minimal cleanup (5 steps or less)',
		icon: '🍲',
		rarity: 'COMMON',
		category: 'SPECIAL',
		unlockCriteria: 'Complete a recipe with 5 or fewer steps',
		aiCategory: 'special',
	},
	'minimalist chef': {
		name: 'Minimalist Chef',
		description: 'Maximum flavor, minimum steps (3 or less)',
		icon: '✨',
		rarity: 'RARE',
		category: 'SPECIAL',
		unlockCriteria: 'Complete a recipe with 3 or fewer steps',
		aiCategory: 'special',
	},
	'party planner': {
		name: 'Party Planner',
		description: 'Cooked for a crowd (8+ servings)',
		icon: '🎉',
		rarity: 'UNCOMMON',
		category: 'SPECIAL',
		unlockCriteria: 'Complete a recipe serving 8+ people',
		aiCategory: 'special',
	},
	'crowd pleaser': {
		name: 'Crowd Pleaser',
		description: 'Massive batch cooking (12+ servings)',
		icon: '👥',
		rarity: 'RARE',
		category: 'SPECIAL',
		unlockCriteria: 'Complete a recipe serving 12+ people',
		aiCategory: 'special',
	},
	'comfort food king': {
		name: 'Comfort Food King',
		description: 'Master of soul-warming comfort dishes',
		icon: '🍜',
		rarity: 'UNCOMMON',
		category: 'SPECIAL',
		unlockCriteria: 'Complete a recipe with braising, slow cooking, or stewing',
		aiCategory: 'special',
	},
	'breakfast boss': {
		name: 'Breakfast Boss',
		description: 'Ruled the most important meal of the day',
		icon: '🍳',
		rarity: 'COMMON',
		category: 'SPECIAL',
		unlockCriteria: 'Complete a breakfast recipe',
		aiCategory: 'special',
	},
	'dessert darling': {
		name: 'Dessert Darling',
		description: 'Created sweet masterpieces',
		icon: '🍰',
		rarity: 'RARE',
		category: 'SPECIAL',
		unlockCriteria: 'Complete a dessert with baking, frosting, or decorating',
		aiCategory: 'special',
	},
	'patience is key': {
		name: 'Patience is Key',
		description: 'Legendary patience - expert recipe with 15+ steps',
		icon: '⏳',
		rarity: 'LEGENDARY',
		category: 'SPECIAL',
		unlockCriteria: 'Complete an expert recipe with 15+ steps',
		aiCategory: 'special',
		isHidden: true,
	},
	'flow state': {
		name: 'Flow State',
		description: 'Perfect focus - advanced recipe in 30 minutes',
		icon: '🌊',
		rarity: 'RARE',
		category: 'SPECIAL',
		unlockCriteria: 'Complete an advanced recipe in under 30 minutes',
		aiCategory: 'special',
		isHidden: true,
	},
	"má's hands": {
		name: "Má's Hands",
		description: 'Cooked with the love and skill of Vietnamese mothers',
		icon: '👵',
		rarity: 'RARE',
		category: 'SPECIAL',
		unlockCriteria: 'Complete an intermediate Vietnamese recipe',
		aiCategory: 'special',
		isHidden: true,
	},
	'umami whisperer': {
		name: 'Umami Whisperer',
		description: 'Mastered the fifth taste through fermentation',
		icon: '🫙',
		rarity: 'EPIC',
		category: 'SPECIAL',
		unlockCriteria: 'Master fermenting and sauce making',
		aiCategory: 'special',
		isHidden: true,
	},

	// ============================================
	// STREAK BADGES (Backend-awarded, not from AI)
	// ============================================
	streak_3: {
		name: '3-Day Streak',
		description: 'Cooked 3 days in a row',
		icon: '🔥',
		rarity: 'COMMON',
		category: 'STREAK',
		unlockCriteria: 'Maintain a 3-day cooking streak',
	},
	streak_7: {
		name: 'Week Warrior',
		description: 'Cooked every day for a week',
		icon: '🔥',
		rarity: 'UNCOMMON',
		category: 'STREAK',
		unlockCriteria: 'Maintain a 7-day cooking streak',
	},
	streak_14: {
		name: 'Two Week Champion',
		description: 'Cooked every day for two weeks',
		icon: '🔥',
		rarity: 'RARE',
		category: 'STREAK',
		unlockCriteria: 'Maintain a 14-day cooking streak',
	},
	streak_30: {
		name: 'Monthly Master',
		description: 'Cooked every day for a month',
		icon: '💪',
		rarity: 'EPIC',
		category: 'STREAK',
		unlockCriteria: 'Maintain a 30-day cooking streak',
	},
	streak_100: {
		name: 'Century Chef',
		description: 'Achieved a 100-day cooking streak',
		icon: '🏆',
		rarity: 'LEGENDARY',
		category: 'STREAK',
		unlockCriteria: 'Maintain a 100-day cooking streak',
	},

	// ============================================
	// CREATOR BADGES (Backend-awarded, not from AI)
	// ============================================
	first_recipe: {
		name: 'Recipe Creator',
		description: 'Published your first recipe',
		icon: '📝',
		rarity: 'COMMON',
		category: 'CREATOR',
		unlockCriteria: 'Create and publish your first recipe',
	},
	popular_creator: {
		name: 'Popular Creator',
		description: '10 people have cooked your recipes',
		icon: '⭐',
		rarity: 'RARE',
		category: 'CREATOR',
		unlockCriteria: 'Have your recipes cooked 10 times by others',
	},
	viral_chef: {
		name: 'Viral Chef',
		description: '100 people have cooked your recipes',
		icon: '🚀',
		rarity: 'EPIC',
		category: 'CREATOR',
		unlockCriteria: 'Have your recipes cooked 100 times by others',
	},

	// ============================================
	// CHALLENGE BADGES (Backend-awarded, not from AI)
	// ============================================
	challenge_complete: {
		name: 'Challenge Accepted',
		description: 'Completed your first daily challenge',
		icon: '🎯',
		rarity: 'COMMON',
		category: 'CHALLENGE',
		unlockCriteria: 'Complete a daily challenge',
	},
	challenge_streak_7: {
		name: 'Challenge Warrior',
		description: 'Completed 7 daily challenges',
		icon: '⚔️',
		rarity: 'UNCOMMON',
		category: 'CHALLENGE',
		unlockCriteria: 'Complete 7 daily challenges',
	},
	challenge_streak_30: {
		name: 'Challenge Champion',
		description: 'Completed 30 daily challenges',
		icon: '🏅',
		rarity: 'RARE',
		category: 'CHALLENGE',
		unlockCriteria: 'Complete 30 daily challenges',
	},

	// ============================================
	// SOCIAL BADGES (Backend-awarded, not from AI)
	// ============================================
	first_follower: {
		name: 'First Follower',
		description: 'Someone followed your cooking journey',
		icon: '👋',
		rarity: 'COMMON',
		category: 'SOCIAL',
		unlockCriteria: 'Get your first follower',
	},
	influencer: {
		name: 'Influencer',
		description: 'Reached 100 followers',
		icon: '✨',
		rarity: 'RARE',
		category: 'SOCIAL',
		unlockCriteria: 'Reach 100 followers',
	},
	community_star: {
		name: 'Community Star',
		description: 'Reached 1000 followers',
		icon: '🌟',
		rarity: 'LEGENDARY',
		category: 'SOCIAL',
		unlockCriteria: 'Reach 1000 followers',
	},
}

// ============================================
// BADGE RESOLUTION FUNCTIONS
// ============================================

/**
 * Normalize badge ID for lookup
 * Handles various formats: "Newbie Chef", "newbie_chef", "NEWBIE_CHEF"
 */
function normalizeBadgeId(badgeId: string): string {
	return badgeId.toLowerCase().replace(/_/g, ' ').trim()
}

/**
 * Resolve a badge ID to a full Badge object
 * Returns undefined if badge not found in registry
 */
export function resolveBadge(
	badgeId: string,
	earnedAt?: string,
): Badge | undefined {
	const normalized = normalizeBadgeId(badgeId)
	const definition = BADGE_DEFINITIONS[normalized]

	if (!definition) {
		console.warn(`Unknown badge ID: "${badgeId}" (normalized: "${normalized}")`)
		return undefined
	}

	return {
		id: badgeId,
		name: definition.name,
		description: definition.description,
		icon: definition.icon,
		iconEmoji: definition.icon,
		rarity: definition.rarity,
		category: definition.category,
		earnedAt,
		isHidden: definition.isHidden ?? false,
		unlockCriteria: definition.unlockCriteria,
	}
}

/**
 * Resolve multiple badge IDs to Badge objects
 * Filters out unknown badges
 */
export function resolveBadges(badgeIds: string[], earnedAt?: string): Badge[] {
	return badgeIds
		.map(id => resolveBadge(id, earnedAt))
		.filter((badge): badge is Badge => badge !== undefined)
}

/**
 * Create a fallback badge for unknown badge IDs
 * Used when we want to display something even for unknown badges
 */
export function createFallbackBadge(badgeId: string, earnedAt?: string): Badge {
	// Try to make a readable name from the ID
	const name = badgeId
		.replace(/_/g, ' ')
		.replace(/([a-z])([A-Z])/g, '$1 $2')
		.split(' ')
		.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join(' ')

	return {
		id: badgeId,
		name,
		description: 'A special achievement',
		icon: '🏅',
		iconEmoji: '🏅',
		rarity: 'COMMON',
		category: 'COOKING',
		earnedAt,
		isHidden: false,
		unlockCriteria: 'Special achievement',
	}
}

/**
 * Resolve badges with fallback for unknown ones
 * Always returns a Badge for each valid ID
 * Filters out empty/falsy badge IDs to prevent React key collisions
 */
export function resolveBadgesWithFallback(
	badgeIds: string[],
	earnedAt?: string,
): Badge[] {
	return badgeIds
		.filter(id => id && id.trim()) // Filter out empty/whitespace-only IDs
		.map(id => resolveBadge(id, earnedAt) ?? createFallbackBadge(id, earnedAt))
}

/**
 * Get all available badges (for display in badge catalog)
 */
export function getAllBadges(): Badge[] {
	return Object.entries(BADGE_DEFINITIONS).map(([id, def]) => ({
		id,
		name: def.name,
		description: def.description,
		icon: def.icon,
		iconEmoji: def.icon,
		rarity: def.rarity,
		category: def.category,
		isHidden: def.isHidden ?? false,
		unlockCriteria: def.unlockCriteria,
	}))
}

/**
 * Get badges by category
 */
export function getBadgesByCategory(category: BadgeCategory): Badge[] {
	return getAllBadges().filter(badge => badge.category === category)
}

/**
 * Get badges by rarity
 */
export function getBadgesByRarity(rarity: BadgeRarity): Badge[] {
	return getAllBadges().filter(badge => badge.rarity === rarity)
}
