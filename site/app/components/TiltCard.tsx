"use client";

import { useRef, useState } from "react";

const TiltCard = ({ src, alt, details_link, default_src }: { src: string; alt: string; details_link: string, default_src: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({});
  const [display_src, setSrc] = useState<string>(src);

  const handleImageLoadError = (e: Error) => {
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

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={style}
      className="w-full"
    >
      <a href={details_link} target="_blank" rel="noopener noreferrer" className="block cursor-pointer">
        <img
          src={display_src}
          alt={alt}
          className="w-full rounded-md object-contain pointer-events-none"
          onError={handleImageLoadError}
          loading="lazy"
        />
      </a>
    </div>
  );
};

export default TiltCard;
