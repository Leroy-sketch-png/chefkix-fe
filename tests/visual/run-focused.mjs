import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const __filename = fileURLToPath(import.meta.url)
const VISUAL_DIR = path.dirname(__filename)
const FE_ROOT = path.resolve(VISUAL_DIR, '..', '..')
const PLAYWRIGHT_CLI = require.resolve('@playwright/test/cli')
const VALID_STATES = new Set(['default', 'empty', 'loading', 'error', 'guest'])

function hasEnvKey(name) {
	return Object.prototype.hasOwnProperty.call(process.env, name)
}

function isTruthyEnv(value) {
	if (typeof value !== 'string') return false
	const normalized = value.trim().toLowerCase()
	return normalized === 'true' || normalized === '1' || normalized === 'yes'
}

function readFlagEnv(value) {
	if (typeof value !== 'string') return null
	const normalized = value.trim().toLowerCase()
	if (normalized.length === 0) {
		return false
	}
	if (normalized === 'true' || normalized === '1' || normalized === 'yes') {
		return true
	}
	if (normalized === 'false' || normalized === '0' || normalized === 'no') {
		return false
	}
	return null
}

function readNpmConfigFallback() {
	const gotoTimeoutKey = hasEnvKey('npm_config_goto_timeout')
		? 'npm_config_goto_timeout'
		: hasEnvKey('npm_config_gototimeout')
			? 'npm_config_gototimeout'
			: null
	const buildAiReviewKey = hasEnvKey('npm_config_build_ai_review')
		? 'npm_config_build_ai_review'
		: hasEnvKey('npm_config_buildaireview')
			? 'npm_config_buildaireview'
			: null

	return {
		desktop: readFlagEnv(process.env.npm_config_desktop),
		mobile: readFlagEnv(process.env.npm_config_mobile),
		prepare: readFlagEnv(process.env.npm_config_prepare),
		prepareProvided: hasEnvKey('npm_config_prepare'),
		warm: readFlagEnv(process.env.npm_config_warm),
		noWarm: isTruthyEnv(process.env.npm_config_no_warm),
		noPrepare: isTruthyEnv(process.env.npm_config_no_prepare),
		noPrepareProvided: hasEnvKey('npm_config_no_prepare'),
		gotoTimeout: gotoTimeoutKey ? (process.env[gotoTimeoutKey] ?? null) : null,
		gotoTimeoutProvided: gotoTimeoutKey !== null,
		buildAiReview: buildAiReviewKey
			? (process.env[buildAiReviewKey] ?? null)
			: null,
		buildAiReviewProvided: buildAiReviewKey !== null,
	}
}

function getRawCliArgs() {
	const directArgs = process.argv.slice(2)
	const npmArgvRaw = process.env.npm_config_argv
	if (typeof npmArgvRaw !== 'string' || npmArgvRaw.trim().length === 0) {
		return directArgs
	}

	try {
		const parsed = JSON.parse(npmArgvRaw)
		const original = Array.isArray(parsed?.original) ? parsed.original : []
		const markerIndex = original.indexOf('--')
		if (markerIndex >= 0) {
			const forwardedArgs = original.slice(markerIndex + 1)
			if (forwardedArgs.length > 0) {
				return forwardedArgs
			}
		}
	} catch {
		// Fall back to process.argv when npm_config_argv is absent or malformed.
	}

	return directArgs
}

function printUsage() {
	console.log(`Usage:
  npm run visual:focus -- --route dashboard
  npm run visual:focus -- --route dashboard --route feed --state default --desktop --mobile
  npm run visual:focus -- --routes explore,feed --states guest,default --desktop
	  npm run visual:focus -- dashboard default

Options:
  --route <name>           Repeatable route name from visual-runner.spec.ts
  --routes <a,b,c>         Comma-separated route names
  --state <name>           Repeatable visual state (default, empty, loading, error, guest)
  --states <a,b,c>         Comma-separated states
  --desktop                Include desktop-chrome project (default if no device chosen)
  --mobile                 Include mobile-iphone project
	--warm                   Force route prewarm before capture
	--no-warm                Disable route prewarm before capture
  --no-prepare             Skip tests/visual/prepare-run.mjs
  --goto-timeout <ms>      Override VISUAL_GOTO_TIMEOUT (default 240000)
  --build-ai-review <0|1>  Override VISUAL_BUILD_AI_REVIEW (default 0)
`)
}

function pushCsvValues(target, rawValue) {
	for (const part of rawValue.split(',')) {
		const value = part.trim()
		if (value) {
			target.push(value)
		}
	}
}

