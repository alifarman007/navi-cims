import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useState, type ReactNode } from 'react'
import { Toaster } from 'sonner'
import { useAuthStore } from '@/app/store/auth'
import { authApi } from '@/api/auth'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 15_000 },
  },
})

/** Loads /auth/me on boot when a token exists, so route guards know the user + permissions. */
function AuthHydrator({ children }: { children: ReactNode }) {
  const { accessToken, user, setUser, clear } = useAuthStore()
  const [ready, setReady] = useState(!accessToken || !!user)

  useEffect(() => {
    let cancelled = false
    if (accessToken && !user) {
      authApi
        .me()
        .then((u) => !cancelled && setUser(u))
        .catch(() => !cancelled && clear())
        .finally(() => !cancelled && setReady(true))
    } else {
      setReady(true)
    }
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!ready) {
    return (
      <div className="flex h-full min-h-screen items-center justify-center bg-page">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }
  return <>{children}</>
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthHydrator>{children}</AuthHydrator>
      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{ style: { fontFamily: 'Roboto, sans-serif', fontSize: 14 } }}
      />
    </QueryClientProvider>
  )
}
