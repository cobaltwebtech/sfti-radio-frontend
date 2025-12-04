import { Icon } from "@iconify/react";
import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	NavigationMenu,
	NavigationMenuContent,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	NavigationMenuTrigger,
	navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { TsftiRadioLogo } from "@/components/ui/TsftiRadioLogo";
import { cn } from "@/lib/utils";

// Helper to check if a link is active
const isLinkActive = (url: string, currentPath: string) => {
	// Exact match or starts with (for nested routes)
	return currentPath === url || currentPath.startsWith(`${url}/`);
};

// Main menu navigation links
const defaultNavigationLinks: NavItem[] = [
	{ title: "Blog Posts", url: "/post" },
	{ title: "Test Form", url: "/forms/test-form" },
];

// Hamburger icon component with animated transition
const HamburgerIcon = ({
	className,
	...props
}: React.SVGAttributes<SVGElement>) => (
	<svg
		className={cn("pointer-events-none", className)}
		width={16}
		height={16}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		xmlns="http://www.w3.org/2000/svg"
		aria-hidden="true"
		{...props}
	>
		<path
			d="M4 12L20 12"
			className="origin-center -translate-y-[7px] transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-x-0 group-aria-expanded:translate-y-0 group-aria-expanded:rotate-315"
		/>
		<path
			d="M4 12H20"
			className="origin-center transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.8)] group-aria-expanded:rotate-45"
		/>
		<path
			d="M4 12H20"
			className="origin-center translate-y-[7px] transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-y-0 group-aria-expanded:rotate-135"
		/>
	</svg>
);

// Types
export interface NavSubItem {
	title: string;
	url: string;
	description?: string;
}

export interface NavItem {
	title: string;
	url: string;
	submenu?: boolean;
	items?: NavSubItem[];
}

export interface CommunityItem {
	name: string;
	slug: string;
}

export interface NavMenuProps extends React.HTMLAttributes<HTMLElement> {
	logoHref?: string;
	navigationLinks?: NavItem[];
	communities?: CommunityItem[];
	ctaText?: string;
	ctaHref?: string;
	onCtaClick?: () => void;
	showAnnouncementBanner?: boolean;
	announcementText?: string;
	announcementUrl?: string;
}

