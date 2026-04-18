/**
 * Shared Payload CMS Types
 */

/**
 * Payload's default rich text format (Lexical)
 */
export interface RichText {
	root: {
		type: string;
		children: RichTextNode[];
		direction: "ltr" | "rtl" | null;
		format: "" | "left" | "start" | "center" | "right" | "end" | "justify";
		indent: number;
		version: number;
	};
	[k: string]: unknown;
}

export interface RichTextNode {
	type: string;
	children?: RichTextNode[];
	[k: string]: unknown;
}

/**
 * Media type for images/files in Payload CMS
 * Used by multiple collections for featured images and file attachments
 */
export interface Media {
	id: string;
	alt?: string | null;
	url?: string | null;
	filename?: string | null;
	mimeType?: string | null;
	filesize?: number | null;
	width?: number | null;
	height?: number | null;
	createdAt: string;
	updatedAt: string;
}

// Types for Payload CMS API responses
export interface PayloadPaginatedDocs<T> {
	docs: T[];
	totalDocs: number;
	limit: number;
	totalPages: number;
	page: number;
	pagingCounter: number;
	hasPrevPage: boolean;
	hasNextPage: boolean;
	prevPage: number | null;
	nextPage: number | null;
}

export interface PayloadClientOptions {
	/**
	 * The Payload CMS Worker binding (Fetcher) - used in production
	 */
	worker?: Fetcher;
	/**
	 * Direct API URL for local development when worker binding isn't available
	 */
	apiUrl?: string;
}

export interface CollectionQueryParams {
	limit?: number;
	page?: number;
	where?: Record<string, unknown>;
	sort?: string;
	depth?: number;
}

/**
 * Cache-related metadata from CMS response headers
 */
export interface CacheMetadata {
	/** Cache tags from response (Cache-Tag header) */
	cacheTags: string[];
	/** Cloudflare cache status (cf-cache-status header) */
	cacheStatus:
		| "HIT"
		| "MISS"
		| "EXPIRED"
		| "STALE"
		| "BYPASS"
		| "DYNAMIC"
		| null;
	/** Cache-Control header info */
	cacheControl: {
		maxAge?: number;
		sMaxAge?: number;
		staleWhileRevalidate?: number;
		isPublic: boolean;
		isPrivate: boolean;
	} | null;
}

/**
 * Response wrapper that includes cache metadata
 */
export interface PayloadResponseWithCache<T> {
	data: T;
	cache: CacheMetadata;
}

/**
 * Fetch options for CMS requests
 */
export interface PayloadFetchOptions {
	/**
	 * Whether to skip the cache and fetch fresh data
	 * Sets Cache-Control: no-cache header
	 */
	skipCache?: boolean;
	/**
	 * Whether to return cache metadata with the response
	 * If true, returns PayloadResponseWithCache<T>
	 */
	includeCacheMetadata?: boolean;
}
