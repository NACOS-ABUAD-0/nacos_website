import { Pressable, ScrollView, Text, View } from 'react-native';

import type { EventSales, SalesFigures } from '@/lib/api';

// "all", or a ticket type id; null is the "General admission" / deleted-type bucket.
export type TicketTypeFilter = 'all' | number | null;

const naira = (amount: number) => `₦${Number(amount).toLocaleString('en-NG', { maximumFractionDigits: 2 })}`;

function Stat({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: 'green' | 'amber' }) {
  const color = tone === 'green' ? 'text-primary' : tone === 'amber' ? 'text-amber-600' : 'text-gray-900';
  return (
    <View className="w-[48%] mb-3 rounded-xl border border-gray-100 bg-gray-50 px-3 py-3">
      <Text className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{label}</Text>
      <Text className={`mt-1 text-2xl font-extrabold ${color}`}>{value}</Text>
      {hint ? <Text className="mt-0.5 text-xs text-gray-500">{hint}</Text> : null}
    </View>
  );
}

export function EventSalesPanel({
  sales,
  isError,
  filter,
  onFilterChange,
}: {
  sales: EventSales | undefined;
  isError: boolean;
  filter: TicketTypeFilter;
  onFilterChange: (filter: TicketTypeFilter) => void;
}) {
  if (!sales) {
    return (
      <Text className="text-sm text-gray-500">
        {isError ? "Couldn't load ticket sales. Retrying…" : 'Loading ticket sales…'}
      </Text>
    );
  }

  const types = sales.ticket_types;
  const selected = filter === 'all' ? undefined : types.find((t) => t.id === filter);
  const figures: SalesFigures = selected ?? sales.totals;
  const hasMoney = sales.totals.paid > 0 || sales.totals.refunded > 0 || types.some((t) => (t.price ?? 0) > 0);
  const checkedInPct = figures.booked ? Math.round((figures.checked_in / figures.booked) * 100) : 0;
  const updated = new Date(sales.generated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const chip = (value: TicketTypeFilter, label: string, count: number) => {
    const active = filter === value;
    return (
      <Pressable
        key={String(value)}
        onPress={() => onFilterChange(value)}
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        className={`mr-2 rounded-full border px-3 py-1.5 ${active ? 'border-primary bg-primary' : 'border-gray-200 bg-white'}`}
      >
        <Text className={`text-xs font-semibold ${active ? 'text-white' : 'text-gray-700'}`}>
          {label} ({count})
        </Text>
      </Pressable>
    );
  };

  return (
    <View>
      <View className="mb-3 flex-row items-center gap-2">
        <View className="h-2.5 w-2.5 rounded-full bg-green-500" />
        <Text className="text-xs font-semibold text-gray-600">Live · updated {updated}</Text>
      </View>

      {types.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
          {chip('all', 'All tickets', sales.totals.booked)}
          {types.map((t) => chip(t.id, t.name, t.booked))}
        </ScrollView>
      )}

      <View className="flex-row flex-wrap justify-between">
        <Stat
          label="Booked"
          value={String(figures.booked)}
          hint={figures.capacity != null ? `of ${figures.capacity} · ${figures.remaining} left` : undefined}
        />
        <Stat
          label="Checked in"
          value={String(figures.checked_in)}
          hint={figures.booked ? `${checkedInPct}% of booked` : undefined}
          tone="green"
        />
        {hasMoney && (
          <>
            <Stat
              label="Money received"
              value={naira(figures.revenue)}
              hint={`${figures.paid} payment${figures.paid === 1 ? '' : 's'}`}
              tone="green"
            />
            <Stat
              label="Paying now"
              value={String(figures.awaiting_payment)}
              hint="Checkout not confirmed yet"
              tone={figures.awaiting_payment ? 'amber' : undefined}
            />
          </>
        )}
      </View>

      {hasMoney && (
        <Text className="text-xs text-gray-500">
          Paystack fees {naira(figures.fees)} · you receive {naira(figures.net)}
          {figures.refunded > 0 ? ` · ${figures.refunded} refunded (${naira(figures.refunded_amount)})` : ''}
        </Text>
      )}

      {figures.needs_attention > 0 && (
        <View className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
          <Text className="text-xs text-amber-800">
            {figures.needs_attention} payment{figures.needs_attention === 1 ? ' needs' : 's need'} attention (for example,
            someone paid twice). Money received includes them until they're refunded. Check Django admin → Ticket payments.
          </Text>
        </View>
      )}

      {filter === 'all' && types.length > 1 && (
        <View className="mt-4">
          <View className="flex-row border-b border-gray-200 pb-2">
            <Text className="flex-1 text-[11px] font-semibold uppercase text-gray-500">Ticket</Text>
            <Text className="w-16 text-right text-[11px] font-semibold uppercase text-gray-500">Booked</Text>
            <Text className="w-16 text-right text-[11px] font-semibold uppercase text-gray-500">In</Text>
            {hasMoney && <Text className="w-24 text-right text-[11px] font-semibold uppercase text-gray-500">Received</Text>}
          </View>
          {types.map((t) => (
            <View key={String(t.id)} className="flex-row border-b border-gray-100 py-2">
              <Text className="flex-1 text-sm font-medium text-gray-900" numberOfLines={1}>
                {t.name}
                {t.remaining != null ? <Text className="text-xs font-normal text-gray-400"> · {t.remaining} left</Text> : null}
              </Text>
              <Text className="w-16 text-right text-sm text-gray-800">{t.booked}</Text>
              <Text className="w-16 text-right text-sm text-gray-800">{t.checked_in}</Text>
              {hasMoney && <Text className="w-24 text-right text-sm text-gray-800">{naira(t.revenue)}</Text>}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
