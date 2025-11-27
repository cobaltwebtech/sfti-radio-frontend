/**
 * Payload CMS Client
 *
 * Helper functions for communicating with the Payload CMS Worker
 * via Cloudflare Worker-to-Worker binding (Service Binding)
 */
import type { LexicalContent } from "./lexical-renderer";

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

// Blog post type - adjust fields based on your Payload CMS schema
export interface BlogPost {
	id: number | string;
	title: string;
	slug?: string;
	description?: string;
	content?: LexicalContent;
	excerpt?: string;
	postDate?: string;
	publishedAt?: string;
	createdAt: string;
	updatedAt: string;
	author?: {
		id: number;
		email: string;
	};
	// Add more fields as needed based on your Payload CMS Blog collection
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

/**
 * Create a Payload CMS client for fetching data from the CMS Worker
 */
export function createPayloadClient(options: PayloadClientOptions) {
	const { worker, apiUrl } = options;

	/**
	 * Make a fetch request to the Payload CMS Worker
	 */
	async function fetchFromPayload<T>(
		endpoint: string,
		init?: RequestInit
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
			throw new Error("No Payload CMS connection configured (Worker Binding or API URL required)");
		}

		if (!response.ok) {
			throw new Error(
				`Payload CMS Error: ${response.status} ${response.statusText}`
			);
		}

		return response.json() as Promise<T>;
	}

	return {
		/**
		 * Get all documents from a collection
		 */
		async getCollection<T = unknown>(
			collection: string,
			params?: {
				limit?: number;
				page?: number;
				where?: Record<string, unknown>;
				sort?: string;
				depth?: number;
			}
		): Promise<PayloadPaginatedDocs<T>> {
			const searchParams = new URLSearchParams();

			if (params?.limit) searchParams.set("limit", String(params.limit));
			if (params?.page) searchParams.set("page", String(params.page));
			if (params?.sort) searchParams.set("sort", params.sort);
			if (params?.depth) searchParams.set("depth", String(params.depth));
			if (params?.where) {
				searchParams.set("where", JSON.stringify(params.where));
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
			params?: { depth?: number }
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
			params?: { depth?: number }
		): Promise<T | null> {
			const result = await this.getCollection<T>(collection, {
				where: {
					slug: { equals: slug },
				},
				limit: 1,
				depth: params?.depth,
			});

			return result.docs[0] || null;
		},

		/**
		 * Get blog posts with optional filtering
		 */
		async getBlogPosts(params?: {
			limit?: number;
			page?: number;
			sort?: string;
		}): Promise<PayloadPaginatedDocs<BlogPost>> {
			return this.getCollection<BlogPost>("blog", {
				...params,
				sort: params?.sort || "-publishedAt",
			});
		},

		/**
		 * Get a single blog post by slug
		 */
		async getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
			return this.getDocumentBySlug<BlogPost>("blog", slug);
		},

		/**
		 * Get a single blog post by ID
		 */
		async getBlogPostById(id: string): Promise<BlogPost | null> {
			try {
				return await this.getDocument<BlogPost>("blog", id);
			} catch {
				return null;
			}
		},
	};
}

/**
 * Get the Payload client using Cloudflare Worker bindings or direct API URL
 * @param options - Either a Fetcher (worker binding) or an object with worker and/or apiUrl
 */
export function getPayloadClient(options: Fetcher | { worker?: Fetcher; apiUrl?: string }) {
	// Handle both simple Fetcher and options object
	if (typeof options === "object" && "fetch" in options) {
		// It's a Fetcher
		return createPayloadClient({ worker: options as Fetcher });
	}
	return createPayloadClient(options as { worker?: Fetcher; apiUrl?: string });
}
