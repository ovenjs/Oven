/**
 * Main WebSocket client for Discord gateway
 * Orchestrates sharding, event handling, and connection management
 */
import { EventEmitter } from 'events';
import { ShardManager } from '../sharding/index.js';
import { EventHandler } from '../handlers/index.js';
/**
 * Main WebSocket client for Discord gateway connections
 */
export class WebSocketClient extends EventEmitter {
    options;
    shardManager;
    eventHandler;
    restClient;
    connected = false;
    ready = false;
    constructor(options) {
        super();
        this.options = options;
        this.restClient = options.restClient;
        // Initialize shard manager
        const shardManagerOptions = {
            token: options.token,
            intents: options.intents,
            shardCount: options.shardCount,
            shardIds: options.shardIds,
            gatewayURL: options.gatewayURL,
            version: options.version,
            encoding: options.encoding,
            compress: options.compress,
            largeThreshold: options.largeThreshold,
            presence: options.presence,
            spawnDelay: options.spawnDelay,
            spawnTimeout: options.spawnTimeout,
        };
        this.shardManager = new ShardManager(shardManagerOptions);
        // Initialize event handler
        const eventHandlerOptions = {
            validateEvents: options.validateEvents,
            debugMode: options.debugMode,
        };
        this.eventHandler = new EventHandler(eventHandlerOptions);
        this.setupEventHandlers();
        this.setMaxListeners(0);
    }
    /**
     * Connect to Discord gateway
     */
    async connect() {
        if (this.connected) {
            throw new Error('WebSocket client is already connected');
        }
        try {
            // Fetch gateway info and spawn shards
            await this.shardManager.fetchGatewayInfo();
            await this.shardManager.spawnAll();
            this.connected = true;
            this.emit('connect');
            this.emit('debug', 'WebSocket client connected');
        }
        catch (error) {
            this.emit('error', error);
            throw error;
        }
    }
    /**
     * Disconnect from Discord gateway
     */
    async disconnect() {
        if (!this.connected) {
            return;
        }
        try {
            await this.shardManager.disconnectAll();
            this.connected = false;
            this.ready = false;
            this.emit('disconnect');
            this.emit('debug', 'WebSocket client disconnected');
        }
        catch (error) {
            this.emit('error', error);
            throw error;
        }
    }
    /**
     * Check if client is connected
     */
    isConnected() {
        return this.connected;
    }
    /**
     * Check if client is ready (all shards ready)
     */
    isReady() {
        return this.ready;
    }
    /**
     * Get client status
     */
    getStatus() {
        return {
            connected: this.connected,
            ready: this.ready,
            shardManager: this.shardManager.getStatus(),
            eventStats: this.eventHandler.getEventStats(),
            totalEvents: this.eventHandler.getTotalEvents(),
            eventsPerSecond: this.eventHandler.getEventsPerSecond(),
        };
    }
    /**
     * Get shard manager
     */
    getShardManager() {
        return this.shardManager;
    }
    /**
     * Get event handler
     */
    getEventHandler() {
        return this.eventHandler;
    }
    /**
     * Send payload to all shards
     */
    broadcast(payload) {
        return this.shardManager.broadcast(payload);
    }
    /**
     * Send payload to specific shard
     */
    sendToShard(shardId, payload) {
        const shard = this.shardManager.getShard(shardId);
        if (!shard) {
            throw new Error(`Shard ${shardId} not found`);
        }
        shard.send(payload);
    }
    /**
     * Update presence on all shards
     */
    updatePresence(presence) {
        const payload = {
            op: 3, // PRESENCE_UPDATE
            d: presence,
        };
        return this.broadcast(payload);
    }
    /**
     * Request guild members for a guild
     */
    requestGuildMembers(guildId, options = {}) {
        const payload = {
            op: 8, // REQUEST_GUILD_MEMBERS
            d: {
                guild_id: guildId,
                query: options.query || '',
                limit: options.limit || 0,
                presences: options.presences || false,
                user_ids: options.user_ids,
                nonce: options.nonce,
            },
        };
        // Send to all shards that might have this guild
        this.broadcast(payload);
    }
    /**
     * Update voice state
     */
    updateVoiceState(guildId, channelId, options = {}) {
        const payload = {
            op: 4, // VOICE_STATE_UPDATE
            d: {
                guild_id: guildId,
                channel_id: channelId,
                self_mute: options.selfMute || false,
                self_deaf: options.selfDeaf || false,
            },
        };
        this.broadcast(payload);
    }
    /**
     * Get gateway information
     */
    async getGatewayInfo() {
        return this.shardManager.fetchGatewayInfo();
    }
    /**
     * Restart a specific shard
     */
    async restartShard(shardId) {
        await this.shardManager.restartShard(shardId);
    }
    /**
     * Restart all shards
     */
    async restartAll() {
        this.emit('debug', 'Restarting all shards');
        const shards = Array.from(this.shardManager.getShards().keys());
        for (const shardId of shards) {
            await this.restartShard(shardId);
            // Add delay between restarts
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    /**
     * Get detailed statistics
     */
    getDetailedStats() {
        const status = this.getStatus();
        const topEvents = this.eventHandler.getTopEvents();
        const shardDetails = status.shardManager.shards;
        return {
            client: status,
            topEvents,
            shardDetails,
        };
    }
    /**
     * Setup event handlers for shard manager and event handler
     */
    setupEventHandlers() {
        // Shard manager events
        this.shardManager.on('ready', () => {
            this.ready = true;
            this.emit('ready');
            this.emit('debug', 'All shards ready');
        });
        this.shardManager.on('shardReady', (shardId, data) => {
            this.emit('shardReady', shardId, data);
            this.emit('debug', `Shard ${shardId} ready`);
        });
        this.shardManager.on('shardResumed', (shardId) => {
            this.emit('shardResumed', shardId);
            this.emit('debug', `Shard ${shardId} resumed`);
        });
        this.shardManager.on('shardDisconnect', (shardId, code, reason) => {
            this.emit('shardDisconnect', shardId, code, reason);
            this.emit('debug', `Shard ${shardId} disconnected: ${code} ${reason}`);
        });
        this.shardManager.on('shardError', (shardId, error) => {
            this.emit('shardError', shardId, error);
            this.emit('error', new Error(`Shard ${shardId} error: ${error.message}`));
        });
        this.shardManager.on('shardStateChange', (shardId, newState, oldState) => {
            this.emit('shardStateChange', shardId, newState, oldState);
            this.emit('debug', `Shard ${shardId} state: ${oldState} -> ${newState}`);
        });
        this.shardManager.on('dispatch', (shardId, payload) => {
            // Process the event through the event handler
            const processedEvent = this.eventHandler.processEvent(shardId, payload);
            if (processedEvent) {
                // Emit the processed event
                this.emit('event', processedEvent);
                this.emit(processedEvent.type.toLowerCase(), processedEvent);
            }
        });
        this.shardManager.on('debug', (message) => {
            this.emit('debug', message);
        });
        // Event handler events
        this.eventHandler.on('error', (error) => {
            this.emit('error', error);
        });
        this.eventHandler.on('debug', (message) => {
            this.emit('debug', message);
        });
    }
    /**
     * Add event listener with type safety
     */
    on(event, listener) {
        return super.on(event, listener);
    }
    /**
     * Add one-time event listener with type safety
     */
    once(event, listener) {
        return super.once(event, listener);
    }
    /**
     * Emit event with type safety
     */
    emit(event, ...args) {
        return super.emit(event, ...args);
    }
    /**
     * Destroy the WebSocket client
     */
    async destroy() {
        await this.disconnect();
        await this.shardManager.destroy();
        this.eventHandler.destroy();
        this.removeAllListeners();
        this.emit('debug', 'WebSocket client destroyed');
    }
}
//# sourceMappingURL=WebSocketClient.js.map