function sanitizeRouteArgs(routes) {
	return routes.filter(
		route => !/^(true|false)$/i.test(route) && !/^\d+$/.test(route),
	)
}

function isConcreteOptionValue(value) {
	return (
		typeof value === 'string' &&
		value.trim().length > 0 &&
		!/^(true|false)$/i.test(value)
	)
}

function parseArgs(argv) {
	const routes = []
	const states = []
	const projects = []
	const orphanValues = []
	let shouldPrepare = true
	let warmMode = 'auto'
	let gotoTimeout = '240000'
	let buildAiReview = '0'

	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index]

		if (arg.startsWith('--route=')) {
			pushCsvValues(routes, arg.slice('--route='.length))
			continue
		}

		if (arg.startsWith('--routes=')) {
			pushCsvValues(routes, arg.slice('--routes='.length))
			continue
		}

		if (arg.startsWith('--state=')) {
			pushCsvValues(states, arg.slice('--state='.length))
			continue
		}

		if (arg.startsWith('--states=')) {
			pushCsvValues(states, arg.slice('--states='.length))
			continue
		}

		if (arg.startsWith('--goto-timeout=')) {
			gotoTimeout = arg.slice('--goto-timeout='.length)
			continue
		}

		if (arg.startsWith('--build-ai-review=')) {
			buildAiReview = arg.slice('--build-ai-review='.length)
			continue
		}

		if (arg === '--help' || arg === '-h') {
			return { help: true }
		}

		if (arg === '--route' || arg === '--routes') {
			const value = argv[index + 1]
			if (!value) {
				throw new Error(`${arg} requires a value`)
			}
			pushCsvValues(routes, value)
			index += 1
			continue
		}

		if (arg === '--state' || arg === '--states') {
			const value = argv[index + 1]
			if (!value) {
				throw new Error(`${arg} requires a value`)
			}
			pushCsvValues(states, value)
			index += 1
			continue
		}

		if (arg === '--desktop') {
			projects.push('desktop-chrome')
			continue
		}

		if (arg === '--mobile') {
			projects.push('mobile-iphone')
			continue
		}

		if (arg === '--no-prepare') {
			shouldPrepare = false
			continue
		}

		if (arg === '--warm') {
			warmMode = 'on'
			continue
		}

		if (arg === '--no-warm') {
			warmMode = 'off'
			continue
		}

		if (arg === '--goto-timeout') {
			const value = argv[index + 1]
			if (!value) {
				throw new Error('--goto-timeout requires a value')
			}
			gotoTimeout = value
			index += 1
			continue
		}

		if (arg === '--build-ai-review') {
			const value = argv[index + 1]
			if (!value) {
				throw new Error('--build-ai-review requires a value')
			}
			buildAiReview = value
			index += 1
			continue
		}

		if (arg.startsWith('--')) {
			throw new Error(`Unknown option: ${arg}`)
		}

		if (VALID_STATES.has(arg)) {
			states.push(arg)
			continue
		}

		if (arg === 'desktop') {
			projects.push('desktop-chrome')
			continue
		}

		if (arg === 'mobile') {
			projects.push('mobile-iphone')
			continue
		}

		if (/^\d+$/.test(arg)) {
			orphanValues.push(arg)
			continue
		}

		routes.push(arg)
	}

	return {
		routes: [...new Set(sanitizeRouteArgs(routes))],
		states: [...new Set(states)],
		projects: [...new Set(projects)],
		orphanValues,
		shouldPrepare,
		warmMode,
		gotoTimeout,
		buildAiReview,
		help: false,
	}
}

