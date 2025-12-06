import { Icon } from "@iconify/react";
import { Activity, useEffect, useEffectEvent, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// Station ID from the Live365 URL
const stationId = "a34277";
// Live365 API endpoint for station metadata
const stationApi = `https://api.live365.com/station/${stationId}`;
// Stream URL from the API
const streamUrl = `https://streaming.live365.com/${stationId}`;

// Declare global audio element to persist across React re-renders and page navigations
declare global {
	interface Window {
		_sftiRadioAudio?: HTMLAudioElement;
		_sftiRadioPlaying?: boolean;
		_sftiRadioVolume?: number;
	}
}

// Get or create the global audio element
function getAudioElement(): HTMLAudioElement {
	if (!window._sftiRadioAudio) {
		const audio = new Audio();
		audio.preload = "none";
		window._sftiRadioAudio = audio;
		window._sftiRadioVolume = 0.7;
	}
	return window._sftiRadioAudio;
}

// Types for Live365 API response
interface CurrentTrack {
	title: string;
	artist: string;
	art: string;
}

interface StationData {
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
	const audioRef = useRef<HTMLAudioElement | null>(null);

	// Effect Event for fetching metadata - reads latest state without causing Effect re-runs
	const onMetadataFetch = useEffectEvent(async () => {
		try {
			const response = await fetch(stationApi);
			if (response.ok) {
				const data: StationData = await response.json();
				setCurrentTrack(data["current-track"]);
				setListeners(data.listeners);
			}
		} catch (err) {
			console.error("Failed to fetch station metadata:", err);
		}
	});

	// Initialize audio element and sync state (client-side only)
	useEffect(() => {
		const audio = getAudioElement();
		audioRef.current = audio;

		// Sync state from global (persisted across navigations)
		setIsPlaying(!audio.paused);
		setVolume(window._sftiRadioVolume ?? 0.7);

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

		// Fetch initial metadata
		onMetadataFetch();

		// Poll for metadata updates every 15 seconds when playing
		const intervalId = setInterval(() => {
			if (window._sftiRadioPlaying) {
				onMetadataFetch();
			}
		}, 15000);

		return () => {
			audio.removeEventListener("play", handlePlay);
			audio.removeEventListener("pause", handlePause);
			audio.removeEventListener("canplay", handleCanPlay);
			audio.removeEventListener("error", handleError);
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

	const togglePlay = async () => {
		const audio = audioRef.current;
		if (!audio) return;

		try {
			if (isPlaying) {
				audio.pause();
			} else {
				setIsLoading(true);
				setError(null);
				// Set the source if not already set
				if (!audio.src || !audio.src.includes(stationId)) {
					audio.src = streamUrl;
				}
				await audio.play();
				// Fetch fresh metadata when starting playback
				onMetadataFetch();
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
							? "Now playing SFTI Radio"
							: "Listen to SFTI Radio"}
				</TooltipContent>
			</Tooltip>

			{/* Music Player Panel - Activity preserves state when hidden */}
			<Activity mode={isOpen ? "visible" : "hidden"}>
				<div
					className={cn(
						"absolute bottom-20 right-0 w-80 overflow-hidden rounded-lg shadow-2xl",
						"bg-background border-3 border-default shadow-xl shadow-primary",
					)}
				>
					{/* Header bar */}
					<div className="flex items-center justify-between bg-muted px-3 py-2">
						<div className="flex items-center gap-2">
							<span className="text-sm font-medium text-muted-foreground">
								SFTI Radio
							</span>
							{listeners > 0 && (
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
						{/* Current track info */}
						<div className="flex items-center gap-3">
							{currentTrack?.art && !currentTrack.art.includes("blankart") ? (
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
											SFTI Radio Dublin TX
										</h3>
										<p className="text-muted-foreground text-xs truncate">
											{isPlaying ? "Now Playing" : "Live365 Stream"}
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
									<Icon icon="mdi:loading" className="size-5 animate-spin" />
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
							<p className="text-xs text-destructive text-center">{error}</p>
						)}
					</div>
				</div>
			</Activity>
		</div>
	);
}

export default MusicPlayer;
