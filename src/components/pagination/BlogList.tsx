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
import type { BlogPost } from "@/payload";
import type {
	OptimizedImage,
	OptimizedImageMap,
	PaginatedResponse,
} from "./types";

export interface BlogListProps {
	/** Initial items fetched server-side */
	initialItems: BlogPost[];
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
 * Fetch paginated blog posts from the API
 */
async function fetchPage(
	page: number,
	limit: number,
): Promise<PaginatedResponse<BlogPost>> {
	const params = new URLSearchParams({
		page: String(page),
		limit: String(limit),
	});

	const response = await fetch(`/api/blog?${params}`);

	if (!response.ok) {
		throw new Error(`Failed to fetch blog posts: ${response.statusText}`);
	}

	return response.json();
}

/**
 * Get the date to display for a blog post
 */
function getPostDate(post: BlogPost): string | null {
	const date = post.publishDate || post.publishedAt || post.createdAt;
	if (!date) return null;

	return new Date(date).toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});
}

/**
 * Individual blog post item component
 */
function BlogListItem({
	post,
	optimizedImage,
	r2BaseUrl,
	index,
}: {
	post: BlogPost;
	optimizedImage?: OptimizedImage;
	r2BaseUrl?: string;
	index: number;
}) {
	const url = `/post/${post.id}`;
	const date = getPostDate(post);
	const isFeatureItem = index === 0;
	const imageSize = isFeatureItem ? "size-48" : "size-24";

	// For client-loaded items without optimized images, fall back to raw R2 URL
	// Note: BlogPost type may not have featuredImage, so we check dynamically
	const featuredImage = (
		post as { featuredImage?: { filename?: string; alt?: string } }
	).featuredImage;
	const fallbackImageSrc =
		!optimizedImage && featuredImage?.filename && r2BaseUrl
			? `${r2BaseUrl.replace(/\/$/, "")}/${featuredImage.filename}`
			: null;
	const imageSrc = optimizedImage?.src || fallbackImageSrc;
	const imageAlt = optimizedImage?.alt || featuredImage?.alt || post.title;

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
					<ItemTitle>{post.title}</ItemTitle>
					{date && (
						<span className="text-xs text-muted-foreground">{date}</span>
					)}
					{post.description && (
						<ItemDescription>{post.description}</ItemDescription>
					)}
					<span className="text-sm font-semibold mt-1">Read More &rarr;</span>
				</ItemContent>
			</a>
		</Item>
	);
}

/**
 * Paginated blog list component
 *
 * @example
 * ```tsx
 * <BlogList
 *   client:load
 *   initialItems={posts}
 *   hasNextPage={hasNextPage}
 *   limit={limit}
 *   r2BaseUrl={r2BaseUrl}
 *   optimizedImages={optimizedImagesMap}
 * />
 * ```
 */
export function BlogList({
	initialItems,
	hasNextPage: initialHasNextPage,
	limit = 20,
	r2BaseUrl,
	optimizedImages = {},
}: BlogListProps) {
	const [items, setItems] = useState<BlogPost[]>(initialItems);
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
			const result = await fetchPage(nextPage, limit);

			setItems((prev) => [...prev, ...result.docs]);
			setPage(nextPage);
			setHasNextPage(result.hasNextPage);
		} catch (err) {
			console.error("Failed to load more posts:", err);
			setError(err instanceof Error ? err.message : "Failed to load more");
		} finally {
			setLoading(false);
		}
	}, [loading, hasNextPage, page, limit]);

	return (
		<div className="space-y-6">
			{/* Items list */}
			<ItemGroup className="grid md:grid-cols-3 gap-3">
				{items.map((post, index) => (
					<BlogListItem
						key={post.id}
						post={post}
						optimizedImage={optimizedImages[post.id]}
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
