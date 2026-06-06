import { readFileSync, writeFileSync } from 'fs'

const file = new URL('./live-demo-orchestrator.mjs', import.meta.url).pathname.replace(/^\//, '')
const content = readFileSync(file, 'utf8')

// The corrupted block starts with this and ends before `const heroTimeouts`
const BAD_START = `\ttry {\n\t\tawait gotoWithAuthFallback(page, \`\${settings.baseUrl}/recipes\`, \`\${label}-recipes-index\`, 20000)`
const BAD_END_MARKER = `\tconst heroTimeouts = {`

const startIdx = content.indexOf(BAD_START)
if (startIdx === -1) {
  console.error('BAD_START not found — already patched?')
  process.exit(1)
}

const endIdx = content.indexOf(BAD_END_MARKER, startIdx)
if (endIdx === -1) {
  console.error('BAD_END_MARKER not found')
  process.exit(1)
}

console.log(`Found corrupted block at char ${startIdx}..${endIdx}`)

const GOOD_BLOCK = `\t// Navigate to /explore (the actual recipe listing page — no /recipes index exists).
\ttry {
\t\tawait gotoWithAuthFallback(page, \`\${settings.baseUrl}/explore\`, \`\${label}-recipes-index\`, 22000)
\t\t// Wait for recipe cards to render before trying to click
\t\tawait page
\t\t\t.waitForSelector(
\t\t\t\t'main a[href*="/recipes/"], a[href*="/recipes/"]',
\t\t\t\t{ timeout: 10000 },
\t\t\t)
\t\t\t.catch(() => null)
\t\tconst clickedFromExplore = await tryClickRecipeLink(
\t\t\t'main a[href*="/recipes/"], a[href*="/recipes/"]',
\t\t\t14000,
\t\t)
\t\tif (clickedFromExplore || onRecipeDetail()) {
\t\t\treturn true
\t\t}
\t\tconst navigatedByHrefOnExplore = await tryDirectRecipeHrefNavigation(\`\${label}-recipes-index\`)
\t\tif (navigatedByHrefOnExplore || onRecipeDetail()) {
\t\t\treturn true
\t\t}
\t\tconst navigatedByApiOnExplore = await tryApiBackedRecipeNavigation(\`\${label}-recipes-index\`)
\t\tif (navigatedByApiOnExplore || onRecipeDetail()) {
\t\t\treturn true
\t\t}
\t} catch {
\t\t// Continue with dashboard fallback (recipes may appear in feed).
\t}

\t// Last resort: dashboard feed may contain recipe links.
\ttry {
\t\tawait gotoWithAuthFallback(page, \`\${settings.baseUrl}/dashboard\`, \`\${label}-explore-fallback\`, 20000)
\t\tawait page
\t\t\t.waitForSelector('main a[href*="/recipes/"]', { timeout: 8000 })
\t\t\t.catch(() => null)
\t\tconst clickedFromDashboard = await tryClickRecipeLink('main a[href*="/recipes/"]', 12000)
\t\tif (clickedFromDashboard || onRecipeDetail()) {
\t\t\treturn true
\t\t}
\t\tconst navigatedByApiOnDashboard = await tryApiBackedRecipeNavigation(\`\${label}-explore\`)
\t\tif (navigatedByApiOnDashboard || onRecipeDetail()) {
\t\t\treturn true
\t\t}
\t} catch {
\t\t// Final gate below decides failure.
\t}

\t`

const fixed = content.slice(0, startIdx) + GOOD_BLOCK + content.slice(endIdx)
writeFileSync(file, fixed, 'utf8')
console.log('Fixed! File written.')
