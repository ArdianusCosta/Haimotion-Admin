import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Menghilangkan tag [RESIGN] atau variasinya dari nama user
 * Contoh: "[RESIGN] Siska Harmelia Merywati Sihaloho" -> "Siska Harmelia Merywati Sihaloho"
 */
export function cleanUserName(name: string | null | undefined): string {
  if (!name) return ''
  return name.replace(/\[\s*resign\s*\]\s*|\(\s*resign\s*\)\s*/gi, '').trim()
}

/**
 * Cek apakah string mengandung penanda resign seperti [RESIGN] atau (RESIGN)
 */
export function hasResignTag(name: string | null | undefined): boolean {
  if (!name) return false
  return /\[\s*resign\s*\]|\(\s*resign\s*\)/i.test(name)
}

/**
 * Memisahkan nama asli user dari jabatan / departemen yang tersimpan di dalam kurung.
 * Contoh:
 * - firstname: "Administrator", lastname: "(IT Admin)" -> displayName: "Administrator", position: "IT Admin", initials: "AD"
 * - firstname: "Gabriel Georgio", lastname: "(CEO)" -> displayName: "Gabriel Georgio", position: "CEO", initials: "GG"
 * - firstname: "Ardianus caesar emanual ruicosta du'u", lastname: "(IT - Web Developer Staff)" -> displayName: "Ardianus caesar emanual ruicosta du'u", position: "IT - Web Developer Staff", initials: "AC"
 */
export function parseUserInfo(
  firstname: string | null | undefined,
  lastname?: string | null | undefined,
  fallbackRole?: string | null | undefined
) {
  const rawFirst = cleanUserName(firstname) || ''
  const rawLast = cleanUserName(lastname) || ''
  const combined = `${rawFirst} ${rawLast}`.trim()

  // Ambil teks di dalam kurung (...) atau [...] sebagai posisi/jabatan
  const parenMatch = combined.match(/[\(\[]\s*([^()\[\]]+)\s*[\)\]]/)
  const position = parenMatch ? parenMatch[1].trim() : (fallbackRole || 'Staff')

  // Hapus semua kurung untuk mendapatkan nama asli yang bersih
  const cleanFirst = rawFirst.replace(/[\(\[][^()\[\]]*[\)\]]/g, '').trim()
  const cleanLast = rawLast.replace(/[\(\[][^()\[\]]*[\)\]]/g, '').trim()
  const displayName = `${cleanFirst} ${cleanLast}`.trim() || cleanFirst || cleanLast || 'User'

  // Buat inisial yang rapi dari nama asli (hanya huruf, tanpa kurung atau simbol)
  const alphaWords = displayName
    .replace(/[^a-zA-Z\s]/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  let initials = 'U'
  if (alphaWords.length >= 2) {
    initials = `${alphaWords[0][0]}${alphaWords[1][0]}`.toUpperCase()
  } else if (alphaWords.length === 1) {
    initials = alphaWords[0].slice(0, 2).toUpperCase()
  }

  return { displayName, position, initials }
}
