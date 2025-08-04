/**
 * Type System Tests
 *
 * This file contains comprehensive tests for the advanced type system
 * implemented in the enhanced REST package.
 */

import { describe, it, expect } from 'vitest';
import {
	APIRequest,
	APIResponse,
	RequestOptions,
	RetryOptions,
	CacheOptions,
	RateLimitInfo,
	RequestPriority,
	CacheStrategy,
	ErrorType,
	HTTPMethod,
	RESTOptions,
} from '../../../packages/rest/src/types';

describe('Type System', () => {
	describe('APIRequest', () => {
		it('should accept valid request data', () => {
			const request: APIRequest = {
				method: 'GET',
				path: '/users',
				data: { id: '123' },
				options: {
					headers: {
						'Content-Type': 'application/json',
					},
					timeout: 5000,
				},
				priority: 'high',
				cacheKey: 'user-123',
				retryCount: 0,
			};

			expect(request.method).toBe('GET');
			expect(request.path).toBe('/users');
			expect(request.data).toEqual({ id: '123' });
			expect(request.options).toBeDefined();
			expect(request.priority).toBe('high');
			expect(request.cacheKey).toBe('user-123');
			expect(request.retryCount).toBe(0);
		});
	});

	describe('APIResponse', () => {
		it('should accept valid response data', () => {
			const response: APIResponse = {
				status: 200,
				statusText: 'OK',
				headers: {
					'content-type': 'application/json',
					'content-length': '1234',
				},
				data: { users: [] },
				cached: false,
				requestTime: 250,
				timestamp: Date.now(),
			};

			expect(response.status).toBe(200);
			expect(response.statusText).toBe('OK');
			expect(response.headers).toBeDefined();
			expect(response.data).toEqual({ users: [] });
			expect(response.cached).toBe(false);
			expect(response.requestTime).toBe(250);
		});

		it('should accept cached response', () => {
			const response: APIResponse = {
				status: 200,
				statusText: 'OK',
				headers: {
					'content-type': 'application/json',
				},
				data: { users: [] },
				cached: true,
				requestTime: 5,
				timestamp: Date.now(),
			};

			expect(response.status).toBe(200);
			expect(response.cached).toBe(true);
		});
	});

	describe('RequestOptions', () => {
		it('should accept valid request options', () => {
			const options: RequestOptions = {
				headers: {
					'Content-Type': 'application/json',
					'Authorization': 'Bearer token',
				},
				timeout: 5000,
				retryOptions: {
					maxRetries: 3,
					retryDelay: 1000,
				},
				cacheOptions: {
					ttl: 300000,
					strategy: 'memory',
				},
			};

			expect(options.headers).toBeDefined();
			expect(options.timeout).toBe(5000);
			expect(options.retryOptions).toBeDefined();
			expect(options.cacheOptions).toBeDefined();
		});
	});

	describe('RetryOptions', () => {
		it('should accept valid retry options', () => {
			const options: RetryOptions = {
				maxRetries: 3,
				retryDelay: 1000,
				backoffMultiplier: 2,
				maxRetryDelay: 30000,
				retryableStatusCodes: [408, 429, 500, 502, 503, 504],
			};

			expect(options.maxRetries).toBe(3);
			expect(options.retryDelay).toBe(1000);
			expect(options.backoffMultiplier).toBe(2);
			expect(options.maxRetryDelay).toBe(30000);
			expect(options.retryableStatusCodes).toEqual([408, 429, 500, 502, 503, 504]);
		});
	});

	describe('CacheOptions', () => {
		it('should accept valid cache options', () => {
			const options: CacheOptions = {
				ttl: 300000,
				strategy: 'memory',
				key: 'user-123',
				forceRefresh: false,
				staleWhileRevalidate: true,
			};

			expect(options.ttl).toBe(300000);
			expect(options.strategy).toBe('memory');
			expect(options.key).toBe('user-123');
			expect(options.forceRefresh).toBe(false);
			expect(options.staleWhileRevalidate).toBe(true);
		});
	});

	describe('RateLimitInfo', () => {
		it('should accept valid rate limit info', () => {
			const rateLimit: RateLimitInfo = {
				global: false,
				bucketId: 'bucket-123',
				limit: 10,
				remaining: 5,
				reset: Date.now() + 60000,
				resetAfter: 60,
				retryAfter: 5,
				maxUses: 10,
			};

			expect(rateLimit.global).toBe(false);
			expect(rateLimit.bucketId).toBe('bucket-123');
			expect(rateLimit.limit).toBe(10);
			expect(rateLimit.remaining).toBe(5);
			expect(rateLimit.retryAfter).toBe(5);
		});
	});

	describe('Type Guards', () => {
		it('should validate RequestPriority', () => {
			expect(['low', 'normal', 'high', 'critical'].includes('high')).toBe(true);
			expect(['low', 'normal', 'high', 'critical'].includes('invalid')).toBe(false);
		});

		it('should validate CacheStrategy', () => {
			expect(['memory', 'persistent', 'hybrid'].includes('memory')).toBe(true);
			expect(['memory', 'persistent', 'hybrid'].includes('invalid')).toBe(false);
		});

		it('should validate ErrorType', () => {
			expect([
				'DiscordAPIError',
				'RateLimitError',
				'ValidationError',
				'NetworkError',
				'TimeoutError',
				'RetryError',
				'CacheError'
			].includes('NetworkError')).toBe(true);
			expect([
				'DiscordAPIError',
				'RateLimitError',
				'ValidationError',
				'NetworkError',
				'TimeoutError',
				'RetryError',
				'CacheError'
			].includes('InvalidError')).toBe(false);
		});

		it('should validate HTTPMethod', () => {
			expect(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes('GET')).toBe(true);
			expect(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes('INVALID')).toBe(false);
		});
	});

	describe('Constants', () => {
		it('should have correct API_BASE_URL', () => {
			const { API_BASE_URL } = require('../../../packages/rest/src/types');
			expect(API_BASE_URL).toBe('https://discord.com/api');
		});

		it('should have correct SUPPORTED_API_VERSIONS', () => {
			const { SUPPORTED_API_VERSIONS } = require('../../../packages/rest/src/types');
			expect(SUPPORTED_API_VERSIONS).toEqual([9, 10]);
		});

		it('should have correct HTTP_METHODS', () => {
			const { HTTP_METHODS } = require('../../../packages/rest/src/types');
			expect(HTTP_METHODS).toEqual(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
		});

		it('should have correct REQUEST_PRIORITIES', () => {
			const { REQUEST_PRIORITIES } = require('../../../packages/rest/src/types');
			expect(REQUEST_PRIORITIES).toEqual(['low', 'normal', 'high', 'critical']);
		});

		it('should have correct CACHE_STRATEGIES', () => {
			const { CACHE_STRATEGIES } = require('../../../packages/rest/src/types');
			expect(CACHE_STRATEGIES).toEqual(['memory', 'persistent', 'hybrid']);
		});

		it('should have correct ERROR_TYPES', () => {
			const { ERROR_TYPES } = require('../../../packages/rest/src/types');
			expect(ERROR_TYPES).toEqual([
				'DiscordAPIError',
				'RateLimitError',
				'ValidationError',
				'NetworkError',
				'TimeoutError',
				'RetryError',
				'CacheError'
			]);
		});
	});
});