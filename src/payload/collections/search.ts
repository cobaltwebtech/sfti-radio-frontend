/**
 * Search Collection Configuration
 *
 * Types and methods for the Search collection in Payload CMS
 * (created by the Search plugin)
 */
import type { PayloadPaginatedDocs } from "../types";

/**
 * Polymorphic document reference returned by the search plugin
 */
export interface SearchDocRef {
	/** The collection slug (e.g., 'blog', 'news', 'churches') */
	relationTo: string;
	/** The document ID */
	value: string | number;
}

/**
 * Individual search result from the Payload CMS search collection
 */
export interface SearchResult {
	id: string | number;
	/** The synced title (or name) from the indexed document */
	title: string;
	/** Priority/ranking score for sorting results */
	priority?: number;
	/** Reference to the original document */
	doc: SearchDocRef;
	createdAt?: string;
	updatedAt?: string;
}

/**
 * Search query parameters
 */
export interface SearchQueryParams {
	/** Search query string (searches title field) */
	query?: string;
	/** Filter by collection type (e.g., 'blog', 'news') */
	collection?: string;
	/** Number of results per page */
	limit?: number;
	/** Page number */
	page?: number;
	/** Sort field (prefix with - for descending, default: -priority) */
	sort?: string;
}

export interface SearchCollectionMethods {
	/**
	 * Search across all indexed collections
	 */
	search(
		params?: SearchQueryParams,
	): Promise<PayloadPaginatedDocs<SearchResult>>;

	/**
	 * Search within a specific collection
	 */
	searchCollection(
		collection: string,
		query: string,
		params?: Omit<SearchQueryParams, "collection" | "query">,
	): Promise<PayloadPaginatedDocs<SearchResult>>;
}

/**
 * Collection metadata for display purposes
 */
export interface CollectionMeta {
	slug: string;
	label: string;
	icon: string;
	href: (id: string | number, slug?: string) => string;
}

/**
 * Map of collection slugs to their metadata
 */
export const COLLECTION_META: Record<string, CollectionMeta> = {
	"market-areas": {
		slug: "market-areas",
		label: "Community",
		icon: "lucide:map-pin",
		href: (id, slug) => (slug ? `/communities/${slug}` : `/communities/${id}`),
	},
	news: {
		slug: "news",
		label: "News",
		icon: "lucide:megaphone",
		href: (id) => `/news/${id}`,
	},
	churches: {
		slug: "churches",
		label: "Church",
		icon: "lucide:church",
		href: (id) => `/churches/${id}`,
	},
	schools: {
		slug: "schools",
		label: "School",
		icon: "lucide:graduation-cap",
		href: (id) => `/schools/${id}`,
	},
	sports: {
		slug: "sports",
		label: "Sports",
		icon: "lucide:trophy",
		href: (id) => `/sports/${id}`,
	},
	"local-events": {
		slug: "local-events",
		label: "Event",
		icon: "lucide:calendar",
		href: (id) => `/events/${id}`,
	},
	blog: {
		slug: "blog",
		label: "Blog Post",
		icon: "lucide:newspaper",
		href: (id, slug) => (slug ? `/post/${slug}` : `/post/${id}`),
	},
};
