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
