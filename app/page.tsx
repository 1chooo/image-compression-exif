import { ImageCompressor } from "@/components/image-compressor"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold tracking-tight text-foreground mb-3">圖片壓縮工具</h1>
          <p className="text-muted-foreground text-lg">上傳圖片，自動轉換為高品質 WebP 格式</p>
        </div>
        <ImageCompressor />
      </div>
    </main>
  )
}
