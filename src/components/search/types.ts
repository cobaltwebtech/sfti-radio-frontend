/**
 * Search Component Types
 *
 * Re-exports search types from the Payload module for use in components.
 * This keeps the search component module self-contained while using
 * the canonical types from the Payload client.
 */

import type { PayloadPaginatedDocs, SearchResult } from "@/payload";

// Re-export types from payload
export type {
	CollectionMeta,
	SearchDocRef,
	SearchQueryParams as SearchParams,
	SearchResult,
} from "@/payload";

// Re-export the collection metadata constant
export { COLLECTION_META } from "@/payload";

// Define SearchResponse as a typed alias
export type SearchResponse = PayloadPaginatedDocs<SearchResult>;
