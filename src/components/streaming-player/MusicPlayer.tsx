import { Icon } from "@iconify/react";
import { Activity, useEffect, useEffectEvent, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// Default stream ID from the Live365 URL
const DEFAULT_STREAM_ID = "a34277";
const DEFAULT_STREAM_TITLE = "SFTI Radio";

// Helper functions for Live365 URLs
const getStreamApi = (id: string) => `https://api.live365.com/station/${id}`;
const getStreamUrl = (id: string) => `https://streaming.live365.com/${id}`;

// Stream info for external control
export interface StreamInfo {
	id?: string;
	title: string;
	/** Custom stream URL - if provided, bypasses Live365 */
	url?: string;
}

// Custom event for switching streams
export const STREAM_CHANGE_EVENT = "sfti-stream-change";

export function switchStream(stream: StreamInfo) {
	window.dispatchEvent(
		new CustomEvent(STREAM_CHANGE_EVENT, { detail: stream }),
	);
}

// Declare global audio element to persist across React re-renders and page navigations
declare global {
	interface Window {
		_sftiRadioAudio?: HTMLAudioElement;
		_sftiRadioPlaying?: boolean;
		_sftiRadioVolume?: number;
		_sftiRadioStreamId?: string;
		_sftiRadioStreamTitle?: string;
		_sftiRadioStreamUrl?: string;
		_sftiRadioIsLive365?: boolean;
		_sftiRadioHasSelected?: boolean;
	}
}

// Get or create the global audio element
function getAudioElement(): HTMLAudioElement {
	if (!window._sftiRadioAudio) {
		const audio = new Audio();
		audio.preload = "none";
		window._sftiRadioAudio = audio;
		window._sftiRadioVolume = 0.7;
		window._sftiRadioStreamId = DEFAULT_STREAM_ID;
		window._sftiRadioStreamTitle = DEFAULT_STREAM_TITLE;
		window._sftiRadioStreamUrl = getStreamUrl(DEFAULT_STREAM_ID);
		window._sftiRadioIsLive365 = true;
	}
	return window._sftiRadioAudio;
}

// Get the actual stream URL - uses custom URL if provided, otherwise Live365
// Proxies HTTP streams through the secure API endpoint
function resolveStreamUrl(id: string | undefined, customUrl?: string): string {
	if (customUrl) {
		if (customUrl.startsWith("http://")) {
			return `/api/stream-proxy?url=${encodeURIComponent(customUrl)}`;
		}
		return customUrl;
	}
	if (!id) throw new Error("Stream ID is required when no custom URL provided");
	return getStreamUrl(id);
}

// Types for Live365 API response
interface CurrentTrack {
	title: string;
	artist: string;
	art: string;
}

interface StreamData {
	name: string;
	logo: string;
	"current-track": CurrentTrack;
	listeners: number;
}

interface MusicPlayerProps {
	/** Additional CSS classes for the container */
	className?: string;
}

export function MusicPlayer({ className }: MusicPlayerProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [isPlaying, setIsPlaying] = useState(false);
	const [volume, setVolume] = useState(0.7);
	const [isMuted, setIsMuted] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [currentTrack, setCurrentTrack] = useState<CurrentTrack | null>(null);
	const [listeners, setListeners] = useState<number>(0);
	const [streamId, setStreamId] = useState(DEFAULT_STREAM_ID);
	const [streamTitle, setStreamTitle] = useState(DEFAULT_STREAM_TITLE);
	const [customUrl, setCustomUrl] = useState<string | undefined>(undefined);
	const [isLive365, setIsLive365] = useState(true);
	const [hasSelected, setHasSelected] = useState(false);
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const panelRef = useRef<HTMLDivElement | null>(null);
	const toggleButtonRef = useRef<HTMLButtonElement | null>(null);

	// Effect Event for fetching metadata - reads latest state without causing Effect re-runs
	// Only fetches for Live365 streams (custom URL streams have no metadata API)
	const onMetadataFetch = useEffectEvent(async (id?: string) => {
		// Skip metadata fetch for non-Live365 streams
		if (window._sftiRadioIsLive365 === false) {
			setCurrentTrack(null);
			setListeners(0);
			return;
		}

		const fetchId = id ?? window._sftiRadioStreamId ?? DEFAULT_STREAM_ID;
		try {
			const response = await fetch(getStreamApi(fetchId));
			if (response.ok) {
				const data: StreamData = await response.json();
				setCurrentTrack(data["current-track"]);
				setListeners(data.listeners);
			}
		} catch (err) {
			console.error("Failed to fetch stream metadata:", err);
		}
	});

	// Handle stream switch - plays new stream and opens player
	const handleStreamSwitch = useEffectEvent(
		async (event: CustomEvent<StreamInfo>) => {
			const { id, title, url } = event.detail;
			const audio = audioRef.current;
			if (!audio) return;

			// Determine if this is a Live365 stream (no custom URL)
			const streamIsLive365 = !url;

			// Update state and global
			setStreamId(id ?? DEFAULT_STREAM_ID);
			setStreamTitle(title);
			setCustomUrl(url);
			setIsLive365(streamIsLive365);
			setHasSelected(true);
			window._sftiRadioStreamId = id ?? DEFAULT_STREAM_ID;
			window._sftiRadioStreamTitle = title;
			window._sftiRadioStreamUrl = url;
			window._sftiRadioIsLive365 = streamIsLive365;
			window._sftiRadioHasSelected = true;

			// Open player panel
			setIsOpen(true);

			// Stop current playback and switch to new stream
			audio.pause();
			setIsLoading(true);
			setError(null);
			setCurrentTrack(null);

			try {
				audio.src = resolveStreamUrl(id, url);
				await audio.play();
				if (streamIsLive365) {
					onMetadataFetch(id ?? DEFAULT_STREAM_ID);
				}
			} catch (err) {
				console.error("Playback error:", err);
				setError("Unable to connect. Please try again later.");
			} finally {
				setIsLoading(false);
			}
		},
	);

	// Initialize audio element and sync state (client-side only)
	useEffect(() => {
		const audio = getAudioElement();
		audioRef.current = audio;

		// Sync state from global (persisted across navigations)
		setIsPlaying(!audio.paused);
		setVolume(window._sftiRadioVolume ?? 0.7);
		setStreamId(window._sftiRadioStreamId ?? DEFAULT_STREAM_ID);
		setStreamTitle(window._sftiRadioStreamTitle ?? DEFAULT_STREAM_TITLE);
		setCustomUrl(window._sftiRadioStreamUrl);
		setIsLive365(window._sftiRadioIsLive365 ?? true);
		setHasSelected(window._sftiRadioHasSelected ?? false);

		// Set up event listeners
		const handlePlay = () => {
			setIsPlaying(true);
			window._sftiRadioPlaying = true;
		};
		const handlePause = () => {
			setIsPlaying(false);
			window._sftiRadioPlaying = false;
		};
		const handleCanPlay = () => {
			setIsLoading(false);
			setError(null);
		};
		const handleError = () => {
			if (window._sftiRadioPlaying) {
				setError("Stream connection lost. Try again.");
				setIsPlaying(false);
				window._sftiRadioPlaying = false;
			}
		};

		audio.addEventListener("play", handlePlay);
		audio.addEventListener("pause", handlePause);
		audio.addEventListener("canplay", handleCanPlay);
		audio.addEventListener("error", handleError);

		// Listen for stream change events
		const streamChangeHandler = (e: Event) =>
			handleStreamSwitch(e as CustomEvent<StreamInfo>);
		window.addEventListener(STREAM_CHANGE_EVENT, streamChangeHandler);

		// Fetch initial metadata (only for Live365 streams that have been selected)
		if (window._sftiRadioHasSelected && window._sftiRadioIsLive365 !== false) {
			onMetadataFetch();
		}

		// Poll for metadata updates every 15 seconds when playing (only for Live365)
		const intervalId = setInterval(() => {
			if (window._sftiRadioPlaying && window._sftiRadioIsLive365 !== false) {
				onMetadataFetch();
			}
		}, 15000);

		return () => {
			audio.removeEventListener("play", handlePlay);
			audio.removeEventListener("pause", handlePause);
			audio.removeEventListener("canplay", handleCanPlay);
			audio.removeEventListener("error", handleError);
			window.removeEventListener(STREAM_CHANGE_EVENT, streamChangeHandler);
			clearInterval(intervalId);
		};
	}, []);

	// Update volume when it changes
	useEffect(() => {
		const audio = audioRef.current;
		if (audio) {
			audio.volume = volume;
			audio.muted = isMuted;
			window._sftiRadioVolume = volume;
		}
	}, [volume, isMuted]);

	// Close panel when clicking outside
	useEffect(() => {
		if (!isOpen) return;

		const handleClickOutside = (event: MouseEvent) => {
			const target = event.target as Node;
			const clickedOutsidePanel =
				panelRef.current && !panelRef.current.contains(target);
			const clickedOutsideToggle =
				toggleButtonRef.current && !toggleButtonRef.current.contains(target);

			if (clickedOutsidePanel && clickedOutsideToggle) {
				setIsOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [isOpen]);

	const togglePlay = async () => {
		const audio = audioRef.current;
		if (!audio) return;

		const currentStreamId = window._sftiRadioStreamId ?? streamId;
		const currentCustomUrl = window._sftiRadioStreamUrl ?? customUrl;
		const currentIsLive365 = window._sftiRadioIsLive365 ?? isLive365;

		try {
			if (isPlaying) {
				audio.pause();
			} else {
				setIsLoading(true);
				setError(null);
				// Set the source if not already set or if stream changed
				const targetUrl = resolveStreamUrl(currentStreamId, currentCustomUrl);
				if (!audio.src || audio.src !== targetUrl) {
					audio.src = targetUrl;
				}
				await audio.play();
				// Fetch fresh metadata when starting playback (only for Live365)
				if (currentIsLive365) {
					onMetadataFetch();
				}
			}
		} catch (err) {
			console.error("Playback error:", err);
			setError("Unable to connect. Please try again later.");
		} finally {
			setIsLoading(false);
		}
	};

	const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newVolume = Number.parseFloat(e.target.value);
		setVolume(newVolume);
		if (newVolume > 0 && isMuted) {
			setIsMuted(false);
		}
	};

	const toggleMute = () => {
		setIsMuted(!isMuted);
	};

	return (
		<div className={cn("fixed bottom-6 right-6 z-1000", className)}>
			{/* Toggle Button - Music bubble icon */}
			<Tooltip>
				<TooltipTrigger asChild>
					<div className="relative">
						{isPlaying && !isOpen && (
							<div className="absolute inline-flex size-full animate-ping rounded-full bg-secondary opacity-75" />
						)}
						<Button
							onClick={() => setIsOpen(!isOpen)}
							ref={toggleButtonRef}
							aria-expanded={isOpen}
							aria-label={isOpen ? "Close music player" : "Open music player"}
							size="icon-lg"
							variant="secondary"
							className={cn(
								"relative size-14 rounded-full shadow-lg hover:bg-secondary",
								isPlaying &&
									"ring-3 ring-default ring-offset-3 ring-offset-background",
							)}
						>
							<Icon
								icon={
									isOpen
										? "mdi:close"
										: isPlaying
											? "tabler:player-play-filled"
											: "mdi:music"
								}
								className="size-7"
							/>
						</Button>
					</div>
				</TooltipTrigger>
				<TooltipContent side="left">
					{isOpen
						? "Close player"
						: isPlaying
							? `Now playing ${streamTitle}`
							: hasSelected
								? `Listen to ${streamTitle}`
								: "Browse radio stations"}
				</TooltipContent>
			</Tooltip>

			{/* Music Player Panel - Activity preserves state when hidden */}
			<Activity mode={isOpen ? "visible" : "hidden"}>
				<div
					ref={panelRef}
					className={cn(
						"absolute bottom-20 right-0 w-80 overflow-hidden rounded-lg shadow-2xl",
						"bg-background border-3 border-default shadow-xl shadow-primary",
					)}
				>
					{/* Header bar */}
					<div className="flex items-center justify-between bg-muted px-3 py-2">
						<div className="flex items-center gap-2">
							<span className="text-sm font-medium text-muted-foreground truncate max-w-45">
								{hasSelected ? streamTitle : "SFTI Radio"}
							</span>
							{hasSelected && isLive365 && listeners > 0 && (
								<span className="text-xs text-muted-foreground/70">
									• {listeners} listening
								</span>
							)}
						</div>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									onClick={() => setIsOpen(false)}
									aria-label="Close music player"
									variant="ghost"
									size="icon-sm"
								>
									<Icon icon="octicon:x-circle-fill-16" className="size-5" />
								</Button>
							</TooltipTrigger>
							<TooltipContent side="left">Close</TooltipContent>
						</Tooltip>
					</div>

					{/* Player content */}
					<div className="p-4 space-y-4">
						{!hasSelected ? (
							/* Initial state - no stream selected */
							<div className="flex flex-col items-center gap-4 py-2">
								<div className="size-16 bg-linear-to-br from-primary to-primary/60 rounded-full flex items-center justify-center">
									<Icon
										icon="mdi:radio"
										className="size-8 text-primary-foreground"
									/>
								</div>
								<div className="text-center">
									<h3 className="font-semibold text-sm">
										Welcome to SFTI Radio
									</h3>
									<p className="text-muted-foreground text-xs mt-1">
										Select a community to start listening
									</p>
								</div>
								<Button asChild className="w-full">
									<a href="/communities">
										<Icon icon="mdi:map-marker" className="size-5 mr-2" />
										Browse Stations
									</a>
								</Button>
							</div>
						) : (
							/* Stream selected - show player controls */
							<>
								{/* Current track info */}
								<div className="flex items-center gap-3">
									{currentTrack?.art &&
									!currentTrack.art.includes("blankart") ? (
										<img
											src={currentTrack.art}
											alt="Album art"
											className="size-14 rounded-lg object-cover shrink-0"
										/>
									) : (
										<div className="size-14 bg-linear-to-br from-primary to-primary/60 rounded-lg flex items-center justify-center shrink-0">
											<Icon
												icon="mdi:music"
												className="size-7 text-primary-foreground"
											/>
										</div>
									)}
									<div className="min-w-0 flex-1">
										{currentTrack?.title ? (
											<>
												<h3 className="font-semibold text-sm truncate">
													{currentTrack.title}
												</h3>
												<p className="text-muted-foreground text-xs truncate">
													{currentTrack.artist || "Unknown Artist"}
												</p>
											</>
										) : (
											<>
												<h3 className="font-semibold text-sm truncate">
													{streamTitle}
												</h3>
												<p className="text-muted-foreground text-xs truncate">
													{isPlaying
														? "Now Playing"
														: isLive365
															? "Live365 Stream"
															: "Live Stream"}
												</p>
											</>
										)}
									</div>
								</div>

								{/* Play/Pause and Volume controls */}
								<div className="flex items-center gap-4">
									{/* Play/Pause Button */}
									<Button
										onClick={togglePlay}
										disabled={isLoading}
										size="icon-lg"
										className="size-12 rounded-full"
										aria-label={isPlaying ? "Pause" : "Play"}
									>
										{isLoading ? (
											<Icon
												icon="mdi:loading"
												className="size-5 animate-spin"
											/>
										) : isPlaying ? (
											<Icon icon="mdi:pause" className="size-5" />
										) : (
											<Icon icon="mdi:play" className="size-5 ml-0.5" />
										)}
									</Button>

									{/* Volume Control */}
									<div className="flex items-center gap-2 flex-1">
										<Button
											onClick={toggleMute}
											variant="ghost"
											size="icon-sm"
											aria-label={isMuted ? "Unmute" : "Mute"}
										>
											<Icon
												icon={
													isMuted || volume === 0
														? "mdi:volume-off"
														: "mdi:volume-high"
												}
												className="size-5"
											/>
										</Button>
										<input
											type="range"
											min="0"
											max="1"
											step="0.01"
											value={isMuted ? 0 : volume}
											onChange={handleVolumeChange}
											className="flex-1 h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
											aria-label="Volume"
										/>
									</div>
								</div>

								{/* Error Message */}
								{error && (
									<p className="text-xs text-destructive text-center">
										{error}
									</p>
								)}
							</>
						)}
					</div>
				</div>
			</Activity>
		</div>
	);
}

export default MusicPlayer;
