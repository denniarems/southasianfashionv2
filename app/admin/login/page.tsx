'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { requestOtp, verifyOtp } from '@/app/actions/auth'

export default function AdminLogin() {
	const router = useRouter()
	const [email, setEmail] = useState('')
	const [otp, setOtp] = useState('')
	const [otpSent, setOtpSent] = useState(false)
	const [loading, setLoading] = useState(false)
	const emailLooksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
	const emailError = email.length > 0 && !emailLooksValid ? 'Enter a valid email address.' : ''
	const otpError = otp.length > 0 && otp.length < 6 ? 'Enter the full 6-digit code.' : ''

	const handleRequestOTP = async () => {
		if (!emailLooksValid) {
			toast.error('Please enter a valid admin email')
			return
		}
		setLoading(true)
		try {
			const res = await requestOtp(email)
			if (res.error) throw new Error(res.error)
			setOtpSent(true)
			toast.success('Verification code sent to your email')
		} catch (e: any) {
			toast.error(e.message || 'Failed to send code')
		} finally {
			setLoading(false)
		}
	}

	const handleVerifyOTP = async () => {
		if (otp.length !== 6) {
			toast.error('Please enter the 6-digit code')
			return
		}
		setLoading(true)
		try {
			const res = await verifyOtp(email, otp)
			if (res.error) throw new Error(res.error)
			toast.success('Welcome to the admin portal')
			router.push('/admin/dashboard')
			router.refresh()
		} catch (e: any) {
			toast.error(e.message || 'Invalid code')
		} finally {
			setLoading(false)
		}
	}

	return (
		<div
			className="min-h-screen bg-stone-50 flex items-center justify-center px-6"
			data-testid="admin-login-page"
		>
			<div className="w-full max-w-md">
				<div className="text-center mb-12">
					<a
						href="/"
						className="font-heading text-2xl tracking-wider text-stone-900"
						data-testid="admin-logo"
					>
						SouthAsianFashion
					</a>
					<p className="font-accent italic text-yellow-700 mt-2">Admin Portal</p>
				</div>

				<div className="bg-white border border-stone-200 p-8 md:p-12 shadow-sm">
					{!otpSent ? (
						<div className="space-y-6">
							<div>
								<Label className="text-xs uppercase tracking-widest text-stone-500 mb-3 block">
									Admin Email
								</Label>
								<Input
									data-testid="admin-email-input"
									type="email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									aria-invalid={Boolean(emailError)}
									aria-describedby={emailError ? 'admin-email-error' : undefined}
									className="border-0 border-b border-stone-300 rounded-none px-0 py-3 shadow-none focus-visible:ring-0 focus:border-stone-900 bg-transparent"
									placeholder="admin@example.com"
								/>
								{emailError ? (
									<p id="admin-email-error" className="mt-2 text-xs text-red-600">
										{emailError}
									</p>
								) : null}
							</div>
							<Button
								data-testid="send-otp-btn"
								onClick={handleRequestOTP}
								disabled={loading || !emailLooksValid}
								className="w-full bg-stone-900 text-white rounded-none h-12 text-xs uppercase tracking-widest hover:bg-yellow-700"
							>
								{loading ? 'Sending...' : 'Send Verification Code'}
							</Button>
						</div>
					) : (
						<div className="space-y-8">
							<div className="text-center">
								<p className="text-sm text-stone-500 mb-1">Enter the 6-digit code sent to</p>
								<p className="text-sm font-medium text-stone-900">{email}</p>
							</div>
							<div className="flex justify-center">
								<InputOTP data-testid="otp-input" maxLength={6} value={otp} onChange={setOtp}>
									<InputOTPGroup>
										<InputOTPSlot
											index={0}
											className="rounded-none border-stone-300 h-12 w-12 text-lg"
										/>
										<InputOTPSlot
											index={1}
											className="rounded-none border-stone-300 h-12 w-12 text-lg"
										/>
										<InputOTPSlot
											index={2}
											className="rounded-none border-stone-300 h-12 w-12 text-lg"
										/>
										<InputOTPSlot
											index={3}
											className="rounded-none border-stone-300 h-12 w-12 text-lg"
										/>
										<InputOTPSlot
											index={4}
											className="rounded-none border-stone-300 h-12 w-12 text-lg"
										/>
										<InputOTPSlot
											index={5}
											className="rounded-none border-stone-300 h-12 w-12 text-lg"
										/>
									</InputOTPGroup>
								</InputOTP>
							</div>
							{otpError ? <p className="text-center text-xs text-red-600">{otpError}</p> : null}
							<div className="space-y-3">
								<Button
									data-testid="verify-otp-btn"
									onClick={handleVerifyOTP}
									disabled={loading || otp.length !== 6}
									className="w-full bg-stone-900 text-white rounded-none h-12 text-xs uppercase tracking-widest hover:bg-yellow-700"
								>
									{loading ? 'Verifying...' : 'Verify & Enter'}
								</Button>
								<button
									data-testid="resend-otp-btn"
									onClick={() => {
										setOtpSent(false)
										setOtp('')
									}}
									className="w-full text-xs text-stone-400 hover:text-stone-600 transition-colors uppercase tracking-widest"
								>
									Use different email
								</button>
							</div>
						</div>
					)}
				</div>

				<p className="text-center text-xs text-stone-400 mt-8">
					<a href="/" className="hover:text-stone-600 transition-colors">
						&larr; Back to store
					</a>
				</p>
			</div>
		</div>
	)
}
