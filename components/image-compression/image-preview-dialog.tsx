"use client"

import { Camera, ZoomIn, ZoomOut, Maximize2 } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
  const [zoom, setZoom] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const imageRef = useRef<HTMLDivElement>(null)

  // Reset zoom and position when image changes
  useEffect(() => {
    setZoom(1)
    setPosition({ x: 0, y: 0 })
  }, [image?.id])

  const handleZoomChange = (newZoom: number) => {
    setZoom(newZoom)
    if (newZoom === 1) {
      setPosition({ x: 0, y: 0 })
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true)
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      })
      e.preventDefault()
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    const newZoom = Math.max(1, Math.min(5, zoom + delta))
    handleZoomChange(newZoom)
  }

  return (
    <Dialog open={!!image} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-7xl max-h-[95vh] p-0 gap-0 flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle className="text-base sm:text-lg">
            {image?.originalName.replace(/\.[^.]+$/, ".webp")}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Compressed image preview with metadata
          </DialogDescription>
        </DialogHeader>

        {image && (
          <div className="flex flex-col lg:grid lg:grid-cols-[1.5fr_1fr] gap-4 sm:gap-6 p-4 sm:p-6 overflow-y-auto flex-1 min-h-0">
            {/* Left: Image Preview */}
            <div className="flex flex-col gap-4 order-1">
              {/* Zoom Controls */}
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleZoomChange(1)}
                  className={zoom === 1 ? "bg-primary text-primary-foreground" : ""}
                >
                  1x
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleZoomChange(2)}
                  className={zoom === 2 ? "bg-primary text-primary-foreground" : ""}
                >
                  2x
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleZoomChange(5)}
                  className={zoom === 5 ? "bg-primary text-primary-foreground" : ""}
                >
                  5x
                </Button>
                <div className="h-4 w-px bg-border mx-1" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleZoomChange(Math.max(1, zoom - 0.5))}
                  disabled={zoom <= 1}
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-sm font-medium min-w-12 text-center">
                  {zoom.toFixed(1)}x
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleZoomChange(Math.min(5, zoom + 0.5))}
                  disabled={zoom >= 5}
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
              </div>

              {/* Image Container */}
              <div 
                ref={imageRef}
                className="relative bg-muted rounded-lg overflow-hidden"
                style={{ 
                  minHeight: "500px",
                  height: "calc(95vh - 400px)",
                  cursor: zoom > 1 ? (isDragging ? "grabbing" : "grab") : "default"
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.previewUrl}
                  alt={image.originalName}
                  className="w-full h-full object-contain select-none"
                  style={{
                    transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
                    transition: isDragging ? "none" : "transform 0.2s ease-out",
                  }}
                  draggable={false}
                />
              </div>

              {zoom > 1 && (
                <p className="text-xs text-center text-muted-foreground">
                  💡 Drag to pan • Scroll to zoom • Click zoom buttons to preset
                </p>
              )}

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
