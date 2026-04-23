/**
 * Payload CMS Client
 *
 * Helper functions for communicating with the Payload CMS Worker
 * via Cloudflare Worker-to-Worker binding (Service Binding)
 */

import type { BlogCollectionMethods, BlogPost } from "./collections/blog";
import type { Church, ChurchesCollectionMethods } from "./collections/churches";
import type {
	FileUploadData,
	FileUploadResponse,
	FormSubmissionRequest,
	FormSubmissionResponse,
	FormsCollectionMethods,
	PayloadForm,
} from "./collections/forms";
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
import type {
	SearchCollectionMethods,
	SearchQueryParams,
	SearchResult,
} from "./collections/search";
import type { Sports, SportsCollectionMethods } from "./collections/sports";
import type {
	CacheMetadata,
	CollectionQueryParams,
	PayloadClientOptions,
	PayloadFetchOptions,
	PayloadPaginatedDocs,
	PayloadResponseWithCache,
} from "./types";

export interface PayloadClient
	extends BlogCollectionMethods,
		MarketAreaCollectionMethods,
		NewsCollectionMethods,
		ChurchesCollectionMethods,
		LocalEventsCollectionMethods,
		SchoolsCollectionMethods,
		SportsCollectionMethods,
		SearchCollectionMethods,
		FormsCollectionMethods {
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

	// ============================================
	// Cache-Aware Methods
	// ============================================

	/**
	 * Get all documents from a collection with cache metadata
	 * Useful for debugging cache behavior or implementing cache-aware features
	 */
	getCollectionWithCache<T = unknown>(
		collection: string,
		params?: CollectionQueryParams & { skipCache?: boolean },
	): Promise<PayloadResponseWithCache<PayloadPaginatedDocs<T>>>;

	/**
	 * Get a single document by ID with cache metadata
	 */
	getDocumentWithCache<T = unknown>(
		collection: string,
		id: string,
		params?: { depth?: number; skipCache?: boolean },
	): Promise<PayloadResponseWithCache<T>>;

	/**
	 * Get a document by slug with cache metadata
	 */
	getDocumentBySlugWithCache<T = unknown>(
		collection: string,
		slug: string,
		params?: { depth?: number; skipCache?: boolean },
	): Promise<PayloadResponseWithCache<T | null>>;
}

/**
 * Create a Payload CMS client for fetching data from the CMS Worker
 */
