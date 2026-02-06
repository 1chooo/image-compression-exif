import { useState } from "react"
import { X, FileImage, Camera, ChevronDown, ChevronUp, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

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

interface PendingFile {
  id: string
  file: File
  previewUrl: string
  exifData: ExifData | null
}

interface PendingFilesListProps {
  files: PendingFile[]
  onRemoveFile: (id: string) => void
  onClearAll: () => void
  formatSize: (bytes: number) => string
}

export function PendingFilesList({
  files,
  onRemoveFile,
  onClearAll,
  formatSize,
}: PendingFilesListProps) {
  const [expandedExif, setExpandedExif] = useState<Set<string>>(new Set())

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

  const formatExifSummary = (exif: ExifData) => {
    const parts: string[] = []
    if (exif.model) parts.push(exif.model)
    if (exif.focalLength) parts.push(exif.focalLength)
    if (exif.fNumber) parts.push(exif.fNumber)
    if (exif.exposureTime) parts.push(exif.exposureTime)
    if (exif.iso) parts.push(`ISO ${exif.iso}`)
    return parts.join(" · ")
  }

  const totalSize = files.reduce((sum, p) => sum + p.file.size, 0)

  if (files.length === 0) return null

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            Pending ({files.length} images, {formatSize(totalSize)})
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClearAll} className="h-8 px-2">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3 max-h-100 overflow-y-auto">
        {files.map((pending) => (
          <div key={pending.id} className="flex gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="relative shrink-0">
              <button
                onClick={() => onRemoveFile(pending.id)}
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
                    <span className="truncate max-w-50">
                      {formatExifSummary(pending.exifData)}
                    </span>
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
  )
}
