import { Icon } from "@iconify/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

type Platform = "ios" | "android" | null;

interface BeforeInstallPromptEvent extends Event {
	readonly platforms: string[];
	readonly userChoice: Promise<{
		outcome: "accepted" | "dismissed";
		platform: string;
	}>;
	prompt(): Promise<void>;
}

const DISMISS_KEY = "pwa-install-dismissed";
const DISMISS_DAYS = 14;
const APP_NAME = "SFTI Radio";
const APP_ICON = "/icons/any-192.png";

function detectPlatform(): Platform {
	if (typeof navigator === "undefined") return null;
	const ua = navigator.userAgent || "";

	// Android first — some Android tablets also expose maxTouchPoints
	if (/Android/i.test(ua)) return "android";

	// Direct iOS UA match (iPhone, old iPads, iPod)
	if (/iPad|iPhone|iPod/.test(ua)) return "ios";

	// iPadOS 13+ masquerades as macOS Safari. It exposes touch support,
	// while real macOS does not. `navigator.platform` is deprecated and
	// unreliable, so detect by touch + Safari/WebKit + Mac-ish UA instead.
	const hasTouch =
		(navigator.maxTouchPoints ?? 0) > 1 ||
		(typeof window !== "undefined" && "ontouchend" in window);
	const isMacUA = /Macintosh|Mac OS X/.test(ua);
	const isSafari = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS|EdgiOS/.test(ua);
	if (hasTouch && isMacUA && isSafari) return "ios";

	return null;
}

function isStandalone(): boolean {
	if (typeof window === "undefined") return false;
	const navStandalone = (
		window.navigator as Navigator & { standalone?: boolean }
	).standalone;
	return (
		window.matchMedia?.("(display-mode: standalone)").matches === true ||
		navStandalone === true
	);
}

function isDismissed(): boolean {
	if (typeof localStorage === "undefined") return false;
	const ts = localStorage.getItem(DISMISS_KEY);
	if (!ts) return false;
	const dismissedAt = Number(ts);
	if (Number.isNaN(dismissedAt)) return false;
	const ageMs = Date.now() - dismissedAt;
	return ageMs < DISMISS_DAYS * 24 * 60 * 60 * 1000;
}

export default function PWAInstallPrompt() {
	const [platform, setPlatform] = useState<Platform>(null);
	const [open, setOpen] = useState(false);
	const [installEvent, setInstallEvent] =
		useState<BeforeInstallPromptEvent | null>(null);

	useEffect(() => {
		if (isStandalone() || isDismissed()) return;

		const detected = detectPlatform();
		if (!detected) return;
		setPlatform(detected);

		if (detected === "android") {
			const handler = (e: Event) => {
				e.preventDefault();
				setInstallEvent(e as BeforeInstallPromptEvent);
				setOpen(true);
			};
			window.addEventListener("beforeinstallprompt", handler);

			// Fallback: some Android browsers (or when event already fired) won't
			// fire `beforeinstallprompt`. Show generic prompt after a short delay.
			const fallback = window.setTimeout(() => {
				setOpen((v) => v || true);
			}, 1500);

			return () => {
				window.removeEventListener("beforeinstallprompt", handler);
				window.clearTimeout(fallback);
			};
		}

		// iOS: just show after a short delay
		const t = window.setTimeout(() => setOpen(true), 1000);
		return () => window.clearTimeout(t);
	}, []);

	const dismiss = () => {
		try {
			localStorage.setItem(DISMISS_KEY, String(Date.now()));
		} catch {
			// ignore
		}
		setOpen(false);
	};

	const handleOpenChange = (next: boolean) => {
		if (!next) {
			dismiss();
		} else {
			setOpen(true);
		}
	};

	const handleAndroidInstall = async () => {
		if (!installEvent) {
			dismiss();
			return;
		}
		await installEvent.prompt();
		const choice = await installEvent.userChoice;
		if (choice.outcome === "accepted" || choice.outcome === "dismissed") {
			dismiss();
		}
	};

	if (!platform) return null;

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-sm">
				{platform === "android" ? (
					<>
						<DialogHeader>
							<DialogTitle className="text-center">
								Save SFTI Radio to Home Screen
							</DialogTitle>
							<DialogDescription className="sr-only">
								Install {APP_NAME} as an app on your device.
							</DialogDescription>
						</DialogHeader>
						<div className="flex flex-col items-center gap-2">
							<img
								src={APP_ICON}
								alt={`${APP_NAME} icon`}
								className="size-16 rounded-xl"
								width={64}
								height={64}
							/>
							<p className="font-medium">{APP_NAME}</p>
						</div>
						<DialogFooter className="gap-4">
							<Button onClick={dismiss} variant="outline">
								Stay in Browser
							</Button>
							<Button onClick={handleAndroidInstall}>Install as an App</Button>
						</DialogFooter>
					</>
				) : (
					<>
						<DialogHeader>
							<DialogTitle className="text-center">
								Save SFTI Radio to Home Screen
							</DialogTitle>
							<DialogDescription className="sr-only">
								Add {APP_NAME} to your home screen.
							</DialogDescription>
						</DialogHeader>
						<div className="flex flex-col items-center gap-2">
							<img
								src={APP_ICON}
								alt={`${APP_NAME} icon`}
								className="size-16 rounded-xl"
								width={64}
								height={64}
							/>
							<p className="font-medium">{APP_NAME}</p>
						</div>
						<ol className="space-y-3 text-sm leading-relaxed">
							<li>
								1. Click the icon{" "}
								<Icon
									icon="heroicons:ellipsis-horizontal-circle"
									className="inline-block size-10 align-middle"
								/>{" "}
								in the browser address bar at the bottom.
							</li>
							<li>
								2. Click the{" "}
								<Icon
									icon="pepicons-pop:share-ios"
									className="inline-block size-10 align-middle"
								/>{" "}
								Share button.
							</li>
							<li>
								3. Click{" "}
								<Icon
									icon="mynaui:plus-square"
									className="inline-block size-10 align-middle"
								/>{" "}
								"Add to Home Screen".
							</li>
						</ol>
						<DialogFooter>
							<Button onClick={dismiss} variant="outline">
								Stay in Browser
							</Button>
						</DialogFooter>
					</>
				)}
			</DialogContent>
		</Dialog>
	);
}
