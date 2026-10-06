import { fireEvent, render, screen } from '@testing-library/react'
import { GraphCanvas } from '../components/GraphCanvas'
import type { GraphData } from '../types'

jest.mock('../hooks/useForceLayout', () => ({
	useForceLayout: () => ({
		positions: new Map([
			['butter', { x: 100, y: 100 }],
			['coconut oil', { x: 200, y: 200 }],
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
