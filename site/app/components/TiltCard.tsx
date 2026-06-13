"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";

const isValidImageSrc = (s: string) =>
  s.startsWith("/") || s.startsWith("http://") || s.startsWith("https://");

const TiltCard = ({ src, alt, href, default_src }: { src: string; alt: string; href: string, default_src: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({});
  const [display_src, setSrc] = useState<string>(
    isValidImageSrc(src) ? src : default_src
  );

  const handleImageLoadError = () => {
    if (default_src !== display_src) {
      setSrc(default_src);
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const rotateX = (0.5 - y) * 20;
    const rotateY = (x - 0.5) * 20;

    setStyle({
      transform: `perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`,
      transition: "transform 0.1s ease-out",
    });
  };

  const handleMouseLeave = () => {
    setStyle({
      transform: "perspective(600px) rotateX(0deg) rotateY(0deg) scale(1)",
      transition: "transform 0.4s ease-out",
    });
  };

  const image = (
    <Image
      src={display_src}
      alt={alt}
      width={400}
      height={252}
      sizes="(max-width: 768px) 40vw, 200px"
      className="w-full h-auto rounded-md object-contain pointer-events-none"
      style={{ width: "100%", height: "auto" }}
      onError={handleImageLoadError}
      loading="lazy"
    />
  );

  // Internal links ("/cards/...") use the client router and open in the same
  // tab; external links (issuer pages) open in a new tab.
  const isInternal = href.startsWith("/");

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={style}
      className="w-full"
    >
      {isInternal ? (
        <Link href={href} className="block cursor-pointer">
          {image}
        </Link>
      ) : (
        <a href={href} target="_blank" rel="noopener noreferrer" className="block cursor-pointer">
          {image}
        </a>
      )}
    </div>
  );
};

export default TiltCard;
