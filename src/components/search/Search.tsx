/**
 * Search Component
 *
 * A search interface for querying the Payload CMS search index.
 * Uses React 19 features like Activity, Suspense, and transitions
 * for a smooth, performant user experience.
 */

import { Icon } from "@iconify/react";
import {
	Activity,
	Suspense,
	useCallback,
	useEffect,
	useId,
	useRef,
	useState,
} from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { COLLECTION_META, type SearchResult } from "./types";
import { useSearch } from "./useSearch";

interface SearchProps {
	/** Placeholder text for the search input */
	placeholder?: string;
	/** Additional CSS classes */
	className?: string;
	/** Callback when a result is selected */
	onResultSelect?: (result: SearchResult) => void;
	/** Whether to show the collection filter tabs */
	showFilters?: boolean;
	/** Limit results per page */
	limit?: number;
	/** Minimum characters before searching */
	minChars?: number;
}
// Sub-components

/** Loading skeleton for search results */
function SearchResultsSkeleton() {
	return (
		<div className="space-y-2 p-2" aria-hidden="true">
			{[1, 2, 3].map((i) => (
				<div key={i} className="flex items-center gap-3 rounded-md p-3">
					<div className="bg-muted h-8 w-8 animate-pulse rounded-md" />
					<div className="flex-1 space-y-2">
						<div className="bg-muted h-4 w-3/4 animate-pulse rounded" />
						<div className="bg-muted h-3 w-1/4 animate-pulse rounded" />
					</div>
				</div>
			))}
		</div>
	);
}

/** Individual search result item */
function SearchResultItem({
	result,
	onSelect,
	isHighlighted,
}: {
	result: SearchResult;
	onSelect: (result: SearchResult) => void;
	isHighlighted: boolean;
}) {
	const meta = COLLECTION_META[result.doc.relationTo];
	const href = meta?.href(result.doc.value) ?? "#";
	const label = meta?.label ?? result.doc.relationTo;
	const icon = meta?.icon ?? "lucide:file";

	return (
		<a
			href={href}
			onClick={(e) => {
				e.preventDefault();
				onSelect(result);
			}}
			className={cn(
				"flex items-center gap-3 rounded-md p-3 text-left transition-colors",
				"hover:bg-accent focus-visible:bg-accent focus-visible:outline-none",
				isHighlighted && "bg-accent",
			)}
			role="option"
			aria-selected={isHighlighted}
		>
			<div className="bg-muted text-muted-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-md">
				<Icon icon={icon} className="h-4 w-4" />
			</div>
			<div className="min-w-0 flex-1">
				<p className="truncate font-medium">{result.title}</p>
				<p className="text-muted-foreground text-sm">{label}</p>
			</div>
			<Icon
				icon="lucide:arrow-right"
				className="text-muted-foreground h-4 w-4 shrink-0"
			/>
		</a>
	);
}

/** Collection filter tabs */
function CollectionFilters({
	activeFilter,
	onFilterChange,
	availableCollections,
}: {
	activeFilter: string | null;
	onFilterChange: (filter: string | null) => void;
	availableCollections: string[];
}) {
	const filters = [
		{ slug: null, label: "All", icon: "lucide:search" },
		...availableCollections
			.map((slug) => COLLECTION_META[slug])
			.filter(Boolean),
	];

	return (
		<div className="border-border flex flex-wrap gap-1 border-b p-2">
			{filters.map((filter) => {
				const isActive =
					filter.slug === activeFilter ||
					(filter.slug === null && activeFilter === null);
				return (
					<Button
						key={filter.slug ?? "all"}
						type="button"
						onClick={() => onFilterChange(filter.slug)}
						className={cn(
							"inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
							isActive
								? "bg-primary text-primary-foreground"
								: "text-muted-foreground hover:bg-accent hover:text-foreground",
						)}
					>
						<Icon icon={filter.icon} className="h-3.5 w-3.5" />
						{filter.label}
					</Button>
				);
			})}
		</div>
	);
}

