import { Icon } from "@iconify/react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Item,
	ItemContent,
	ItemDescription,
	ItemGroup,
	ItemMedia,
	ItemTitle,
} from "@/components/ui/item";
import type {
	OptimizedImage,
	OptimizedImageMap,
	PaginatedResponse,
	PlaceCollectionType,
	PlaceItem,
} from "./types";
import { getItemFeaturedImage, getItemSlug } from "./types";

/**
 * Props for the PlacesList component
 */
export interface PlacesListProps {
	/** Initial items fetched server-side */
	initialItems: PlaceItem[];
	/** Community/market area slug */
	community: string;
	/** Collection type for API calls and URL building */
	collection: PlaceCollectionType;
	/** Whether there are more items to load */
	hasNextPage: boolean;
	/** Number of items per page */
	limit?: number;
	/** R2 base URL for fetching images on client-side pagination */
	r2BaseUrl?: string;
	/** Pre-optimized images map (item ID -> optimized image data) */
	optimizedImages?: OptimizedImageMap;
}

/**
 * Fetch paginated data from the community API
 */
async function fetchPage(
	collection: PlaceCollectionType,
	community: string,
	page: number,
	limit: number,
): Promise<PaginatedResponse<PlaceItem>> {
	const params = new URLSearchParams({
		community,
		page: String(page),
		limit: String(limit),
	});

	const response = await fetch(`/api/community/${collection}?${params}`);

	if (!response.ok) {
		throw new Error(`Failed to fetch ${collection}: ${response.statusText}`);
	}

	return response.json();
}

/**
 * Get the subtitle for a place item (denomination for churches, description for schools)
 */
function getPlaceSubtitle(item: PlaceItem): string | null {
	if ("denomination" in item && item.denomination) {
		return item.denomination;
	}
	if ("description" in item && item.description) {
		return item.description;
	}
	return null;
}

/**
 * Get the location address for a place item
 */
function getPlaceAddress(item: PlaceItem): string | null {
	if (item.location?.address) {
		return item.location.address;
	}
	return null;
}

/**
 * Build the detail URL for a place item
 */
function getPlaceUrl(
	item: PlaceItem,
	community: string,
	collection: PlaceCollectionType,
): string {
	const slug = getItemSlug(item);
	return `/communities/${community}/${collection}/${slug}`;
}

/**
 * Individual place item component for the list
 */
function PlaceListItem({
	item,
	community,
	collection,
	optimizedImage,
	r2BaseUrl,
}: {
	item: PlaceItem;
	community: string;
	collection: PlaceCollectionType;
	optimizedImage?: OptimizedImage;
	r2BaseUrl?: string;
}) {
	const title = item.name;
	const subtitle = getPlaceSubtitle(item);
	const address = getPlaceAddress(item);
	const url = getPlaceUrl(item, community, collection);

	// For client-loaded items without optimized images, fall back to raw R2 URL
	const featuredImage = getItemFeaturedImage(item);
	const fallbackImageSrc =
		!optimizedImage && featuredImage && r2BaseUrl
			? `${r2BaseUrl.replace(/\/$/, "")}/${featuredImage.filename}`
			: null;
	const imageSrc = optimizedImage?.src || fallbackImageSrc;
	const imageAlt = optimizedImage?.alt || featuredImage?.alt || title;

	return (
		<Item asChild>
			<a href={url}>
				{imageSrc && (
					<ItemMedia
						variant="image"
						className="size-20 shrink-0 rounded-md overflow-hidden"
					>
						<img
							src={imageSrc}
							alt={imageAlt}
							width={optimizedImage?.width || 80}
							height={optimizedImage?.height || 80}
							className="w-full h-full object-cover"
							loading="lazy"
						/>
					</ItemMedia>
				)}
				<ItemContent className="gap-1 flex-1">
					<ItemTitle>{title}</ItemTitle>
					{subtitle && (
						<span className="text-sm text-muted-foreground font-medium">
							{subtitle}
						</span>
					)}
					{address && (
						<ItemDescription className="flex items-center gap-1">
							<Icon icon="lucide:map-pin" className="size-4 shrink-0" />
							<span className="line-clamp-1">{address}</span>
						</ItemDescription>
					)}
					<span className="text-sm font-semibold mt-1">
						View Details &rarr;
					</span>
				</ItemContent>
			</a>
		</Item>
	);
}

