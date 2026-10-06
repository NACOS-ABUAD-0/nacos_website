# backend/events/test_sales.py
"""The admin sales panel: live bookings, check-ins and money per ticket type. Paystack is mocked."""
from datetime import timedelta
from decimal import Decimal
from unittest import mock

from django.core.cache import cache
from django.test import override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient, APITestCase

from accounts.models import User

from .models import Event, EventRegistration, TicketPayment, TicketType
from .ticketing import sync_unconfirmed_payments

Status = EventRegistration.Status
PaymentStatus = TicketPayment.Status


class EventSalesTest(APITestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()
        self.admin = User.objects.create_user(email='admin@example.com', full_name='Admin', password='pass12345', role='admin')
        self.exco = User.objects.create_user(email='exco@example.com', full_name='Exco', password='pass12345', role='president')
        self.student = User.objects.create_user(email='student@example.com', full_name='Student', password='pass12345')
        self.event = Event.objects.create(
            title='Dinner', start_time=timezone.now() + timedelta(days=3), location='Hall', capacity=100,
        )
        self.regular = TicketType.objects.create(event=self.event, name='Regular', price=Decimal('2000'), capacity=50)
        self.vip = TicketType.objects.create(event=self.event, name='VIP', price=Decimal('10000'), capacity=10, sort_order=1)
        self.n = 0

    def ticket(self, ticket_type, status=Status.CONFIRMED, checked_in=False, payment=PaymentStatus.SUCCESSFUL, fees=100):
        self.n += 1
        registration = EventRegistration.objects.create(
            event=self.event, name=f'Buyer {self.n}', email=f'buyer{self.n}@example.com', ticket_type=ticket_type,
            status=status, amount_kobo=ticket_type.price_kobo,
            hold_expires_at=timezone.now() + timedelta(minutes=30) if status == Status.PENDING_PAYMENT else None,
            checked_in_at=timezone.now() if checked_in else None,
        )
        TicketPayment.objects.create(
            registration=registration, event=self.event, email=registration.email, ticket_type=ticket_type,
            reference=f'REF-{self.n}', amount_kobo=ticket_type.price_kobo, status=payment,
            fees_kobo=fees if payment == PaymentStatus.SUCCESSFUL else None,
        )
        return registration

    def sales(self, user=None):
        self.client.force_authenticate(user=user or self.admin)
        return self.client.get(reverse('events-sales', kwargs={'pk': self.event.pk}))

    def test_totals_and_breakdown_per_ticket_type(self):
        self.ticket(self.regular, checked_in=True)
        self.ticket(self.regular)
        self.ticket(self.vip)
        self.ticket(self.vip, status=Status.PENDING_PAYMENT, payment=PaymentStatus.PENDING)
        self.ticket(self.regular, status=Status.CANCELLED, payment=PaymentStatus.REFUNDED)

        response = self.sales()
        self.assertEqual(response.status_code, 200)
        totals = response.data['totals']
        self.assertEqual(totals['booked'], 3)
        self.assertEqual(totals['checked_in'], 1)
        self.assertEqual(totals['awaiting_payment'], 1)
        self.assertEqual(totals['paid'], 3)
        self.assertEqual(totals['revenue'], 14000)
        self.assertEqual(totals['fees'], 3)
        self.assertEqual(totals['net'], 13997)
        self.assertEqual(totals['refunded'], 1)
        self.assertEqual(totals['refunded_amount'], 2000)
        self.assertEqual(totals['remaining'], 96)  # 3 confirmed + 1 held seat

        by_name = {row['name']: row for row in response.data['ticket_types']}
        self.assertEqual(set(by_name), {'Regular', 'VIP'})
        self.assertEqual((by_name['Regular']['booked'], by_name['Regular']['checked_in'], by_name['Regular']['revenue']), (2, 1, 4000))
        self.assertEqual((by_name['VIP']['booked'], by_name['VIP']['awaiting_payment'], by_name['VIP']['revenue']), (1, 1, 10000))
        self.assertEqual(by_name['VIP']['remaining'], 8)

    def test_new_booking_shows_up_on_the_next_poll(self):
        self.assertEqual(self.sales().data['totals']['booked'], 0)
        self.ticket(self.vip)
        self.assertEqual(self.sales().data['totals']['booked'], 1)

    def test_duplicate_payment_counts_as_money_received_and_is_flagged(self):
        registration = self.ticket(self.regular)
        TicketPayment.objects.create(
            registration=registration, event=self.event, email=registration.email, ticket_type=self.regular,
            reference='REF-DUP', amount_kobo=self.regular.price_kobo, status=PaymentStatus.SUCCESSFUL,
            needs_attention=TicketPayment.Attention.DUPLICATE,
        )
        totals = self.sales().data['totals']
        self.assertEqual((totals['booked'], totals['paid'], totals['revenue'], totals['needs_attention']), (1, 2, 4000, 1))

    def test_free_event_without_ticket_types(self):
        free = Event.objects.create(title='Talk', start_time=timezone.now() + timedelta(days=1), location='Hall')
        EventRegistration.objects.create(event=free, name='A', email='a@example.com')
        self.client.force_authenticate(user=self.admin)
        data = self.client.get(reverse('events-sales', kwargs={'pk': free.pk})).data
        self.assertEqual(data['totals']['booked'], 1)
        self.assertEqual(data['ticket_types'][0]['name'], 'General admission')

    def test_excos_can_see_sales_but_students_cannot(self):
        self.assertEqual(self.sales(self.exco).status_code, 200)
        self.assertEqual(self.sales(self.student).status_code, 403)
        self.client.force_authenticate(user=None)
        self.assertIn(self.client.get(reverse('events-sales', kwargs={'pk': self.event.pk})).status_code, (401, 403))

    def test_booked_count_on_event_list_for_managers_only(self):
        self.ticket(self.regular)
        self.ticket(self.vip, status=Status.PENDING_PAYMENT, payment=PaymentStatus.PENDING)
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(reverse('events-detail', kwargs={'pk': self.event.pk}))
        self.assertEqual(response.data['booked_count'], 1)
        self.client.force_authenticate(user=self.student)
        response = self.client.get(reverse('events-detail', kwargs={'pk': self.event.pk}))
        self.assertNotIn('booked_count', response.data)

    @override_settings(PAYSTACK_SECRET_KEY='sk_test_dummy', EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
    def test_sync_confirms_a_payment_whose_buyer_never_came_back(self):
        registration = self.ticket(self.vip, status=Status.PENDING_PAYMENT, payment=PaymentStatus.PENDING)
        TicketPayment.objects.filter(reference='REF-1').update(
            checkout_url='https://checkout.paystack.com/x', created_at=timezone.now() - timedelta(minutes=5),
        )
        verified = {'status': 'success', 'amount': self.vip.price_kobo, 'currency': 'NGN', 'fees': 150, 'id': 1}
        with mock.patch('events.ticketing.verify_payment', return_value=verified):
            self.assertEqual(sync_unconfirmed_payments(self.event.pk), 1)
        registration.refresh_from_db()
        self.assertEqual(registration.status, Status.CONFIRMED)
        with mock.patch('events.views.start_payment_sync'):
            self.assertEqual(self.sales().data['totals']['booked'], 1)

    @override_settings(PAYSTACK_SECRET_KEY='sk_test_dummy')
    def test_sales_view_starts_background_sync_at_most_once_a_minute(self):
        with mock.patch('events.ticketing.threading.Thread') as thread:
            self.sales()
            self.sales()
        self.assertEqual(thread.return_value.start.call_count, 1)
