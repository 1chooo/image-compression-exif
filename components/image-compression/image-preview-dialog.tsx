import { Camera } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ExifDataDisplay } from "@/components/image-compression"

interface ExifData {
  make?: string
  model?: string
  dateTime?: string
  exposureTime?: string
  fNumber?: string
  iso?: string
  focalLength?: string
  lensModel?: string
  imageWidth?: number
  imageHeight?: number
  gps?: {
    latitude?: number
    longitude?: number
  }
}

interface CompressedImage {
  id: string
  originalName: string
  originalSize: number
  compressedSize: number
  downloadUrl: string
  previewUrl: string
  hasExif: boolean
  exifData: ExifData | null
}

interface ImagePreviewDialogProps {
  image: CompressedImage | null
  onClose: () => void
  formatSize: (bytes: number) => string
  calculateSavings: (original: number, compressed: number) => string
}

export function ImagePreviewDialog({
  image,
  onClose,
  formatSize,
  calculateSavings,
}: ImagePreviewDialogProps) {
  return (
    <Dialog open={!!image} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-6xl max-h-[95vh] p-0 gap-0 flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle className="text-base sm:text-lg">
            {image?.originalName.replace(/\.[^.]+$/, ".webp")}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Compressed image preview with metadata
          </DialogDescription>
        </DialogHeader>

        {image && (
          <div className="flex flex-col lg:grid lg:grid-cols-2 gap-4 sm:gap-6 p-4 sm:p-6 overflow-y-auto flex-1 min-h-0">
            {/* Left: Image Preview */}
            <div className="flex flex-col gap-4 order-1">
              <div className="relative bg-muted rounded-lg overflow-hidden aspect-square">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.previewUrl}
                  alt={image.originalName}
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Compression Stats */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Compression Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-xs sm:text-sm">Original Size:</span>
                    <span className="font-medium text-xs sm:text-sm">
                      {formatSize(image.originalSize)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-xs sm:text-sm">
                      Compressed Size:
                    </span>
                    <span className="font-medium text-green-600 text-xs sm:text-sm">
                      {formatSize(image.compressedSize)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-xs sm:text-sm">Space Saved:</span>
                    <span className="font-medium text-green-600 text-xs sm:text-sm">
                      {calculateSavings(image.originalSize, image.compressedSize)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-xs sm:text-sm">EXIF Data:</span>
                    <Badge
                      variant={image.hasExif ? "default" : "secondary"}
                      className={`text-[10px] ${image.hasExif ? "bg-green-600" : ""}`}
                    >
                      {image.hasExif ? "Preserved" : "Not Available"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right: EXIF Data */}
            <div className="flex flex-col order-2">
              <Card className="flex-1 flex flex-col">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Camera className="w-4 h-4" />
                    EXIF Metadata
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden">
                  <ScrollArea className="h-full pr-4 max-h-75 lg:max-h-125">
                    <ExifDataDisplay exifData={image.exifData} hasExif={image.hasExif} />
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
