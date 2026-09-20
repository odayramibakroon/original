"use client";
import Image from "next/image";
import { useState } from "react";
import { useTranslations } from "next-intl";

export function ProductGallery({ images, name, mainImage }: { images: string[]; name: string; mainImage: string }) {
  const [selected, setSelected] = useState(mainImage);
  const t = useTranslations("catalog");
  return <div className="product-gallery">
    <div className="product-gallery-main"><Image src={selected} alt={name} fill priority sizes="(max-width: 760px) 100vw, 50vw" /></div>
    {images.length > 1 && <div className="product-thumbnails">{images.map((image, index) => <button key={image} type="button" aria-pressed={selected === image}
      aria-label={t("image", { number: index + 1 })} onClick={() => setSelected(image)}>
      <Image src={image} alt="" fill sizes="72px" />
    </button>)}</div>}
  </div>;
}
