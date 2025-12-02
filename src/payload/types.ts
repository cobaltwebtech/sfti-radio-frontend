/**
 * Shared Payload CMS Types
 */

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
