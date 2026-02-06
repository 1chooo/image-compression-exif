import { Upload } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface UploadAreaProps {
  isDragging: boolean
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export function UploadArea({
  isDragging,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileSelect,
}: UploadAreaProps) {
  return (
    <Card
      className="border-2 border-dashed transition-colors duration-200"
      style={{ borderColor: isDragging ? "var(--primary)" : undefined }}
    >
      <CardContent className="p-6">
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className="flex flex-col items-center justify-center py-8 cursor-pointer"
          onClick={() => document.getElementById("file-input")?.click()}
        >
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-3">
            <Upload className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="text-base font-medium text-foreground mb-1">Drag and drop images here</p>
          <p className="text-sm text-muted-foreground">
            or click to select files (multiple selection supported)
          </p>
          <input
            id="file-input"
            type="file"
            accept="image/*"
            multiple
            onChange={onFileSelect}
            className="hidden"
          />
        </div>
      </CardContent>
    </Card>
  )
}
