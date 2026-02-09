import { GalleryLayout } from "@/components/gallery-layout"
import { EpisodeDetail } from "@/components/episode-detail"
import { notFound } from "next/navigation"

const episodesData: Record<string, { title: string; date: string; description: string }> = {
  "los-angeles-lakers": {
    title: "Los Angeles Lakers",
    date: "2025.12.19",
    description: "Capturing the energy and atmosphere of a Lakers game at Crypto.com Arena.",
  },
  "disneyland-70th-anniversary": {
    title: "Disneyland's 70th Anniversary",
    date: "2025.12.17",
    description: "Celebrating seven decades of magic at the happiest place on Earth.",
  },
  "usc": {
    title: "USC",
    date: "2025.12.16",
    description: "The University of Southern California campus through light and architecture.",
  },
  "downtown-la": {
    title: "Downtown LA",
    date: "2025.12.13",
    description: "Urban perspectives from the streets of Downtown Los Angeles.",
  },
  "jioufen": {
    title: "Jioufen",
    date: "2025.07.12",
    description: "The old mountain town of Jioufen, where lanterns meet narrow alleyways.",
  },
}

export async function generateStaticParams() {
  return Object.keys(episodesData).map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const episode = episodesData[slug]
  if (!episode) return { title: "Not Found" }
  return {
    title: `${episode.title} - Lin Hugo`,
    description: episode.description,
  }
}

export default async function EpisodeDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const episode = episodesData[slug]
  if (!episode) notFound()

  return (
    <GalleryLayout>
      <EpisodeDetail title={episode.title} date={episode.date} description={episode.description} />
    </GalleryLayout>
  )
}
