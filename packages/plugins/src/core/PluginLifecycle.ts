/**
 * @fileoverview Plugin lifecycle management system
 */

// Re-export types from the central type definitions
export type {
  PluginLifecycleState,
  PluginHooks,
  PluginLifecycle,
  PluginTransition,
  HealthCheckResult,
  HealthCheck,
  PluginLifecycleManager
} from '@ovenjs/types/plugins';

import type {
  PluginContext,
  PluginLifecycleState,
  PluginHooks,
  PluginLifecycle,
  PluginTransition,
  HealthCheckResult,
  PluginLifecycleManager as IPluginLifecycleManager
} from '@ovenjs/types/plugins';

import { PluginLifecycleState } from '@ovenjs/types/plugins';

/**
 * Plugin lifecycle manager implementation
 */
export class PluginLifecycleManager implements IPluginLifecycleManager {
  private readonly states = new Map<string, PluginLifecycleState>();
  private readonly transitions = new Map<string, PluginLifecycleState[]>();
  private readonly hooks = new Map<string, PluginHooks>();

  constructor() {
    this.initializeTransitions();
  }

  /**
   * Register plugin lifecycle hooks
   */
  public registerHooks(pluginName: string, hooks: PluginHooks): void {
    this.hooks.set(pluginName, hooks);
    this.states.set(pluginName, PluginLifecycleState.UNLOADED);
  }

  /**
   * Unregister plugin lifecycle hooks
   */
  public unregisterHooks(pluginName: string): void {
    this.hooks.delete(pluginName);
    this.states.delete(pluginName);
    this.transitions.delete(pluginName);
  }

  /**
   * Get current plugin state
   */
  public getState(pluginName: string): PluginLifecycleState {
    return this.states.get(pluginName) || PluginLifecycleState.UNLOADED;
  }

  /**
   * Transition plugin to new state
   */
  public async transition(
    pluginName: string,
    newState: PluginLifecycleState,
    context: PluginContext
  ): Promise<void> {
    const currentState = this.getState(pluginName);
    
    if (!this.canTransition(pluginName, currentState, newState)) {
      throw new Error(`Invalid transition from ${currentState} to ${newState} for plugin ${pluginName}`);
    }

    this.states.set(pluginName, newState);
    
    // Execute lifecycle hooks
    await this.executeHooks(pluginName, newState, context);
  }

  /**
   * Check if transition is valid
   */
  public canTransition(
    pluginName: string,
    from: PluginLifecycleState,
    to: PluginLifecycleState
  ): boolean {
    const validTransitions = this.getValidTransitions(from);
    return validTransitions.includes(to);
  }

  /**
   * Get valid transitions from current state
   */
  private getValidTransitions(currentState: PluginLifecycleState): PluginLifecycleState[] {
    switch (currentState) {
      case PluginLifecycleState.UNLOADED:
        return [PluginLifecycleState.LOADING];
      
      case PluginLifecycleState.LOADING:
        return [PluginLifecycleState.LOADED, PluginLifecycleState.ERROR];
      
      case PluginLifecycleState.LOADED:
        return [PluginLifecycleState.INITIALIZING, PluginLifecycleState.DESTROYING];
      
      case PluginLifecycleState.INITIALIZING:
        return [PluginLifecycleState.INITIALIZED, PluginLifecycleState.ERROR];
      
      case PluginLifecycleState.INITIALIZED:
        return [PluginLifecycleState.RUNNING, PluginLifecycleState.STOPPING];
      
      case PluginLifecycleState.RUNNING:
        return [PluginLifecycleState.STOPPING, PluginLifecycleState.ERROR];
      
      case PluginLifecycleState.STOPPING:
        return [PluginLifecycleState.STOPPED, PluginLifecycleState.ERROR];
      
      case PluginLifecycleState.STOPPED:
        return [PluginLifecycleState.DESTROYING, PluginLifecycleState.INITIALIZING];
      
      case PluginLifecycleState.ERROR:
        return [PluginLifecycleState.DESTROYING, PluginLifecycleState.LOADING];
      
      case PluginLifecycleState.DESTROYING:
        return [PluginLifecycleState.DESTROYED, PluginLifecycleState.ERROR];
      
      case PluginLifecycleState.DESTROYED:
        return [PluginLifecycleState.UNLOADED];
      
      default:
        return [];
    }
  }

  /**
   * Execute lifecycle hooks for state transition
   */
  private async executeHooks(
    pluginName: string,
    newState: PluginLifecycleState,
    context: PluginContext
  ): Promise<void> {
    const hooks = this.hooks.get(pluginName);
    if (!hooks) return;

    try {
      switch (newState) {
        case PluginLifecycleState.LOADED:
          await hooks.afterLoad?.(context);
          break;
        
        case PluginLifecycleState.INITIALIZING:
          await hooks.beforeLoad?.(context);
          break;
        
        case PluginLifecycleState.STOPPING:
          await hooks.beforeUnload?.(context);
          break;
        
        case PluginLifecycleState.DESTROYED:
          await hooks.afterUnload?.(context);
          break;
      }
    } catch (error) {
      this.states.set(pluginName, PluginLifecycleState.ERROR);
      await hooks.onError?.(error as Error, context);
      throw error;
    }
  }

  /**
   * Initialize state transitions
   */
  private initializeTransitions(): void {
    // This method can be used to set up custom transition rules
    // For now, we use the getValidTransitions method
  }

  /**
   * Handle config change for plugin
   */
  public async handleConfigChange(
    pluginName: string,
    newConfig: unknown,
    oldConfig: unknown,
    context: PluginContext
  ): Promise<void> {
    const hooks = this.hooks.get(pluginName);
    if (!hooks?.onConfigChange) return;

    try {
      await hooks.onConfigChange(newConfig, oldConfig, context);
    } catch (error) {
      this.states.set(pluginName, PluginLifecycleState.ERROR);
      await hooks.onError?.(error as Error, context);
      throw error;
    }
  }

  /**
   * Get all plugin states
   */
  public getAllStates(): Map<string, PluginLifecycleState> {
    return new Map(this.states);
  }

  /**
   * Get plugins in specific state
   */
  public getPluginsInState(state: PluginLifecycleState): string[] {
    return Array.from(this.states.entries())
      .filter(([, pluginState]) => pluginState === state)
      .map(([pluginName]) => pluginName);
  }

  /**
   * Check if plugin is in running state
   */
  public isRunning(pluginName: string): boolean {
    return this.getState(pluginName) === PluginLifecycleState.RUNNING;
  }

  /**
   * Check if plugin is in error state
   */
  public hasError(pluginName: string): boolean {
    return this.getState(pluginName) === PluginLifecycleState.ERROR;
  }

  /**
   * Reset plugin state to unloaded
   */
  public resetState(pluginName: string): void {
    this.states.set(pluginName, PluginLifecycleState.UNLOADED);
  }

  /**
   * Clear all states
   */
  public clearAll(): void {
    this.states.clear();
    this.transitions.clear();
    this.hooks.clear();
  }
}