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
	CollectionType,
	CommunityItem,
	OptimizedImage,
	PaginatedListProps,
	PaginatedResponse,
} from "./types";
import {
	getItemDescription,
	getItemFeaturedImage,
	getItemTitle,
	getItemUrl,
} from "./types";

/**
 * Fetch paginated data from the community API
 */
async function fetchPage(
	collection: CollectionType,
	community: string,
	page: number,
	limit: number,
): Promise<PaginatedResponse<CommunityItem>> {
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
 * Get the date to display for an item based on collection type
 */
function getItemDate(item: CommunityItem): string | null {
	if ("publishDate" in item && item.publishDate) {
		return new Date(item.publishDate).toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	}
	if ("eventDate" in item && item.eventDate) {
		return new Date(item.eventDate).toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	}
	return null;
}

/**
 * Individual item component for the list
 */
function ListItem({
	item,
	community,
	collection,
	optimizedImage,
	r2BaseUrl,
	index,
}: {
	item: CommunityItem;
	community: string;
	collection: CollectionType;
	optimizedImage?: OptimizedImage;
	r2BaseUrl?: string;
	index: number;
}) {
	const title = getItemTitle(item);
	const description = getItemDescription(item);
	const url = getItemUrl(item, community, collection);
	const date = getItemDate(item);

	// For client-loaded items without optimized images, fall back to raw R2 URL
	const featuredImage = getItemFeaturedImage(item);
	const fallbackImageSrc =
		!optimizedImage && featuredImage && r2BaseUrl
			? `${r2BaseUrl.replace(/\/$/, "")}/${featuredImage.filename}`
			: null;
	const imageSrc = optimizedImage?.src || fallbackImageSrc;
	const imageAlt = optimizedImage?.alt || featuredImage?.alt || title;
	const isFeatureItem = index === 0;
	const imageSize = isFeatureItem ? "size-48" : "size-24";

	return (
		<Item asChild className="md:first:col-span-2">
			<a href={url}>
				{imageSrc && (
					<ItemMedia
						variant="image"
						className={`${imageSize} shrink-0 rounded-md overflow-hidden`}
					>
						<img
							src={imageSrc}
							alt={imageAlt}
							width={optimizedImage?.width || (isFeatureItem ? 192 : 96)}
							height={optimizedImage?.height || (isFeatureItem ? 192 : 96)}
							className="w-full h-full object-cover"
							loading="lazy"
						/>
					</ItemMedia>
				)}
				<ItemContent className="gap-2 flex-1">
					<ItemTitle>{title}</ItemTitle>
					{date && (
						<span className="text-xs text-muted-foreground">{date}</span>
					)}
					{description && <ItemDescription>{description}</ItemDescription>}
					<span className="text-sm font-semibold mt-1">View More &rarr;</span>
				</ItemContent>
			</a>
		</Item>
	);
}

/**
 * Reusable paginated list component for community content
 *
 * This component handles client-side pagination for any community collection.
 * It receives initial data from the server and loads more on demand.
 *
 * @example
 * ```tsx
 * <PaginatedList
 *   client:load
 *   initialItems={sports}
 *   community="market-area-slug"
 *   collection="sports"
 *   hasNextPage={hasNextPage}
 *   limit={limit}
 *   r2BaseUrl={r2BaseUrl}
 *   optimizedImages={optimizedImagesMap}
 * />
 * ```
 */
export function PaginatedList({
	initialItems,
	community,
	collection,
	hasNextPage: initialHasNextPage,
	limit = 20,
	r2BaseUrl,
	optimizedImages = {},
}: PaginatedListProps) {
	const [items, setItems] = useState<CommunityItem[]>(initialItems);
	const [page, setPage] = useState(1);
	const [loading, setLoading] = useState(false);
	const [hasNextPage, setHasNextPage] = useState(initialHasNextPage);
	const [error, setError] = useState<string | null>(null);

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

	return (
		<div className="space-y-6">
			{/* Items list */}
			<ItemGroup className="grid md:grid-cols-3 gap-3">
				{items.map((item, index) => (
					<ListItem
						key={item.id}
						item={item}
						community={community}
						collection={collection}
						optimizedImage={optimizedImages[item.id]}
						r2BaseUrl={r2BaseUrl}
						index={index}
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
							<span>Load Older Posts &darr;</span>
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
		</div>
	);
}
