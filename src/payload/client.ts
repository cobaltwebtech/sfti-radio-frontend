/**
 * Payload CMS Client
 *
 * Helper functions for communicating with the Payload CMS Worker
 * via Cloudflare Worker-to-Worker binding (Service Binding)
 */

import type { BlogCollectionMethods, BlogPost } from "./collections/blog";
import type { Church, ChurchesCollectionMethods } from "./collections/churches";
import type {
	LocalEvent,
	LocalEventsCollectionMethods,
} from "./collections/local-events";
import type {
	MarketArea,
	MarketAreaCollectionMethods,
} from "./collections/market-areas";
import type { News, NewsCollectionMethods } from "./collections/news";
import type { School, SchoolsCollectionMethods } from "./collections/schools";
import type { Sports, SportsCollectionMethods } from "./collections/sports";
import type {
	CollectionQueryParams,
	PayloadClientOptions,
	PayloadPaginatedDocs,
} from "./types";

export interface PayloadClient
	extends BlogCollectionMethods,
		MarketAreaCollectionMethods,
		NewsCollectionMethods,
		ChurchesCollectionMethods,
		LocalEventsCollectionMethods,
		SchoolsCollectionMethods,
		SportsCollectionMethods {
	/**
	 * Get all documents from a collection
	 */
	getCollection<T = unknown>(
		collection: string,
		params?: CollectionQueryParams,
	): Promise<PayloadPaginatedDocs<T>>;

	/**
	 * Get a single document by ID
	 */
	getDocument<T = unknown>(
		collection: string,
		id: string,
		params?: { depth?: number },
	): Promise<T>;

	/**
	 * Get a document by slug (for collections with slug field)
	 */
	getDocumentBySlug<T = unknown>(
		collection: string,
		slug: string,
		params?: { depth?: number },
	): Promise<T | null>;
}

/**
 * Create a Payload CMS client for fetching data from the CMS Worker
 */
