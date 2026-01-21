import "server-only"

import { redirect } from "next/navigation"
import { neonAuth } from "@neondatabase/auth/next/server"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"

type NeonAuthUser = {
  id: string
  email?: string | null
  name?: string | null
  image?: string | null
  role?: string | null
}

const syncUser = async (user: NeonAuthUser) => {
  const baseCreate = {
    id: user.id,
    email: user.email ?? null,
    name: user.name ?? null,
    imageUrl: user.image ?? null,
  }
  const baseUpdate = {
    email: user.email ?? null,
    name: user.name ?? null,
    imageUrl: user.image ?? null,
  }
  const roleUpdate = user.role === "admin" ? { role: "admin" as const } : {}

  try {
    return await prisma.user.upsert({
      where: { id: user.id },
      create: { ...baseCreate, ...roleUpdate },
      update: { ...baseUpdate, ...roleUpdate },
    })
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2022" || error.code === "P2021")
    ) {
      return prisma.user.upsert({
        where: { id: user.id },
        create: baseCreate,
        update: baseUpdate,
      })
    }
    throw error
  }
}

export const getOptionalUser = async () => {
  const { user } = await neonAuth()
  if (!user) return null
  const dbUser = await syncUser(user)
  return { user, dbUser }
}

export const requireUser = async () => {
  const { user } = await neonAuth()
  if (!user) {
    redirect("/auth/sign-in")
  }
  const dbUser = await syncUser(user)
  return { user, dbUser }
}

export const requireAdmin = async () => {
  const result = await requireUser()
  if (result.dbUser.role !== "admin") {
    redirect("/")
  }
  return result
}
