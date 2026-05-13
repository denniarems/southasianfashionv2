'use client'

import { useMemo, useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import CalendarCheckIcon from 'lucide-react/dist/esm/icons/calendar-check'
import CheckIcon from 'lucide-react/dist/esm/icons/check'
import ClockIcon from 'lucide-react/dist/esm/icons/clock'
import ExternalLinkIcon from 'lucide-react/dist/esm/icons/external-link'
import MailIcon from 'lucide-react/dist/esm/icons/mail'
import RefreshCwIcon from 'lucide-react/dist/esm/icons/refresh-cw'
import XIcon from 'lucide-react/dist/esm/icons/x'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import {
	approveCustomEnquiryFn,
	rejectCustomEnquiryFn,
	resendCustomEnquiryInviteFn,
	type CustomEnquiryAdminRow,
} from '@/server/custom-enquiries.functions'

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected'

const statusFilters: StatusFilter[] = ['all', 'pending', 'approved', 'rejected']

function formatAppointment(enquiry: CustomEnquiryAdminRow) {
	const [date, time] = enquiry.requestedStartLocal.split('T')
	return `${date} ${time}`
}

function formatDate(value: string | null) {
	if (!value) return 'Not set'
	const parsed = new Date(value)
	if (Number.isNaN(parsed.getTime())) return value
	return parsed.toLocaleString()
}

function statusClass(status: CustomEnquiryAdminRow['status']) {
	switch (status) {
		case 'approved':
			return 'border-emerald-200 bg-emerald-50 text-emerald-800'
		case 'rejected':
			return 'border-red-200 bg-red-50 text-red-700'
		default:
			return 'border-yellow-200 bg-yellow-50 text-yellow-800'
	}
}

function statusIcon(status: CustomEnquiryAdminRow['status']) {
	if (status === 'approved') return CheckIcon
	if (status === 'rejected') return XIcon
	return ClockIcon
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
	return (
		<div className="border-b border-stone-100 py-3 last:border-b-0">
			<p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400">{label}</p>
			<p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-stone-800">
				{value?.trim() || 'Not provided'}
			</p>
		</div>
	)
}

export default function CustomEnquiriesClient({
	enquiries,
	migrationMissing,
}: {
	enquiries: CustomEnquiryAdminRow[]
	migrationMissing?: boolean
}) {
	const router = useRouter()
	const approveCustomEnquiry = useServerFn(approveCustomEnquiryFn)
	const rejectCustomEnquiry = useServerFn(rejectCustomEnquiryFn)
	const resendCustomEnquiryInvite = useServerFn(resendCustomEnquiryInviteFn)
	const [filter, setFilter] = useState<StatusFilter>('pending')
	const [selected, setSelected] = useState<CustomEnquiryAdminRow | null>(null)
	const [adminNote, setAdminNote] = useState('')
	const [actionKey, setActionKey] = useState('')

	const counts = useMemo(
		() => ({
			all: enquiries.length,
			pending: enquiries.filter((enquiry) => enquiry.status === 'pending').length,
			approved: enquiries.filter((enquiry) => enquiry.status === 'approved').length,
			rejected: enquiries.filter((enquiry) => enquiry.status === 'rejected').length,
		}),
		[enquiries],
	)

	const filteredEnquiries = useMemo(() => {
		if (filter === 'all') return enquiries
		return enquiries.filter((enquiry) => enquiry.status === filter)
	}, [enquiries, filter])

	const openEnquiry = (enquiry: CustomEnquiryAdminRow) => {
		setSelected(enquiry)
		setAdminNote(enquiry.adminNote || '')
	}

	const finishAction = async (successMessage: string, warning?: string) => {
		if (warning) {
			toast.warning(`${successMessage}. ${warning}`)
		} else {
			toast.success(successMessage)
		}
		setSelected(null)
		await router.invalidate({ sync: true })
	}

	const runApprove = async () => {
		if (!selected) return
		setActionKey(`approve:${selected.id}`)
		try {
			const result = await approveCustomEnquiry({
				data: { id: selected.id, adminNote },
			})
			if (result.error) {
				toast.error(result.error)
				return
			}
			await finishAction('Request approved and invite sent', result.warning)
		} finally {
			setActionKey('')
		}
	}

	const runReject = async () => {
		if (!selected) return
		setActionKey(`reject:${selected.id}`)
		try {
			const result = await rejectCustomEnquiry({
				data: { id: selected.id, adminNote },
			})
			if (result.error) {
				toast.error(result.error)
				return
			}
			await finishAction('Request rejected')
		} finally {
			setActionKey('')
		}
	}

	const runResend = async () => {
		if (!selected) return
		setActionKey(`resend:${selected.id}`)
		try {
			const result = await resendCustomEnquiryInvite({
				data: { id: selected.id },
			})
			if (result.error) {
				toast.error(result.error)
				return
			}
			await finishAction('Invite resent')
		} finally {
			setActionKey('')
		}
	}

	return (
		<div className="mx-auto max-w-7xl space-y-6 p-6 md:p-10">
			<div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
				<div>
					<p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-yellow-700">
						Client Appointments
					</p>
					<h1 className="mt-2 font-heading text-2xl tracking-wide text-stone-900">
						Private Fitting Requests
					</h1>
					<p className="mt-1 max-w-2xl text-sm text-stone-500">
						Review private fitting requests, approve calendar invites, and keep customer atelier
						notes in one place.
					</p>
				</div>
				<div className="grid grid-cols-2 gap-2 sm:flex">
					{statusFilters.map((status) => (
						<button
							key={status}
							type="button"
							onClick={() => setFilter(status)}
							className={`border px-4 py-2 text-xs font-semibold uppercase tracking-widest transition-colors ${
								filter === status
									? 'border-stone-900 bg-stone-900 text-white'
									: 'border-stone-200 bg-white text-stone-600 hover:border-stone-400'
							}`}
						>
							{status} <span className="ml-1 opacity-70">{counts[status]}</span>
						</button>
					))}
				</div>
			</div>

			{migrationMissing ? (
				<div className="border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-900">
					The private fitting request migration has not been applied in this environment yet.
				</div>
			) : null}

			<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
				{[
					['Pending', counts.pending, ClockIcon],
					['Approved', counts.approved, CalendarCheckIcon],
					['Rejected', counts.rejected, XIcon],
				].map(([label, value, Icon]) => {
					const DisplayIcon = Icon as typeof ClockIcon
					return (
						<div key={label as string} className="border border-stone-200 bg-white p-5">
							<div className="flex items-center justify-between">
								<p className="text-[11px] font-semibold uppercase tracking-widest text-stone-500">
									{label as string}
								</p>
								<DisplayIcon className="h-4 w-4 text-stone-400" />
							</div>
							<p className="mt-3 font-heading text-3xl text-stone-900">{value as number}</p>
						</div>
					)
				})}
			</div>

			<div className="border border-stone-200 bg-white">
				{filteredEnquiries.length > 0 ? (
					<div className="divide-y divide-stone-100">
						{filteredEnquiries.map((enquiry) => {
							const StatusIcon = statusIcon(enquiry.status)
							return (
								<button
									key={enquiry.id}
									type="button"
									onClick={() => openEnquiry(enquiry)}
									className="grid w-full gap-4 px-4 py-5 text-left transition-colors hover:bg-stone-50 md:grid-cols-[1.1fr_1fr_0.8fr_auto] md:items-center md:px-5"
								>
									<div>
										<div className="flex flex-wrap items-center gap-2">
											<span
												className={`inline-flex items-center gap-1 border px-2 py-1 text-[10px] font-semibold uppercase tracking-widest ${statusClass(enquiry.status)}`}
											>
												<StatusIcon className="h-3 w-3" />
												{enquiry.status}
											</span>
											<span className="text-[11px] uppercase tracking-widest text-stone-400">
												{formatDate(enquiry.createdAt)}
											</span>
										</div>
										<p className="mt-2 text-sm font-semibold uppercase tracking-wider text-stone-900">
											{enquiry.customerName}
										</p>
										<p className="mt-1 flex items-center gap-2 text-xs text-stone-500">
											<MailIcon className="h-3 w-3" />
											{enquiry.customerEmail}
										</p>
									</div>
									<div>
										<p className="text-sm font-medium text-stone-900">{enquiry.productName}</p>
										<p className="mt-1 text-xs text-stone-500">
											{enquiry.preferredSize || 'No size'}
										</p>
									</div>
									<div>
										<p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400">
											Appointment
										</p>
										<p className="mt-1 text-sm text-stone-700">{formatAppointment(enquiry)}</p>
									</div>
									<div className="text-xs font-semibold uppercase tracking-widest text-stone-500">
										Review
									</div>
								</button>
							)
						})}
					</div>
				) : (
					<div className="px-4 py-12 text-center text-sm text-stone-500">
						No private fitting requests match this filter.
					</div>
				)}
			</div>

			<Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
				<DialogContent className="max-w-3xl rounded-none">
					{selected ? (
						<>
							<DialogHeader>
								<DialogTitle>Private fitting request from {selected.customerName}</DialogTitle>
								<DialogDescription>
									{selected.productName} - {formatAppointment(selected)}
								</DialogDescription>
							</DialogHeader>

							<div className="grid gap-5 lg:grid-cols-[1fr_280px]">
								<div className="border border-stone-200 px-4">
									<DetailRow label="Customer email" value={selected.customerEmail} />
									<DetailRow label="Phone / Direct Message" value={selected.customerPhone} />
									<DetailRow label="Appointment" value={formatAppointment(selected)} />
									<DetailRow label="Preferred size" value={selected.preferredSize} />
									<DetailRow label="Measurements" value={selected.measurements} />
									<DetailRow label="Blouse, sleeve, neckline" value={selected.blouseNotes} />
									<DetailRow label="General notes" value={selected.generalNotes} />
									<div className="py-3">
										<a
											href={selected.productUrl}
											target="_blank"
											rel="noopener noreferrer"
											className="inline-flex items-center gap-2 text-sm font-medium text-yellow-700 hover:text-stone-900"
										>
											View product <ExternalLinkIcon className="h-3 w-3" />
										</a>
									</div>
								</div>

								<div className="space-y-4">
									<div className={`border p-3 ${statusClass(selected.status)}`}>
										<p className="text-[10px] font-semibold uppercase tracking-widest">Status</p>
										<p className="mt-1 text-sm font-semibold capitalize">{selected.status}</p>
									</div>
									<div className="border border-stone-200 p-3 text-xs text-stone-500">
										<p>Submitted: {formatDate(selected.createdAt)}</p>
										<p>Approved: {formatDate(selected.approvedAt)}</p>
										<p>Invite sent: {formatDate(selected.invitationSentAt)}</p>
									</div>
									<label htmlFor="custom-enquiry-admin-note" className="block">
										<span className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-stone-500">
											Admin note
										</span>
										<Textarea
											id="custom-enquiry-admin-note"
											value={adminNote}
											onChange={(event) => setAdminNote(event.target.value)}
											rows={6}
											className="rounded-none border-stone-200"
											placeholder="Internal confirmation note or fitting details"
										/>
									</label>
								</div>
							</div>

							<DialogFooter className="gap-2">
								{selected.status === 'approved' ? (
									<Button
										type="button"
										variant="outline"
										onClick={runResend}
										disabled={Boolean(actionKey)}
										className="rounded-none"
									>
										<RefreshCwIcon className="h-4 w-4" />
										{actionKey.startsWith('resend:') ? 'Resending…' : 'Resend Invite'}
									</Button>
								) : null}
								{selected.status === 'pending' ? (
									<>
										<Button
											type="button"
											variant="outline"
											onClick={runReject}
											disabled={Boolean(actionKey)}
											className="rounded-none border-red-200 text-red-700 hover:bg-red-50"
										>
											<XIcon className="h-4 w-4" />
											{actionKey.startsWith('reject:') ? 'Rejecting…' : 'Reject'}
										</Button>
										<Button
											type="button"
											onClick={runApprove}
											disabled={Boolean(actionKey)}
											className="rounded-none bg-stone-900 text-white hover:bg-yellow-700"
										>
											<CheckIcon className="h-4 w-4" />
											{actionKey.startsWith('approve:') ? 'Approving…' : 'Approve and Send'}
										</Button>
									</>
								) : null}
							</DialogFooter>
						</>
					) : null}
				</DialogContent>
			</Dialog>
		</div>
	)
}
