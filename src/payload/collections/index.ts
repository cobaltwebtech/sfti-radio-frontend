/**
 * Collections Barrel Export
 *
 * Re-exports all collection types and interfaces
 */

// Media type (re-exported from shared types)
// Rich text types (re-exported from shared types)
export type { Media, RichText, RichTextNode } from "../types";
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
// Daily Prayers collection
export type {
	DailyPrayer,
	DailyPrayersCollectionMethods,
	DailyPrayersDocument,
} from "./daily-prayers";
// Forms collection
export type {
	FileUpload,
	FileUploadData,
	FileUploadResponse,
	FormField,
	FormSubmission,
	FormSubmissionField,
	FormSubmissionRequest,
	FormSubmissionResponse,
	FormsCollectionMethods,
	PayloadForm,
} from "./forms";
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
// News collection
export type {
	News,
	NewsCollectionMethods,
} from "./news";

// Schools collection
export type {
	School,
	SchoolContact,
	SchoolLocation,
	SchoolsCollectionMethods,
} from "./schools";
// Search collection (Payload Search plugin)
export type {
	CollectionMeta,
	SearchCollectionMethods,
	SearchDocRef,
	SearchQueryParams,
	SearchResult,
} from "./search";
export { COLLECTION_META } from "./search";
// Sports collection
export type { Sports, SportsCollectionMethods } from "./sports";
