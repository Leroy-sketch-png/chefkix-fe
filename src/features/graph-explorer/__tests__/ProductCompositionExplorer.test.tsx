import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from '@testing-library/react'
import { GraphExplorer } from '../components/GraphExplorer'
import { useAuthStore } from '@/store/authStore'
import {
	getProductFoodComposition,
	searchProductFoods,
	PRODUCT_GRAPH_EDGES_SHA256,
	PRODUCT_GRAPH_MANIFEST_SHA256,
	PRODUCT_GRAPH_NODES_SHA256,
} from '../services/productGraphService'

jest.mock('../services/productGraphService', () => ({
	...jest.requireActual('../services/productGraphService'),
	searchProductFoods: jest.fn(),
	getProductFoodComposition: jest.fn(),
}))
jest.mock('../components/GraphCanvas', () => ({
	GraphCanvas: () => <div data-testid='legacy-graph-canvas' />,
}))

const provenance = {
	manifestSha256: PRODUCT_GRAPH_MANIFEST_SHA256,
	nodesSha256: PRODUCT_GRAPH_NODES_SHA256,
	edgesSha256: PRODUCT_GRAPH_EDGES_SHA256,
	source: 'FooDB 1.0' as const,
	releaseDate: '2020-04-07' as const,
	license: 'CC BY-NC 4.0' as const,
	scope: 'Top-255 profile scope; export-eligible edges only',
	interpretation:
		'Missing relations are unknown; presence is not quantity or substitution evidence.',
}

function food(name: string, foodId: string) {
	return { name, foodId }
}

function relation(name: string, id: string) {
	return {
		id: `foodb:1.0:compound-id:${id}`,
		name,
		predicate: 'has_compound' as const,
		presence: 'PRESENT' as const,
		contentRowSupport: 8,
		exportEligibleSupport: 8,
	}
}

function composition(
	name: string,
	id: string,
	compounds: ReturnType<typeof relation>[],
	filteredKnownRelationCount = 0,
) {
	return {
		status: compounds.length
			? ('AVAILABLE' as const)
			: ('NO_ELIGIBLE_RELATION_UNKNOWN' as const),
		provenance,
		food: { id: `foodb:1.0:food-id:${id}`, name, type: 'Food' as const },
		compounds,
		filteredKnownRelationCount,
	}
}

beforeEach(() => {
	jest.clearAllMocks()
	useAuthStore.setState({
		isAuthenticated: true,
		isHydrated: true,
		isLoading: false,
		accessToken: 'fixture-token',
	})
})

async function chooseFood(side: 'first' | 'second', name: string) {
	fireEvent.change(
		screen.getByRole('textbox', { name: `Search ${side} food` }),
		{
			target: { value: name },
		},
	)
	fireEvent.click(
		await screen.findByRole('button', { name: new RegExp(`${name}.*Choose`) }),
	)
}

it('explains the sign-in requirement before showing unusable search fields', () => {
	useAuthStore.setState({ isAuthenticated: false, accessToken: null })
	render(<GraphExplorer />)

	expect(
		screen.getByRole('heading', { name: 'Sign in to compare two foods' }),
	).toBeInTheDocument()
	expect(
		screen.getByRole('link', { name: 'Sign in to compare' }),
	).toHaveAttribute('href', '/auth/sign-in?returnTo=%2Fexplore%2Fgraph')
	expect(
		screen.queryByRole('textbox', { name: 'Search first food' }),
	).toBeNull()
	expect(searchProductFoods).not.toHaveBeenCalled()
})

it('waits for auth hydration before choosing the guest experience', () => {
	useAuthStore.setState({ isAuthenticated: false, isHydrated: false })
	render(<GraphExplorer />)

	expect(
		screen.getByRole('status', { name: 'Checking access' }),
	).toBeInTheDocument()
	expect(screen.queryByRole('link', { name: 'Sign in to compare' })).toBeNull()
	expect(
		screen.queryByRole('textbox', { name: 'Search first food' }),
	).toBeNull()

	act(() => useAuthStore.setState({ isHydrated: true }))
	expect(
		screen.getByRole('link', { name: 'Sign in to compare' }),
	).toBeInTheDocument()
})

