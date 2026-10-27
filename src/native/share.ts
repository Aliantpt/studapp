import { Directory, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'

function toBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result).split(',')[1] ?? '')
    r.onerror = () => reject(r.error)
    r.readAsDataURL(blob)
  })
}

/** в приложении web share не работает: кладём файл во временную папку и открываем системное «Поделиться» */
export async function shareNative(blob: Blob, fileName: string, title: string) {
  const { uri } = await Filesystem.writeFile({
    path: fileName,
    data: await toBase64(blob),
    directory: Directory.Cache,
  })
  try {
    await Share.share({ title, files: [uri] })
  } catch (e) {
    // закрыли окно «Поделиться» — это не ошибка
    if (!/cancel/i.test(String((e as Error).message))) throw e
  }
}
