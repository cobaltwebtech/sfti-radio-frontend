/**
 * Search Module
 *
 * Components and utilities for searching the Payload CMS index.
 * Uses the PayloadClient for all API communication.
 *
 * @example
 * ```tsx
 * // Get the Payload client
 * import { getPayloadClient } from '@/payload';
 * const client = getPayloadClient({ apiUrl: 'https://your-cms.com' });
 *
 * // Inline search input
 * import { Search } from '@/components/search';
 * <Search client={client} />
 *
 * // Modal search (Cmd/Ctrl + K)
 * import { SearchModal } from '@/components/search';
 * <SearchModal client={client} />
 * ```
 */

// API utilities (caching) - re-exported from @/lib/search for convenience
export {
	clearSearchCache,
	getCachedSearch,
	invalidateSearchCache,
} from "@/lib/search";
// Components
export { Search } from "./Search";
export { SearchModal } from "./SearchModal";
// Types (re-exported from @/payload)
export type {
	CollectionMeta,
	SearchParams,
	SearchResponse,
	SearchResult,
} from "./types";
export { COLLECTION_META } from "./types";
// Hook
export { useSearch } from "./useSearch";
