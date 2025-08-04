/**
 * Enhanced EventEmitter with performance optimizations
 * 
 * This module provides a high-performance event emitter implementation with
 * support for priority-based listeners, wildcards, and performance monitoring.
 */

import { PerformanceMonitor } from '../performance/PerformanceMonitor';

/**
 * Event listener metadata
 */
export interface EventListenerMetadata {
	/** Listener function */
	listener: (...args: any[]) => void | Promise<void>;
	/** Execution priority (higher numbers = higher priority) */
	priority: number;
	/** Whether the listener should only be called once */
	once: boolean;
	/** Maximum number of times this listener can be called */
	maxCalls?: number;
	/** Current call count */
	callCount: number;
	/** Whether the listener is paused */
	paused: boolean;
	/** Timestamp when the listener was added */
	addedAt: number;
	/** Timestamp of the last execution */
	lastExecutedAt?: number;
	/** Total execution time in milliseconds */
	totalExecutionTime: number;
	/** Average execution time in milliseconds */
	averageExecutionTime: number;
}

/**
 * Event statistics
 */
export interface EventStatistics {
	/** Total number of times the event has been emitted */
	emitCount: number;
	/** Total number of listeners called */
	listenerCallCount: number;
	/** Total execution time for all listeners in milliseconds */
	totalExecutionTime: number;
	/** Average execution time per listener call in milliseconds */
	averageExecutionTime: number;
	/** Maximum execution time for a single listener call in milliseconds */
	maxExecutionTime: number;
	/** Minimum execution time for a single listener call in milliseconds */
	minExecutionTime: number;
	/** Timestamp of the last emission */
	lastEmittedAt?: number;
	/** Number of active listeners */
	activeListenerCount: number;
}

/**
 * Event options
 */
export interface EventOptions {
	/** Maximum number of listeners for this event (default: 10) */
	maxListeners?: number;
	/** Whether to enable performance monitoring for this event */
	monitorPerformance?: boolean;
	/** Whether to warn when exceeding max listeners */
	warnOnMaxListeners?: boolean;
	/** Whether to throw when exceeding max listeners */
	throwOnMaxListeners?: boolean;
}

/**
 * Wildcard event pattern
 */
export interface WildcardPattern {
	/** The pattern string (e.g., 'user.*.created') */
	pattern: string;
	/** The parsed segments */
	segments: string[];
	/** Whether this is a wildcard pattern */
	isWildcard: boolean;
}

/**
 * Enhanced EventEmitter with performance optimizations
 */
export class EventEmitter {
	/** Event listeners storage */
	private eventListeners: Map<string, EventListenerMetadata[]> = new Map();
	
	/** Wildcard patterns storage */
	private wildcards: WildcardPattern[] = [];
	
	/** Event statistics storage */
	private statistics: Map<string, EventStatistics> = new Map();
	
	/** Event options storage */
	private options: Map<string, EventOptions> = new Map();
	
	/** Performance monitor instance */
	protected performanceMonitor: PerformanceMonitor;
	
	/** Global event options */
	private globalOptions: EventOptions = {
		maxListeners: 10,
		monitorPerformance: true,
		warnOnMaxListeners: true,
		throwOnMaxListeners: false,
	};
	
	/** Event aliases */
	private aliases: Map<string, string[]> = new Map();
	
	/** Default maximum listeners */
	private defaultMaxListeners = 10;
	
	constructor(performanceMonitor?: PerformanceMonitor) {
		this.performanceMonitor = performanceMonitor || new PerformanceMonitor();
	}
	
	/**
	 * Add an event listener
	 * @param event Event name
	 * @param listener Listener function
	 * @param options Listener options
	 */
	on(event: string, listener: (...args: any[]) => void | Promise<void>, options: {
		priority?: number;
		once?: boolean;
		maxCalls?: number;
	} = {}): this {
		const { priority = 0, once = false, maxCalls } = options;
		
		// Get or create listeners array
		let listeners = this.eventListeners.get(event);
		if (!listeners) {
			listeners = [];
			this.eventListeners.set(event, listeners);
		}
		
		// Check max listeners
		const eventOptions = this.getEventOptions(event);
		if (listeners.length >= (eventOptions.maxListeners || this.defaultMaxListeners)) {
			if (eventOptions.throwOnMaxListeners) {
				throw new Error(`Max listeners (${eventOptions.maxListeners || this.defaultMaxListeners}) exceeded for event: ${event}`);
			} else if (eventOptions.warnOnMaxListeners) {
				// eslint-disable-next-line no-console
				console.warn(`Max listeners (${eventOptions.maxListeners || this.defaultMaxListeners}) exceeded for event: ${event}`);
			}
		}
		
		// Create listener metadata
		const metadata: EventListenerMetadata = {
			listener,
			priority,
			once,
			maxCalls,
			callCount: 0,
			paused: false,
			addedAt: Date.now(),
			totalExecutionTime: 0,
			averageExecutionTime: 0,
		};
		
		// Add listener and sort by priority
		listeners.push(metadata);
		this.sortListeners(listeners);
		
		// Initialize statistics if monitoring is enabled
		if (eventOptions.monitorPerformance) {
			this.initializeStatistics(event);
		}
		
		// Check if this is a wildcard pattern
		if (event.includes('*')) {
			this.addWildcardPattern(event);
		}
		
		return this;
	}
	
