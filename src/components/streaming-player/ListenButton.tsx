import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import { type StreamInfo, switchStream } from "./MusicPlayer";

interface ListenButtonProps {
	stream: StreamInfo;
	className?: string;
}

export function ListenButton({ stream, className }: ListenButtonProps) {
	const handleClick = () => {
		switchStream(stream);
	};

	return (
		<Button onClick={handleClick} className={className} variant="secondary">
			<Icon icon="mdi:play" className="size-5 mr-2" />
			Listen to {stream.title}
		</Button>
	);
}

export default ListenButton;