export function createPayloadClient(
	options: PayloadClientOptions,
): PayloadClient {
	const { worker, apiUrl } = options;

	/**
	 * Make a fetch request to the Payload CMS Worker
	 */
	async function fetchFromPayload<T>(
		endpoint: string,
		init?: RequestInit,
	): Promise<T> {
		let response: Response;

		// Prefer apiUrl if provided (useful for local development)
		// Fall back to worker binding for production
		if (apiUrl) {
			// Use direct HTTP fetch (local development or explicit API URL)
			const url = new URL(endpoint, apiUrl);
			response = await fetch(url.toString(), {
				...init,
				headers: {
					"Content-Type": "application/json",
					...init?.headers,
				},
			});
		} else if (worker) {
			// Use the Worker binding for Worker-to-Worker communication (production)
			const url = new URL(endpoint, "https://payload-cms-worker");
			response = await worker.fetch(url.toString(), {
				...init,
				headers: {
					"Content-Type": "application/json",
					...init?.headers,
				},
			});
		} else {
			throw new Error(
				"No Payload CMS connection configured (Worker Binding or API URL required)",
			);
		}

		if (!response.ok) {
			throw new Error(
				`Payload CMS Error: ${response.status} ${response.statusText}`,
			);
		}

		return response.json() as Promise<T>;
	}

	const client: PayloadClient = {
		/**
		 * Get all documents from a collection
		 */
		async getCollection<T = unknown>(
			collection: string,
			params?: CollectionQueryParams,
		): Promise<PayloadPaginatedDocs<T>> {
			const searchParams = new URLSearchParams();

			if (params?.limit) searchParams.set("limit", String(params.limit));
			if (params?.page) searchParams.set("page", String(params.page));
			if (params?.sort) searchParams.set("sort", params.sort);
			if (params?.depth) searchParams.set("depth", String(params.depth));

			// Build Payload-style where query: where[field][operator]=value
			if (params?.where) {
				for (const [field, condition] of Object.entries(params.where)) {
					if (
						typeof condition === "object" &&
						condition !== null &&
						!Array.isArray(condition)
					) {
						for (const [operator, value] of Object.entries(
							condition as Record<string, unknown>,
						)) {
							searchParams.set(`where[${field}][${operator}]`, String(value));
						}
					} else {
						// Direct value comparison (equals)
						searchParams.set(`where[${field}][equals]`, String(condition));
					}
				}
			}

			const query = searchParams.toString();
			const endpoint = `/api/${collection}${query ? `?${query}` : ""}`;

			return fetchFromPayload<PayloadPaginatedDocs<T>>(endpoint);
		},

		/**
		 * Get a single document by ID
		 */
		async getDocument<T = unknown>(
			collection: string,
			id: string,
			params?: { depth?: number },
		): Promise<T> {
			const searchParams = new URLSearchParams();
			if (params?.depth) searchParams.set("depth", String(params.depth));

			const query = searchParams.toString();
			const endpoint = `/api/${collection}/${id}${query ? `?${query}` : ""}`;

			return fetchFromPayload<T>(endpoint);
		},

		/**
		 * Get a document by slug (for collections with slug field)
		 */
		async getDocumentBySlug<T = unknown>(
			collection: string,
			slug: string,
			params?: { depth?: number },
		): Promise<T | null> {
			const result = await client.getCollection<T>(collection, {
				where: {
					slug: { equals: slug },
				},
				limit: 1,
				depth: params?.depth,
			});

			return result.docs[0] || null;
		},

		// ============================================
		// Blog Collection Methods
		// ============================================

		/**
		 * Get blog posts with optional filtering
		 */
		async getBlogPosts(params?: {
			limit?: number;
			page?: number;
			sort?: string;
		}): Promise<PayloadPaginatedDocs<BlogPost>> {
			return client.getCollection<BlogPost>("blog", {
				...params,
				sort: params?.sort || "-publishedAt",
			});
		},

		/**
		 * Get a single blog post by slug
		 */
		async getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
			return client.getDocumentBySlug<BlogPost>("blog", slug);
		},

		/**
		 * Get a single blog post by ID
		 */
		async getBlogPostById(id: string): Promise<BlogPost | null> {
			try {
				return await client.getDocument<BlogPost>("blog", id);
			} catch {
				return null;
			}
		},

		// ============================================
		// Market Areas Collection Methods
		// ============================================

		/**
		 * Get market areas with optional filtering
		 */
		async getMarketAreas(params?: {
			limit?: number;
			page?: number;
			sort?: string;
		}): Promise<PayloadPaginatedDocs<MarketArea>> {
			return client.getCollection<MarketArea>("market-areas", {
				...params,
				sort: params?.sort || "name",
			});
		},

		/**
		 * Get a single market area by slug
		 */
		async getMarketAreaBySlug(slug: string): Promise<MarketArea | null> {
			return client.getDocumentBySlug<MarketArea>("market-areas", slug);
		},

		// ============================================
		// News Collection Methods
		// ============================================

		/**
		 * Get news articles with optional filtering
		 */
		async getNews(params?: {
			limit?: number;
			page?: number;
			sort?: string;
			depth?: number;
		}): Promise<PayloadPaginatedDocs<News>> {
			return client.getCollection<News>("news", {
				...params,
				where: {
					status: { equals: "published" },
				},
				sort: params?.sort || "-publishDate",
			});
		},

		/**
		 * Get news articles for a specific market area (community) by ID
		 */
		async getNewsByMarketArea(
			marketAreaId: string,
			params?: {
				limit?: number;
				page?: number;
				sort?: string;
				depth?: number;
			},
		): Promise<PayloadPaginatedDocs<News>> {
			return client.getCollection<News>("news", {
				...params,
				where: {
					marketArea: { equals: marketAreaId },
					status: { equals: "published" },
				},
				sort: params?.sort || "-publishDate",
			});
		},

		/**
		 * Get news articles for a market area by its slug
		 * First fetches the market area to get its ID, then fetches news
		 */
		async getNewsByMarketAreaSlug(
			marketAreaSlug: string,
			params?: {
				limit?: number;
				page?: number;
				sort?: string;
				depth?: number;
			},
		): Promise<PayloadPaginatedDocs<News>> {
			// First, get the market area by slug to get its ID
			const marketArea = await client.getMarketAreaBySlug(marketAreaSlug);

			if (!marketArea) {
				// Return empty results if market area not found
				return {
					docs: [],
					totalDocs: 0,
					limit: params?.limit || 10,
					totalPages: 0,
					page: 1,
					pagingCounter: 1,
					hasPrevPage: false,
					hasNextPage: false,
					prevPage: null,
					nextPage: null,
				};
			}

			return client.getNewsByMarketArea(marketArea.id, params);
		},

		/**
		 * Get a single news article by slug
		 */
		async getNewsBySlug(
			slug: string,
			params?: { depth?: number },
		): Promise<News | null> {
			return client.getDocumentBySlug<News>("news", slug, params);
		},

		/**
		 * Get a single news article by ID
		 */
		async getNewsById(
			id: string,
			params?: { depth?: number },
		): Promise<News | null> {
			try {
				return await client.getDocument<News>("news", id, params);
			} catch {
				return null;
			}
		},

		// ============================================
		// Churches Collection Methods
		// ============================================

		/**
		 * Get churches with optional filtering
		 */
		async getChurches(params?: {
			limit?: number;
			page?: number;
			sort?: string;
			depth?: number;
		}): Promise<PayloadPaginatedDocs<Church>> {
			return client.getCollection<Church>("churches", {
				...params,
				where: {
					status: { equals: "published" },
				},
				sort: params?.sort || "name",
			});
		},

		/**
		 * Get churches for a specific market area (community) by ID
		 */
		async getChurchesByMarketArea(
			marketAreaId: string,
			params?: {
				limit?: number;
				page?: number;
				sort?: string;
				depth?: number;
			},
		): Promise<PayloadPaginatedDocs<Church>> {
			return client.getCollection<Church>("churches", {
				...params,
				where: {
					marketArea: { equals: marketAreaId },
					status: { equals: "published" },
				},
				sort: params?.sort || "name",
			});
		},

		/**
		 * Get churches for a market area by its slug
		 */
		async getChurchesByMarketAreaSlug(
			marketAreaSlug: string,
			params?: {
				limit?: number;
				page?: number;
				sort?: string;
				depth?: number;
			},
		): Promise<PayloadPaginatedDocs<Church>> {
			const marketArea = await client.getMarketAreaBySlug(marketAreaSlug);

			if (!marketArea) {
				return {
					docs: [],
					totalDocs: 0,
					limit: params?.limit || 10,
					totalPages: 0,
					page: 1,
					pagingCounter: 1,
					hasPrevPage: false,
					hasNextPage: false,
					prevPage: null,
					nextPage: null,
				};
			}

			return client.getChurchesByMarketArea(marketArea.id, params);
		},

		/**
		 * Get a single church by slug
		 */
		async getChurchBySlug(
			slug: string,
			params?: { depth?: number },
		): Promise<Church | null> {
			return client.getDocumentBySlug<Church>("churches", slug, params);
		},

		/**
		 * Get a single church by ID
		 */
		async getChurchById(
			id: string,
			params?: { depth?: number },
		): Promise<Church | null> {
			try {
				return await client.getDocument<Church>("churches", id, params);
			} catch {
				return null;
			}
		},

		// ============================================
		// Local Events Collection Methods
		// ============================================

		/**
		 * Get local events with optional filtering
		 */
		async getLocalEvents(params?: {
			limit?: number;
			page?: number;
			sort?: string;
			depth?: number;
		}): Promise<PayloadPaginatedDocs<LocalEvent>> {
			return client.getCollection<LocalEvent>("local-events", {
				...params,
				where: {
					status: { equals: "published" },
				},
				sort: params?.sort || "eventDate",
			});
		},

		/**
		 * Get upcoming local events (events with eventDate >= today)
		 */
		async getUpcomingLocalEvents(params?: {
			limit?: number;
			page?: number;
			depth?: number;
		}): Promise<PayloadPaginatedDocs<LocalEvent>> {
			const today = new Date().toISOString().split("T")[0];
			return client.getCollection<LocalEvent>("local-events", {
				...params,
				where: {
					status: { equals: "published" },
					eventDate: { greater_than_equal: today },
				},
				sort: "eventDate",
			});
		},

		/**
		 * Get local events for a specific market area (community) by ID
		 */
		async getLocalEventsByMarketArea(
			marketAreaId: string,
			params?: {
				limit?: number;
				page?: number;
				sort?: string;
				depth?: number;
				upcomingOnly?: boolean;
			},
		): Promise<PayloadPaginatedDocs<LocalEvent>> {
			const today = new Date().toISOString().split("T")[0];
			return client.getCollection<LocalEvent>("local-events", {
				...params,
				where: {
					marketArea: { equals: marketAreaId },
					status: { equals: "published" },
					...(params?.upcomingOnly && {
						eventDate: { greater_than_equal: today },
					}),
				},
				sort: params?.sort || "eventDate",
			});
		},

		/**
		 * Get local events for a market area by its slug
		 */
		async getLocalEventsByMarketAreaSlug(
			marketAreaSlug: string,
			params?: {
				limit?: number;
				page?: number;
				sort?: string;
				depth?: number;
				upcomingOnly?: boolean;
			},
		): Promise<PayloadPaginatedDocs<LocalEvent>> {
			const marketArea = await client.getMarketAreaBySlug(marketAreaSlug);

			if (!marketArea) {
				return {
					docs: [],
					totalDocs: 0,
					limit: params?.limit || 10,
					totalPages: 0,
					page: 1,
					pagingCounter: 1,
					hasPrevPage: false,
					hasNextPage: false,
					prevPage: null,
					nextPage: null,
				};
			}

			return client.getLocalEventsByMarketArea(marketArea.id, params);
		},

		/**
		 * Get a single local event by slug
		 */
		async getLocalEventBySlug(
			slug: string,
			params?: { depth?: number },
		): Promise<LocalEvent | null> {
			return client.getDocumentBySlug<LocalEvent>("local-events", slug, params);
		},

		/**
		 * Get a single local event by ID
		 */
		async getLocalEventById(
			id: string,
			params?: { depth?: number },
		): Promise<LocalEvent | null> {
			try {
				return await client.getDocument<LocalEvent>("local-events", id, params);
			} catch {
				return null;
			}
		},

		// ============================================
		// Schools Collection Methods
		// ============================================

		/**
		 * Get schools with optional filtering
		 */
		async getSchools(params?: {
			limit?: number;
			page?: number;
			sort?: string;
			depth?: number;
		}): Promise<PayloadPaginatedDocs<School>> {
			return client.getCollection<School>("schools", {
				...params,
				where: {
					status: { equals: "published" },
				},
				sort: params?.sort || "name",
			});
		},

		/**
		 * Get schools for a specific market area (community) by ID
		 */
		async getSchoolsByMarketArea(
			marketAreaId: string,
			params?: {
				limit?: number;
				page?: number;
				sort?: string;
				depth?: number;
			},
		): Promise<PayloadPaginatedDocs<School>> {
			return client.getCollection<School>("schools", {
				...params,
				where: {
					marketArea: { equals: marketAreaId },
					status: { equals: "published" },
				},
				sort: params?.sort || "name",
			});
		},

		/**
		 * Get schools for a market area by its slug
		 */
		async getSchoolsByMarketAreaSlug(
			marketAreaSlug: string,
			params?: {
				limit?: number;
				page?: number;
				sort?: string;
				depth?: number;
			},
		): Promise<PayloadPaginatedDocs<School>> {
			const marketArea = await client.getMarketAreaBySlug(marketAreaSlug);

			if (!marketArea) {
				return {
					docs: [],
					totalDocs: 0,
					limit: params?.limit || 10,
					totalPages: 0,
					page: 1,
					pagingCounter: 1,
					hasPrevPage: false,
					hasNextPage: false,
					prevPage: null,
					nextPage: null,
				};
			}

			return client.getSchoolsByMarketArea(marketArea.id, params);
		},

		/**
		 * Get a single school by slug
		 */
		async getSchoolBySlug(
			slug: string,
			params?: { depth?: number },
		): Promise<School | null> {
			return client.getDocumentBySlug<School>("schools", slug, params);
		},

		/**
		 * Get a single school by ID
		 */
		async getSchoolById(
			id: string,
			params?: { depth?: number },
		): Promise<School | null> {
			try {
				return await client.getDocument<School>("schools", id, params);
			} catch {
				return null;
			}
		},

		// ============================================
		// Sports Collection Methods
		// ============================================

		/**
		 * Get sports articles with optional filtering
		 */
		async getSports(params?: {
			limit?: number;
			page?: number;
			sort?: string;
			depth?: number;
		}): Promise<PayloadPaginatedDocs<Sports>> {
			return client.getCollection<Sports>("sports", {
				...params,
				where: {
					status: { equals: "published" },
				},
				sort: params?.sort || "-publishDate",
			});
		},

		/**
		 * Get sports articles for a specific market area (community) by ID
		 */
		async getSportsByMarketArea(
			marketAreaId: string,
			params?: {
				limit?: number;
				page?: number;
				sort?: string;
				depth?: number;
			},
		): Promise<PayloadPaginatedDocs<Sports>> {
			return client.getCollection<Sports>("sports", {
				...params,
				where: {
					marketArea: { equals: marketAreaId },
					status: { equals: "published" },
				},
				sort: params?.sort || "-publishDate",
			});
		},

		/**
		 * Get sports articles for a market area by its slug
		 */
		async getSportsByMarketAreaSlug(
			marketAreaSlug: string,
			params?: {
				limit?: number;
				page?: number;
				sort?: string;
				depth?: number;
			},
		): Promise<PayloadPaginatedDocs<Sports>> {
			const marketArea = await client.getMarketAreaBySlug(marketAreaSlug);

			if (!marketArea) {
				return {
					docs: [],
					totalDocs: 0,
					limit: params?.limit || 10,
					totalPages: 0,
					page: 1,
					pagingCounter: 1,
					hasPrevPage: false,
					hasNextPage: false,
					prevPage: null,
					nextPage: null,
				};
			}

			return client.getSportsByMarketArea(marketArea.id, params);
		},

		/**
		 * Get a single sports article by slug
		 */
		async getSportsBySlug(
			slug: string,
			params?: { depth?: number },
		): Promise<Sports | null> {
			return client.getDocumentBySlug<Sports>("sports", slug, params);
		},

		/**
		 * Get a single sports article by ID
		 */
		async getSportsById(
			id: string,
			params?: { depth?: number },
		): Promise<Sports | null> {
			try {
				return await client.getDocument<Sports>("sports", id, params);
			} catch {
				return null;
			}
		},
	};

	return client;
}

/**
 * Get the Payload client using Cloudflare Worker bindings or direct API URL
 * @param options - Either a Fetcher (worker binding) or an object with worker and/or apiUrl
 */
export function getPayloadClient(
	options: Fetcher | { worker?: Fetcher; apiUrl?: string },
): PayloadClient {
	// Handle both simple Fetcher and options object
	if (typeof options === "object" && "fetch" in options) {
		// It's a Fetcher
		return createPayloadClient({ worker: options as Fetcher });
	}
	return createPayloadClient(options as { worker?: Fetcher; apiUrl?: string });
}
