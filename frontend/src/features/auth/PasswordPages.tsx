import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { authApi } from '@/api/auth'
import { errorMessage } from '@/lib/utils'
import { AuthLayout } from './AuthLayout'
import { Button } from '@/components/ui/Button'
import { FormField, Fieldset } from '@/components/ui/Form'
import { PasswordInput } from '@/components/ui/Input'
import { CollapsibleCard, FormActions } from '@/components/ui/Form'
import { CheckCircle2, Eraser } from 'lucide-react'

const inputCls =
  'h-[50px] w-full rounded-card border border-line-login bg-white px-[19px] text-base text-ink-heading placeholder:text-login-placeholder focus:border-primary-400'

/** SRS: reset link (valid 12 h) is emailed to the user. */
export function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState('')
  const [sent, setSent] = useState(false)
  const m = useMutation({
    mutationFn: () => authApi.forgotPassword(identifier.trim()),
    onSuccess: () => setSent(true),
    onError: (e) => toast.error(errorMessage(e)),
  })
  return (
    <AuthLayout title="Forgot your password?" subtitle="Enter your User Id, email or mobile number. We will email you a reset link valid for 12 hours.">
      {sent ? (
        <div className="text-center text-sm text-login-text">
          <p>If the account exists, a reset link has been sent to its registered email address.</p>
          <Link to="/login" className="mt-6 inline-block text-primary underline">
            Back to login
          </Link>
        </div>
      ) : (
        <form
          className="flex flex-col gap-[21px]"
          onSubmit={(e) => {
            e.preventDefault()
            if (identifier.trim()) m.mutate()
          }}
        >
          <input className={inputCls} placeholder="User Id / Email / Mobile" value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
          <Button type="submit" size="lg" className="h-[46px] w-full" loading={m.isPending}>
            Send reset link
          </Button>
          <Link to="/login" className="text-center text-15 text-primary underline underline-offset-2">
            Back to login
          </Link>
        </form>
      )}
    </AuthLayout>
  )
}

export function ResetPasswordPage() {
  const { token = '' } = useParams()
  const navigate = useNavigate()
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const m = useMutation({
    mutationFn: () => authApi.resetPassword(token, pw),
    onSuccess: () => {
      toast.success('Password has been reset. Please sign in.')
      navigate('/login', { replace: true })
    },
    onError: (e) => setErr(errorMessage(e)),
  })
  return (
    <AuthLayout title="Set a new password">
      <form
        className="flex flex-col gap-[21px]"
        onSubmit={(e) => {
          e.preventDefault()
          setErr(null)
          if (pw.length < 8) return setErr('Password must be at least 8 characters')
          if (pw !== pw2) return setErr('Passwords do not match')
          m.mutate()
        }}
      >
        <input type="password" className={inputCls} placeholder="New password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" />
        <input type="password" className={inputCls} placeholder="Confirm new password" value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" />
        {err && <p className="-mt-2 text-sm text-danger">{err}</p>}
        <Button type="submit" size="lg" className="h-[46px] w-full" loading={m.isPending}>
          Reset password
        </Button>
        <Link to="/login" className="text-center text-15 text-primary underline underline-offset-2">
          Back to login
        </Link>
      </form>
    </AuthLayout>
  )
}

/** In-app change password (from the user menu). */
export function ChangePasswordPage() {
  const [current, setCurrent] = useState('')
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const m = useMutation({
    mutationFn: () => authApi.changePassword(current, pw),
    onSuccess: () => {
      toast.success('Password changed')
      setCurrent('')
      setPw('')
      setPw2('')
    },
    onError: (e) => setErr(errorMessage(e)),
  })
  return (
    <div className="max-w-3xl">
      <CollapsibleCard title="Change Password">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            setErr(null)
            if (pw.length < 8) return setErr('New password must be at least 8 characters')
            if (pw !== pw2) return setErr('Passwords do not match')
            m.mutate()
          }}
        >
          <Fieldset>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField label="Current Password" required className="md:col-span-2">
                <PasswordInput value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" />
              </FormField>
              <FormField label="New Password" required>
                <PasswordInput value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" />
              </FormField>
              <FormField label="Confirm New Password" required error={err ?? undefined}>
                <PasswordInput value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" />
              </FormField>
            </div>
          </Fieldset>
          <FormActions>
            <Button
              type="button"
              variant="clear"
              icon={<Eraser size={18} />}
              onClick={() => {
                setCurrent('')
                setPw('')
                setPw2('')
                setErr(null)
              }}
            >
              Clear All
            </Button>
            <Button type="submit" icon={<CheckCircle2 size={16} />} loading={m.isPending}>
              Save
            </Button>
          </FormActions>
        </form>
      </CollapsibleCard>
    </div>
  )
}
