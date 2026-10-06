# backend/events/serializers.py
from django.db import transaction
from rest_framework import serializers

from accounts.serializers import UserSerializer

from .models import Event, EventRegistration, TicketType
from .ticketing import seat_counts

MAX_TICKET_TYPES_PER_EVENT = 10


def _min_known(*values):
    known = [value for value in values if value is not None]
    return min(known) if known else None


class TicketTypeSerializer(serializers.ModelSerializer):
    # Writable so the event form can send back existing types to update them; omit for new types.
    id = serializers.IntegerField(required=False)
    price = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=0, coerce_to_string=False)
    capacity = serializers.IntegerField(required=False, allow_null=True, min_value=1)
    # Blank means the event's own location.
    venue = serializers.CharField(required=False, allow_blank=True, max_length=500, default='')
    tickets_remaining = serializers.SerializerMethodField()
    sold_out = serializers.SerializerMethodField()

    class Meta:
        model = TicketType
        fields = ['id', 'name', 'price', 'capacity', 'venue', 'tickets_remaining', 'sold_out']

    def get_tickets_remaining(self, obj):
        event = obj.event
        taken, by_type = self.context['seat_counts'](event.pk)
        event_remaining = None if event.capacity is None else max(event.capacity - taken, 0)
        type_remaining = None if obj.capacity is None else max(obj.capacity - by_type.get(obj.pk, 0), 0)
        return _min_known(type_remaining, event_remaining)

    def get_sold_out(self, obj):
        return self.get_tickets_remaining(obj) == 0


class EventSerializer(serializers.ModelSerializer):
    status = serializers.ReadOnlyField()       # computed @property
    media = serializers.SerializerMethodField()

    # `location` is optional for remote events — allow empty string so the
    # frontend can submit "" without getting a 400 validation error.
    location = serializers.CharField(required=False, allow_blank=True, default="")

    capacity = serializers.IntegerField(required=False, allow_null=True, min_value=1)
    ticket_types = TicketTypeSerializer(many=True, required=False)
    is_paid = serializers.SerializerMethodField()
    price_from = serializers.SerializerMethodField()
    tickets_remaining = serializers.SerializerMethodField()
    sold_out = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = [
            'id', 'title', 'start_time', 'end_time',
            'location', 'is_remote', 'poster_url',
            'description', 'registration_url', 'contact_email',
            'capacity', 'audience', 'ticket_types', 'is_paid', 'price_from', 'tickets_remaining', 'sold_out',
            'is_published', 'status', 'media',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'status', 'created_at', 'updated_at']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # One seat count per event per response, shared with the nested ticket types.
        cache = {}

        def counts(event_id):
            if event_id not in cache:
                cache[event_id] = seat_counts(event_id)
            return cache[event_id]

        self.context.setdefault('seat_counts', counts)

    def get_media(self, obj):
        return {'poster': obj.poster_url or None}

    # ── Ticket summary ────────────────────────────────────────────────────────

    def get_is_paid(self, obj):
        return any(not t.is_free for t in obj.ticket_types.all())

    def get_price_from(self, obj):
        """Lowest ticket price, for "from ₦X" on listings; 0 when free."""
        prices = [t.price for t in obj.ticket_types.all()]
        return min(prices) if prices else 0

    def get_tickets_remaining(self, obj):
        taken, by_type = self.context['seat_counts'](obj.pk)
        event_remaining = None if obj.capacity is None else max(obj.capacity - taken, 0)
        types = list(obj.ticket_types.all())
        if types and all(t.capacity is not None for t in types):
            types_remaining = sum(max(t.capacity - by_type.get(t.pk, 0), 0) for t in types)
            return _min_known(event_remaining, types_remaining)
        return event_remaining

    def get_sold_out(self, obj):
        return self.get_tickets_remaining(obj) == 0

    # ── Validation ────────────────────────────────────────────────────────────

    def validate_ticket_types(self, value):
        if len(value) > MAX_TICKET_TYPES_PER_EVENT:
            raise serializers.ValidationError(f"An event can have at most {MAX_TICKET_TYPES_PER_EVENT} ticket types.")
        seen = set()
        for item in value:
            item['name'] = item['name'].strip()
            key = item['name'].lower()
            if key in seen:
                raise serializers.ValidationError(f'"{item["name"]}" is listed twice.')
            seen.add(key)
        return value

    def validate(self, attrs):
        # If the event is not remote, location must be provided.
        is_remote = attrs.get('is_remote', getattr(self.instance, 'is_remote', False))
        location = attrs.get('location', getattr(self.instance, 'location', ''))

        if not is_remote and not location:
            raise serializers.ValidationError(
                {'location': 'Location is required for in-person events.'}
            )

        if self.instance is not None and attrs.get('capacity') is not None:
            taken, _ = seat_counts(self.instance.pk)
            if attrs['capacity'] < taken:
                raise serializers.ValidationError(
                    {'capacity': f"Capacity can't be lower than the {taken} tickets already taken."}
                )

        return attrs

    # ── Writes ────────────────────────────────────────────────────────────────

    @transaction.atomic
    def create(self, validated_data):
        ticket_types = validated_data.pop('ticket_types', [])
        event = super().create(validated_data)
        for order, item in enumerate(ticket_types):
            item.pop('id', None)
            item['venue'] = item.get('venue', '').strip()
            TicketType.objects.create(event=event, sort_order=order, **item)
        return event

    @transaction.atomic
    def update(self, instance, validated_data):
        ticket_types = validated_data.pop('ticket_types', None)
        event = super().update(instance, validated_data)
        if ticket_types is not None:
            self._sync_ticket_types(event, ticket_types)
        return event

    def _sync_ticket_types(self, event, items):
        """Make the event's ticket types match `items`: update those with an id, create the rest,
        delete the ones left out. Types with tickets taken keep their price and can't be removed."""
        existing = {t.pk: t for t in event.ticket_types.all()}
        _, taken = seat_counts(event.pk)

        kept = set()
        for order, item in enumerate(items):
            type_id = item.pop('id', None)
            if type_id is None:
                item['venue'] = item.get('venue', '').strip()
                TicketType.objects.create(event=event, sort_order=order, **item)
                continue
            ticket_type = existing.get(type_id)
            if ticket_type is None:
                raise serializers.ValidationError({'ticket_types': f"Ticket type {type_id} doesn't belong to this event."})
            kept.add(type_id)
            sold = taken.get(type_id, 0)
            if item['price'] != ticket_type.price and sold:
                raise serializers.ValidationError({
                    'ticket_types': f"The {ticket_type.name} price can't change after tickets of that type have been taken.",
                })
            capacity = item.get('capacity', ticket_type.capacity)
            if capacity is not None and capacity < sold:
                raise serializers.ValidationError({
                    'ticket_types': f"{ticket_type.name} capacity can't be lower than the {sold} tickets already taken.",
                })
            ticket_type.name = item['name']
            ticket_type.price = item['price']
            ticket_type.capacity = capacity
            ticket_type.venue = item.get('venue', ticket_type.venue).strip()
            ticket_type.sort_order = order
            ticket_type.save()

        for type_id, ticket_type in existing.items():
            if type_id in kept:
                continue
            if taken.get(type_id):
                raise serializers.ValidationError({
                    'ticket_types': f"{ticket_type.name} tickets have already been taken, so that type can't be removed. "
                                    f"Set its capacity to stop new sales instead.",
                })
            ticket_type.delete()


