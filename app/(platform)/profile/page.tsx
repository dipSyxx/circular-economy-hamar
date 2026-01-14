import { pageCopy } from "@/content/no"
import { ProfileDashboard } from "@/components/profile-dashboard"

export default function ProfilePage() {
  return (
    <div>
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-bold mb-4">{pageCopy.profile.title}</h1>
            <p className="text-lg text-muted-foreground">{pageCopy.profile.description}</p>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <ProfileDashboard />
        </div>
      </section>
    </div>
  )
}
