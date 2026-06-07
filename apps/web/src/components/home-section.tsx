import type { HomeSection as HomeSectionData } from "@music/api";
import { MediaGrid, MediaRow } from "./media-row";

export function HomeSection({ section }: { section: HomeSectionData }) {
	switch (section.layout) {
		case "grid":
			return <MediaGrid title={section.title} items={section.items} />;
		case "circle-row":
			return (
				<MediaRow title={section.title} items={section.items} shape="circle" />
			);
		case "row":
			return (
				<MediaRow title={section.title} items={section.items} shape="square" />
			);
	}
}
