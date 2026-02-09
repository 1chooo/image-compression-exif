"use client"

import { Camera, ZoomIn, ZoomOut, Download } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

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
      <DialogContent className="max-w-[95vw] w-[95vw] max-h-[95vh] h-[95vh] p-0 gap-0 flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0 space-y-0">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg font-semibold truncate">
                {image?.originalName.replace(/\.[^.]+$/, ".webp")}
              </DialogTitle>
            </div>
            {image && (
              <Button
                asChild
                variant="default"
                size="sm"
                className="shrink-0"
              >
                <a
                  href={image.downloadUrl}
                  download={image.originalName.replace(/\.[^.]+$/, ".webp")}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </a>
              </Button>
            )}
          </div>
        </DialogHeader>

        {image && (
          <div className="flex flex-col flex-1 min-h-0 overflow-auto">
            {/* Top: Image Preview */}
            <div className="flex flex-col p-6 gap-4 shrink-0">
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
                <Separator orientation="vertical" className="h-6 mx-1" />
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
                  height: "60vh",
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
                  💡 Drag to pan • Scroll to zoom • Click zoom buttons for presets
                </p>
              )}
            </div>

            {/* Bottom: Stats & EXIF */}
            <div className="border-t bg-muted/20">
              <div className="p-6 space-y-6">
                {/* Compression Stats */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    Compression Stats
                  </h3>
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Original:</span>
                      <span className="font-medium font-mono">{formatSize(image.originalSize)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Compressed:</span>
                      <span className="font-medium font-mono text-green-600">
                        {formatSize(image.compressedSize)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Saved:</span>
                      <span className="font-semibold text-green-600">
                        {calculateSavings(image.originalSize, image.compressedSize)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">EXIF:</span>
                      <Badge
                        variant={image.hasExif ? "default" : "secondary"}
                        className={`text-xs ${image.hasExif ? "bg-green-600" : ""}`}
                      >
                        {image.hasExif ? "Preserved" : "Not Available"}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* EXIF Metadata - Similar to files-manager */}
                {image.exifData && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h3 className="font-semibold text-sm flex items-center gap-2">
                        <Camera className="w-4 h-4" />
                        EXIF Metadata
                      </h3>

                      <div className="space-y-3 text-sm">
                        {/* Camera Info */}
                        {(image.exifData.make || image.exifData.model) && (
                          <div className="space-y-1">
                            <span className="text-xs text-muted-foreground font-medium">Camera</span>
                            <p className="font-mono text-xs bg-muted px-2 py-1.5 rounded">
                              {image.exifData.make} {image.exifData.model}
                            </p>
                          </div>
                        )}

                        {image.exifData.lensModel && (
                          <div className="space-y-1">
                            <span className="text-xs text-muted-foreground font-medium">Lens</span>
                            <p className="font-mono text-xs bg-muted px-2 py-1.5 rounded break-all">
                              {image.exifData.lensModel}
                            </p>
                          </div>
                        )}

                        {image.exifData.dateTime && (
                          <div className="space-y-1">
                            <span className="text-xs text-muted-foreground font-medium">Date/Time</span>
                            <p className="font-mono text-xs bg-muted px-2 py-1.5 rounded">
                              {image.exifData.dateTime}
                            </p>
                          </div>
                        )}

                        {(image.exifData.imageWidth || image.exifData.imageHeight) && (
                          <div className="space-y-1">
                            <span className="text-xs text-muted-foreground font-medium">Resolution</span>
                            <p className="font-mono text-xs bg-muted px-2 py-1.5 rounded">
                              {image.exifData.imageWidth} × {image.exifData.imageHeight}
                            </p>
                          </div>
                        )}

                        {/* Camera Settings */}
                        {(image.exifData.focalLength ||
                          image.exifData.fNumber ||
                          image.exifData.exposureTime ||
                          image.exifData.iso) && (
                          <>
                            <Separator className="my-3" />
                            <div className="space-y-2">
                              <span className="text-xs text-muted-foreground font-semibold">Settings</span>
                              <div className="grid grid-cols-2 gap-2">
                                {image.exifData.focalLength && (
                                  <div className="space-y-1">
                                    <span className="text-[10px] text-muted-foreground block">Focal Length</span>
                                    <Badge variant="secondary" className="font-mono text-xs w-full justify-center">
                                      {image.exifData.focalLength}
                                    </Badge>
                                  </div>
                                )}
                                {image.exifData.fNumber && (
                                  <div className="space-y-1">
                                    <span className="text-[10px] text-muted-foreground block">Aperture</span>
                                    <Badge variant="secondary" className="font-mono text-xs w-full justify-center">
                                      {image.exifData.fNumber}
                                    </Badge>
                                  </div>
                                )}
                                {image.exifData.exposureTime && (
                                  <div className="space-y-1">
                                    <span className="text-[10px] text-muted-foreground block">Shutter</span>
                                    <Badge variant="secondary" className="font-mono text-xs w-full justify-center">
                                      {image.exifData.exposureTime}
                                    </Badge>
                                  </div>
                                )}
                                {image.exifData.iso && (
                                  <div className="space-y-1">
                                    <span className="text-[10px] text-muted-foreground block">ISO</span>
                                    <Badge variant="secondary" className="font-mono text-xs w-full justify-center">
                                      {image.exifData.iso}
                                    </Badge>
                                  </div>
                                )}
                              </div>
                            </div>
                          </>
                        )}

                        {/* GPS Location */}
                        {image.exifData.gps?.latitude && image.exifData.gps?.longitude && (
                          <>
                            <Separator className="my-3" />
                            <div className="space-y-2">
                              <span className="text-xs text-muted-foreground font-semibold">Location</span>
                              <div className="space-y-1">
                                <span className="text-[10px] text-muted-foreground block">GPS Coordinates</span>
                                <p className="font-mono text-xs bg-muted px-2 py-1.5 rounded">
                                  {image.exifData.gps.latitude.toFixed(6)}, {image.exifData.gps.longitude.toFixed(6)}
                                </p>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* No EXIF message */}
                {!image.exifData && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h3 className="font-semibold text-sm flex items-center gap-2">
                        <Camera className="w-4 h-4" />
                        EXIF Metadata
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        No EXIF data available for this image.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
