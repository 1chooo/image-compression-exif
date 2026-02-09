import { GalleryLayout } from "@/components/gallery-layout"
import { AboutContent } from "@/components/about-content"

export const metadata = {
  title: "About - Lin Hugo",
  description: "About Lin Hugo - software builder, writer, and photographer.",
}

export default function AboutPage() {
  return (
    <GalleryLayout>
      <AboutContent />
    </GalleryLayout>
  )
}
