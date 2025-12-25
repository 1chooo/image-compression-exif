import { ImageCompressor } from "@/components/image-compressor"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">圖片壓縮工具</h1>
          <p className="text-muted-foreground">上傳圖片，自動轉換為高品質 WebP 格式並保留 EXIF</p>
        </div>
        <ImageCompressor />
      </div>
    </main>
  )
}