it('turns two food selections into an honest shared-record comparison', async () => {
	jest.mocked(searchProductFoods).mockImplementation(async query => ({
		provenance,
		foods: [
			query.toLowerCase() === 'apple'
				? food('Apple', '42')
				: food('Avocado', '84'),
		],
	}))
	jest
		.mocked(getProductFoodComposition)
		.mockImplementation(async id =>
			id === '42'
				? composition('Apple', id, [
						relation('Shared record', '9'),
						relation('Apple-only record', '10'),
					])
				: composition('Avocado', id, [
						relation('Shared record', '9'),
						relation('Avocado-only record', '11'),
					]),
		)

	render(<GraphExplorer />)
	expect(
		screen.getByRole('heading', { name: 'What do two foods have in common?' }),
	).toBeInTheDocument()
	expect(
		screen.getByRole('button', { name: /Show what they share/ }),
	).toBeDisabled()
	expect(screen.queryByTestId('graph-content')).not.toBeInTheDocument()

	await chooseFood('first', 'Apple')
	await chooseFood('second', 'Avocado')
	fireEvent.click(screen.getByRole('button', { name: /Show what they share/ }))

	expect(await screen.findByText('Shared record')).toBeInTheDocument()
	expect(
		screen.getByRole('region', { name: 'Food comparison results' }),
	).toHaveTextContent(/1\s*matching compound/)
	expect(screen.getByText('Apple-only record')).not.toBeVisible()
	expect(
		screen.getByText(/which compound links appear in both source records/i),
	).toBeInTheDocument()
	expect(
		screen.getByText(/does not describe amounts, nutrition, flavor, safety/i),
	).toBeInTheDocument()
	expect(getProductFoodComposition).toHaveBeenNthCalledWith(1, '42')
	expect(getProductFoodComposition).toHaveBeenNthCalledWith(2, '84')

	act(() =>
		useAuthStore.setState({ isAuthenticated: false, accessToken: null }),
	)
	expect(
		screen.queryByRole('region', { name: 'Food comparison results' }),
	).not.toBeInTheDocument()
	expect(
		screen.getByRole('link', { name: 'Sign in to compare' }),
	).toBeInTheDocument()
})

it('keeps the compound list collapsed while showing its incompleteness warning', async () => {
	jest.mocked(searchProductFoods).mockImplementation(async query => ({
		provenance,
		foods: [food(query, query === 'Apple' ? '42' : '84')],
	}))
	jest
		.mocked(getProductFoodComposition)
		.mockImplementation(async id =>
			composition('Food', id, [relation('Shared record', '9')], 1),
		)
	render(<GraphExplorer />)
	await chooseFood('first', 'Apple')
	await chooseFood('second', 'Avocado')
	fireEvent.click(screen.getByRole('button', { name: /Show what they share/ }))

	const results = await screen.findByRole('region', {
		name: 'Food comparison results',
	})
	const browseLabel = within(results).getByText(
		'Browse 1 matching compound names',
	)
	const disclosure = browseLabel.closest('details')
	expect(disclosure).not.toHaveAttribute('open')
	expect(
		within(results).getByText(/source export withheld additional known links/i),
	).toBeVisible()
	expect(within(results).getByText('Shared record')).not.toBeVisible()

	fireEvent.click(browseLabel)
	expect(disclosure).toHaveAttribute('open')
	expect(within(results).getByText('Shared record')).toBeVisible()
})

it('separates shared and one-sided returned links and filters their names', async () => {
	jest.mocked(searchProductFoods).mockImplementation(async query => ({
		provenance,
		foods: [food(query, query === 'Apple' ? '42' : '84')],
	}))
	jest
		.mocked(getProductFoodComposition)
		.mockImplementation(async id =>
			id === '42'
				? composition('Apple', id, [
						relation('Malic acid', '9'),
						relation('Apple-listed link', '10'),
					])
				: composition('Pear', id, [
						relation('Malic acid', '9'),
						relation('Pear-listed link', '11'),
					]),
		)
	render(<GraphExplorer />)
	await chooseFood('first', 'Apple')
	await chooseFood('second', 'Pear')
	fireEvent.click(screen.getByRole('button', { name: /Show what they share/ }))

	const results = await screen.findByRole('region', {
		name: 'Food comparison results',
	})
	expect(
		within(results).getByText('In Apple’s returned list, not Pear’s'),
	).toBeInTheDocument()
	expect(
		within(results).getByText('In Pear’s returned list, not Apple’s'),
	).toBeInTheDocument()
	expect(within(results).getByText('Apple-listed link')).not.toBeVisible()
	expect(within(results).getByText('Pear-listed link')).not.toBeVisible()

	fireEvent.change(
		within(results).getByRole('searchbox', { name: 'Find a listed compound' }),
		{ target: { value: 'malic acid' } },
	)
	const sharedList = within(results).getByText(
		'Browse 1 matching compound names',
	)
	fireEvent.click(sharedList)
	expect(within(results).getByText('Malic acid')).toBeVisible()
	expect(
		within(results).getByText(/Showing 1 of 1 names matching “malic acid”/),
	).toBeVisible()
	const pearOnly = within(results).getByText(
		'Browse 1 compound listed for Pear, not Apple',
	)
	fireEvent.click(pearOnly)
	expect(
		within(results).getAllByText(
			/No listed compound name matches “malic acid”/,
		),
	).toHaveLength(2)
})

