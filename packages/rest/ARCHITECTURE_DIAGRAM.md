# Enhanced REST Package Architecture Diagram

## System Architecture Overview

```mermaid
graph TB
    subgraph "Client Application"
        APP[Application Code]
    end

    subgraph "@ovendjs/rest Package"
        subgraph "Public API"
            REST_CLIENT[RESTClient]
        end

        subgraph "Core Components"
            RL_MANAGER[RateLimitManager]
            REQ_PROCESSOR[RequestProcessor]
            CACHE_MANAGER[CacheManager]
            EVENT_SYSTEM[EventSystem]
        end

        subgraph "HTTP Layer"
            HTTP_CLIENT[HttpClient]
            CONN_POOL[ConnectionPool]
            RESP_HANDLER[ResponseHandler]
        end

        subgraph "Middleware Pipeline"
            REQ_INTERCEPTORS[Request Interceptors]
            RESP_INTERCEPTORS[Response Interceptors]
            ERROR_HANDLERS[Error Handlers]
            RETRY_MIDDLEWARE[Retry Middleware]
        end

        subgraph "Rate Limiting"
            BUCKET_MANAGER[BucketManager]
            PREDICTIVE_LIMITER[PredictiveLimiter]
            BUCKETS[Buckets]
        end

        subgraph "Request Processing"
            REQ_QUEUE[RequestQueue]
            REQ_BATCHER[RequestBatcher]
            REQ_CACHE[RequestCache]
        end

        subgraph "Caching Layer"
            MEM_CACHE[MemoryCache]
            CACHE_STRATEGY[CacheStrategy]
        end

        subgraph "Monitoring"
            METRICS_COLLECTOR[MetricsCollector]
            PERF_TRACKER[PerformanceTracker]
            ANALYTICS[Analytics]
        end

        subgraph "Discord API"
            DISCORD_API[Discord REST API]
        end
    end

    %% Connections
    APP --> REST_CLIENT
    REST_CLIENT --> REQ_PROCESSOR
    REST_CLIENT --> RL_MANAGER
    REST_CLIENT --> CACHE_MANAGER
    REST_CLIENT --> EVENT_SYSTEM

    REQ_PROCESSOR --> REQ_QUEUE
    REQ_PROCESSOR --> REQ_BATCHER
    REQ_PROCESSOR --> REQ_CACHE
    REQ_PROCESSOR --> HTTP_CLIENT

    HTTP_CLIENT --> CONN_POOL
    HTTP_CLIENT --> RESP_HANDLER
    HTTP_CLIENT --> DISCORD_API

    REQ_PROCESSOR --> REQ_INTERCEPTORS
    REQ_PROCESSOR --> RESP_INTERCEPTORS
    REQ_PROCESSOR --> ERROR_HANDLERS
    REQ_PROCESSOR --> RETRY_MIDDLEWARE

    RL_MANAGER --> BUCKET_MANAGER
    RL_MANAGER --> PREDICTIVE_LIMITER
    BUCKET_MANAGER --> BUCKETS

    CACHE_MANAGER --> MEM_CACHE
    CACHE_MANAGER --> CACHE_STRATEGY

    EVENT_SYSTEM --> METRICS_COLLECTOR
    EVENT_SYSTEM --> PERF_TRACKER
    EVENT_SYSTEM --> ANALYTICS

    %% Event flows
    EVENT_SYSTEM -.-> APP
    METRICS_COLLECTOR -.-> APP
    PERF_TRACKER -.-> APP
```

## Request Processing Flow

```mermaid
sequenceDiagram
    participant App as Application
    participant RC as RESTClient
    participant M as Middleware Pipeline
    participant RL as RateLimitManager
    participant RP as RequestProcessor
    participant C as CacheManager
    participant H as HttpClient
    participant DA as Discord API

    App->>RC: rest.get('/users/@me')
    RC->>M: Apply request interceptors
    M->>C: Check cache
    alt Cache hit
        C-->>RC: Return cached response
        RC-->>App: Resolve with cached data
    else Cache miss
        C-->>M: Cache miss
        M->>RL: Check rate limits
        RL-->>M: Rate limit status
        alt Rate limited
            RL-->>RC: Wait for rate limit reset
        else Not rate limited
            M->>RP: Process request
            RP->>H: Make HTTP request
            H->>DA: Send request
            DA-->>H: Return response
            H-->>RP: Return response
            RP->>C: Cache response
            RP-->>M: Return processed response
            M->>M: Apply response interceptors
            M-->>RC: Return final response
            RC-->>App: Resolve with data
        end
    end
```

## Event System Architecture

```mermaid
graph LR
    subgraph "Event Sources"
        REST_EVENTS[REST Events]
        RL_EVENTS[Rate Limit Events]
        CACHE_EVENTS[Cache Events]
        PERF_EVENTS[Performance Events]
        ERROR_EVENTS[Error Events]
    end

    subgraph "Event Processing"
        EVENT_DISPATCHER[Event Dispatcher]
        EVENT_PRIORITIZER[Event Prioritizer]
        EVENT_FILTER[Event Filter]
        EVENT_ROUTER[Event Router]
    end

    subgraph "Event Handlers"
        DEBUG_HANDLER[Debug Handler]
        METRICS_HANDLER[Metrics Handler]
        NOTIFICATION_HANDLER[Notification Handler]
        CUSTOM_HANDLER[Custom Handler]
    end

    subgraph "Event Sinks"
        LOGGER[Logger]
        METRICS[Metrics System]
        NOTIFICATIONS[Notifications]
        EXTERNAL[External Systems]
    end

    %% Event flow
    REST_EVENTS --> EVENT_DISPATCHER
    RL_EVENTS --> EVENT_DISPATCHER
    CACHE_EVENTS --> EVENT_DISPATCHER
    PERF_EVENTS --> EVENT_DISPATCHER
    ERROR_EVENTS --> EVENT_DISPATCHER

    EVENT_DISPATCHER --> EVENT_PRIORITIZER
    EVENT_PRIORITIZER --> EVENT_FILTER
    EVENT_FILTER --> EVENT_ROUTER

    EVENT_ROUTER --> DEBUG_HANDLER
    EVENT_ROUTER --> METRICS_HANDLER
    EVENT_ROUTER --> NOTIFICATION_HANDLER
    EVENT_ROUTER --> CUSTOM_HANDLER

    DEBUG_HANDLER --> LOGGER
    METRICS_HANDLER --> METRICS
    NOTIFICATION_HANDLER --> NOTIFICATIONS
    CUSTOM_HANDLER --> EXTERNAL
```