function mergeFallbacks(parsed) {
	const fallback = readNpmConfigFallback()
	const mergedProjects = [...parsed.projects]
	if (fallback.desktop === true) {
		mergedProjects.push('desktop-chrome')
	}
	if (fallback.mobile === true) {
		mergedProjects.push('mobile-iphone')
	}

	const orphanValues = [...(parsed.orphanValues ?? [])]
	const derivedGotoTimeout =
		fallback.gotoTimeoutProvided &&
		!isConcreteOptionValue(fallback.gotoTimeout) &&
		orphanValues.length > 0
			? (orphanValues.shift() ?? null)
			: null
	const derivedBuildAiReview =
		fallback.buildAiReviewProvided &&
		!isConcreteOptionValue(fallback.buildAiReview) &&
		orphanValues.length > 0
			? (orphanValues.shift() ?? null)
			: null
	const heuristicGotoTimeout =
		!derivedGotoTimeout &&
		!derivedBuildAiReview &&
		orphanValues.length === 1 &&
		parsed.gotoTimeout === '240000'
			? orphanValues[0]
			: null

	let mergedWarmMode = parsed.warmMode
	if (fallback.noWarm) {
		mergedWarmMode = 'off'
	} else if (fallback.warm === false) {
		mergedWarmMode = 'off'
	} else if (fallback.warm === true) {
		mergedWarmMode = 'on'
	}

	return {
		...parsed,
		routes: [...new Set(sanitizeRouteArgs(parsed.routes))],
		states: [
			...new Set(parsed.states.filter(state => VALID_STATES.has(state))),
		],
		projects: [...new Set(mergedProjects)],
		shouldPrepare:
			fallback.noPrepare ||
			fallback.noPrepareProvided ||
			fallback.prepare === false ||
			(fallback.prepareProvided && fallback.prepare !== true)
				? false
				: parsed.shouldPrepare,
		warmMode: mergedWarmMode,
		gotoTimeout: isConcreteOptionValue(fallback.gotoTimeout)
			? fallback.gotoTimeout
			: derivedGotoTimeout
				? derivedGotoTimeout
				: heuristicGotoTimeout
					? heuristicGotoTimeout
					: parsed.gotoTimeout,
		buildAiReview: isConcreteOptionValue(fallback.buildAiReview)
			? fallback.buildAiReview
			: derivedBuildAiReview
				? derivedBuildAiReview
				: parsed.buildAiReview,
	}
}

function escapeRegex(text) {
	return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function buildGrepPattern(routes, states) {
	return routes
		.flatMap(route =>
			states.map(state => `${escapeRegex(route)} \\[${escapeRegex(state)}\\]`),
		)
		.join('|')
}

function runCommand(command, args, options) {
	const result = spawnSync(command, args, {
		stdio: 'inherit',
		cwd: FE_ROOT,
		shell: process.platform === 'win32' && /\.cmd$/i.test(command),
		...options,
	})

	if (typeof result.status === 'number') {
		return result.status
	}

	if (result.error) {
		throw result.error
	}

	return 1
}

function main() {
	let parsed
	try {
		parsed = parseArgs(getRawCliArgs())
	} catch (error) {
		console.error(`[visual:focus] ${error.message}`)
		printUsage()
		process.exit(1)
	}

	if (parsed.help) {
		printUsage()
		return
	}

	parsed = mergeFallbacks(parsed)
	if (parsed.states.length === 0) {
		parsed.states = ['default']
	}
	if (parsed.projects.length === 0) {
		parsed.projects = ['desktop-chrome']
	}

	if (!parsed.routes || parsed.routes.length === 0) {
		console.error('[visual:focus] At least one route is required.')
		printUsage()
		process.exit(1)
	}

	const grepPattern = buildGrepPattern(parsed.routes, parsed.states)
	const env = {
		...process.env,
		VISUAL_BUILD_AI_REVIEW: parsed.buildAiReview,
		VISUAL_GOTO_TIMEOUT: parsed.gotoTimeout,
		VISUAL_WARM_ROUTES:
			parsed.warmMode === 'on'
				? '1'
				: parsed.warmMode === 'off'
					? '0'
					: parsed.routes.length > 1
						? '1'
						: (process.env.VISUAL_WARM_ROUTES ?? '0'),
	}

	console.log(
		`[visual:focus] routes=${parsed.routes.join(',')} states=${parsed.states.join(',')} projects=${parsed.projects.join(',')} warm=${env.VISUAL_WARM_ROUTES} prepare=${parsed.shouldPrepare ? '1' : '0'} gotoTimeout=${parsed.gotoTimeout}`,
	)
	console.log(`[visual:focus] grep=${grepPattern}`)

	if (parsed.shouldPrepare) {
		const prepareExitCode = runCommand(
			process.execPath,
			['tests/visual/prepare-run.mjs'],
			{
				env,
			},
		)
		if (prepareExitCode !== 0) {
			process.exit(prepareExitCode)
		}
	}

	const playwrightArgs = [
		PLAYWRIGHT_CLI,
		'test',
		'tests/visual/visual-runner.spec.ts',
		'--config=playwright.config.ts',
		...parsed.projects.map(project => `--project=${project}`),
		'--grep',
		grepPattern,
	]

	const exitCode = runCommand(process.execPath, playwrightArgs, { env })
	process.exit(exitCode)
}

main()
