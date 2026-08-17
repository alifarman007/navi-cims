import { Construction } from 'lucide-react'

export function ComingSoon({ name }: { name: string }) {
  return (
    <div className="card flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <Construction size={40} className="text-primary/60" />
      <h2 className="text-xl font-medium text-primary">{name}</h2>
      <p className="max-w-md text-sm text-ink-muted">This screen is being built. The route, navigation and permissions are already wired.</p>
    </div>
  )
}
