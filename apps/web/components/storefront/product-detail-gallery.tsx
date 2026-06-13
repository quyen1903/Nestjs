"use client";

import Image from "next/image";
import { useState } from "react";

import { cn } from "@/lib/utils";

export function ProductDetailGallery({ images, name }: { images: string[]; name: string }) {
  const [selected, setSelected] = useState(images[0]);

  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-lg border bg-secondary">
        <Image src={selected} alt={name} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
      </div>
      <div className="grid grid-cols-4 gap-3">
        {images.map((image) => (
          <button
            key={image}
            type="button"
            className={cn(
              "relative aspect-square overflow-hidden rounded-md border bg-secondary focus:outline-none focus:ring-2 focus:ring-ring",
              selected === image && "border-primary"
            )}
            onClick={() => setSelected(image)}
          >
            <Image src={image} alt="" fill sizes="120px" className="object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