class TicketTypeBriefSerializer(serializers.ModelSerializer):
    price = serializers.DecimalField(max_digits=10, decimal_places=2, coerce_to_string=False)
    # The ticket type's venue, or the event's location when it has none of its own.
    venue = serializers.CharField(source='effective_venue', read_only=True)

    class Meta:
        model = TicketType
        fields = ['id', 'name', 'price', 'venue']


class EventRegistrationSerializer(serializers.ModelSerializer):
    """Student-facing: what a student sees for their own registration/QR."""

    ticket_type = TicketTypeBriefSerializer(read_only=True)
    amount_paid = serializers.SerializerMethodField()

    class Meta:
        model = EventRegistration
        fields = ['id', 'token', 'short_code', 'status', 'ticket_type', 'amount_paid', 'hold_expires_at', 'checked_in_at', 'created_at']
        read_only_fields = fields

    def get_amount_paid(self, obj):
        return obj.amount_kobo / 100 if obj.is_confirmed else 0

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # No QR or ticket code until the ticket is paid for.
        if not instance.is_confirmed:
            data['token'] = None
            data['short_code'] = None
        return data


class AdminEventRegistrationSerializer(serializers.ModelSerializer):
    """Admin-facing: used by the check-in screen's roster + check-in responses."""

    user = UserSerializer(read_only=True)
    checked_in_by = UserSerializer(read_only=True)
    ticket_type = TicketTypeBriefSerializer(read_only=True)
    amount_paid = serializers.SerializerMethodField()

    class Meta:
        model = EventRegistration
        # user is null for guests; name/email are always set.
        fields = ['id', 'user', 'name', 'email', 'token', 'short_code', 'status', 'ticket_type', 'amount_paid', 'checked_in_at', 'checked_in_by', 'created_at']
        read_only_fields = fields

    def get_amount_paid(self, obj):
        return obj.amount_kobo / 100
