export type DemoInjectionEvent = 
  | { type: 'FORCE_LEVEL_UP'; data: { oldLevel: number, newLevel: number, xp: number } }
  | { type: 'AI_OVERRIDE'; data: { text: string } }
  | { type: 'CO_COOK_SYNC'; data: { userId: string, action: string, step?: number } }
  | { type: 'LASER_FOCUS'; data: { selector: string } }
  | { type: 'TIME_WARP'; data: { enabled: boolean } }

type InjectorCallback = (event: DemoInjectionEvent) => void;

class DemoInjector {
  private listeners: Set<InjectorCallback> = new Set();
  
  public timeWarpActive = false;

  subscribe(callback: InjectorCallback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  dispatch(event: DemoInjectionEvent) {
    if (event.type === 'TIME_WARP') {
      this.timeWarpActive = event.data.enabled;
    }
    this.listeners.forEach(cb => cb(event));
  }

  // Extreme Cheat Methods
  triggerLevelUp(oldLevel = 4, newLevel = 5, xp = 5000) {
    this.dispatch({ type: 'FORCE_LEVEL_UP', data: { oldLevel, newLevel, xp } });
  }

  injectAiResponse(text = "Yes, you can substitute butter for olive oil in a 1:1 ratio. The flavor will be richer.") {
    this.dispatch({ type: 'AI_OVERRIDE', data: { text } });
  }

  simulateCoCookFriend(action = "check-ingredient") {
    this.dispatch({ type: 'CO_COOK_SYNC', data: { userId: 'mock-friend', action } });
  }

  toggleTimeWarp(enabled: boolean) {
    this.dispatch({ type: 'TIME_WARP', data: { enabled } });
  }
}

// Global singleton
export const demoInjector = typeof window !== 'undefined' 
  ? ((window as any).__DEMO_INJECTOR = (window as any).__DEMO_INJECTOR || new DemoInjector())
  : new DemoInjector();