/**
 * Reusable paginated list component for places (churches and schools)
 *
 * This component handles client-side pagination for churches and schools collections.
 * It receives initial data from the server and loads more on demand.
 *
 * @example
 * ```tsx
 * <PlacesList
 *   client:load
 *   initialItems={churches}
 *   community="market-area-slug"
 *   collection="churches"
 *   hasNextPage={hasNextPage}
 *   limit={limit}
 *   r2BaseUrl={r2BaseUrl}
 *   optimizedImages={optimizedImagesMap}
 * />
 * ```
 */
export function PlacesList({
	initialItems,
	community,
	collection,
	hasNextPage: initialHasNextPage,
	limit = 20,
	r2BaseUrl,
	optimizedImages = {},
}: PlacesListProps) {
	const [items, setItems] = useState<PlaceItem[]>(initialItems);
	const [page, setPage] = useState(1);
	const [loading, setLoading] = useState(false);
	const [hasNextPage, setHasNextPage] = useState(initialHasNextPage);
	const [error, setError] = useState<string | null>(null);
	const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

	// Sort items alphabetically by name
	const sortedItems = [...items].sort((a, b) => {
		const comparison = a.name.localeCompare(b.name);
		return sortDirection === "asc" ? comparison : -comparison;
	});

	const toggleSortDirection = () => {
		setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
	};

	const loadMore = useCallback(async () => {
		if (loading || !hasNextPage) return;

		setLoading(true);
		setError(null);

		try {
			const nextPage = page + 1;
			const result = await fetchPage(collection, community, nextPage, limit);

			setItems((prev) => [...prev, ...result.docs]);
			setPage(nextPage);
			setHasNextPage(result.hasNextPage);
		} catch (err) {
			console.error("Failed to load more items:", err);
			setError(err instanceof Error ? err.message : "Failed to load more");
		} finally {
			setLoading(false);
		}
	}, [loading, hasNextPage, page, collection, community, limit]);

	// Determine the label based on collection type
	const collectionLabel = collection === "churches" ? "Churches" : "Schools";

	return (
		<div className="space-y-6">
			{/* Sort controls */}
			<div>
				<p className="mb-2 text-sm font-medium">Sort Alphabetically:</p>
				<Button
					variant="outline"
					size="sm"
					onClick={toggleSortDirection}
					className="flex items-center gap-2"
				>
					<Icon
						icon={
							sortDirection === "asc"
								? "lucide:arrow-up-a-z"
								: "lucide:arrow-down-z-a"
						}
						className="size-4"
					/>
					{sortDirection === "asc" ? "A to Z" : "Z to A"}
				</Button>
			</div>

			{/* Items list */}
			<ItemGroup className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
				{sortedItems.map((item) => (
					<PlaceListItem
						key={item.id}
						item={item}
						community={community}
						collection={collection}
						optimizedImage={optimizedImages[item.id]}
						r2BaseUrl={r2BaseUrl}
					/>
				))}
			</ItemGroup>

			{/* Error message */}
			{error && (
				<div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-lg text-center">
					<p>{error}</p>
					<Button
						onClick={() => {
							setError(null);
							loadMore();
						}}
						className="mt-2 text-sm underline hover:no-underline"
					>
						Try again
					</Button>
				</div>
			)}

			{/* Load more button */}
			{hasNextPage && !error && (
				<div className="flex justify-center pt-4">
					<Button
						onClick={loadMore}
						disabled={loading}
						size="lg"
						variant="success"
					>
						{loading ? (
							<span className="flex items-center gap-2">
								<Icon icon="lucide:loader-circle" className="animate-spin" />
								Loading...
							</span>
						) : (
							<span>Load More {collectionLabel} &darr;</span>
						)}
					</Button>
				</div>
			)}

			{/* End of list indicator */}
			{!hasNextPage && items.length > 0 && (
				<p className="text-center text-muted-foreground text-sm pt-4">
					You've reached the end
				</p>
			)}

			{/* Empty state */}
			{items.length === 0 && (
				<p className="text-center text-muted-foreground py-8">
					No {collectionLabel.toLowerCase()} found in this area.
				</p>
			)}
		</div>
	);
}
