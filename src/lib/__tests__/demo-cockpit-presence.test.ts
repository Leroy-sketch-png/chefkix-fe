import {
	applyDemoCockpitStatus,
	type DemoCockpitPresence,
} from '@/lib/demo-cockpit-presence'

const unknown: DemoCockpitPresence = {
	activeCockpitId: null,
	status: 'UNKNOWN',
}

describe('demo cockpit presence', () => {
	it('promotes the newest active cockpit', () => {
		expect(
			applyDemoCockpitStatus(unknown, {
				cockpitId: 'new-cockpit',
				status: 'ACTIVE',
			}),
		).toEqual({
			activeCockpitId: 'new-cockpit',
			status: 'ACTIVE',
		})
	})

	it('ignores a stale cockpit teardown', () => {
		const active: DemoCockpitPresence = {
			activeCockpitId: 'new-cockpit',
			status: 'ACTIVE',
		}

		expect(
			applyDemoCockpitStatus(active, {
				cockpitId: 'old-cockpit',
				status: 'STANDBY',
			}),
		).toEqual(active)
	})

	it('releases control when the active cockpit tears down', () => {
		expect(
			applyDemoCockpitStatus(
				{
					activeCockpitId: 'active-cockpit',
					status: 'ACTIVE',
				},
				{
					cockpitId: 'active-cockpit',
					status: 'STANDBY',
				},
			),
		).toEqual({
			activeCockpitId: null,
			status: 'STANDBY',
		})
	})
})