	/**
	 * Add a one-time event listener
	 * @param event Event name
	 * @param listener Listener function
	 * @param options Listener options
	 */
	once(event: string, listener: (...args: any[]) => void | Promise<void>, options: {
		priority?: number;
	} = {}): this {
		return this.on(event, listener, { ...options, once: true });
	}
	
	/**
	 * Add a listener with high priority
	 * @param event Event name
	 * @param listener Listener function
	 * @param options Listener options
	 */
	prependListener(event: string, listener: (...args: any[]) => void | Promise<void>, options: {
		once?: boolean;
		maxCalls?: number;
	} = {}): this {
		return this.on(event, listener, { ...options, priority: 100 });
	}
	
	/**
	 * Add a one-time listener with high priority
	 * @param event Event name
	 * @param listener Listener function
	 */
	prependOnceListener(event: string, listener: (...args: any[]) => void | Promise<void>): this {
		return this.on(event, listener, { priority: 100, once: true });
	}
	
	/**
	 * Remove an event listener
	 * @param event Event name
	 * @param listener Listener function
	 */
	off(event: string, listener: (...args: any[]) => void | Promise<void>): this {
		const listeners = this.eventListeners.get(event);
		if (listeners) {
			const index = listeners.findIndex(l => l.listener === listener);
			if (index !== -1) {
				listeners.splice(index, 1);
				if (listeners.length === 0) {
					this.eventListeners.delete(event);
				}
			}
		}
		
		// Remove from wildcards if this was a wildcard pattern
		if (event.includes('*')) {
			this.removeWildcardPattern(event);
		}
		
		return this;
	}
	
	/**
	 * Remove all listeners for an event
	 * @param event Event name
	 */
	removeAllListeners(event?: string): this {
		if (event) {
			this.eventListeners.delete(event);
			this.statistics.delete(event);
			this.options.delete(event);
			if (event.includes('*')) {
				this.removeWildcardPattern(event);
			}
		} else {
			this.eventListeners.clear();
			this.statistics.clear();
			this.options.clear();
			this.wildcards = [];
		}
		return this;
	}
	
	/**
	 * Get all listeners for an event
	 * @param event Event name
	 */
	getListeners(event: string): EventListenerMetadata[] {
		const listeners = this.eventListeners.get(event) || [];
		return listeners.filter(l => !l.paused);
	}
	
	/**
	 * Get the number of listeners for an event
	 * @param event Event name
	 */
	listenerCount(event: string): number {
		return this.getListeners(event).length;
	}
	
	/**
	 * Get all event names
	 */
	eventNames(): string[] {
		return Array.from(this.eventListeners.keys());
	}
	
	/**
	 * Set the maximum number of listeners for an event
	 * @param event Event name
	 * @param count Maximum number of listeners
	 */
	setMaxListeners(event: string, count: number): this {
		const options = this.getEventOptions(event);
		options.maxListeners = count;
		this.options.set(event, options);
		return this;
	}
	
	/**
	 * Get the maximum number of listeners for an event
	 * @param event Event name
	 */
	getMaxListeners(event: string): number {
		const options = this.getEventOptions(event);
		return options.maxListeners || this.defaultMaxListeners;
	}
	