it('does not turn no shared listed links into a claim of absence', async () => {
	jest.mocked(searchProductFoods).mockImplementation(async query => ({
		provenance,
		foods: [food(query, query === 'Apple' ? '42' : '84')],
	}))
	jest
		.mocked(getProductFoodComposition)
		.mockImplementation(async id =>
			id === '42'
				? composition('Apple', id, [relation('Apple link', '1')], 2)
				: composition('Avocado', id, [relation('Avocado link', '2')]),
		)
	render(<GraphExplorer />)
	await chooseFood('first', 'Apple')
	await chooseFood('second', 'Avocado')
	fireEvent.click(screen.getByRole('button', { name: /Show what they share/ }))

	expect(
		await screen.findByText(/No compound appears in both displayed records/i),
	).toBeInTheDocument()
	expect(
		screen.getByText(/not proof the foods have nothing in common/i),
	).toBeInTheDocument()
	expect(
		screen.getByText(/export withheld additional known links/i),
	).toBeInTheDocument()
})

it('locks food choices while the comparison is loading', async () => {
	jest.mocked(searchProductFoods).mockImplementation(async query => ({
		provenance,
		foods: [food(query, query === 'Apple' ? '42' : '84')],
	}))
	let resolveFirst:
		| ((value: ReturnType<typeof composition>) => void)
		| undefined
	let resolveSecond:
		| ((value: ReturnType<typeof composition>) => void)
		| undefined
	jest.mocked(getProductFoodComposition).mockImplementation(
		id =>
			new Promise<ReturnType<typeof composition>>(resolve => {
				if (id === '42') resolveFirst = resolve
				else resolveSecond = resolve
			}),
	)
	render(<GraphExplorer />)
	await chooseFood('first', 'Apple')
	await chooseFood('second', 'Avocado')
	fireEvent.click(screen.getByRole('button', { name: /Show what they share/ }))

	const changeButtons = await screen.findAllByRole('button', { name: 'Change' })
	expect(changeButtons).toHaveLength(2)
	changeButtons.forEach(button => expect(button).toBeDisabled())
	expect(
		screen.getByRole('button', { name: 'Comparing records…' }),
	).toBeDisabled()

	resolveFirst?.(composition('Apple', '42', [relation('Shared record', '9')]))
	resolveSecond?.(
		composition('Avocado', '84', [relation('Shared record', '9')]),
	)
	expect(await screen.findByText('Shared record')).toBeInTheDocument()
})

it('explains when a selected food cannot be compared from this subset', async () => {
	jest.mocked(searchProductFoods).mockImplementation(async query => ({
		provenance,
		foods: [food(query, query === 'Apple' ? '42' : '84')],
	}))
	jest.mocked(getProductFoodComposition).mockImplementation(async id =>
		id === '42'
			? composition('Apple', id, [relation('Apple link', '1')])
			: {
					status: 'UNKNOWN_OR_OUT_OF_SCOPE' as const,
					provenance,
					food: null,
					compounds: [],
					filteredKnownRelationCount: 0,
				},
	)
	render(<GraphExplorer />)
	await chooseFood('first', 'Apple')
	await chooseFood('second', 'Avocado')
	fireEvent.click(screen.getByRole('button', { name: /Show what they share/ }))
	expect(
		await screen.findByText(
			/We can’t make this comparison from the available records/i,
		),
	).toBeInTheDocument()
	expect(
		screen.getByText(/outside the selected record scope/i),
	).toBeInTheDocument()
})

it('keeps authentication and access errors distinct', async () => {
	jest
		.mocked(searchProductFoods)
		.mockRejectedValue({ response: { status: 401 } })
	render(<GraphExplorer />)
	fireEvent.change(screen.getByRole('textbox', { name: 'Search first food' }), {
		target: { value: 'Apple' },
	})

	const alert = await screen.findByRole('alert')
	expect(alert).toHaveTextContent('Sign in to search the pinned food records.')
	expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute(
		'href',
		'/auth/sign-in?returnTo=%2Fexplore%2Fgraph',
	)
	expect(alert).not.toHaveTextContent('could not be reached')
})

it('requires two distinct selected source records', async () => {
	jest.mocked(searchProductFoods).mockResolvedValue({
		provenance,
		foods: [food('Apple', '42')],
	})
	render(<GraphExplorer />)
	await chooseFood('first', 'Apple')
	fireEvent.change(
		screen.getByRole('textbox', { name: 'Search second food' }),
		{
			target: { value: 'Apple' },
		},
	)
	expect(
		await screen.findByRole('button', { name: /Already chosen/ }),
	).toBeDisabled()
	expect(
		screen.getByRole('button', { name: /Show what they share/ }),
	).toBeDisabled()
})

it('does not expose record IDs until the source disclosure is opened', async () => {
	render(<GraphExplorer />)
	const disclosure = screen
		.getByText('Where these records come from')
		.closest('details')
	expect(disclosure).not.toHaveAttribute('open')
	expect(
		within(disclosure as HTMLElement).getByText(PRODUCT_GRAPH_MANIFEST_SHA256),
	).toBeInTheDocument()
	fireEvent.click(screen.getByText('Where these records come from'))
	await waitFor(() =>
		expect(screen.getByText(PRODUCT_GRAPH_MANIFEST_SHA256)).toBeInTheDocument(),
	)
})
