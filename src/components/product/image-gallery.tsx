"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import { useTranslations } from "next-intl";
import { Expand, ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { ProductImage } from "@/types";

/**
 * Sized deliberately smaller than "fill the column" on desktop (capped at
 * max-w-md) — on a wide laptop screen a full-bleed 4:5 image in a 2-col
 * grid renders taller than the viewport. Tap/click opens a full-size
 * lightbox instead. The carousel itself is embla-powered so it's a real
 * touch swipe on phone/iPad, not just tap-the-arrow.
 */
export function ImageGallery({
  images,
  productName,
}: {
  images: ProductImage[];
  productName: string;
}) {
  const t = useTranslations("productDetail");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const [mainRef, mainApi] = useEmblaCarousel({ loop: images.length > 1 });
  const [lightboxRef, lightboxApi] = useEmblaCarousel({
    loop: images.length > 1,
    startIndex: selectedIndex,
  });

  useEffect(() => {
    if (!mainApi) return;
    const onSelect = () => setSelectedIndex(mainApi.selectedScrollSnap());
    mainApi.on("select", onSelect);
    mainApi.on("reInit", onSelect);
    return () => {
      mainApi.off("select", onSelect);
      mainApi.off("reInit", onSelect);
    };
  }, [mainApi]);

  useEffect(() => {
    if (!lightboxApi) return;
    const onLightboxSelect = () => setSelectedIndex(lightboxApi.selectedScrollSnap());
    lightboxApi.on("select", onLightboxSelect);
    return () => {
      lightboxApi.off("select", onLightboxSelect);
    };
  }, [lightboxApi]);

  useEffect(() => {
    if (lightboxOpen) lightboxApi?.scrollTo(selectedIndex, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightboxOpen]);

  useEffect(() => {
    mainApi?.scrollTo(selectedIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightboxOpen]);

  if (images.length === 0) {
    return (
      <div className="mx-auto flex aspect-[4/5] w-full max-w-md items-center justify-center bg-neutral-100 text-sm text-neutral-400 lg:mx-0">
        {t("noImageAvailable")}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md lg:mx-0">
      <div className="relative">
        <div
          className="touch-pan-y overflow-hidden bg-neutral-100"
          ref={mainRef}
          tabIndex={0}
          role="group"
          aria-label={`${productName} — ${selectedIndex + 1}/${images.length}`}
          onKeyDown={(event) => {
            if (event.key === "ArrowRight") mainApi?.scrollNext();
            if (event.key === "ArrowLeft") mainApi?.scrollPrev();
          }}
        >
          <div className="flex">
            {images.map((image, index) => (
              <button
                key={image.id}
                type="button"
                className="relative aspect-[4/5] w-full flex-none"
                onClick={() => setLightboxOpen(true)}
              >
                <Image
                  src={image.image_url}
                  alt={productName}
                  fill
                  priority={index === 0}
                  sizes="(min-width: 1024px) 480px, 100vw"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          aria-label={t("expandImage")}
          className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-neutral-900 shadow-sm transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
        >
          <Expand className="h-4 w-4" />
        </button>

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => mainApi?.scrollPrev()}
              aria-label={t("previousImage")}
              className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-neutral-900 shadow-sm transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => mainApi?.scrollNext()}
              aria-label={t("nextImage")}
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-neutral-900 shadow-sm transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-2 flex justify-center gap-1.5 sm:hidden">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => mainApi?.scrollTo(index)}
              aria-label={`${index + 1}/${images.length}`}
              aria-current={index === selectedIndex}
              className={cn(
                "h-1.5 rounded-full transition-all",
                index === selectedIndex ? "w-5 bg-neutral-900" : "w-1.5 bg-neutral-300",
              )}
            />
          ))}
        </div>
      )}

      {images.length > 1 && (
        <div className="mt-3 hidden gap-2 sm:flex">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => mainApi?.scrollTo(index)}
              aria-label={`${index + 1}/${images.length}`}
              aria-current={index === selectedIndex}
              className={cn(
                "relative aspect-[4/5] w-16 shrink-0 overflow-hidden bg-neutral-100 ring-1 ring-inset transition-opacity",
                index === selectedIndex
                  ? "ring-neutral-900"
                  : "opacity-70 ring-neutral-200 hover:opacity-100",
              )}
            >
              <Image src={image.image_url} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="w-[92vw] max-w-3xl border-none bg-transparent p-0 shadow-none sm:w-full sm:rounded-sm">
          <DialogTitle className="sr-only">{productName}</DialogTitle>
          <div className="relative">
            <div className="touch-pan-y overflow-hidden bg-neutral-100" ref={lightboxRef}>
              <div className="flex">
                {images.map((image) => (
                  <div key={image.id} className="relative aspect-[4/5] w-full flex-none sm:aspect-[4/3]">
                    <Image
                      src={image.image_url}
                      alt={productName}
                      fill
                      sizes="(min-width: 640px) 768px, 100vw"
                      className="object-contain"
                    />
                  </div>
                ))}
              </div>
            </div>

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => lightboxApi?.scrollPrev()}
                  aria-label={t("previousImage")}
                  className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-neutral-900 shadow-sm hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => lightboxApi?.scrollNext()}
                  aria-label={t("nextImage")}
                  className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-neutral-900 shadow-sm hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
