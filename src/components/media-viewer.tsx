"use client";

import { Media } from "@/types/media";
import Link from "next/link";
import Image from "next/image";
import cn from "@/lib/cn";

type MediaViewerProps = {
  media: Media;
  className?: string;
} & (
  | {
      link?: boolean;
    }
  | {
      onClick?: () => void;
    }
);

export default function MediaViewer({
  media,
  className,
  ...props
}: MediaViewerProps) {
  const component = (
    <div className={"w-full flex items-center space-x-2"}>
      <Image
        src={media.coverLinkLow}
        alt={`${media.title} by ${media.artist}`}
        width={45}
        height={45}
        className="rounded-lg"
      />
      <div className="flex flex-col">
        <p className="font-semibold">{media.title}</p>
        <p className="text-sm font-semibold text-neutral-500 truncate">
          {media.type === "song" ? "Song" : "Album"}
          {" • "}
          {media.artist}
        </p>
      </div>
    </div>
  );

  if ("link" in props) {
    return (
      <Link
        className={cn("py-2 cursor-pointer", className)}
        href={`/${media.type}?id=${media.id}`}
      >
        {component}
      </Link>
    );
  }
  if ("onClick" in props) {
    return (
      <div
        className={cn("py-2 cursor-pointer", className)}
        onClick={props.onClick}
      >
        {component}
      </div>
    );
  }

  return <div className={cn("py-2", className)}>{component}</div>;
}
