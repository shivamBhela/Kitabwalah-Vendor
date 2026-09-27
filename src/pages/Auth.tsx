import { useState } from 'react'
import type { FormEvent } from 'react'
import { vendorApi, errMsg } from '../api'
import { Brand, Field } from '../components/ui'

type AuthProps = {
  onSuccess: () => void
  notify: (m: string) => void
}

export function Auth({ onSuccess, notify }: AuthProps) {
  const [mode, setMode] = useState<'login' | 'otp' | 'onboard'>('login')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Registration form fields
  const [regForm, setRegForm] = useState({
    storeName: '',
    storeDescription: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  })

  const handleSendOtp = async (e: FormEvent) => {
    e.preventDefault()
    if (!phone || phone.length !== 10) {
      setError('Please enter a valid 10-digit Indian mobile number.')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      await vendorApi.sendOtp(phone)
      setMode('otp')
      notify('OTP sent successfully')
    } catch (err) {
      setError(errMsg(err))
    } finally {
      setSubmitting(false)
    }
  }

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault()
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP code.')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      const res = await vendorApi.verifyOtp(phone, otp)
      localStorage.setItem('kb-auth-token', res.accessToken)

      if (res.user.role === 'customer') {
        // Check if vendor profile exists
        try {
          await vendorApi.getProfile()
        } catch (profErr: any) {
          if (profErr.response?.status === 404) {
            // Need vendor registration
            setRegForm((prev) => ({ ...prev, phone }))
            setMode('onboard')
            notify('Please complete your vendor store registration.')
            return
          }
        }
      }

      onSuccess()
    } catch (err) {
      setError(errMsg(err))
    } finally {
      setSubmitting(false)
    }
  }

  const handleRegisterVendor = async (e: FormEvent) => {
    e.preventDefault()
    if (
      !regForm.storeName ||
      !regForm.phone ||
      !regForm.address ||
      !regForm.city ||
      !regForm.state ||
      !regForm.pincode
    ) {
      setError('Please complete all required fields.')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      await vendorApi.registerVendor(regForm)
      notify('Vendor application submitted successfully!')
      onSuccess()
    } catch (err) {
      setError(errMsg(err))
    } finally {
      setSubmitting(false)
    }
  }

  if (mode === 'onboard') {
    return (
      <div className="auth">
        <div className="onboard-card" style={{ maxWidth: 540, margin: '0 auto' }}>
          <Brand />
          <h1>Register Your Bookstore</h1>
          <p>Provide your store details to apply for a vendor account.</p>
          {error && <p className="error" style={{ color: '#d9534f', marginBottom: 12 }}>{error}</p>}
          <form onSubmit={handleRegisterVendor} className="form-grid">
            <Field
              label="Store Name"
              required
              placeholder="e.g. Acme Bookstore"
              value={regForm.storeName}
              onChange={(v: string) => setRegForm({ ...regForm, storeName: v })}
            />
            <Field
              label="Phone Number"
              required
              placeholder="10-digit mobile"
              value={regForm.phone}
              onChange={(v: string) => setRegForm({ ...regForm, phone: v })}
            />
            <Field
              label="Address"
              required
              placeholder="Store / Dispatch Address"
              value={regForm.address}
              onChange={(v: string) => setRegForm({ ...regForm, address: v })}
            />
            <Field
              label="City"
              required
              placeholder="City"
              value={regForm.city}
              onChange={(v: string) => setRegForm({ ...regForm, city: v })}
            />
            <Field
              label="State"
              required
              placeholder="State"
              value={regForm.state}
              onChange={(v: string) => setRegForm({ ...regForm, state: v })}
            />
            <Field
              label="Pincode"
              required
              placeholder="6-digit Pincode"
              value={regForm.pincode}
              onChange={(v: string) => setRegForm({ ...regForm, pincode: v })}
            />
            <Field
              label="Store Description"
              textarea
              placeholder="Tell readers about your store"
              value={regForm.storeDescription}
              onChange={(v: string) => setRegForm({ ...regForm, storeDescription: v })}
              full
            />
            <div className="form-actions" style={{ marginTop: 16, width: '100%' }}>
              <button type="submit" className="button full" disabled={submitting}>
                {submitting ? 'Submitting…' : 'Submit Vendor Application'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  if (mode === 'otp') {
    return (
      <div className="auth">
        <div className="auth-card">
          <Brand />
          <button className="back-link" onClick={() => setMode('login')}>
            ← Back
          </button>
          <h1>Verify OTP</h1>
          <p>We sent a 6-digit OTP code to <b>+91 {phone}</b></p>
          {error && <p className="error">{error}</p>}
          <form onSubmit={handleVerifyOtp}>
            <input
              className="otp-input"
              value={otp}
              maxLength={6}
              onChange={(e) => {
                setOtp(e.target.value)
                setError('')
              }}
              placeholder="• • • • • •"
              inputMode="numeric"
              autoFocus
            />
            <div style={{ height: 16 }}></div>
            <button type="submit" className="button full" disabled={submitting}>
              {submitting ? 'Verifying…' : 'Verify & Continue'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="auth">
      <div className="auth-splash">
        <Brand />
        <div>
          <span className="eyebrow">KITABWALAH VENDOR PORTAL</span>
          <h2>
            Your books. <br />
            More readers.
          </h2>
          <p>Run your bookstore, manage catalog and orders seamlessly with our backend.</p>
        </div>
        <div className="trust">
          <span>✓ Direct backend integration</span>
          <span>✓ Real-time order processing</span>
          <span>✓ Timely withdrawals & settlement</span>
        </div>
      </div>
      <div className="auth-card login">
        <Brand />
        <h1>Sign In / Register</h1>
        <p>Enter your 10-digit mobile number to receive an OTP.</p>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleSendOtp}>
          <Field
            label="Mobile Number"
            required
            prefix="+91"
            placeholder="10-digit Indian Mobile"
            value={phone}
            onChange={(v: string) => setPhone(v)}
          />
          <div style={{ height: 16 }}></div>
          <button type="submit" className="button full" disabled={submitting}>
            {submitting ? 'Sending OTP…' : 'Send OTP'}
          </button>
        </form>
      </div>
    </div>
  )
}