export const Navbar = React.forwardRef<HTMLElement, NavMenuProps>(
	(
		{
			className,
			logoHref = "/",
			navigationLinks = defaultNavigationLinks,
			communities = [],
			ctaText = "Become a Member",
			ctaHref = "/membership",
			onCtaClick,
			showAnnouncementBanner = false,
			announcementText = "Check out September 2025 Update",
			announcementUrl = "/news/2025-sep-update",
			...props
		},
		ref,
	) => {
		const [isMobile, setIsMobile] = useState(false);
		const [isOpen, setIsOpen] = useState(false);
		const [currentPath, setCurrentPath] = useState("");
		const containerRef = useRef<HTMLElement>(null);

		useEffect(() => {
			// Set current path on mount (client-side only)
			setCurrentPath(window.location.pathname);
		}, []);

		useEffect(() => {
			const checkWidth = () => {
				if (containerRef.current) {
					const width = containerRef.current.offsetWidth;
					setIsMobile(width < 1024); // 1024px is lg breakpoint
				}
			};

			checkWidth();
			const resizeObserver = new ResizeObserver(checkWidth);
			if (containerRef.current) {
				resizeObserver.observe(containerRef.current);
			}

			return () => {
				resizeObserver.disconnect();
			};
		}, []);

		// Combine refs
		const combinedRef = React.useCallback(
			(node: HTMLElement | null) => {
				containerRef.current = node;
				if (typeof ref === "function") {
					ref(node);
				} else if (ref) {
					ref.current = node;
				}
			},
			[ref],
		);

		return (
			<header
				ref={combinedRef}
				className={cn(
					"bg-accent sticky inset-x-0 top-0 z-50 w-full",
					className,
				)}
				{...props}
			>
				{/* Announcement Banner */}
				{showAnnouncementBanner && (
					<div className="bg-focus text-background w-full py-1 text-sm font-bold uppercase md:text-base">
						<a
							href={announcementUrl}
							className="flex items-center justify-center gap-2"
						>
							{announcementText}
							<Icon icon="lucide:arrow-right" className="size-5" />
						</a>
					</div>
				)}

				<nav className="relative mx-auto flex w-full max-w-7xl flex-wrap items-center px-4 py-2 md:px-6 lg:grid lg:grid-cols-8 lg:px-8">
					{/* Logo */}
					<div className="lg:col-span-1">
						<a href={logoHref} aria-label="Go to homepage">
							<TsftiRadioLogo size={120} />
							<span className="sr-only">TSFTI Radio</span>
						</a>
					</div>

					{/* Desktop Menu - visible on lg+ */}
					{!isMobile && (
						<div className="hidden lg:order-2 lg:col-span-4 lg:col-start-3 lg:flex">
							<NavigationMenu>
								<NavigationMenuList>
									{/* Communities Dropdown */}
									<NavigationMenuItem>
										<NavigationMenuTrigger>Communities</NavigationMenuTrigger>
										<NavigationMenuContent>
											<div className="grid w-[400px] gap-4 p-4 md:w-[500px] md:grid-cols-2">
												{communities.map((community) => (
													<NavigationMenuLink key={community.slug} asChild>
														<a
															href={`/communities/${community.slug}`}
															className="text-sm font-semibold leading-none hover:bg-accent"
														>
															{community.name}
														</a>
													</NavigationMenuLink>
												))}
												<NavigationMenuLink asChild>
													<a
														href="/communities"
														className="flex flex-row gap-2 text-sm font-semibold leading-none hover:bg-accent"
													>
														<Icon icon="lucide:building-2" />
														<span>View All Communities</span>
													</a>
												</NavigationMenuLink>
											</div>
										</NavigationMenuContent>
									</NavigationMenuItem>
									{navigationLinks.map((link) => (
										<NavigationMenuItem key={link.title}>
											{link.submenu && link.items ? (
												<>
													<NavigationMenuTrigger>
														{link.title}
													</NavigationMenuTrigger>
													<NavigationMenuContent>
														<div className="grid gap-3 p-4 w-[400px]">
															{link.items.map((item) => (
																<NavigationMenuLink key={item.url} asChild>
																	<a href={item.url} className="text-green-400">
																		<div className="text-sm font-medium leading-none text-green-400">
																			{item.title}
																		</div>
																		{item.description && (
																			<p className="line-clamp-2 text-sm leading-snug text-red-400">
																				{item.description}
																			</p>
																		)}
																	</a>
																</NavigationMenuLink>
															))}
														</div>
													</NavigationMenuContent>
												</>
											) : (
												<NavigationMenuLink
													href={link.url}
													className={navigationMenuTriggerStyle()}
													data-active={isLinkActive(link.url, currentPath)}
												>
													{link.title}
												</NavigationMenuLink>
											)}
										</NavigationMenuItem>
									))}
								</NavigationMenuList>
							</NavigationMenu>
						</div>
					)}

					{/* Container for CTA button and Mobile menu toggle */}
					<div className="ms-auto flex items-center gap-x-2 py-1 lg:order-3 lg:col-span-2 lg:col-end-9 lg:gap-x-4">
						{/* CTA Button */}
						<Button
							variant="secondary"
							size="default"
							className="rounded-full"
							asChild
						>
							<a href={ctaHref} aria-label={ctaText}>
								<Icon icon="lucide:heart-handshake" />
								<span className="hidden lg:block">{ctaText}</span>
							</a>
						</Button>

						{/* Theme Toggle */}
						<ThemeToggle />

						{/* Mobile Menu Toggle Button */}
						{isMobile && (
							<Popover open={isOpen} onOpenChange={setIsOpen}>
								<PopoverTrigger asChild>
									<Button
										className="group size-10 lg:hidden"
										variant="ghost"
										size="icon"
										aria-expanded={isOpen}
										aria-label="Toggle navigation"
									>
										<HamburgerIcon />
									</Button>
								</PopoverTrigger>
								<PopoverContent align="end" className="w-64 p-1">
									<nav>
										<ul className="flex flex-col gap-1">
											{/* Communities Section */}
											<li>
												<div className="text-muted-foreground px-3 py-1.5 text-xs font-medium">
													Communities
												</div>
												<ul>
													{communities.length > 0 ? (
														communities.map((community) => (
															<li key={community.slug}>
																<a
																	href={`/communities/${community.slug}`}
																	className="flex w-full items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground no-underline"
																	onClick={() => setIsOpen(false)}
																>
																	{community.name}
																</a>
															</li>
														))
													) : (
														<li>
															<a
																href="/communities"
																className="flex w-full items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground no-underline"
																onClick={() => setIsOpen(false)}
															>
																View All Communities
															</a>
														</li>
													)}
												</ul>
											</li>
											{/* Separator */}
											<hr className="bg-border -mx-1 my-1 h-px border-0" />
											{navigationLinks.map((link) => (
												<li key={link.title}>
													{link.submenu && link.items ? (
														<>
															<div className="text-muted-foreground px-3 py-1.5 text-xs font-medium">
																{link.title}
															</div>
															<ul>
																{link.items.map((item) => (
																	<li key={item.url}>
																		<a
																			href={item.url}
																			className="flex w-full items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground no-underline"
																			onClick={() => setIsOpen(false)}
																		>
																			{item.title}
																		</a>
																	</li>
																))}
															</ul>
														</>
													) : (
														<a
															href={link.url}
															className="flex w-full items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground no-underline"
															onClick={() => setIsOpen(false)}
														>
															{link.title}
														</a>
													)}
												</li>
											))}
										</ul>
									</nav>
								</PopoverContent>
							</Popover>
						)}
					</div>
				</nav>
			</header>
		);
	},
);

Navbar.displayName = "Navbar";

export { HamburgerIcon };
