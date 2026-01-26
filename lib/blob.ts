import "server-only"

import { del } from "@vercel/blob"

const BLOB_HOST_SUFFIX = ".blob.vercel-storage.com"

export const isBlobUrl = (value: string) => {
  try {
    const parsed = new URL(value)
    return parsed.hostname.endsWith(BLOB_HOST_SUFFIX)
  } catch {
    return false
  }
}

export const safeDeleteBlob = async (url: string | null | undefined) => {
  if (!url) return
  if (!isBlobUrl(url)) return
  try {
    await del(url)
  } catch (error) {
    console.error("Blob delete failed", error)
  }
}
