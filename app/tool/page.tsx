import { GalleryLayout } from "@/components/gallery-layout"
import { ImageCompressor } from "@/components/image-compressor"

export const metadata = {
  title: "Tool - Lin Hugo",
  description: "Image compression tool that preserves EXIF metadata.",
}

export default function ToolPage() {
  return (
    <GalleryLayout>
      <div>
        <h1 className="text-lg font-semibold text-foreground mb-1">Image Compression Tool</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Upload images, automatically convert to high-quality WebP format with EXIF preservation.
        </p>
        <ImageCompressor />
      </div>
    </GalleryLayout>
  )
}