## Rate Limiting Architecture

```mermaid
graph TB
    subgraph "Rate Limit Input"
        REQUEST[Incoming Request]
        HEADERS[Response Headers]
        BUCKET_ID[Bucket ID]
    end

    subgraph "Rate Limit Processing"
        BUCKET_MANAGER[Bucket Manager]
        PREDICTIVE_LIMITER[Predictive Limiter]
        BUCKET[Bucket Instance]
        QUEUE[Request Queue]
    end

    subgraph "Rate Limit Decision"
        LIMIT_CHECK[Limit Check]
        PREDICTION[Prediction Engine]
        QUEUE_MANAGER[Queue Manager]
    end

    subgraph "Rate Limit Output"
        ALLOW[Allow Request]
        DELAY[Delay Request]
        REJECT[Reject Request]
    end

    REQUEST --> BUCKET_MANAGER
    HEADERS --> BUCKET_MANAGER
    BUCKET_ID --> BUCKET_MANAGER

    BUCKET_MANAGER --> BUCKET
    BUCKET_MANAGER --> PREDICTIVE_LIMITER
    BUCKET --> QUEUE

    BUCKET --> LIMIT_CHECK
    PREDICTIVE_LIMITER --> PREDICTION
    QUEUE --> QUEUE_MANAGER

    LIMIT_CHECK --> ALLOW
    LIMIT_CHECK --> DELAY
    PREDICTION --> DELAY
    QUEUE_MANAGER --> ALLOW
    QUEUE_MANAGER --> REJECT
```

## Middleware Pipeline Architecture

```mermaid
graph LR
    subgraph "Request Flow"
        REQUEST[Incoming Request]
        INTERCEPTOR1[Interceptor 1]
        INTERCEPTOR2[Interceptor 2]
        VALIDATOR[Request Validator]
        RATE_LIMIT[Rate Limit Check]
        CACHE_CHECK[Cache Check]
        HTTP_CLIENT[HTTP Client]
    end

    subgraph "Response Flow"
        RESPONSE[HTTP Response]
        CACHE_STORE[Cache Store]
        ERROR_HANDLER[Error Handler]
        TRANSFORMER[Response Transformer]
        INTERCEPTOR3[Response Interceptor]
        FINAL_RESPONSE[Final Response]
    end

    REQUEST --> INTERCEPTOR1
    INTERCEPTOR1 --> INTERCEPTOR2
    INTERCEPTOR2 --> VALIDATOR
    VALIDATOR --> RATE_LIMIT
    RATE_LIMIT --> CACHE_CHECK
    CACHE_CHECK --> HTTP_CLIENT
    HTTP_CLIENT --> RESPONSE
    RESPONSE --> CACHE_STORE
    CACHE_STORE --> ERROR_HANDLER
    ERROR_HANDLER --> TRANSFORMER
    TRANSFORMER --> INTERCEPTOR3
    INTERCEPTOR3 --> FINAL_RESPONSE
```

## Cache Architecture

```mermaid
graph TB
    subgraph "Cache Interface"
        CACHE_MANAGER[Cache Manager]
    end

    subgraph "Cache Layers"
        L1_CACHE[L1 Cache - Memory]
        L2_CACHE[L2 Cache - Optional Persistent]
    end

    subgraph "Cache Strategies"
        TTL_STRATEGY[TTL Strategy]
        LRU_STRATEGY[LRU Strategy]
        INVALIDATE_STRATEGY[Invalidation Strategy]
    end

    subgraph "Cache Operations"
        GET_OPERATION[Get Operation]
        SET_OPERATION[Set Operation]
        DELETE_OPERATION[Delete Operation]
        CLEAR_OPERATION[Clear Operation]
    end

    subgraph "Cache Analytics"
        HIT_RATIO[Hit Ratio]
        MEMORY_USAGE[Memory Usage]
        PERFORMANCE[Performance Metrics]
    end

    CACHE_MANAGER --> L1_CACHE
    CACHE_MANAGER --> L2_CACHE
    CACHE_MANAGER --> TTL_STRATEGY
    CACHE_MANAGER --> LRU_STRATEGY
    CACHE_MANAGER --> INVALIDATE_STRATEGY

    GET_OPERATION --> CACHE_MANAGER
    SET_OPERATION --> CACHE_MANAGER
    DELETE_OPERATION --> CACHE_MANAGER
    CLEAR_OPERATION --> CACHE_MANAGER

    CACHE_MANAGER --> HIT_RATIO
    CACHE_MANAGER --> MEMORY_USAGE
    CACHE_MANAGER --> PERFORMANCE
```

These diagrams illustrate the comprehensive architecture of the enhanced REST package, showing the relationships between components and the flow of data through the system.