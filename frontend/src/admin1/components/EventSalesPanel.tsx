// src/admin1/components/EventSalesPanel.tsx
import React from 'react'
import type { EventSales, SalesFigures } from '../../lib/hooks/useEventAttendance'

// "all", or a ticket type id; null is the "General admission" / deleted-type bucket.
export type TicketTypeFilter = 'all' | number | null

const naira = (amount: number): string =>
  `₦${Number(amount).toLocaleString('en-NG', { maximumFractionDigits: 2 })}`

const Stat: React.FC<{ label: string; value: string; hint?: string; tone?: 'green' | 'amber' }> = ({ label, value, hint, tone }) => (
  <div className="rounded-xl border border-gray-100 bg-[#f9fafb] px-4 py-3">
    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{label}</p>
    <p className={`mt-1 text-2xl font-extrabold tabular-nums ${tone === 'green' ? 'text-[#1a7a3f]' : tone === 'amber' ? 'text-amber-600' : 'text-gray-900'}`}>
      {value}
    </p>
    {hint && <p className="mt-0.5 text-xs text-gray-500">{hint}</p>}
  </div>
)

const EventSalesPanel: React.FC<{
  sales: EventSales | undefined
  isError: boolean
  filter: TicketTypeFilter
  onFilterChange: (filter: TicketTypeFilter) => void
}> = ({ sales, isError, filter, onFilterChange }) => {
  if (!sales) {
    return (
      <p className="text-sm text-gray-500">
        {isError ? "Couldn't load ticket sales. Retrying…" : 'Loading ticket sales…'}
      </p>
    )
  }

  const types = sales.ticket_types
  const selected = filter === 'all' ? undefined : types.find(t => t.id === filter)
  const figures: SalesFigures = selected ?? sales.totals
  const hasMoney = sales.totals.paid > 0 || sales.totals.refunded > 0 || types.some(t => (t.price ?? 0) > 0)
  const capacityHint = figures.capacity != null ? `of ${figures.capacity} · ${figures.remaining} left` : undefined
  const checkedInPct = figures.booked ? Math.round((figures.checked_in / figures.booked) * 100) : 0

  const chip = (value: TicketTypeFilter, label: string, count: number) => (
    <button
      key={String(value)}
      type="button"
      onClick={() => onFilterChange(value)}
      aria-pressed={filter === value}
      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
        filter === value
          ? 'bg-[#1a7a3f] text-white border-[#1a7a3f]'
          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
      }`}
    >
      {label} <span className="tabular-nums opacity-80">({count})</span>
    </button>
  )

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
          </span>
          <span className="text-xs font-semibold text-gray-600">
            Live · updated {new Date(sales.generated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>
      </div>

      {types.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-4" role="group" aria-label="Filter by ticket type">
          {chip('all', 'All tickets', sales.totals.booked)}
          {types.map(t => chip(t.id, t.name, t.booked))}
        </div>
      )}

      <div className={`grid gap-3 ${hasMoney ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2'}`}>
        <Stat label="Booked" value={String(figures.booked)} hint={capacityHint} />
        <Stat label="Checked in" value={String(figures.checked_in)} hint={figures.booked ? `${checkedInPct}% of booked` : undefined} tone="green" />
        {hasMoney && (
          <>
            <Stat label="Money received" value={naira(figures.revenue)} hint={`${figures.paid} payment${figures.paid === 1 ? '' : 's'}`} tone="green" />
            <Stat
              label="Paying now"
              value={String(figures.awaiting_payment)}
              hint="Started checkout, not confirmed yet"
              tone={figures.awaiting_payment ? 'amber' : undefined}
            />
          </>
        )}
      </div>

      {hasMoney && (
        <p className="mt-3 text-xs text-gray-500">
          Paystack fees {naira(figures.fees)} · you receive {naira(figures.net)}
          {figures.refunded > 0 && ` · ${figures.refunded} refunded (${naira(figures.refunded_amount)})`}
        </p>
      )}

      {figures.needs_attention > 0 && (
        <p className="mt-3 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
          {figures.needs_attention} payment{figures.needs_attention === 1 ? ' needs' : 's need'} attention (for example,
          someone paid twice). Money received includes them until they're refunded. Find them in Django admin under
          Events → Ticket payments.
        </p>
      )}

      {filter === 'all' && types.length > 1 && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase text-gray-500">
                <th className="py-2 pr-4">Ticket</th>
                <th className="py-2 px-2 text-right">Booked</th>
                <th className="py-2 px-2 text-right">Checked in</th>
                <th className="py-2 px-2 text-right">Left</th>
                {hasMoney && <th className="py-2 pl-2 text-right">Received</th>}
              </tr>
            </thead>
            <tbody>
              {types.map(t => (
                <tr key={String(t.id)} className="border-b border-gray-100">
                  <td className="py-2 pr-4 font-medium text-gray-900">
                    {t.name}
                    {t.price != null && <span className="ml-2 text-xs text-gray-400">{t.price > 0 ? naira(t.price) : 'Free'}</span>}
                  </td>
                  <td className="py-2 px-2 text-right tabular-nums">{t.booked}</td>
                  <td className="py-2 px-2 text-right tabular-nums">{t.checked_in}</td>
                  <td className="py-2 px-2 text-right tabular-nums text-gray-500">{t.remaining ?? '—'}</td>
                  {hasMoney && <td className="py-2 pl-2 text-right tabular-nums">{naira(t.revenue)}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default EventSalesPanel