	/**
	 * Emit an event
	 * @param event Event name
	 * @param args Arguments to pass to listeners
	 */
	async emit(event: string, ...args: any[]): Promise<boolean> {
		const startTime = this.performanceMonitor.now();
		
		// Get listeners for this event
		let listeners = this.eventListeners.get(event) || [];
		
		// Get wildcard listeners
		const wildcardListeners = this.getWildcardListeners(event);
		listeners = [...listeners, ...wildcardListeners];
		
		// Sort by priority
		this.sortListeners(listeners);
		
		// Get event options
		const eventOptions = this.getEventOptions(event);
		
		// Update statistics
		if (eventOptions.monitorPerformance) {
			this.updateEmitStatistics(event);
		}
		
		// Execute listeners
		const hasListeners = listeners.length > 0;
		
		for (const metadata of listeners) {
			if (metadata.paused) continue;
			
			// Check max calls
			if (metadata.maxCalls && metadata.callCount >= metadata.maxCalls) {
				continue;
			}
			
			// Execute listener
			const listenerStartTime = this.performanceMonitor.now();
			try {
				await metadata.listener(...args);
				metadata.callCount++;
				metadata.lastExecutedAt = Date.now();
				
				// Update performance statistics
				const executionTime = this.performanceMonitor.now() - listenerStartTime;
				metadata.totalExecutionTime += executionTime;
				metadata.averageExecutionTime = metadata.totalExecutionTime / metadata.callCount;
				
				// Update event statistics
				if (eventOptions.monitorPerformance) {
					this.updateListenerStatistics(event, executionTime);
				}
				
				// Remove if once
				if (metadata.once) {
					this.off(event, metadata.listener);
				}
			} catch (error) {
				// Emit error event
				await this.emit('error', error, event, ...args);
			}
		}
		
		// Check for aliases
		const aliases = this.aliases.get(event);
		if (aliases) {
			for (const alias of aliases) {
				await this.emit(alias, ...args);
			}
		}
		
		return hasListeners;
	}
	
	/**
	 * Emit an event synchronously
	 * @param event Event name
	 * @param args Arguments to pass to listeners
	 */
	emitSync(event: string, ...args: any[]): boolean {
		const startTime = this.performanceMonitor.now();
		
		// Get listeners for this event
		let listeners = this.eventListeners.get(event) || [];
		
		// Get wildcard listeners
		const wildcardListeners = this.getWildcardListeners(event);
		listeners = [...listeners, ...wildcardListeners];
		
		// Sort by priority
		this.sortListeners(listeners);
		
		// Get event options
		const eventOptions = this.getEventOptions(event);
		
		// Update statistics
		if (eventOptions.monitorPerformance) {
			this.updateEmitStatistics(event);
		}
		
		// Execute listeners
		const hasListeners = listeners.length > 0;
		
		for (const metadata of listeners) {
			if (metadata.paused) continue;
			
			// Check max calls
			if (metadata.maxCalls && metadata.callCount >= metadata.maxCalls) {
				continue;
			}
			
			// Execute listener
			const listenerStartTime = this.performanceMonitor.now();
			try {
				metadata.listener(...args);
				metadata.callCount++;
				metadata.lastExecutedAt = Date.now();
				
				// Update performance statistics
				const executionTime = this.performanceMonitor.now() - listenerStartTime;
				metadata.totalExecutionTime += executionTime;
				metadata.averageExecutionTime = metadata.totalExecutionTime / metadata.callCount;
				
				// Update event statistics
				if (eventOptions.monitorPerformance) {
					this.updateListenerStatistics(event, executionTime);
				}
				
				// Remove if once
				if (metadata.once) {
					this.off(event, metadata.listener);
				}
			} catch (error) {
				// Emit error event
				this.emitSync('error', error, event, ...args);
			}
		}
		
		// Check for aliases
		const aliases = this.aliases.get(event);
		if (aliases) {
			for (const alias of aliases) {
				this.emitSync(alias, ...args);
			}
		}
		
		return hasListeners;
	}
	
	/**
	 * Pause a listener
	 * @param event Event name
	 * @param listener Listener function
	 */
	pauseListener(event: string, listener: (...args: any[]) => void | Promise<void>): this {
		const listeners = this.eventListeners.get(event);
		if (listeners) {
			const metadata = listeners.find(l => l.listener === listener);
			if (metadata) {
				metadata.paused = true;
			}
		}
		return this;
	}
	
	/**
	 * Resume a paused listener
	 * @param event Event name
	 * @param listener Listener function
	 */
	resumeListener(event: string, listener: (...args: any[]) => void | Promise<void>): this {
		const listeners = this.eventListeners.get(event);
		if (listeners) {
			const metadata = listeners.find(l => l.listener === listener);
			if (metadata) {
				metadata.paused = false;
			}
		}
		return this;
	}
	
	/**
	 * Get event statistics
	 * @param event Event name
	 */
	getStatistics(event: string): EventStatistics | undefined {
		return this.statistics.get(event);
	}
	
	/**
	 * Get all event statistics
	 */
	getAllStatistics(): Map<string, EventStatistics> {
		return new Map(this.statistics);
	}
	
	/**
	 * Set event options
	 * @param event Event name
	 * @param options Event options
	 */
	setEventOptions(event: string, options: EventOptions): this {
		this.options.set(event, { ...this.globalOptions, ...options });
		return this;
	}
	
