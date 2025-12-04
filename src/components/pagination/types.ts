/**
 * Shared types for paginated community content lists
 */
import type {
	Church,
	LocalEvent,
	Media,
	News,
	School,
	Sports,
} from "@/payload";

/**
 * Union type of all community collection items
 */
export type CommunityItem = Church | LocalEvent | News | School | Sports;

/**
 * Union type for place-based collections (churches and schools)
 * These have similar structures with name, location, and contact info
 */
export type PlaceItem = Church | School;

/**
 * Collection types for places (churches and schools)
 */
export type PlaceCollectionType = "churches" | "schools";

/**
 * Optimized image data pre-processed by Astro's Image component
 * This is passed from the Astro wrapper to the React component
 */
export interface OptimizedImage {
	src: string;
	alt: string;
	width: number;
	height: number;
}

/**
 * Map of item IDs to their optimized featured images
 */
export type OptimizedImageMap = Record<string, OptimizedImage>;

/**
 * Collection types supported by the API
 */
export type CollectionType =
	| "churches"
	| "events"
	| "news"
	| "schools"
	| "sports";

/**
 * API response structure matching PayloadPaginatedDocs
 */
export interface PaginatedResponse<T> {
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

/**
 * Props for the paginated list component
 */
export interface PaginatedListProps {
	/** Initial items fetched server-side */
	initialItems: CommunityItem[];
	/** Community/market area slug */
	community: string;
	/** Collection type for API calls and URL building */
	collection: CollectionType;
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
 * Helper to get the display title from any collection item
 */
export function getItemTitle(item: CommunityItem): string {
	if ("title" in item) return item.title;
	if ("name" in item) return item.name;
	return "Untitled";
}

/**
 * Helper to get the slug from any collection item
 */
export function getItemSlug(item: CommunityItem): string {
	return item.slug || item.id;
}

/**
 * Helper to get the description from any collection item
 */
export function getItemDescription(item: CommunityItem): string | null {
	if ("description" in item && item.description) return item.description;
	return null;
}

/**
 * Helper to build the detail URL for an item
 */
export function getItemUrl(
	item: CommunityItem,
	community: string,
	collection: CollectionType,
): string {
	const slug = getItemSlug(item);
	return `/communities/${community}/${collection}/${slug}`;
}

/**
 * Helper to get the featured image from any collection item
 * Returns the Media object if it's populated, null otherwise
 */
export function getItemFeaturedImage(item: CommunityItem): Media | null {
	if ("featuredImage" in item && item.featuredImage) {
		// Check if it's a populated Media object (has filename)
		if (
			typeof item.featuredImage === "object" &&
			"filename" in item.featuredImage
		) {
			return item.featuredImage as Media;
		}
	}
	return null;
}
