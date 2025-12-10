import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import { type StreamInfo, switchStream } from "./MusicPlayer";

interface ChristmasButtonProps {
	stream: StreamInfo;
	className?: string;
}

export function ChristmasButton({ stream }: ChristmasButtonProps) {
	const handleClick = () => {
		switchStream(stream);
	};

	return (
		<div className="relative inline-block">
			<div className="absolute mx-auto w-3/5 inset-0 rounded-full bg-red-500 animate-ping" />
			<Button
				onClick={handleClick}
				className="relative bg-green-600 hover:bg-green-700"
				size="lg"
			>
				<Icon icon="mdi:play" className="size-5" />
				Listen to {stream.title}
			</Button>
		</div>
	);
}

export default ChristmasButton;