	/**
	 * Get event options
	 * @param event Event name
	 */
	getEventOptions(event: string): EventOptions {
		return this.options.get(event) || { ...this.globalOptions };
	}
	
	/**
	 * Set global event options
	 * @param options Global event options
	 */
	setGlobalOptions(options: EventOptions): this {
		this.globalOptions = { ...this.globalOptions, ...options };
		return this;
	}
	
	/**
	 * Add event alias
	 * @param event Event name
	 * @param alias Event alias
	 */
	addAlias(event: string, alias: string): this {
		const aliases = this.aliases.get(event) || [];
		if (!aliases.includes(alias)) {
			aliases.push(alias);
			this.aliases.set(event, aliases);
		}
		return this;
	}
	
	/**
	 * Remove event alias
	 * @param event Event name
	 * @param alias Event alias
	 */
	removeAlias(event: string, alias: string): this {
		const aliases = this.aliases.get(event);
		if (aliases) {
			const index = aliases.indexOf(alias);
			if (index !== -1) {
				aliases.splice(index, 1);
				if (aliases.length === 0) {
					this.aliases.delete(event);
				}
			}
		}
		return this;
	}
	
	/**
	 * Get event aliases
	 * @param event Event name
	 */
	getAliases(event: string): string[] {
		return this.aliases.get(event) || [];
	}
	
	/**
	 * Sort listeners by priority
	 * @param listeners Listeners to sort
	 */
	private sortListeners(listeners: EventListenerMetadata[]): void {
		listeners.sort((a, b) => b.priority - a.priority);
	}
	
	/**
	 * Add wildcard pattern
	 * @param pattern Wildcard pattern
	 */
	private addWildcardPattern(pattern: string): void {
		const segments = pattern.split('*');
		const wildcard: WildcardPattern = {
			pattern,
			segments,
			isWildcard: true,
		};
		
		if (!this.wildcards.find(w => w.pattern === pattern)) {
			this.wildcards.push(wildcard);
		}
	}
	
	/**
	 * Remove wildcard pattern
	 * @param pattern Wildcard pattern
	 */
	private removeWildcardPattern(pattern: string): void {
		const index = this.wildcards.findIndex(w => w.pattern === pattern);
		if (index !== -1) {
			this.wildcards.splice(index, 1);
		}
	}
	
	/**
	 * Get wildcard listeners for an event
	 * @param event Event name
	 */
	private getWildcardListeners(event: string): EventListenerMetadata[] {
		const result: EventListenerMetadata[] = [];
		
		for (const wildcard of this.wildcards) {
			if (this.matchWildcard(event, wildcard.pattern)) {
				const listeners = this.eventListeners.get(wildcard.pattern) || [];
				result.push(...listeners);
			}
		}
		
		return result;
	}
	
	/**
	 * Check if an event matches a wildcard pattern
	 * @param event Event name
	 * @param pattern Wildcard pattern
	 */
	private matchWildcard(event: string, pattern: string): boolean {
		const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
		return regex.test(event);
	}
	
	/**
	 * Initialize statistics for an event
	 * @param event Event name
	 */
	private initializeStatistics(event: string): void {
		if (!this.statistics.has(event)) {
			this.statistics.set(event, {
				emitCount: 0,
				listenerCallCount: 0,
				totalExecutionTime: 0,
				averageExecutionTime: 0,
				maxExecutionTime: 0,
				minExecutionTime: Number.MAX_VALUE,
				activeListenerCount: 0,
			});
		}
	}
	
	/**
	 * Update emit statistics
	 * @param event Event name
	 */
	private updateEmitStatistics(event: string): void {
		let stats = this.statistics.get(event);
		if (!stats) {
			stats = {
				emitCount: 0,
				listenerCallCount: 0,
				totalExecutionTime: 0,
				averageExecutionTime: 0,
				maxExecutionTime: 0,
				minExecutionTime: Number.MAX_VALUE,
				activeListenerCount: 0,
			};
			this.statistics.set(event, stats);
		}
		
		stats.emitCount++;
		stats.lastEmittedAt = Date.now();
		stats.activeListenerCount = this.listenerCount(event);
	}
	
	/**
	 * Update listener statistics
	 * @param event Event name
	 * @param executionTime Execution time in milliseconds
	 */
	private updateListenerStatistics(event: string, executionTime: number): void {
		const stats = this.statistics.get(event);
		if (!stats) return;
		
		stats.listenerCallCount++;
		stats.totalExecutionTime += executionTime;
		stats.averageExecutionTime = stats.totalExecutionTime / stats.listenerCallCount;
		stats.maxExecutionTime = Math.max(stats.maxExecutionTime, executionTime);
		stats.minExecutionTime = Math.min(stats.minExecutionTime, executionTime);
	}
}