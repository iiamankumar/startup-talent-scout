import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

export const Route = createFileRoute('/unsubscribe')({
  component: UnsubscribePage,
})

function UnsubscribePage() {
  const [status, setStatus] = useState<'loading' | 'valid' | 'already' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const url = new URL(window.location.href)
    const t = url.searchParams.get('token')
    if (!t) {
      setStatus('error')
      setMessage('Invalid or missing unsubscribe token.')
      return
    }
    setToken(t)

    fetch(`/email/unsubscribe?token=${encodeURIComponent(t)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.valid === true) {
          setStatus('valid')
        } else if (data.reason === 'already_unsubscribed') {
          setStatus('already')
          setMessage('You have already unsubscribed from these emails.')
        } else {
          setStatus('error')
          setMessage(data.error || 'Invalid token.')
        }
      })
      .catch(() => {
        setStatus('error')
        setMessage('Something went wrong. Please try again.')
      })
  }, [])

  const confirm = async () => {
    if (!token) return
    setStatus('loading')
    try {
      const r = await fetch('/email/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = await r.json()
      if (data.success) {
        setStatus('already')
        setMessage('You have been unsubscribed successfully.')
      } else if (data.reason === 'already_unsubscribed') {
        setStatus('already')
        setMessage('You have already unsubscribed from these emails.')
      } else {
        setStatus('error')
        setMessage(data.error || 'Something went wrong.')
      }
    } catch {
      setStatus('error')
      setMessage('Something went wrong. Please try again.')
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-md rounded-2xl bg-card p-8 ring-1 ring-black/5">
        <h1 className="text-xl font-medium tracking-tight">Email preferences</h1>
        {status === 'loading' && (
          <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
        )}
        {status === 'valid' && (
          <>
            <p className="mt-4 text-sm text-muted-foreground">
              Click below to unsubscribe from Aveiq emails.
            </p>
            <button
              onClick={confirm}
              className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-foreground py-2.5 text-sm font-medium text-background transition-transform hover:scale-[1.02]"
            >
              Confirm Unsubscribe
            </button>
          </>
        )}
        {(status === 'already' || status === 'error') && (
          <p className={`mt-4 text-sm ${status === 'error' ? 'text-destructive' : 'text-muted-foreground'}`}>
            {message}
          </p>
        )}
      </div>
    </main>
  )
}
