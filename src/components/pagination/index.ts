/**
 * Community Components
 *
 * Reusable components for paginated community content lists.
 * Works with Churches, Events, News, Schools, Sports, and Blog collections.
 */

export type { BlogListProps } from "./BlogList";
export { BlogList } from "./BlogList";
export { PaginatedList } from "./PaginatedList";
export type { PlacesListProps } from "./PlacesList";
export { PlacesList } from "./PlacesList";
export type {
	CollectionType,
	CommunityItem,
	OptimizedImage,
	OptimizedImageMap,
	PaginatedListProps,
	PaginatedResponse,
	PlaceCollectionType,
	PlaceItem,
} from "./types";
export {
	getItemDescription,
	getItemFeaturedImage,
	getItemSlug,
	getItemTitle,
	getItemUrl,
} from "./types";
