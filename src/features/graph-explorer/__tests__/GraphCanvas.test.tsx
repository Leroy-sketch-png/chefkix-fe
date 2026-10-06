import { fireEvent, render, screen } from '@testing-library/react'
import { GraphCanvas } from '../components/GraphCanvas'
import type { GraphData } from '../types'

jest.mock('../hooks/useForceLayout', () => ({
	useForceLayout: () => ({
		positions: new Map([
			['butter', { x: 100, y: 100 }],
			['coconut oil', { x: 200, y: 200 }],
			['ginger', { x: 300, y: 300 }],
		]),
		dragNode: jest.fn(),
		pinNode: jest.fn(),
	}),
}))

it('opens graph nodes and edges from the keyboard', () => {
	const data: GraphData = {
		nodes: [
			{
				id: 'butter',
				name: 'Butter',
				category: 'fat',
				allergenFlags: ['milk'],
			},
			{
				id: 'coconut oil',
				name: 'Coconut Oil',
				category: 'fat',
				allergenFlags: [],
			},
			{
				id: 'ginger',
				name: 'Ginger',
				category: 'produce',
				allergenFlags: [],
			},
		],
		edges: [
			{
				source: 'butter',
				target: 'coconut oil',
				type: 'substitution',
				substitutionRatio: 0.75,
			},
		],
	}
	const onNodeSelect = jest.fn()
	const onEdgeSelect = jest.fn()
	render(
		<GraphCanvas
			data={data}
			query=''
			signals={['substitution']}
			searchPosition={0}
			searchMatchCount={0}
			onNodeSelect={onNodeSelect}
			onEdgeSelect={onEdgeSelect}
		/>,
	)

	fireEvent.keyDown(screen.getByRole('button', { name: 'Explore Butter' }), {
		key: 'Enter',
	})
	expect(onNodeSelect).toHaveBeenCalledWith('butter')
	expect(screen.getByLabelText('Ingredient details')).toBeTruthy()
	expect(screen.queryByRole('button', { name: 'Explore Ginger' })).toBeNull()
	expect(
		screen.getByRole('button', { name: 'Ginger No link yet' }),
	).toBeTruthy()

	fireEvent.keyDown(
		screen.getByRole('button', {
			name: 'View Butter to Coconut Oil relationship',
		}),
		{ key: ' ' },
	)
	expect(onEdgeSelect).toHaveBeenCalledWith(data.edges[0])
	expect(screen.getByLabelText('Relationship details')).toBeTruthy()
})

it('centers a searched ingredient even when it has no documented link', () => {
	const data: GraphData = {
		nodes: [
			{ id: 'ginger', name: 'Ginger', category: 'produce', allergenFlags: [] },
			{ id: 'butter', name: 'Butter', category: 'dairy', allergenFlags: [] },
			{
				id: 'coconut oil',
				name: 'Coconut Oil',
				category: 'oil',
				allergenFlags: [],
			},
		],
		edges: [{ source: 'butter', target: 'coconut oil', type: 'substitution' }],
	}
	render(
		<GraphCanvas
			data={data}
			query='ginger'
			signals={['substitution']}
			searchTargetId='ginger'
			searchPosition={1}
			searchMatchCount={1}
		/>,
	)
	expect(screen.getByRole('button', { name: 'Explore Ginger' })).toBeTruthy()
	expect(screen.queryByRole('button', { name: 'Explore Butter' })).toBeNull()
	const graph = screen.getByRole('img', {
		name: 'Ingredient force-directed knowledge graph',
	})
	const [x, y, width, height] = graph
		.getAttribute('viewBox')!
		.split(' ')
		.map(Number)
	expect(x + width / 2).toBeCloseTo(300)
	expect(y + height / 2).toBeCloseTo(300)
	fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }))
	expect(Number(graph.getAttribute('viewBox')!.split(' ')[2])).toBeLessThan(
		width,
	)
	expect(screen.getByLabelText('Ingredient details')).toHaveTextContent(
		'Ginger',
	)
})
