/**
 * Blog Collection Configuration
 *
 * Types and methods for the Blog collection in Payload CMS
 */
import type { LexicalContent } from "../../lib/lexical-renderer";
import type { PayloadPaginatedDocs } from "../types";

// Blog post type - adjust fields based on your Payload CMS schema
export interface BlogPost {
	id: number | string;
	title: string;
	slug?: string;
	description?: string;
	content?: LexicalContent;
	excerpt?: string;
	postDate?: string;
	publishedAt?: string;
	createdAt: string;
	updatedAt: string;
	author?: {
		id: number;
		email: string;
	};
	// Add more fields as needed based on your Payload CMS Blog collection
}

export interface BlogCollectionMethods {
	/**
	 * Get blog posts with optional filtering
	 */
	getBlogPosts(params?: {
		limit?: number;
		page?: number;
		sort?: string;
	}): Promise<PayloadPaginatedDocs<BlogPost>>;

	/**
	 * Get a single blog post by slug
	 */
	getBlogPostBySlug(slug: string): Promise<BlogPost | null>;

	/**
	 * Get a single blog post by ID
	 */
	getBlogPostById(id: string): Promise<BlogPost | null>;
}

export type { LexicalContent };
