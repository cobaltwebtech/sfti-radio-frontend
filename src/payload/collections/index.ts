/**
 * Collections Barrel Export
 *
 * Re-exports all collection types and interfaces
 */

// Blog collection
export type { BlogCollectionMethods, BlogPost, LexicalContent } from "./blog";
// Churches collection
export type {
	Church,
	ChurchContact,
	ChurchesCollectionMethods,
	ChurchLocation,
	ServiceTime,
} from "./churches";
// Local Events collection
export type {
	EventLocation,
	LocalEvent,
	LocalEventsCollectionMethods,
} from "./local-events";
// Market Areas collection
export type {
	MarketArea,
	MarketAreaCollectionMethods,
	SurroundingArea,
} from "./market-areas";
// Media collection (shared)
export type { Media } from "./media";
// News collection
export type {
	News,
	NewsCollectionMethods,
	RichText,
	RichTextNode,
} from "./news";

// Schools collection
export type {
	School,
	SchoolContact,
	SchoolLocation,
	SchoolsCollectionMethods,
} from "./schools";

// Sports collection
export type { Sports, SportsCollectionMethods } from "./sports";
