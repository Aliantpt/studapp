import { imageSize } from './image'

// минимальный PDF: каждая страница — одна JPEG-картинка на весь лист, без сторонних библиотек
const A4_WIDTH = 595.28

export async function buildPdf(pages: Blob[]): Promise<Blob> {
  const enc = new TextEncoder()
  const parts: Uint8Array[] = []
  const offsets: number[] = []
  let length = 0
  const push = (chunk: Uint8Array | string) => {
    const bytes = typeof chunk === 'string' ? enc.encode(chunk) : chunk
    parts.push(bytes)
    length += bytes.length
  }
  const obj = (n: number, body: string) => {
    offsets[n] = length
    push(`${n} 0 obj\n${body}\nendobj\n`)
  }

  const n = pages.length
  // 1 — каталог, 2 — дерево страниц, дальше на каждую страницу: page, content, image
  const pageObj = (i: number) => 3 + i * 3
  push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n')
  obj(1, '<< /Type /Catalog /Pages 2 0 R >>')
  obj(2, `<< /Type /Pages /Count ${n} /Kids [${pages.map((_, i) => `${pageObj(i)} 0 R`).join(' ')}] >>`)

  for (let i = 0; i < n; i++) {
    const { w, h } = await imageSize(pages[i])
    const pw = A4_WIDTH
    const ph = (A4_WIDTH * h) / w
    const p = pageObj(i)
    obj(
      p,
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pw.toFixed(2)} ${ph.toFixed(2)}] ` +
        `/Resources << /XObject << /Im${i} ${p + 2} 0 R >> >> /Contents ${p + 1} 0 R >>`,
    )
    const draw = `q ${pw.toFixed(2)} 0 0 ${ph.toFixed(2)} 0 0 cm /Im${i} Do Q`
    obj(p + 1, `<< /Length ${draw.length} >>\nstream\n${draw}\nendstream`)
    const jpeg = new Uint8Array(await pages[i].arrayBuffer())
    offsets[p + 2] = length
    push(
      `${p + 2} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${w} /Height ${h} ` +
        `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`,
    )
    push(jpeg)
    push('\nendstream\nendobj\n')
  }

  const total = 3 + n * 3
  const xref = length
  push(`xref\n0 ${total}\n0000000000 65535 f \n`)
  for (let i = 1; i < total; i++) push(`${String(offsets[i]).padStart(10, '0')} 00000 n \n`)
  push(`trailer\n<< /Size ${total} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`)
  return new Blob(parts as BlobPart[], { type: 'application/pdf' })
}

/** отдаём PDF через «Поделиться», а если нельзя — просто скачиваем */
export function sharePdf(pdf: Blob, name: string) {
  return shareFile(pdf, `${name.replace(/[\\/:*?"<>|]+/g, ' ').trim() || 'scan'}.pdf`, name)
}

export async function shareFile(blob: Blob, fileName: string, title = fileName) {
  const file = new File([blob], fileName, { type: blob.type })
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title })
      return
    } catch (e) {
      if ((e as Error).name === 'AbortError') return
    }
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.append(a)
  a.click()
  setTimeout(() => {
    a.remove()
    URL.revokeObjectURL(url)
  }, 10_000)
}
