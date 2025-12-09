/**
 * Search API Utilities
 *
 * Helper functions for search caching and utilities.
 * The actual search is performed via the PayloadClient.
 */

import type { SearchParams, SearchResponse } from "@/components/search/types";
import type { PayloadClient } from "@/payload";

/**
 * Create a cached search function for use with React Suspense
 * Uses a simple in-memory cache with expiration
 */
const searchCache = new Map<
	string,
	{ promise: Promise<SearchResponse>; timestamp: number }
>();
const CACHE_TTL = 30000; // 30 seconds

/**
 * Execute a cached search using the Payload client
 */
export function getCachedSearch(
	client: PayloadClient,
	params: SearchParams,
): Promise<SearchResponse> {
	const cacheKey = JSON.stringify(params);
	const now = Date.now();
	const cached = searchCache.get(cacheKey);

	// Return cached promise if still valid
	if (cached && now - cached.timestamp < CACHE_TTL) {
		return cached.promise;
	}

	// Create new promise and cache it
	const promise = client.search(params);
	searchCache.set(cacheKey, { promise, timestamp: now });

	// Clean up old cache entries periodically
	if (searchCache.size > 100) {
		for (const [key, value] of searchCache.entries()) {
			if (now - value.timestamp > CACHE_TTL) {
				searchCache.delete(key);
			}
		}
	}

	return promise;
}

/**
 * Clear the search cache (useful when data is updated)
 */
export function clearSearchCache(): void {
	searchCache.clear();
}

/**
 * Invalidate a specific cache entry
 */
export function invalidateSearchCache(params: SearchParams): void {
	const cacheKey = JSON.stringify(params);
	searchCache.delete(cacheKey);
}
