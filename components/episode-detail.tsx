"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

interface EpisodeDetailProps {
  title: string
  date: string
  description: string
}

// Placeholder images for episode detail masonry galleries
const episodeImages = [
  { src: "https://images.unsplash.com/photo-1580655653885-65763b2597d0?w=600&q=80", alt: "Photo 1", aspect: "tall" },
  { src: "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=600&q=80", alt: "Photo 2", aspect: "wide" },
  { src: "https://images.unsplash.com/photo-1562774053-701939374585?w=600&q=80", alt: "Photo 3", aspect: "wide" },
  { src: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600&q=80", alt: "Photo 4", aspect: "wide" },
  { src: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80", alt: "Photo 5", aspect: "wide" },
  { src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80", alt: "Photo 6", aspect: "square" },
  { src: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600&q=80", alt: "Photo 7", aspect: "tall" },
  { src: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600&q=80", alt: "Photo 8", aspect: "square" },
]

export function EpisodeDetail({ title, date, description }: EpisodeDetailProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/episodes"
          className="inline-flex items-center gap-1.5 text-muted-foreground text-xs hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-3 h-3" />
          episodes
        </Link>
        <h1 className="text-lg font-semibold text-foreground">{title}</h1>
        <div className="flex items-center gap-3 mt-1">
          <time className="text-xs text-muted-foreground tabular-nums">{date}</time>
        </div>
        <p className="text-sm text-muted-foreground mt-3 max-w-lg leading-relaxed">
          {description}
        </p>
      </div>

      {/* Masonry Grid */}
      <div className="masonry-grid">
        {episodeImages.map((image, index) => (
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

          {lightboxIndex < episodeImages.length - 1 && (
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
            src={episodeImages[lightboxIndex].src.replace("w=600", "w=1200")}
            alt={episodeImages[lightboxIndex].alt}
            width={1200}
            height={800}
            className="max-w-full max-h-[85vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-background/70 text-xs tracking-wide">
            {lightboxIndex + 1} / {episodeImages.length}
          </p>
        </div>
      )}
    </div>
  )
}
