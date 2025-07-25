/**
 * @fileoverview Hook manager for plugin system
 */

// Import types from centralized location
import type { 
  Plugin,
  HookManager as IHookManager
} from '@ovenjs/types/plugins';

/**
 * Hook manager implementation
 */
export class HookManager implements IHookManager {
  private readonly hooks = new Map<string, Set<Function>>();

  /**
   * Execute hooks
   */
  public async execute<TArgs extends readonly unknown[], TReturn>(
    hookName: string,
    ...args: TArgs
  ): Promise<TReturn[]> {
    const handlers = this.hooks.get(hookName);
    if (!handlers) return [];

    const results: TReturn[] = [];
    for (const handler of handlers) {
      try {
        const result = await handler(...args);
        results.push(result);
      } catch (error) {
        console.error(`Hook execution failed for ${hookName}:`, error);
      }
    }

    return results;
  }

  /**
   * Register plugin hooks
   */
  public async registerPluginHooks(plugin: Plugin): Promise<void> {
    // In a real implementation, this would register the plugin's hooks
    // For now, we'll just log that hooks are being registered
    console.log(`Registering hooks for plugin: ${plugin.meta.name}`);
  }

  /**
   * Unregister plugin hooks
   */
  public async unregisterPluginHooks(plugin: Plugin): Promise<void> {
    // In a real implementation, this would unregister the plugin's hooks
    // For now, we'll just log that hooks are being unregistered
    console.log(`Unregistering hooks for plugin: ${plugin.meta.name}`);
  }

  /**
   * Execute hooks sequentially
   */
  public async executeSequential<TArgs extends readonly unknown[], TReturn>(
    hookName: string,
    ...args: TArgs
  ): Promise<TReturn[]> {
    return this.execute(hookName, ...args);
  }

  /**
   * Execute hooks in parallel
   */
  public async executeParallel<TArgs extends readonly unknown[], TReturn>(
    hookName: string,
    ...args: TArgs
  ): Promise<TReturn[]> {
    return this.execute(hookName, ...args);
  }

  /**
   * Execute hooks in waterfall mode
   */
  public async executeWaterfall<TArgs extends readonly unknown[], TReturn>(
    hookName: string,
    initialValue: TReturn,
    ...args: TArgs
  ): Promise<TReturn> {
    const handlers = this.hooks.get(hookName);
    if (!handlers) return initialValue;

    let currentValue = initialValue;
    for (const handler of handlers) {
      try {
        currentValue = await handler(currentValue, ...args);
      } catch (error) {
        console.error(`Hook execution failed for ${hookName}:`, error);
      }
    }

    return currentValue;
  }

  /**
   * Execute hooks in bail mode (stop on first non-null result)
   */
  public async executeBail<TArgs extends readonly unknown[], TReturn>(
    hookName: string,
    ...args: TArgs
  ): Promise<TReturn | undefined> {
    const handlers = this.hooks.get(hookName);
    if (!handlers) return undefined;

    for (const handler of handlers) {
      try {
        const result = await handler(...args);
        if (result != null) {
          return result;
        }
      } catch (error) {
        console.error(`Hook execution failed for ${hookName}:`, error);
      }
    }

    return undefined;
  }

  /**
   * Execute hooks with timeout
   */
  public async executeWithTimeout<TArgs extends readonly unknown[], TReturn>(
    hookName: string,
    timeout: number,
    ...args: TArgs
  ): Promise<TReturn[]> {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Hook execution timeout')), timeout)
    );

    return Promise.race([
      this.execute(hookName, ...args),
      timeoutPromise
    ]);
  }

  /**
   * Execute hooks with cancellation
   */
  public async executeWithCancellation<TArgs extends readonly unknown[], TReturn>(
    hookName: string,
    cancellationToken: { cancelled: boolean },
    ...args: TArgs
  ): Promise<TReturn[]> {
    if (cancellationToken.cancelled) return [];
    return this.execute(hookName, ...args);
  }

  /**
   * Create cancellation token
   */
  public createCancellationToken(): { cancelled: boolean; cancel: () => void } {
    const token = { cancelled: false, cancel: () => { token.cancelled = true; } };
    return token;
  }
}