export function createPayloadClient(
	options: PayloadClientOptions,
): PayloadClient {
	const { worker, apiUrl } = options;

	/**
	 * Extract cache metadata from response headers
	 */
	function extractCacheMetadata(response: Response): CacheMetadata {
		// Parse Cache-Tag header
		const cacheTagHeader = response.headers.get("Cache-Tag");
		const cacheTags = cacheTagHeader
			? cacheTagHeader.split(",").map((tag) => tag.trim())
			: [];

		// Get Cloudflare cache status
		const cacheStatus = response.headers.get("cf-cache-status") as
			| "HIT"
			| "MISS"
			| "EXPIRED"
			| "STALE"
			| "BYPASS"
			| "DYNAMIC"
			| null;

		// Parse Cache-Control header
		const cacheControlHeader = response.headers.get("Cache-Control");
		let cacheControl: CacheMetadata["cacheControl"] = null;

		if (cacheControlHeader) {
			const directives = cacheControlHeader
				.split(",")
				.map((d) => d.trim().toLowerCase());

			const getDirectiveValue = (name: string): number | undefined => {
				const directive = directives.find((d) => d.startsWith(`${name}=`));
				if (!directive) return undefined;
				const value = directive.split("=")[1];
				return value ? Number.parseInt(value, 10) : undefined;
			};

			cacheControl = {
				maxAge: getDirectiveValue("max-age"),
				sMaxAge: getDirectiveValue("s-maxage"),
				staleWhileRevalidate: getDirectiveValue("stale-while-revalidate"),
				isPublic: directives.includes("public"),
				isPrivate: directives.includes("private"),
			};
		}

		return { cacheTags, cacheStatus, cacheControl };
	}

	/**
	 * Make a fetch request to the Payload CMS Worker
	 * Supports cache options for bypassing cache or including cache metadata
	 */
	async function fetchFromPayload<T>(
		endpoint: string,
		init?: RequestInit,
		fetchOptions?: PayloadFetchOptions,
	): Promise<T> {
		let response: Response;

		// Build headers with cache control
		const headers: Record<string, string> = {
			"Content-Type": "application/json",
			...((init?.headers as Record<string, string>) || {}),
		};

		// Add cache bypass header if requested
		if (fetchOptions?.skipCache) {
			headers["Cache-Control"] = "no-cache";
		}

		// Prefer apiUrl if provided (useful for local development)
		// Fall back to worker binding for production
		if (apiUrl) {
			// Use direct HTTP fetch (local development or explicit API URL)
			const url = new URL(endpoint, apiUrl);
			response = await fetch(url.toString(), {
				...init,
				headers,
			});
		} else if (worker) {
			// Use the Worker binding for Worker-to-Worker communication (production)
			// We use a placeholder URL because the fetch method requires a full URL,
			// but the actual request is routed via the Worker Service Binding.
			const url = new URL(endpoint, "https://sfti-radio-cms-worker");
			response = await worker.fetch(url.toString(), {
				...init,
				headers,
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

		const data = (await response.json()) as T;

		// Return with cache metadata if requested
		// Note: Caller must cast to PayloadResponseWithCache<T> when using includeCacheMetadata
		if (fetchOptions?.includeCacheMetadata) {
			return {
				data,
				cache: extractCacheMetadata(response),
			} as unknown as T;
		}

		return data;
	}

	/**
	 * Make a fetch request with cache metadata included in response
	 */
	async function fetchFromPayloadWithCache<T>(
		endpoint: string,
		init?: RequestInit,
		fetchOptions?: Omit<PayloadFetchOptions, "includeCacheMetadata">,
	): Promise<PayloadResponseWithCache<T>> {
		return fetchFromPayload<PayloadResponseWithCache<T>>(endpoint, init, {
			...fetchOptions,
			includeCacheMetadata: true,
		});
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
		// Cache-Aware Methods
		// ============================================

		/**
		 * Get all documents from a collection with cache metadata
		 */
		async getCollectionWithCache<T = unknown>(
			collection: string,
			params?: CollectionQueryParams & { skipCache?: boolean },
		): Promise<PayloadResponseWithCache<PayloadPaginatedDocs<T>>> {
			const searchParams = new URLSearchParams();

			if (params?.limit) searchParams.set("limit", String(params.limit));
			if (params?.page) searchParams.set("page", String(params.page));
			if (params?.sort) searchParams.set("sort", params.sort);
			if (params?.depth) searchParams.set("depth", String(params.depth));

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
						searchParams.set(`where[${field}][equals]`, String(condition));
					}
				}
			}

			const query = searchParams.toString();
			const endpoint = `/api/${collection}${query ? `?${query}` : ""}`;

			return fetchFromPayloadWithCache<PayloadPaginatedDocs<T>>(
				endpoint,
				undefined,
				{ skipCache: params?.skipCache },
			);
		},

		/**
		 * Get a single document by ID with cache metadata
		 */
		async getDocumentWithCache<T = unknown>(
			collection: string,
			id: string,
			params?: { depth?: number; skipCache?: boolean },
		): Promise<PayloadResponseWithCache<T>> {
			const searchParams = new URLSearchParams();
			if (params?.depth) searchParams.set("depth", String(params.depth));

			const query = searchParams.toString();
			const endpoint = `/api/${collection}/${id}${query ? `?${query}` : ""}`;

			return fetchFromPayloadWithCache<T>(endpoint, undefined, {
				skipCache: params?.skipCache,
			});
		},

		/**
		 * Get a document by slug with cache metadata
		 */
		async getDocumentBySlugWithCache<T = unknown>(
			collection: string,
			slug: string,
			params?: { depth?: number; skipCache?: boolean },
		): Promise<PayloadResponseWithCache<T | null>> {
			const result = await client.getCollectionWithCache<T>(collection, {
				where: {
					slug: { equals: slug },
				},
				limit: 1,
				depth: params?.depth,
				skipCache: params?.skipCache,
			});

			return {
				data: result.data.docs[0] || null,
				cache: result.cache,
			};
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
				where: {
					active: { equals: true },
				},
				sort: params?.sort || "name",
			});
		},

		/**
		 * Get a single market area by slug
		 */
		async getMarketAreaBySlug(slug: string): Promise<MarketArea | null> {
			const result = await client.getCollection<MarketArea>("market-areas", {
				where: {
					slug: { equals: slug },
					active: { equals: true },
				},
				limit: 1,
			});
			return result.docs[0] || null;
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

		// ============================================
		// Search Collection Methods (Payload Search Plugin)
		// ============================================

		/**
		 * Search across all indexed collections
		 */
		async search(
			params?: SearchQueryParams,
		): Promise<PayloadPaginatedDocs<SearchResult>> {
			const searchParams = new URLSearchParams();

			// Pagination
			if (params?.limit) searchParams.set("limit", String(params.limit));
			if (params?.page) searchParams.set("page", String(params.page));

			// Sort (default to -priority for relevance ranking)
			searchParams.set("sort", params?.sort ?? "-priority");

			// Filter by collection type
			if (params?.collection) {
				searchParams.set("where[doc.relationTo][equals]", params.collection);
			}

			// Search by title (case-insensitive contains)
			if (params?.query) {
				searchParams.set("where[title][contains]", params.query);
			}

			const query = searchParams.toString();
			const endpoint = `/api/search${query ? `?${query}` : ""}`;

			return fetchFromPayload<PayloadPaginatedDocs<SearchResult>>(endpoint);
		},

		/**
		 * Search within a specific collection
		 */
		async searchCollection(
			collection: string,
			query: string,
			params?: Omit<SearchQueryParams, "collection" | "query">,
		): Promise<PayloadPaginatedDocs<SearchResult>> {
			return client.search({
				...params,
				collection,
				query,
			});
		},

		// ============================================
		// Forms Collection Methods
		// ============================================

		/**
		 * Get all forms
		 */
		async getForms(
			params?: CollectionQueryParams,
		): Promise<PayloadPaginatedDocs<PayloadForm>> {
			return client.getCollection<PayloadForm>("forms", params);
		},

		/**
		 * Get a single form by ID
		 */
		async getForm(id: string | number): Promise<PayloadForm> {
			return client.getDocument<PayloadForm>("forms", String(id));
		},

		/**
		 * Submit a form to Payload CMS
		 */
		async submitForm(
			data: FormSubmissionRequest,
		): Promise<FormSubmissionResponse> {
			const endpoint = "/api/form-submissions";

			if (apiUrl) {
				const response = await fetch(`${apiUrl}${endpoint}`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(data),
				});

				if (!response.ok) {
					const errorText = await response.text();
					throw new Error(
						`Form submission failed: ${response.statusText} - ${errorText}`,
					);
				}

				return response.json();
			}

			if (worker) {
				const url = new URL(endpoint, "https://sfti-radio-cms-worker");
				const response = await worker.fetch(url.toString(), {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(data),
				});

				if (!response.ok) {
					const errorText = await response.text();
					throw new Error(
						`Form submission failed: ${response.statusText} - ${errorText}`,
					);
				}

				return response.json();
			}

			throw new Error("No Payload CMS connection configured");
		},

		/**
		 * Upload a file for a form submission
		 */
		async uploadFormFile(
			file: File,
			data: FileUploadData,
		): Promise<FileUploadResponse> {
			const formData = new FormData();
			formData.append("file", file);
			formData.append("_payload", JSON.stringify(data));

			const endpoint = "/api/file-uploads";

			if (apiUrl) {
				const response = await fetch(`${apiUrl}${endpoint}`, {
					method: "POST",
					body: formData,
				});

				if (!response.ok) {
					const errorText = await response.text();
					throw new Error(
						`File upload failed: ${response.statusText} - ${errorText}`,
					);
				}

				return response.json();
			}

			if (worker) {
				const url = new URL(endpoint, "https://sfti-radio-cms-worker");
				const response = await worker.fetch(url.toString(), {
					method: "POST",
					body: formData,
				});

				if (!response.ok) {
					const errorText = await response.text();
					throw new Error(
						`File upload failed: ${response.statusText} - ${errorText}`,
					);
				}

				return response.json();
			}

			throw new Error("No Payload CMS connection configured");
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
