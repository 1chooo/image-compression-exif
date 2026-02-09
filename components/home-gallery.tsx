"use client"

import { useState } from "react"
import Image from "next/image"

const galleryImages = [
  { src: "https://images.unsplash.com/photo-1580655653885-65763b2597d0?w=600&q=80", alt: "USC campus brick building", aspect: "tall" },
  { src: "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=600&q=80", alt: "Ornate building facade", aspect: "wide" },
  { src: "https://images.unsplash.com/photo-1562774053-701939374585?w=600&q=80", alt: "University entrance", aspect: "wide" },
  { src: "https://images.unsplash.com/photo-1617575521317-d2974f3b56d2?w=600&q=80", alt: "Red lanterns", aspect: "wide" },
  { src: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600&q=80", alt: "Library interior", aspect: "wide" },
  { src: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80", alt: "Geometric pattern", aspect: "wide" },
  { src: "https://images.unsplash.com/photo-1514924013411-cbf25faa35bb?w=600&q=80", alt: "Train platform yellow line", aspect: "wide" },
  { src: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600&q=80", alt: "Gothic architecture", aspect: "square" },
  { src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80", alt: "Building reflection", aspect: "square" },
  { src: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600&q=80", alt: "Street sign one way", aspect: "tall" },
  { src: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80", alt: "Downtown skyline", aspect: "wide" },
  { src: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=600&q=80", alt: "Castle turrets", aspect: "wide" },
  { src: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&q=80", alt: "Glass building facade", aspect: "wide" },
  { src: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=600&q=80", alt: "Stone wall gallery", aspect: "wide" },
  { src: "https://images.unsplash.com/photo-1481277542470-605612bd2d61?w=600&q=80", alt: "Art deco details", aspect: "square" },
  { src: "https://images.unsplash.com/photo-1518391846015-55a9cc003b25?w=600&q=80", alt: "Reflections in water", aspect: "wide" },
]

export function HomeGallery() {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  return (
    <div>
      <h1 className="text-lg font-semibold text-foreground mb-6">Lin Hugo</h1>

      {/* Masonry Grid */}
      <div className="masonry-grid">
        {galleryImages.map((image, index) => (
          <button
            key={index}
            onClick={() => setLightboxIndex(index)}
            className="w-full overflow-hidden cursor-pointer block focus:outline-none group"
          >
            <Image
              src={image.src}
              alt={image.alt}
              width={400}
              height={image.aspect === "tall" ? 500 : image.aspect === "square" ? 400 : 280}
              className="w-full h-auto object-cover transition-opacity duration-300 group-hover:opacity-80"
              sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 bg-foreground/90 z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxIndex(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Image lightbox"
        >
          <button
            className="absolute top-6 right-6 text-background text-sm tracking-wide hover:opacity-70 transition-opacity cursor-pointer"
            onClick={() => setLightboxIndex(null)}
          >
            close
          </button>

          {/* Previous */}
          {lightboxIndex > 0 && (
            <button
              className="absolute left-6 top-1/2 -translate-y-1/2 text-background text-sm tracking-wide hover:opacity-70 transition-opacity cursor-pointer"
              onClick={(e) => {
                e.stopPropagation()
                setLightboxIndex(lightboxIndex - 1)
              }}
            >
              prev
            </button>
          )}

          {/* Next */}
          {lightboxIndex < galleryImages.length - 1 && (
            <button
              className="absolute right-6 top-1/2 -translate-y-1/2 text-background text-sm tracking-wide hover:opacity-70 transition-opacity cursor-pointer"
              onClick={(e) => {
                e.stopPropagation()
                setLightboxIndex(lightboxIndex + 1)
              }}
            >
              next
            </button>
          )}

          <Image
            src={galleryImages[lightboxIndex].src.replace("w=600", "w=1200")}
            alt={galleryImages[lightboxIndex].alt}
            width={1200}
            height={800}
            className="max-w-full max-h-[85vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-background/70 text-xs tracking-wide">
            {lightboxIndex + 1} / {galleryImages.length}
          </p>
        </div>
      )}
    </div>
  )
}
