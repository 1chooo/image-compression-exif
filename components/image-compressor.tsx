"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Upload, Download, ImageIcon, Loader2, X, FileImage, Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
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
}

export function ImageCompressor() {
  const [isDragging, setIsDragging] = useState(false)
  const [isCompressing, setIsCompressing] = useState(false)
  const [quality, setQuality] = useState(80)
  const [compressedImages, setCompressedImages] = useState<CompressedImage[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [exifData, setExifData] = useState<ExifData | null>(null)

  const parseExif = async (file: File): Promise<ExifData | null> => {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const tags = ExifReader.load(arrayBuffer)

      const exif: ExifData = {}

      // 相機資訊
      if (tags.Make?.description) exif.make = tags.Make.description
      if (tags.Model?.description) exif.model = tags.Model.description

      // 拍攝時間
      if (tags.DateTime?.description) {
        exif.dateTime = tags.DateTime.description
      } else if (tags.DateTimeOriginal?.description) {
        exif.dateTime = tags.DateTimeOriginal.description
      }

      // 曝光參數
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

      // 圖片尺寸
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

      // GPS 資訊
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

      // 檢查是否有任何有效的 EXIF 資料
      if (Object.keys(exif).length === 0) return null

      return exif
    } catch (error) {
      console.error("EXIF 解析錯誤:", error)
      return null
    }
  }

  const handleFileSelection = async (file: File) => {
    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))

    // 解析 EXIF
    const exif = await parseExif(file)
    setExifData(exif)
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
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith("image/")) {
      handleFileSelection(file)
    }
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelection(file)
    }
  }, [])

  const handleCompress = async () => {
    if (!selectedFile) return

    setIsCompressing(true)
    try {
      const formData = new FormData()
      formData.append("image", selectedFile)
      formData.append("quality", quality.toString())

      const response = await fetch("/api/compress", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("壓縮失敗")

      const blob = await response.blob()
      const downloadUrl = URL.createObjectURL(blob)

      const newImage: CompressedImage = {
        id: Date.now().toString(),
        originalName: selectedFile.name,
        originalSize: selectedFile.size,
        compressedSize: blob.size,
        downloadUrl,
        previewUrl: downloadUrl,
      }

      setCompressedImages((prev) => [newImage, ...prev])
      setSelectedFile(null)
      setPreviewUrl(null)
      setExifData(null)
    } catch (error) {
      console.error("壓縮錯誤:", error)
      alert("圖片壓縮失敗，請重試")
    } finally {
      setIsCompressing(false)
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

  const clearSelection = () => {
    setSelectedFile(null)
    setExifData(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* 上傳區域 */}
      <Card
        className="border-2 border-dashed transition-colors duration-200"
        style={{ borderColor: isDragging ? "var(--primary)" : undefined }}
      >
        <CardContent className="p-8">
          {!selectedFile ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className="flex flex-col items-center justify-center py-10 cursor-pointer"
              onClick={() => document.getElementById("file-input")?.click()}
            >
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Upload className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-medium text-foreground mb-1">拖放圖片到這裡</p>
              <p className="text-sm text-muted-foreground">或點擊選擇檔案</p>
              <input id="file-input" type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute -top-2 -right-2 z-10 h-8 w-8 rounded-full bg-muted"
                  onClick={clearSelection}
                >
                  <X className="h-4 w-4" />
                </Button>
                <div className="aspect-video relative rounded-lg overflow-hidden bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewUrl || ""} alt="預覽" className="w-full h-full object-contain" />
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <FileImage className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">{formatSize(selectedFile.size)}</p>
                </div>
              </div>

              {exifData && (
                <div className="p-4 bg-muted/50 rounded-lg space-y-3 border">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Camera className="w-4 h-4" />
                    EXIF 資訊
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    {exifData.make && (
                      <>
                        <span className="text-muted-foreground">製造商</span>
                        <span>{exifData.make}</span>
                      </>
                    )}
                    {exifData.model && (
                      <>
                        <span className="text-muted-foreground">相機型號</span>
                        <span>{exifData.model}</span>
                      </>
                    )}
                    {exifData.lensModel && (
                      <>
                        <span className="text-muted-foreground">鏡頭</span>
                        <span>{exifData.lensModel}</span>
                      </>
                    )}
                    {exifData.dateTime && (
                      <>
                        <span className="text-muted-foreground">拍攝時間</span>
                        <span>{exifData.dateTime}</span>
                      </>
                    )}
                    {(exifData.imageWidth || exifData.imageHeight) && (
                      <>
                        <span className="text-muted-foreground">解析度</span>
                        <span>
                          {exifData.imageWidth} x {exifData.imageHeight}
                        </span>
                      </>
                    )}
                    {exifData.focalLength && (
                      <>
                        <span className="text-muted-foreground">焦距</span>
                        <span>{exifData.focalLength}</span>
                      </>
                    )}
                    {exifData.fNumber && (
                      <>
                        <span className="text-muted-foreground">光圈</span>
                        <span>{exifData.fNumber}</span>
                      </>
                    )}
                    {exifData.exposureTime && (
                      <>
                        <span className="text-muted-foreground">快門速度</span>
                        <span>{exifData.exposureTime}</span>
                      </>
                    )}
                    {exifData.iso && (
                      <>
                        <span className="text-muted-foreground">ISO</span>
                        <span>{exifData.iso}</span>
                      </>
                    )}
                    {exifData.gps && (
                      <>
                        <span className="text-muted-foreground">GPS 座標</span>
                        <span className="text-xs">
                          {exifData.gps.latitude?.toFixed(6)}, {exifData.gps.longitude?.toFixed(6)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* 品質控制 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>壓縮品質</Label>
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
                <p className="text-xs text-muted-foreground">建議使用 70-85% 以獲得最佳品質與大小平衡</p>
              </div>

              <Button onClick={handleCompress} disabled={isCompressing} className="w-full" size="lg">
                {isCompressing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    壓縮中...
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-4 h-4 mr-2" />
                    壓縮並轉換為 WebP
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 壓縮結果 */}
      {compressedImages.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">壓縮結果</h2>
          <div className="space-y-3">
            {compressedImages.map((img) => (
              <Card key={img.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.previewUrl || "/placeholder.svg"}
                        alt={img.originalName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{img.originalName.replace(/\.[^.]+$/, ".webp")}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{formatSize(img.originalSize)}</span>
                        <span>→</span>
                        <span className="text-green-600 font-medium">{formatSize(img.compressedSize)}</span>
                        <span className="text-green-600">
                          (-{calculateSavings(img.originalSize, img.compressedSize)}%)
                        </span>
                      </div>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <a href={img.downloadUrl} download={img.originalName.replace(/\.[^.]+$/, ".webp")}>
                        <Download className="w-4 h-4 mr-2" />
                        下載
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
