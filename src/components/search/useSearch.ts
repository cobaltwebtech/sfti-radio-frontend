/**
 * useSearch Hook
 *
 * Custom hook for managing search state and queries.
 * Calls the /api/search endpoint which uses the worker binding
 * for fast server-side search.
 */

import {
	useCallback,
	useDeferredValue,
	useEffect,
	useRef,
	useState,
	useTransition,
} from "react";
import type { SearchResponse, SearchResult } from "./types";

interface UseSearchOptions {
	/** Debounce delay in milliseconds */
	debounceMs?: number;
	/** Number of results per page */
	limit?: number;
	/** Minimum characters before searching */
	minChars?: number;
}

interface UseSearchReturn {
	/** Current search query */
	query: string;
	/** Set the search query */
	setQuery: (query: string) => void;
	/** Deferred query value (for Suspense/transitions) */
	deferredQuery: string;
	/** Search results */
	results: SearchResult[];
	/** Total number of results */
	totalResults: number;
	/** Whether search is in progress */
	isSearching: boolean;
	/** Whether initial search is pending (for transition) */
	isPending: boolean;
	/** Error message if search failed */
	error: string | null;
	/** Clear search state */
	clearSearch: () => void;
	/** Filter by collection type */
	collectionFilter: string | null;
	/** Set collection filter */
	setCollectionFilter: (collection: string | null) => void;
	/** Load more results */
	loadMore: () => void;
	/** Whether more results are available */
	hasMore: boolean;
	/** Current page */
	page: number;
}

export function useSearch(options: UseSearchOptions = {}): UseSearchReturn {
	const { debounceMs = 300, limit = 10, minChars = 2 } = options;

	// Search state
	const [query, setQuery] = useState("");
	const [collectionFilter, setCollectionFilter] = useState<string | null>(null);
	const [results, setResults] = useState<SearchResult[]>([]);
	const [totalResults, setTotalResults] = useState(0);
	const [page, setPage] = useState(1);
	const [hasMore, setHasMore] = useState(false);
	const [isSearching, setIsSearching] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Use transition for smoother UI updates
	const [isPending, startTransition] = useTransition();

	// Deferred value for Suspense-like behavior
	const deferredQuery = useDeferredValue(query);

	// Debounce timer ref
	const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

	// Abort controller for canceling pending requests
	const abortControllerRef = useRef<AbortController>(undefined);

	// Perform search via API route
	const performSearch = useCallback(
		async (searchQuery: string, searchPage = 1, append = false) => {
			// Cancel any pending request
			abortControllerRef.current?.abort();
			abortControllerRef.current = new AbortController();

			// Skip if query is too short
			if (searchQuery.length < minChars) {
				if (!append) {
					setResults([]);
					setTotalResults(0);
					setHasMore(false);
					setPage(1);
				}
				return;
			}

			setIsSearching(true);
			setError(null);

			try {
				// Build search URL with query params
				const searchParams = new URLSearchParams({
					q: searchQuery,
					limit: String(limit),
					page: String(searchPage),
					sort: "-priority",
				});

				if (collectionFilter) {
					searchParams.set("collection", collectionFilter);
				}

				const response = await fetch(`/api/search?${searchParams}`, {
					signal: abortControllerRef.current.signal,
				});

				if (!response.ok) {
					throw new Error(`Search failed: ${response.statusText}`);
				}

				const data: SearchResponse = await response.json();

				startTransition(() => {
					if (append) {
						setResults((prev) => [...prev, ...data.docs]);
					} else {
						setResults(data.docs);
					}
					setTotalResults(data.totalDocs);
					setHasMore(data.hasNextPage);
					setPage(searchPage);
				});
			} catch (err) {
				// Ignore abort errors
				if (err instanceof Error && err.name === "AbortError") {
					return;
				}
				setError(err instanceof Error ? err.message : "Search failed");
				if (!append) {
					setResults([]);
					setTotalResults(0);
					setHasMore(false);
				}
			} finally {
				setIsSearching(false);
			}
		},
		[collectionFilter, limit, minChars],
	);

	// Debounced search effect
	useEffect(() => {
		// Clear previous timer
		if (debounceRef.current) {
			clearTimeout(debounceRef.current);
		}

		// Set new timer
		debounceRef.current = setTimeout(() => {
			performSearch(deferredQuery, 1, false);
		}, debounceMs);

		return () => {
			if (debounceRef.current) {
				clearTimeout(debounceRef.current);
			}
		};
	}, [deferredQuery, debounceMs, performSearch]);

	// Reset page when collection filter changes
	useEffect(() => {
		if (deferredQuery.length >= minChars) {
			performSearch(deferredQuery, 1, false);
		}
		// collectionFilter is intentionally included in performSearch's deps
	}, [deferredQuery, minChars, performSearch]);

	// Clear search state
	const clearSearch = useCallback(() => {
		setQuery("");
		setResults([]);
		setTotalResults(0);
		setPage(1);
		setHasMore(false);
		setError(null);
		setCollectionFilter(null);
	}, []);

	// Load more results
	const loadMore = useCallback(() => {
		if (hasMore && !isSearching) {
			performSearch(deferredQuery, page + 1, true);
		}
	}, [hasMore, isSearching, deferredQuery, page, performSearch]);

	return {
		query,
		setQuery,
		deferredQuery,
		results,
		totalResults,
		isSearching,
		isPending,
		error,
		clearSearch,
		collectionFilter,
		setCollectionFilter,
		loadMore,
		hasMore,
		page,
	};
}