/** Empty state when no results found */
function EmptyState({ query }: { query: string }) {
	return (
		<div className="flex flex-col items-center justify-center p-8 text-center">
			<Icon
				icon="lucide:search-x"
				className="text-muted-foreground mb-3 h-12 w-12"
			/>
			<p className="font-medium">No results found</p>
			<p className="text-muted-foreground text-sm">
				No results for "{query}". Try a different search term.
			</p>
		</div>
	);
}

/** Initial state before searching */
function InitialState() {
	return (
		<div className="flex flex-col items-center justify-center p-8 text-center">
			<Icon
				icon="lucide:search"
				className="text-muted-foreground mb-3 h-12 w-12"
			/>
			<p className="text-muted-foreground text-sm">
				Type to search across all content
			</p>
		</div>
	);
}

// =============================================================================
// Main Component
// =============================================================================

export function Search({
	placeholder = "Search...",
	className,
	onResultSelect,
	showFilters = true,
	limit = 10,
	minChars = 2,
}: SearchProps) {
	const inputId = useId();
	const listboxId = useId();
	const inputRef = useRef<HTMLInputElement>(null);
	const resultsRef = useRef<HTMLDivElement>(null);

	// Search state from custom hook
	const {
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
	} = useSearch({ limit, minChars });

	// UI state
	const [isOpen, setIsOpen] = useState(false);
	const [highlightedIndex, setHighlightedIndex] = useState(-1);

	// Available collections for filtering (could be made dynamic)
	const availableCollections = [
		"blog",
		"news",
		"churches",
		"schools",
		"sports",
		"local-events",
		"market-areas",
	];

	// Handle result selection
	const handleSelect = useCallback(
		(result: SearchResult) => {
			if (onResultSelect) {
				onResultSelect(result);
			} else {
				// Default behavior: navigate to the result
				const meta = COLLECTION_META[result.doc.relationTo];
				const href = meta?.href(result.doc.value) ?? "#";
				window.location.href = href;
			}
			setIsOpen(false);
			clearSearch();
		},
		[onResultSelect, clearSearch],
	);

	// Keyboard navigation
	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			switch (e.key) {
				case "ArrowDown":
					e.preventDefault();
					setHighlightedIndex((prev) =>
						prev < results.length - 1 ? prev + 1 : prev,
					);
					break;
				case "ArrowUp":
					e.preventDefault();
					setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
					break;
				case "Enter":
					e.preventDefault();
					if (highlightedIndex >= 0 && results[highlightedIndex]) {
						handleSelect(results[highlightedIndex]);
					}
					break;
				case "Escape":
					e.preventDefault();
					setIsOpen(false);
					inputRef.current?.blur();
					break;
			}
		},
		[results, highlightedIndex, handleSelect],
	);

	// Reset highlighted index when results change
	// biome-ignore lint/correctness/useExhaustiveDependencies: Reset on results array reference change
	useEffect(() => {
		setHighlightedIndex(-1);
	}, [results]);

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			const target = e.target as Node;
			if (
				inputRef.current &&
				!inputRef.current.contains(target) &&
				resultsRef.current &&
				!resultsRef.current.contains(target)
			) {
				setIsOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	// Scroll highlighted item into view
	useEffect(() => {
		if (highlightedIndex >= 0 && resultsRef.current) {
			const items = resultsRef.current.querySelectorAll('[role="option"]');
			items[highlightedIndex]?.scrollIntoView({ block: "nearest" });
		}
	}, [highlightedIndex]);

	const showResults = isOpen && query.length >= minChars;
	const showInitial = isOpen && query.length < minChars;

	return (
		<div className={cn("relative w-full max-w-md", className)}>
			{/* Search Input */}
			<div className="relative">
				<Icon
					icon="lucide:search"
					className={cn(
						"pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors",
						isSearching || isPending
							? "text-primary animate-pulse"
							: "text-muted-foreground",
					)}
				/>
				<Input
					ref={inputRef}
					id={inputId}
					type="search"
					value={query}
					onChange={(e) => {
						setQuery(e.target.value);
						setIsOpen(true);
					}}
					onFocus={() => setIsOpen(true)}
					onKeyDown={handleKeyDown}
					placeholder={placeholder}
					className={cn(
						"border-input bg-background placeholder:text-muted-foreground w-full rounded-md border py-2 pl-9 pr-9 text-sm",
						"focus:border-ring focus:ring-ring/50 focus:outline-none focus:ring-2",
						"disabled:cursor-not-allowed disabled:opacity-50",
					)}
					role="combobox"
					aria-expanded={isOpen}
					aria-controls={listboxId}
					aria-activedescendant={
						highlightedIndex >= 0
							? `search-result-${highlightedIndex}`
							: undefined
					}
					autoComplete="off"
					autoCorrect="off"
					autoCapitalize="off"
					spellCheck="false"
				/>
				{query && (
					<Button
						type="button"
						onClick={() => {
							clearSearch();
							inputRef.current?.focus();
						}}
						className="text-muted-foreground hover:text-foreground absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
						aria-label="Clear search"
					>
						<Icon icon="lucide:x" className="h-4 w-4" />
					</Button>
				)}
			</div>

			{/* Results Dropdown */}
			<Activity mode={isOpen ? "visible" : "hidden"}>
				<div
					ref={resultsRef}
					id={listboxId}
					role="listbox"
					aria-label="Search results"
					className={cn(
						"bg-popover text-popover-foreground absolute top-full z-50 mt-1 w-full overflow-hidden rounded-md border shadow-lg",
						!isOpen && "hidden",
					)}
				>
					{/* Collection Filters */}
					{showFilters && showResults && (
						<CollectionFilters
							activeFilter={collectionFilter}
							onFilterChange={setCollectionFilter}
							availableCollections={availableCollections}
						/>
					)}

					{/* Initial State */}
					{showInitial && <InitialState />}

					{/* Search Results */}
					<Suspense fallback={<SearchResultsSkeleton />}>
						{showResults && (
							<div className="max-h-[60vh] overflow-y-auto">
								{/* Error State */}
								{error && (
									<div className="flex items-center gap-2 p-4 text-sm text-red-500">
										<Icon icon="lucide:alert-circle" className="h-4 w-4" />
										{error}
									</div>
								)}

								{/* Loading State (inline) */}
								{isSearching && results.length === 0 && (
									<SearchResultsSkeleton />
								)}

								{/* Results List */}
								{!isSearching && results.length === 0 && deferredQuery && (
									<EmptyState query={deferredQuery} />
								)}

								{results.length > 0 && (
									<>
										<div className="border-border border-b px-3 py-2">
											<span className="text-muted-foreground text-xs font-medium">
												{totalResults} result{totalResults !== 1 ? "s" : ""}{" "}
												{isPending && "(updating...)"}
											</span>
										</div>
										<div className="p-1">
											{results.map((result, index) => (
												<SearchResultItem
													key={`${result.doc.relationTo}-${result.doc.value}`}
													result={result}
													onSelect={handleSelect}
													isHighlighted={index === highlightedIndex}
												/>
											))}
										</div>

										{/* Load More Button */}
										{hasMore && (
											<div className="border-border border-t p-2">
												<Button
													variant="ghost"
													size="sm"
													onClick={loadMore}
													disabled={isSearching}
													className="w-full"
												>
													{isSearching ? (
														<>
															<Icon
																icon="lucide:loader-2"
																className="mr-2 h-4 w-4 animate-spin"
															/>
															Loading...
														</>
													) : (
														<>
															<Icon
																icon="lucide:chevron-down"
																className="mr-2 h-4 w-4"
															/>
															Load more results
														</>
													)}
												</Button>
											</div>
										)}
									</>
								)}
							</div>
						)}
					</Suspense>
				</div>
			</Activity>
		</div>
	);
}

export default Search;
