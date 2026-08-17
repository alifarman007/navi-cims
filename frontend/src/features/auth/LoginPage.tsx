import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/app/store/auth'
import { errorMessage } from '@/lib/utils'
import { AuthLayout } from './AuthLayout'
import { Button } from '@/components/ui/Button'

/**
 * Figma "Login new": right card 488px #F4F7FF with crest, User Id + Password (h50, r8, #E5E7EB),
 * Remember me + "Forgot your password?", primary Login button.
 */
export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation() as { state?: { from?: string } }
  const setSession = useAuthStore((s) => s.setSession)
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const login = useMutation({
    mutationFn: () => authApi.login(identifier.trim(), password, remember),
    onSuccess: (pair) => {
      setSession(pair, remember)
      navigate(location.state?.from && location.state.from !== '/login' ? location.state.from : '/', { replace: true })
    },
    onError: (e) => setError(errorMessage(e, 'Login failed')),
  })

  return (
    <AuthLayout>
      <form
        className="flex flex-col gap-[21px]"
        onSubmit={(e) => {
          e.preventDefault()
          setError(null)
          if (!identifier.trim() || !password) {
            setError('Please enter your User Id and Password')
            return
          }
          login.mutate()
        }}
        noValidate
      >
        <input
          className="h-[50px] w-full rounded-card border border-line-login bg-white px-[19px] text-base text-ink-heading placeholder:text-login-placeholder focus:border-primary-400"
          placeholder="User Id"
          autoComplete="username"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          aria-label="User Id"
        />
        <input
          type="password"
          className="h-[50px] w-full rounded-card border border-line-login bg-white px-[19px] text-base text-ink-heading placeholder:text-login-placeholder focus:border-primary-400"
          placeholder="Password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-label="Password"
        />
        <div className="flex items-center justify-between text-15">
          <label className="inline-flex cursor-pointer items-center gap-[7px] text-login-text">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 rounded border-line-login accent-primary"
            />
            Remember me
          </label>
          <Link to="/forgot-password" className="text-primary underline underline-offset-2 hover:text-primary-hover">
            Forgot your password?
          </Link>
        </div>
        {error && <p className="-mt-2 text-sm text-danger">{error}</p>}
        <Button type="submit" size="lg" className="mt-1 h-[46px] w-full text-base" loading={login.isPending}>
          Login
        </Button>
      </form>
    </AuthLayout>
  )
}
