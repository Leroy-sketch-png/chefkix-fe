import { render, screen } from '@testing-library/react'
import { MetricBarChart } from '../components/MetricBarChart'
import { getEvaluationDashboardData } from '../services/evaluationDashboardService'
import { parseEvaluationDashboardData } from '../services/evaluationDashboardSchema'

const provenance = {
	dataset: 'fixture',
	split: 'held-out',
	protocol: 'matched-v1',
	seeds: [42],
	sourceSha256: 'a'.repeat(64),
	predictionsSha256: 'b'.repeat(64),
	decision: 'rejected' as const,
	claimLimits: 'Confounded result; not accepted for deployment.',
}
it('retains status, full hashes and claim limits inside the SVG used by PNG export', () => {
	render(
		<MetricBarChart
			data={[
				{
					id: 'a',
					label: 'Rejected model',
					status: 'verified-negative',
					value: 12,
					provenance,
				},
				{ id: 'b', label: 'Pending model', status: 'pending' },
			]}
			ariaLabel='Evidence fixture'
			fileName='fixture'
			valueLabel='MRR'
		/>,
	)
	const svg = screen.getByRole('img')
	expect(svg.textContent).toContain('verified-negative')
	expect(svg.textContent).toContain(provenance.sourceSha256)
	expect(svg.textContent).toContain(provenance.predictionsSha256)
	expect(svg.textContent).toContain('Confounded result')
	expect(svg.textContent).toContain('Detailed provenance unavailable')
	expect(Number(svg.getAttribute('viewBox')?.split(' ')[3])).toBeGreaterThan(
		320,
	)
})
it('preserves complete metadata and rejects partial, invalid or duplicate-seed provenance', async () => {
	const data = await getEvaluationDashboardData()
	data.benchmarks.models[0].provenance = provenance
	expect(
		parseEvaluationDashboardData(data).benchmarks.models[0].provenance,
	).toEqual(provenance)
	for (const invalid of [
		{ ...provenance, sourceSha256: 'unknown' },
		{ ...provenance, seeds: [1, 1] },
		{ dataset: 'only' },
	]) {
		expect(() =>
			parseEvaluationDashboardData({
				...data,
				benchmarks: {
					...data.benchmarks,
					models: [{ ...data.benchmarks.models[0], provenance: invalid }],
				},
			}),
		).toThrow()
	}
})
