import { GalleryLayout } from "@/components/gallery-layout"
import { EpisodesList } from "@/components/episodes-list"

export const metadata = {
  title: "Episodes - Lin Hugo",
  description: "Photography episodes by Lin Hugo",
}

export default function EpisodesPage() {
  return (
    <GalleryLayout>
      <EpisodesList />
    </GalleryLayout>
  )
}
