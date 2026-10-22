import { readFileSync } from 'node:fs'
import { join } from 'node:path'

it('serves the same current evaluation records through public JSON and the dashboard', () => {
	for (const name of [
		'benchmark_results.json',
		'ablation_results.json',
		'allergen_benchmark.json',
	]) {
		const read = (path: string) =>
			JSON.parse(readFileSync(join(process.cwd(), path, name), 'utf8'))
		expect(read('public/data')).toEqual(
			read('src/features/evaluation-dashboard/data'),
		)
	}
})
