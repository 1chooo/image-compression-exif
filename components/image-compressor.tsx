"use client"

import type React from "react"
import JSZip from "jszip"
import imageCompression from "browser-image-compression"
import { toast } from "sonner"

import { useState, useCallback } from "react"
import {
  Upload,
  Download,
  ImageIcon,
  Loader2,
  X,
  FileImage,
  Camera,
  Trash2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Eye,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import ExifReader from "exifreader"

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

interface PendingFile {
  id: string
  file: File
  previewUrl: string
  exifData: ExifData | null
}

export function ImageCompressor() {
  const [isDragging, setIsDragging] = useState(false)
  const [isCompressing, setIsCompressing] = useState(false)
  const [quality, setQuality] = useState(80)
  const [compressedImages, setCompressedImages] = useState<CompressedImage[]>([])
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([])
  const [compressionProgress, setCompressionProgress] = useState<{ current: number; total: number } | null>(null)
  const [expandedExif, setExpandedExif] = useState<Set<string>>(new Set())
  const [previewImage, setPreviewImage] = useState<CompressedImage | null>(null)

  const toggleExif = (id: string) => {
    setExpandedExif((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const parseExif = async (file: File): Promise<ExifData | null> => {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const tags = ExifReader.load(arrayBuffer)

      const exif: ExifData = {}

      if (tags.Make?.description) exif.make = tags.Make.description
      if (tags.Model?.description) exif.model = tags.Model.description

      if (tags.DateTime?.description) {
        exif.dateTime = tags.DateTime.description
      } else if (tags.DateTimeOriginal?.description) {
        exif.dateTime = tags.DateTimeOriginal.description
      }

      if (tags.ExposureTime?.description) {
        exif.exposureTime = tags.ExposureTime.description
      }
      if (tags.FNumber?.description) {
        exif.fNumber = `f/${tags.FNumber.value}`
      }
      if (tags.ISOSpeedRatings?.description) {
        exif.iso = tags.ISOSpeedRatings.description
      }
      if (tags.FocalLength?.description) {
        exif.focalLength = tags.FocalLength.description
      }
      if (tags.LensModel?.description) {
        exif.lensModel = tags.LensModel.description
      }

      if (tags["Image Width"]?.value) {
        exif.imageWidth = Number(tags["Image Width"].value)
      } else if (tags.PixelXDimension?.value) {
        exif.imageWidth = Number(tags.PixelXDimension.value)
      }
      if (tags["Image Height"]?.value) {
        exif.imageHeight = Number(tags["Image Height"].value)
      } else if (tags.PixelYDimension?.value) {
        exif.imageHeight = Number(tags.PixelYDimension.value)
      }

      if (tags.GPSLatitude && tags.GPSLongitude) {
        const latRef = tags.GPSLatitudeRef?.description || "N"
        const lonRef = tags.GPSLongitudeRef?.description || "E"
        const lat = tags.GPSLatitude.description
        const lon = tags.GPSLongitude.description

        if (lat && lon) {
          exif.gps = {
            latitude: latRef === "S" ? -Number(lat) : Number(lat),
            longitude: lonRef === "W" ? -Number(lon) : Number(lon),
          }
        }
      }

      if (Object.keys(exif).length === 0) return null

      return exif
    } catch (error) {
      console.error("EXIF parsing error:", error)
      return null
    }
  }

  const checkCompressedExif = async (blob: Blob): Promise<boolean> => {
    try {
      const arrayBuffer = await blob.arrayBuffer()
      const tags = ExifReader.load(arrayBuffer)
      // Check if there is any meaningful EXIF data
      return !!(
        tags.Make?.description ||
        tags.Model?.description ||
        tags.DateTime?.description ||
        tags.DateTimeOriginal?.description
      )
    } catch {
      return false
    }
  }

  const handleFilesSelection = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((f) => f.type.startsWith("image/"))

    const newPendingFiles: PendingFile[] = await Promise.all(
      fileArray.map(async (file) => {
        const previewUrl = URL.createObjectURL(file)
        const exifData = await parseExif(file)
        return {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          file,
          previewUrl,
          exifData,
        }
      }),
    )

    setPendingFiles((prev) => [...prev, ...newPendingFiles])
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFilesSelection(files)
    }
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFilesSelection(files)
    }
    e.target.value = ""
  }, [])

  const handleCompressAll = async () => {
    if (pendingFiles.length === 0) return

    setIsCompressing(true)
    setCompressionProgress({ current: 0, total: pendingFiles.length })
    
    // Show start toast
    toast.info(`Starting compression of ${pendingFiles.length} image${pendingFiles.length > 1 ? 's' : ''}...`)

    const results: CompressedImage[] = []
    let successCount = 0
    let failCount = 0

    for (let i = 0; i < pendingFiles.length; i++) {
      const pending = pendingFiles[i]
      setCompressionProgress({ current: i + 1, total: pendingFiles.length })

      try {
        // Step 1: Client-side pre-compression for large images
        let fileToUpload = pending.file
        const fileSizeMB = pending.file.size / 1024 / 1024

        // If file is larger than 3 MB, pre-compress on client side
        if (fileSizeMB > 3) {
          toast.loading(`Pre-compressing ${pending.file.name} (${fileSizeMB.toFixed(1)}MB)...`, {
            id: `compress-${pending.id}`,
          })

          const options = {
            maxSizeMB: 3.5, // Target size before server upload (under 4MB limit)
            maxWidthOrHeight: 4096, // Maintain reasonable resolution
            useWebWorker: true,
            fileType: pending.file.type,
            preserveExif: true, // Keep EXIF data during client compression
          }

          try {
            fileToUpload = await imageCompression(pending.file, options)
            console.log(`Pre-compressed ${pending.file.name} from ${fileSizeMB.toFixed(2)}MB to ${(fileToUpload.size / 1024 / 1024).toFixed(2)}MB`)
          } catch (compressionError) {
            console.warn("Client-side compression failed, trying original file:", compressionError)
            // If client compression fails, try with original file anyway
          }
        }

        // Step 2: Send to server for WebP conversion and final optimization
        toast.loading(`Converting ${pending.file.name} to WebP...`, {
          id: `compress-${pending.id}`,
        })

        const formData = new FormData()
        formData.append("image", fileToUpload)
        formData.append("quality", quality.toString())

        const response = await fetch("/api/compress", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) throw new Error("Compression failed")

        const blob = await response.blob()
        const downloadUrl = URL.createObjectURL(blob)

        const hasExif = await checkCompressedExif(blob)
        const compressedExifData = hasExif ? await parseExif(new File([blob], "compressed.webp")) : null

        results.push({
          id: pending.id,
          originalName: pending.file.name,
          originalSize: pending.file.size,
          compressedSize: blob.size,
          downloadUrl,
          previewUrl: downloadUrl,
          hasExif,
          exifData: compressedExifData,
        })

        successCount++
        toast.success(`✓ ${pending.file.name}`, {
          id: `compress-${pending.id}`,
          description: `${formatSize(pending.file.size)} → ${formatSize(blob.size)} (-${calculateSavings(pending.file.size, blob.size)}%)`,
        })
      } catch (error) {
        failCount++
        console.error(`Failed to compress ${pending.file.name}:`, error)
        toast.error(`Failed to compress ${pending.file.name}`, {
          id: `compress-${pending.id}`,
          description: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    setCompressedImages((prev) => [...results, ...prev])

    pendingFiles.forEach((p) => URL.revokeObjectURL(p.previewUrl))
    setPendingFiles([])
    setCompressionProgress(null)
    setIsCompressing(false)

    // Show final summary toast
    if (successCount > 0 && failCount === 0) {
      toast.success(`All ${successCount} image${successCount > 1 ? 's' : ''} compressed successfully! 🎉`)
    } else if (successCount > 0 && failCount > 0) {
      toast.warning(`Compression complete: ${successCount} succeeded, ${failCount} failed`)
    } else if (failCount > 0) {
      toast.error(`All ${failCount} image${failCount > 1 ? 's' : ''} failed to compress`)
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(2) + " MB"
  }

  const calculateSavings = (original: number, compressed: number) => {
    const savings = ((original - compressed) / original) * 100
    return savings.toFixed(1)
  }

  const removePendingFile = (id: string) => {
    setPendingFiles((prev) => {
      const file = prev.find((p) => p.id === id)
      if (file) URL.revokeObjectURL(file.previewUrl)
      return prev.filter((p) => p.id !== id)
    })
  }

  const clearAllPending = () => {
    pendingFiles.forEach((p) => URL.revokeObjectURL(p.previewUrl))
    setPendingFiles([])
  }

  const clearAllCompressed = () => {
    compressedImages.forEach((img) => URL.revokeObjectURL(img.downloadUrl))
    setCompressedImages([])
  }

  const downloadAll = async () => {
    if (compressedImages.length === 0) return

    if (compressedImages.length === 1) {
      const link = document.createElement("a")
      link.href = compressedImages[0].downloadUrl
      link.download = compressedImages[0].originalName.replace(/\.[^.]+$/, ".webp")
      link.click()
      return
    }

    const zip = new JSZip()

    for (const img of compressedImages) {
      const response = await fetch(img.downloadUrl)
      const blob = await response.blob()
      const fileName = img.originalName.replace(/\.[^.]+$/, ".webp")
      zip.file(fileName, blob)
    }

    const zipBlob = await zip.generateAsync({ type: "blob" })
    const url = URL.createObjectURL(zipBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `compressed-images-${Date.now()}.zip`
    link.click()
    URL.revokeObjectURL(url)
  }

  const totalPendingSize = pendingFiles.reduce((sum, p) => sum + p.file.size, 0)

  const formatExifSummary = (exif: ExifData) => {
    const parts: string[] = []
    if (exif.model) parts.push(exif.model)
    if (exif.focalLength) parts.push(exif.focalLength)
    if (exif.fNumber) parts.push(exif.fNumber)
    if (exif.exposureTime) parts.push(exif.exposureTime)
    if (exif.iso) parts.push(`ISO ${exif.iso}`)
    return parts.join(" · ")
  }

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
        {/* Left side: Upload and pending compression area */}
        <div className="space-y-6">
          {/* Upload area */}
          <Card
            className="border-2 border-dashed transition-colors duration-200"
            style={{ borderColor: isDragging ? "var(--primary)" : undefined }}
          >
            <CardContent className="p-6">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className="flex flex-col items-center justify-center py-8 cursor-pointer"
                onClick={() => document.getElementById("file-input")?.click()}
              >
                <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-3">
                  <Upload className="w-7 h-7 text-muted-foreground" />
                </div>
                <p className="text-base font-medium text-foreground mb-1">Drag and drop images here</p>
                <p className="text-sm text-muted-foreground">or click to select files (multiple selection supported)</p>
                <input
                  id="file-input"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </CardContent>
          </Card>

          {/* Quality control */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label>Compression Quality</Label>
                <span className="text-sm font-medium text-muted-foreground">{quality}%</span>
              </div>
              <Slider
                value={[quality]}
                onValueChange={(value) => setQuality(value[0])}
                min={10}
                max={100}
                step={5}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">Recommended 70-85% for optimal quality and size balance</p>
            </CardContent>
          </Card>

          {/* Pending compression list */}
          {pendingFiles.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    Pending ({pendingFiles.length} images, {formatSize(totalPendingSize)})
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={clearAllPending} className="h-8 px-2">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-3 max-h-100 overflow-y-auto">
                {pendingFiles.map((pending) => (
                  <div key={pending.id} className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="relative shrink-0">
                      <button
                        onClick={() => removePendingFile(pending.id)}
                        className="absolute -top-1.5 -right-1.5 z-10 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/80 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      <div className="w-16 h-16 rounded-md overflow-hidden bg-muted">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={pending.previewUrl || "/placeholder.svg"}
                          alt={pending.file.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <FileImage className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <p className="text-sm font-medium truncate">{pending.file.name}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">{formatSize(pending.file.size)}</p>

                      {pending.exifData && (
                        <div className="pt-1">
                          <button
                            onClick={() => toggleExif(pending.id)}
                            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Camera className="w-3 h-3" />
                            <span className="truncate max-w-50">{formatExifSummary(pending.exifData)}</span>
                            {expandedExif.has(pending.id) ? (
                              <ChevronUp className="w-3 h-3 shrink-0" />
                            ) : (
                              <ChevronDown className="w-3 h-3 shrink-0" />
                            )}
                          </button>

                          {expandedExif.has(pending.id) && (
                            <div className="mt-2 pt-2 border-t border-border/50 space-y-0.5 text-xs">
                              {pending.exifData.model && (
                                <div className="flex">
                                  <span className="text-muted-foreground w-14 shrink-0">Camera</span>
                                  <span className="truncate">
                                    {pending.exifData.make} {pending.exifData.model}
                                  </span>
                                </div>
                              )}
                              {pending.exifData.dateTime && (
                                <div className="flex">
                                  <span className="text-muted-foreground w-14 shrink-0">Time</span>
                                  <span>{pending.exifData.dateTime}</span>
                                </div>
                              )}
                              {(pending.exifData.imageWidth || pending.exifData.imageHeight) && (
                                <div className="flex">
                                  <span className="text-muted-foreground w-14 shrink-0">Resolution</span>
                                  <span>
                                    {pending.exifData.imageWidth} x {pending.exifData.imageHeight}
                                  </span>
                                </div>
                              )}
                              {pending.exifData.focalLength && (
                                <div className="flex">
                                  <span className="text-muted-foreground w-14 shrink-0">Focal</span>
                                  <span>{pending.exifData.focalLength}</span>
                                </div>
                              )}
                              {pending.exifData.fNumber && (
                                <div className="flex">
                                  <span className="text-muted-foreground w-14 shrink-0">Aperture</span>
                                  <span>{pending.exifData.fNumber}</span>
                                </div>
                              )}
                              {pending.exifData.exposureTime && (
                                <div className="flex">
                                  <span className="text-muted-foreground w-14 shrink-0">Shutter</span>
                                  <span>{pending.exifData.exposureTime}</span>
                                </div>
                              )}
                              {pending.exifData.iso && (
                                <div className="flex">
                                  <span className="text-muted-foreground w-14 shrink-0">ISO</span>
                                  <span>{pending.exifData.iso}</span>
                                </div>
                              )}
                              {pending.exifData.lensModel && (
                                <div className="flex">
                                  <span className="text-muted-foreground w-14 shrink-0">Lens</span>
                                  <span className="truncate">{pending.exifData.lensModel}</span>
                                </div>
                              )}
                              {pending.exifData.gps && (
                                <div className="flex">
                                  <span className="text-muted-foreground w-14 shrink-0">GPS</span>
                                  <span>
                                    {pending.exifData.gps.latitude?.toFixed(6)},{" "}
                                    {pending.exifData.gps.longitude?.toFixed(6)}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Compress button */}
          {pendingFiles.length > 0 && (
            <Button onClick={handleCompressAll} disabled={isCompressing} className="w-full" size="lg">
              {isCompressing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Compressing ({compressionProgress?.current}/{compressionProgress?.total})...
                </>
              ) : (
                <>
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Compress All and Convert to WebP
                </>
              )}
            </Button>
          )}
        </div>

        {/* Right side: Compression results */}
        <div className="space-y-4">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  Compression Results {compressedImages.length > 0 && `(${compressedImages.length} images)`}
                </CardTitle>
                {compressedImages.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={downloadAll} className="h-8 px-3 bg-transparent">
                      <Download className="w-4 h-4 mr-1.5" />
                      Download All
                    </Button>
                    <Button variant="ghost" size="sm" onClick={clearAllCompressed} className="h-8 px-2">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {compressedImages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <ImageIcon className="w-12 h-12 mb-3 opacity-50" />
                  <p className="text-sm">Compressed images will be displayed here</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-150 overflow-y-auto">
                  {compressedImages.map((img) => (
                    <div key={img.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="w-14 h-14 rounded-md overflow-hidden bg-muted shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.previewUrl || "/placeholder.svg"}
                          alt={img.originalName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">
                            {img.originalName.replace(/\.[^.]+$/, ".webp")}
                          </p>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge
                                variant={img.hasExif ? "default" : "secondary"}
                                className={`text-[10px] px-1.5 py-0 h-4 ${img.hasExif ? "bg-green-600 hover:bg-green-700" : ""}`}
                              >
                                {img.hasExif ? "EXIF" : "No EXIF"}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{img.hasExif ? "EXIF data preserved" : "EXIF data not preserved or original file has no EXIF"}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span>{formatSize(img.originalSize)}</span>
                          <span>→</span>
                          <span className="text-green-600 font-medium">{formatSize(img.compressedSize)}</span>
                          <span className="text-green-600">
                            (-{calculateSavings(img.originalSize, img.compressedSize)}%)
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPreviewImage(img)}
                          className="bg-transparent"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button asChild variant="outline" size="sm" className="bg-transparent">
                          <a href={img.downloadUrl} download={img.originalName.replace(/\.[^.]+$/, ".webp")}>
                            <Download className="w-4 h-4" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{previewImage?.originalName.replace(/\.[^.]+$/, ".webp")}</DialogTitle>
            <DialogDescription>
              Compressed image preview with metadata
            </DialogDescription>
          </DialogHeader>
          
          {previewImage && (
            <div className="grid md:grid-cols-2 gap-6 overflow-hidden">
              {/* Left: Image Preview */}
              <div className="flex flex-col gap-4">
                <div className="relative bg-muted rounded-lg overflow-hidden aspect-square">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewImage.previewUrl}
                    alt={previewImage.originalName}
                    className="w-full h-full object-contain"
                  />
                </div>
                
                {/* Compression Stats */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Compression Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Original Size:</span>
                      <span className="font-medium">{formatSize(previewImage.originalSize)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Compressed Size:</span>
                      <span className="font-medium text-green-600">
                        {formatSize(previewImage.compressedSize)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Space Saved:</span>
                      <span className="font-medium text-green-600">
                        {calculateSavings(previewImage.originalSize, previewImage.compressedSize)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">EXIF Data:</span>
                      <Badge
                        variant={previewImage.hasExif ? "default" : "secondary"}
                        className={previewImage.hasExif ? "bg-green-600" : ""}
                      >
                        {previewImage.hasExif ? "Preserved" : "Not Available"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right: EXIF Data */}
              <div className="flex flex-col">
                <Card className="flex-1 flex flex-col">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Camera className="w-4 h-4" />
                      EXIF Metadata
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-hidden">
                    <ScrollArea className="h-full pr-4">
                      {previewImage.exifData ? (
                        <div className="space-y-3">
                          {previewImage.exifData.make && (
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Camera</Label>
                              <p className="text-sm font-medium">
                                {previewImage.exifData.make} {previewImage.exifData.model}
                              </p>
                            </div>
                          )}
                          
                          {previewImage.exifData.lensModel && (
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Lens</Label>
                              <p className="text-sm">{previewImage.exifData.lensModel}</p>
                            </div>
                          )}
                          
                          {previewImage.exifData.dateTime && (
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Date Taken</Label>
                              <p className="text-sm">{previewImage.exifData.dateTime}</p>
                            </div>
                          )}
                          
                          {(previewImage.exifData.imageWidth || previewImage.exifData.imageHeight) && (
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Resolution</Label>
                              <p className="text-sm">
                                {previewImage.exifData.imageWidth} × {previewImage.exifData.imageHeight} pixels
                              </p>
                            </div>
                          )}
                          
                          {previewImage.exifData.focalLength && (
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Focal Length</Label>
                              <p className="text-sm">{previewImage.exifData.focalLength}</p>
                            </div>
                          )}
                          
                          {previewImage.exifData.fNumber && (
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Aperture</Label>
                              <p className="text-sm">{previewImage.exifData.fNumber}</p>
                            </div>
                          )}
                          
                          {previewImage.exifData.exposureTime && (
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Shutter Speed</Label>
                              <p className="text-sm">{previewImage.exifData.exposureTime}</p>
                            </div>
                          )}
                          
                          {previewImage.exifData.iso && (
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">ISO</Label>
                              <p className="text-sm">{previewImage.exifData.iso}</p>
                            </div>
                          )}
                          
                          {previewImage.exifData.gps && (
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">GPS Location</Label>
                              <p className="text-sm font-mono">
                                {previewImage.exifData.gps.latitude?.toFixed(6)}, {previewImage.exifData.gps.longitude?.toFixed(6)}
                              </p>
                              <a
                                href={`https://www.google.com/maps?q=${previewImage.exifData.gps.latitude},${previewImage.exifData.gps.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline"
                              >
                                View on Google Maps →
                              </a>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                          <Camera className="w-8 h-8 mb-2 opacity-50" />
                          <p className="text-sm">No EXIF data available</p>
                          <p className="text-xs mt-1">
                            {previewImage.hasExif
                              ? "Unable to parse EXIF data"
                              : "Original image had no EXIF metadata"}
                          </p>
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}
