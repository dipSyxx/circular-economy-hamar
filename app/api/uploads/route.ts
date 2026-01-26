import { NextResponse } from "next/server"
import { del, put } from "@vercel/blob"
import { getPublicUser, jsonError } from "@/app/api/public/_helpers"

const MAX_FILE_BYTES = 6 * 1024 * 1024
const BLOB_HOST_SUFFIX = ".blob.vercel-storage.com"

const sanitizeFileName = (name: string) => {
  return name.replace(/[^a-z0-9._-]/gi, "_")
}

const sanitizeFolder = (folder: string) => {
  const cleaned = folder.replace(/[^a-z0-9_-]/gi, "")
  return cleaned || "uploads"
}

export async function POST(request: Request) {
  const { user, error } = await getPublicUser(true)
  if (error) return error
  if (!user) return jsonError("Unauthorized", 401)

  const formData = await request.formData()
  const file = formData.get("file")
  if (!(file instanceof File)) {
    return jsonError("File is required.", 400)
  }

  if (!file.type.startsWith("image/")) {
    return jsonError("Unsupported file type.", 415)
  }

  if (file.size > MAX_FILE_BYTES) {
    return jsonError("File is too large.", 413)
  }

  const folder = sanitizeFolder(String(formData.get("folder") ?? "uploads"))
  const safeName = sanitizeFileName(file.name || "upload")
  const key = `${folder}/${user.id}/${crypto.randomUUID()}-${safeName}`

  const blob = await put(key, file, {
    access: "public",
    contentType: file.type,
  })

  return NextResponse.json({ url: blob.url })
}

export async function DELETE(request: Request) {
  const { user, error } = await getPublicUser(true)
  if (error) return error
  if (!user) return jsonError("Unauthorized", 401)

  const payload = (await request.json().catch(() => null)) as { url?: string } | null
  const url = typeof payload?.url === "string" ? payload.url : ""
  if (!url) {
    return jsonError("Url is required.", 400)
  }

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return jsonError("Invalid url.", 400)
  }

  if (!parsed.hostname.endsWith(BLOB_HOST_SUFFIX)) {
    return jsonError("Not a blob url.", 400)
  }

  const pathParts = parsed.pathname.split("/").filter(Boolean)
  const ownerId = pathParts[1]
  const isAdmin = user.role === "admin"

  if (!isAdmin && ownerId !== user.id) {
    return jsonError("Forbidden.", 403)
  }

  await del(url)
  return NextResponse.json({ ok: true })
}
