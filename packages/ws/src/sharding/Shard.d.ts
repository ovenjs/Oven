/**
 * Individual shard implementation
 * Represents a single WebSocket connection to Discord gateway
 */
import { EventEmitter } from 'events';
import { GatewayPayload, BotToken } from '@ovenjs/types';
export interface ShardOptions {
    id: number;
    count: number;
    token: BotToken;
    intents: number;
    gatewayURL: string;
    version?: number;
    encoding?: 'json' | 'etf';
    compress?: boolean;
    largeThreshold?: number;
    presence?: {
        activities?: any[];
        status?: 'online' | 'dnd' | 'idle' | 'invisible';
        afk?: boolean;
        since?: number | null;
    };
}
export interface ShardStatus {
    id: number;
    state: ShardState;
    ping: number;
    lastHeartbeat: Date;
    sessionId?: string;
    resumeGatewayURL?: string;
    sequence?: number;
    closeCode?: number;
    closeReason?: string;
}
export declare enum ShardState {
    DISCONNECTED = "disconnected",
    CONNECTING = "connecting",
    CONNECTED = "connected",
    IDENTIFYING = "identifying",
    READY = "ready",
    RESUMING = "resuming",
    RECONNECTING = "reconnecting",
    ZOMBIE = "zombie"
}
/**
 * Represents a single shard connection to Discord gateway
 */
export declare class Shard extends EventEmitter {
    private readonly options;
    private ws?;
    private heartbeat?;
    private state;
    private sequence;
    private sessionId?;
    private resumeGatewayURL?;
    private closeSequence;
    private reconnectAttempts;
    private maxReconnectAttempts;
    private reconnectTimeout?;
    private connectTimeout?;
    private identifyTimeout?;
    constructor(options: ShardOptions);
    /**
     * Connect to the Discord gateway
     */
    connect(): Promise<void>;
    /**
     * Disconnect from the gateway
     */
    disconnect(code?: number, reason?: string): Promise<void>;
    /**
     * Send a payload to the gateway
     */
    send(payload: GatewayPayload): void;
    /**
     * Get current shard status
     */
    getStatus(): ShardStatus;
    /**
     * Get shard ID
     */
    getId(): number;
    /**
     * Check if shard is connected and ready
     */
    isReady(): boolean;
    /**
     * Create WebSocket connection
     */
    private createConnection;
    /**
     * Setup WebSocket event handlers
     */
    private setupWebSocketEvents;
    /**
     * Handle incoming WebSocket messages
     */
    private handleMessage;
    /**
     * Handle HELLO opcode - start heartbeat and identify
     */
    private handleHello;
    /**
     * Send heartbeat to gateway
     */
    private sendHeartbeat;
    /**
     * Handle heartbeat acknowledgment
     */
    private handleHeartbeatAck;
    /**
     * Handle heartbeat request from gateway
     */
    private handleHeartbeatRequest;
    /**
     * Handle reconnect request from gateway
     */
    private handleReconnectRequest;
    /**
     * Handle invalid session
     */
    private handleInvalidSession;
    /**
     * Handle dispatch events
     */
    private handleDispatch;
    /**
     * Handle READY event
     */
    private handleReady;
    /**
     * Handle RESUMED event
     */
    private handleResumed;
    /**
     * Send identify payload
     */
    private identify;
    /**
     * Send resume payload
     */
    private resume;
    /**
     * Handle WebSocket close
     */
    private handleClose;
    /**
     * Check if shard should reconnect based on close code
     */
    private shouldReconnect;
    /**
     * Reconnect to the gateway
     */
    private reconnect;
    /**
     * Handle zombie connection
     */
    private handleZombieConnection;
    /**
     * Build gateway URL with query parameters
     */
    private buildGatewayURL;
    /**
     * Set shard state
     */
    private setState;
    /**
     * Clear all timeouts
     */
    private clearTimeouts;
    /**
     * Clear specific timeout
     */
    private clearTimeout;
    /**
     * Destroy the shard
     */
    destroy(): void;
}
//# sourceMappingURL=Shard.d.ts.map