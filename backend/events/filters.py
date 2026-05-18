import django_filters
from .models import Event


class EventFilter(django_filters.FilterSet):
    """
    Explicit FilterSet for Event.

    Only `is_published` and `is_remote` are wired to DjangoFilterBackend.
    The `status`, `upcoming`, `search`, and `ordering` params are handled
    manually in EventViewSet.get_queryset() / DRF filter backends, so they
    must NOT appear here — otherwise django-filter will raise a 400 when it
    tries to validate them against the model.
    """

    class Meta:
        model = Event
        fields = ["is_published", "is_remote"]