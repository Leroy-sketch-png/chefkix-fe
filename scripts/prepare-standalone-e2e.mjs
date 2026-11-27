import { cp, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const root = process.cwd()
const standaloneRoot = resolve(root, '.next', 'standalone')

const assets = [
	[resolve(root, 'public'), resolve(standaloneRoot, 'public')],
	[
		resolve(root, '.next', 'static'),
		resolve(standaloneRoot, '.next', 'static'),
	],
]

for (const [source, destination] of assets) {
	await mkdir(dirname(destination), { recursive: true })
	await cp(source, destination, { recursive: true, force: true })
}
