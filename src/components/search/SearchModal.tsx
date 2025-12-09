/**
 * Search Modal Component
 *
 * A modal/dialog version of the search interface that can be triggered
 * with a keyboard shortcut (Cmd/Ctrl + K) or button click.
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

// Types
interface SearchModalProps {
	/** Placeholder text for the search input */
	placeholder?: string;
	/** Keyboard shortcut to open (default: 'k') */
	shortcutKey?: string;
	/** Whether the modal is controlled externally */
	open?: boolean;
	/** Callback when modal open state changes */
	onOpenChange?: (open: boolean) => void;
	/** Callback when a result is selected */
	onResultSelect?: (result: SearchResult) => void;
	/** Whether to show the collection filter tabs */
	showFilters?: boolean;
	/** Limit results per page */
	limit?: number;
}

// Sub-components

/** Loading skeleton for search results */
function SearchResultsSkeleton() {
	return (
		<div className="space-y-2 p-2" aria-hidden="true">
			{[1, 2, 3, 4, 5].map((i) => (
				<div key={i} className="flex items-center gap-3 rounded-md p-3">
					<div className="bg-muted h-10 w-10 animate-pulse rounded-md" />
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
	index,
}: {
	result: SearchResult;
	onSelect: (result: SearchResult) => void;
	isHighlighted: boolean;
	index: number;
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
				"flex items-center gap-3 rounded-lg p-3 text-left transition-colors",
				"hover:bg-accent focus-visible:bg-accent focus-visible:outline-none",
				isHighlighted && "bg-accent",
			)}
			role="option"
			aria-selected={isHighlighted}
			id={`search-modal-result-${index}`}
		>
			<div className="bg-muted text-muted-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
				<Icon icon={icon} className="h-5 w-5" />
			</div>
			<div className="min-w-0 flex-1">
				<p className="truncate font-medium">{result.title}</p>
				<p className="text-muted-foreground text-sm">{label}</p>
			</div>
			<div className="flex items-center gap-2">
				<kbd className="bg-muted text-muted-foreground hidden rounded px-1.5 py-0.5 text-xs font-medium sm:inline-block">
					↵
				</kbd>
				<Icon
					icon="lucide:arrow-right"
					className="text-muted-foreground h-4 w-4 shrink-0"
				/>
			</div>
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
		{ slug: null, label: "All", icon: "lucide:layers" },
		...availableCollections
			.map((slug) => COLLECTION_META[slug])
			.filter(Boolean),
	];

	return (
		<div className="scrollbar-none flex gap-1 overflow-x-auto px-4 pb-3">
			{filters.map((filter) => {
				const isActive =
					filter.slug === activeFilter ||
					(filter.slug === null && activeFilter === null);
				return (
					<Button
						key={filter.slug ?? "all"}
						type="button"
						variant={isActive ? "default" : "outline"}
						size="sm"
						onClick={() => onFilterChange(filter.slug)}
						className="shrink-0 rounded-full"
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
		<div className="flex flex-col items-center justify-center py-12 text-center">
			<Icon
				icon="lucide:search-x"
				className="text-muted-foreground mb-4 h-16 w-16"
			/>
			<p className="text-lg font-medium">No results found</p>
			<p className="text-muted-foreground mt-1">
				No results for "{query}". Try a different search term.
			</p>
		</div>
	);
}

/** Initial state before searching */
function InitialState() {
	return (
		<div className="flex flex-col items-center justify-center py-12 text-center">
			<Icon
				icon="lucide:search"
				className="text-muted-foreground mb-4 h-16 w-16"
			/>
			<p className="text-muted-foreground">
				Start typing to search across all content
			</p>
			<div className="text-muted-foreground mt-4 flex items-center gap-2 text-sm">
				<kbd className="bg-muted rounded px-2 py-1 font-mono">↑↓</kbd>
				<span>to navigate</span>
				<kbd className="bg-muted ml-2 rounded px-2 py-1 font-mono">↵</kbd>
				<span>to select</span>
				<kbd className="bg-muted ml-2 rounded px-2 py-1 font-mono">esc</kbd>
				<span>to close</span>
			</div>
		</div>
	);
}

// Main Component

export function SearchModal({
	placeholder = "Search across all content...",
	shortcutKey = "k",
	open: controlledOpen,
	onOpenChange,
	onResultSelect,
	showFilters = true,
	limit = 10,
}: SearchModalProps) {
	const inputId = useId();
	const listboxId = useId();
	const inputRef = useRef<HTMLInputElement>(null);
	const resultsRef = useRef<HTMLDivElement>(null);

	// Modal state (controlled or uncontrolled)
	const [internalOpen, setInternalOpen] = useState(false);
	const isOpen = controlledOpen ?? internalOpen;
	const setIsOpen = useCallback(
		(value: boolean) => {
			setInternalOpen(value);
			onOpenChange?.(value);
		},
		[onOpenChange],
	);

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
	} = useSearch({ limit, minChars: 1 });

	// UI state
	const [highlightedIndex, setHighlightedIndex] = useState(-1);

	// Available collections for filtering
	const availableCollections = [
		"market-areas",
		"news",
		"churches",
		"schools",
		"sports",
		"local-events",
		"blog",
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
		[onResultSelect, setIsOpen, clearSearch],
	);

	// Close modal
	const closeModal = useCallback(() => {
		setIsOpen(false);
		clearSearch();
	}, [setIsOpen, clearSearch]);

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
					closeModal();
					break;
			}
		},
		[results, highlightedIndex, handleSelect, closeModal],
	);

	// Reset highlighted index when results change
	useEffect(() => {
		setHighlightedIndex(results.length > 0 ? 0 : -1);
	}, [results]);

	// Global keyboard shortcut to open modal
	useEffect(() => {
		const handleGlobalKeyDown = (e: KeyboardEvent) => {
			// Cmd/Ctrl + K to open
			if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === shortcutKey) {
				e.preventDefault();
				setIsOpen(true);
			}
		};

		document.addEventListener("keydown", handleGlobalKeyDown);
		return () => document.removeEventListener("keydown", handleGlobalKeyDown);
	}, [shortcutKey, setIsOpen]);

	// Focus input when modal opens
	useEffect(() => {
		if (isOpen) {
			// Small delay to ensure the modal is rendered
			const timer = setTimeout(() => {
				inputRef.current?.focus();
			}, 50);
			return () => clearTimeout(timer);
		}
	}, [isOpen]);

	// Lock body scroll when modal is open
	useEffect(() => {
		if (isOpen) {
			const originalOverflow = document.body.style.overflow;
			document.body.style.overflow = "hidden";
			return () => {
				document.body.style.overflow = originalOverflow;
			};
		}
	}, [isOpen]);

	// Scroll highlighted item into view
	useEffect(() => {
		if (highlightedIndex >= 0 && resultsRef.current) {
			const items = resultsRef.current.querySelectorAll('[role="option"]');
			items[highlightedIndex]?.scrollIntoView({ block: "nearest" });
		}
	}, [highlightedIndex]);

	const showResults = query.length >= 1;

	return (
		<>
			{/* Trigger Button */}
			<Button onClick={() => setIsOpen(true)}>
				<Icon icon="lucide:search" className="h-4 w-4" />
				<span className="hidden sm:inline">Search...</span>
				<kbd className="bg-info-foreground pointer-events-none ml-auto hidden h-5 select-none items-center gap-1 rounded border px-1.5 font-mono text-xs font-medium sm:flex">
					<span className="text-xs">⌘</span>
					{shortcutKey.toUpperCase()}
				</kbd>
			</Button>

			{/* Modal Backdrop + Content */}
			<Activity mode={isOpen ? "visible" : "hidden"}>
				<div
					className={cn(
						"fixed inset-0 z-50 flex items-start justify-center pt-[10vh]",
						!isOpen && "pointer-events-none",
					)}
				>
					{/* Backdrop */}
					<div
						className="bg-background/80 absolute inset-0 backdrop-blur-sm"
						onClick={closeModal}
						aria-hidden="true"
					/>

					{/* Modal Content */}
					<div
						className={cn(
							"bg-popover relative z-10 w-full max-w-2xl overflow-hidden rounded-xl border shadow-2xl",
							"animate-in fade-in-0 zoom-in-95 duration-200",
						)}
						role="dialog"
						aria-modal="true"
						aria-label="Search"
					>
						{/* Search Input Header */}
						<div className="border-border flex items-center gap-3 border-b px-4 py-3">
							<Icon
								icon="lucide:search"
								className={cn(
									"h-5 w-5 shrink-0 transition-colors",
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
								onChange={(e) => setQuery(e.target.value)}
								onKeyDown={handleKeyDown}
								placeholder={placeholder}
								className="flex-1 shadow-none [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
								role="combobox"
								aria-expanded={true}
								aria-controls={listboxId}
								aria-activedescendant={
									highlightedIndex >= 0
										? `search-modal-result-${highlightedIndex}`
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
									variant="outline"
									size="icon-sm"
									onClick={() => {
										clearSearch();
										inputRef.current?.focus();
									}}
									aria-label="Clear search"
								>
									<Icon icon="lucide:x" className="h-5 w-5" />
								</Button>
							)}
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={closeModal}
								aria-label="Close search"
							>
								<kbd className="bg-muted rounded px-1.5 py-0.5 text-xs font-medium">
									esc
								</kbd>
							</Button>
						</div>

						{/* Collection Filters */}
						{showFilters && (
							<div className="border-border border-b pt-3">
								<CollectionFilters
									activeFilter={collectionFilter}
									onFilterChange={setCollectionFilter}
									availableCollections={availableCollections}
								/>
							</div>
						)}

						{/* Results Area */}
						<div
							ref={resultsRef}
							id={listboxId}
							role="listbox"
							aria-label="Search results"
							className="max-h-[50vh] overflow-y-auto"
						>
							<Suspense fallback={<SearchResultsSkeleton />}>
								{/* Error State */}
								{error && (
									<div className="flex items-center gap-2 p-4 text-sm text-red-500">
										<Icon icon="lucide:alert-circle" className="h-4 w-4" />
										{error}
									</div>
								)}

								{/* Initial State */}
								{!showResults && <InitialState />}

								{/* Loading State */}
								{showResults && isSearching && results.length === 0 && (
									<SearchResultsSkeleton />
								)}

								{/* Empty State */}
								{showResults &&
									!isSearching &&
									results.length === 0 &&
									deferredQuery && <EmptyState query={deferredQuery} />}

								{/* Results List */}
								{results.length > 0 && (
									<>
										<div className="px-4 py-2">
											<span className="text-muted-foreground text-xs font-medium">
												{totalResults} result{totalResults !== 1 ? "s" : ""}{" "}
												{isPending && "(updating...)"}
											</span>
										</div>
										<div className="p-2">
											{results.map((result, index) => (
												<SearchResultItem
													key={`${result.doc.relationTo}-${result.doc.value}`}
													result={result}
													onSelect={handleSelect}
													isHighlighted={index === highlightedIndex}
													index={index}
												/>
											))}
										</div>

										{/* Load More Button */}
										{hasMore && (
											<div className="border-border border-t p-3">
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
							</Suspense>
						</div>

						{/* Footer */}
						<div className="border-border text-muted-foreground flex items-center justify-between border-t px-4 py-2 text-xs">
							<div className="flex items-center gap-3">
								<span className="flex items-center gap-1">
									<kbd className="bg-muted rounded px-1 py-0.5 font-mono">
										↑↓
									</kbd>
									navigate
								</span>
								<span className="flex items-center gap-1">
									<kbd className="bg-muted rounded px-1 py-0.5 font-mono">
										↵
									</kbd>
									select
								</span>
							</div>
						</div>
					</div>
				</div>
			</Activity>
		</>
	);
}

export default SearchModal;
