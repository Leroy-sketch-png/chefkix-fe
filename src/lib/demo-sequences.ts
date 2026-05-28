import { GhostDriver, getGhostDriver } from './ghost-driver'
import { saveTemporalSnapshot } from './chronos-engine'

async function tryCatch(ghost: GhostDriver, name: string, fn: () => Promise<void>) {
	try {
		await fn()
	} catch (e: any) {
		ghost.log('warn', `[RECOVERY INITIATED] Sequence beat failed: ${name}. Reason: ${e.message}. Proceeding to next beat.`)
	}
}

export async function runOmniDemo() {
	const mainGhost = getGhostDriver('main')
	const friendGhost = getGhostDriver('friend')
	
	try {
		mainGhost.start()

		// ============================================
		// 1. HERO RECIPE BEAT
		// ============================================
		await tryCatch(mainGhost, 'Hero Recipe', async () => {
			saveTemporalSnapshot('Hero Recipe')
			await mainGhost.click('a[href="/recipes/explore"], a[href="/recipes"]')
			await mainGhost.wait(1500)
			
			const firstRecipe = 'main a[href*="/recipes/"]'
			await mainGhost.hover(firstRecipe, true)
			await mainGhost.click(firstRecipe)
			await mainGhost.wait(2000)
			
			// Scroll to ingredients organically
			await mainGhost.scroll(400)
			await mainGhost.wait(2000) // Paced read for ingredients
			
			// Click a shopping list checkbox to prove interaction
			const checkbox = 'input[type="checkbox"], [role="checkbox"]'
			try {
				await mainGhost.hover(checkbox, true)
				await mainGhost.click(checkbox)
			} catch {}
			
			await mainGhost.scroll(300)
			await mainGhost.wait(1500) // Paced read for steps
			
			// Chat with AI
			const chatInput = '[data-testid="room-chat-input"], input[placeholder*="ask" i]'
			try {
				await mainGhost.type(chatInput, "Can I substitute butter for olive oil?")
				await mainGhost.press(chatInput, 'Enter')
				await mainGhost.wait(3500) // Paced read for AI response
			} catch {}
			
			// Start Cooking
			const startCooking = 'button:has-text("Start Cooking"), button:has-text("Cook Recipe")'
			await mainGhost.hover(startCooking, true)
			await mainGhost.click(startCooking)
			await mainGhost.wait(2000)
		})

		// ============================================
		// 2. CO-COOK MULTIPLAYER SWARM
		// ============================================
		await tryCatch(mainGhost, 'Co-Cook Multi-Cursor', async () => {
			saveTemporalSnapshot('Co-Cook Multi-Cursor')
			await mainGhost.click('a[href="/cook-together"], a[href*="room"]')
			await mainGhost.wait(1500)
			
			// Create or Join a Room
			const roomInput = 'input[placeholder*="room" i], input[maxlength="6"]'
			await mainGhost.type(roomInput, 'ABC123')
			await mainGhost.click('button:has-text("Join Room"), button:has-text("Join")')
			await mainGhost.wait(3000)
			
			// Say something in chat
			const chatInput = 'input[placeholder*="chat" i], input[placeholder*="message" i]'
			try {
				await mainGhost.type(chatInput, "I'll start on the garlic!")
				await mainGhost.press(chatInput, 'Enter')
				await mainGhost.wait(1000)
			} catch {}

			// Swarm Activation! Friend cursor joins the presentation.
			friendGhost.start()
			await friendGhost.wait(500)
			
			// Friend checks off step 1
			const readyCheck = 'button:has-text("Ready"), input[type="checkbox"], [role="checkbox"]'
			try {
				// Friend hovers first checkbox
				await friendGhost.hover(`${readyCheck}:nth-of-type(1)`, true)
				await friendGhost.click(`${readyCheck}:nth-of-type(1)`)
				await friendGhost.wait(1000)
				
				// Main cursor checks off step 2
				await mainGhost.hover(`${readyCheck}:nth-of-type(2)`, true)
				await mainGhost.click(`${readyCheck}:nth-of-type(2)`)
				await mainGhost.wait(1500)
			} catch {}
			
			friendGhost.stop()
		})

		// ============================================
		// 3. TASTE COMPATIBILITY BEAT
		// ============================================
		await tryCatch(mainGhost, 'Taste Compatibility', async () => {
			saveTemporalSnapshot('Taste Compatibility')
			await mainGhost.click('a[href="/profile"]')
			await mainGhost.wait(1500)
			await mainGhost.click('a[href="/profile/taste"]')
			await mainGhost.wait(2000)
			
			// Sweep the taste radar with the spotlight
			const radar = '[data-testid="taste-radar"] svg, [data-testid="taste-radar"] canvas'
			try {
				await mainGhost.hover(radar, true)
				await mainGhost.wait(2000)
			} catch {}

			// Go back to Dashboard to find Tonight's Pick
			await mainGhost.click('a[href="/dashboard"], a[href="/"]')
			await mainGhost.wait(2000)
			await mainGhost.scroll(500)
			await mainGhost.wait(1000)
			
			const tonightsPick = '[data-testid="tonights-pick-link"], [data-testid="tonights-pick"] a'
			try {
				await mainGhost.hover(tonightsPick, true)
				await mainGhost.click(tonightsPick)
				await mainGhost.wait(2000)
			} catch {}
		})

		// ============================================
		// 4. CREATOR HEATMAP BEAT
		// ============================================
		await tryCatch(mainGhost, 'Creator Heatmap', async () => {
			saveTemporalSnapshot('Creator Heatmap')
			await mainGhost.click('a[href="/creator"]')
			await mainGhost.wait(2000)
			
			// Spotlight top-level metrics
			try {
				await mainGhost.hover('[data-testid="creator-analytics-card"]', true)
				await mainGhost.wait(2000)
			} catch {}
			
			const viewAnalytics = 'button:has-text("View Step Analytics"), button:has-text("Analytics")'
			try {
				await mainGhost.hover(viewAnalytics, true)
				await mainGhost.click(viewAnalytics)
				await mainGhost.wait(2000)
				
				// Sweep heatmap bars
				const heatmapBars = '[data-testid*="heatmap-bar"], [data-testid*="step-bar"], svg rect'
				await mainGhost.hover(heatmapBars, true) // Hover first one
				await mainGhost.wait(2500) // Paced read for tooltip
			} catch {}
		})

		// ============================================
		// 5. YEAR IN COOKING BEAT
		// ============================================
		await tryCatch(mainGhost, 'Year In Cooking', async () => {
			saveTemporalSnapshot('Year In Cooking')
			// Find year in cooking entry point
			const yicLink = 'a[href*="/year-in-cooking"], a:has-text("Year in Cooking")'
			try {
				await mainGhost.click('a[href="/dashboard"], a[href="/profile"]')
				await mainGhost.wait(1000)
				await mainGhost.hover(yicLink, true)
				await mainGhost.click(yicLink)
				await mainGhost.wait(2000)
				
				// Click next to paginate
				const nextBtn = 'button:has-text("Next"), button[aria-label*="Next"]'
				await mainGhost.click(nextBtn)
				await mainGhost.wait(2000)
			} catch {}
		})

		// ============================================
		// 6. ADMIN REPORTS BEAT
		// ============================================
		await tryCatch(mainGhost, 'Admin Reports', async () => {
			saveTemporalSnapshot('Admin Reports')
			const adminLink = 'a[href="/admin/reports"], a:has-text("Admin")'
			try {
				await mainGhost.hover(adminLink, true)
				await mainGhost.click(adminLink)
				await mainGhost.wait(2000)
				
				// Resolve a report
				const resolveBtn = 'button:has-text("Resolve"), button:has-text("Action")'
				await mainGhost.hover(resolveBtn, true)
				await mainGhost.click(resolveBtn)
				await mainGhost.wait(2000)
			} catch {}
		})

		// Done!
		mainGhost.stop()
		friendGhost.stop()
		
	} catch (e: any) {
		mainGhost.log('error', `CRITICAL FAILURE. Halting Ghost Driver. Reason: ${e.message}`)
		console.error('Ghost Driver critical error', e)
		mainGhost.stop()
		friendGhost.stop()
	}
}
