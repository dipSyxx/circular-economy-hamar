import "server-only"

import { redirect } from "next/navigation"
import { neonAuth } from "@neondatabase/auth/next/server"
import { prisma } from "@/lib/prisma"

type NeonAuthUser = {
  id: string
  email?: string | null
  name?: string | null
  image?: string | null
}

const syncUser = async (user: NeonAuthUser) => {
  return prisma.user.upsert({
    where: { id: user.id },
    create: {
      id: user.id,
      email: user.email ?? null,
      name: user.name ?? null,
      imageUrl: user.image ?? null,
    },
    update: {
      email: user.email ?? null,
      name: user.name ?? null,
      imageUrl: user.image ?? null,
    },
  })
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
