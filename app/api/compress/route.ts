import { type NextRequest, NextResponse } from "next/server"
import sharp from "sharp"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("image") as File
    const quality = Number.parseInt(formData.get("quality") as string) || 80

    if (!file) {
      return NextResponse.json({ error: "未提供圖片" }, { status: 400 })
    }

    // 將 File 轉換為 Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // 使用 sharp 壓縮並轉換為 webp
    const compressedBuffer = await sharp(buffer)
      .withMetadata() // 加入 withMetadata() 保留原始 EXIF 資訊
      .webp({
        quality: quality,
        effort: 4, // 壓縮效率 (0-6)，4 是平衡點
      })
      .toBuffer()

    // 回傳壓縮後的圖片
    return new NextResponse(compressedBuffer, {
      headers: {
        "Content-Type": "image/webp",
        "Content-Disposition": `attachment; filename="compressed.webp"`,
      },
    })
  } catch (error) {
    console.error("壓縮錯誤:", error)
    return NextResponse.json({ error: "圖片處理失敗" }, { status: 500 })
  }
}
