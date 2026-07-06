# backend/assistant/urls.py

from django.urls import path
from .views import ChatView, ClearConversationView, MessagesView

urlpatterns = [
    path('assistant/chat/', ChatView.as_view(), name='assistant-chat'),
    path('assistant/messages/', MessagesView.as_view(), name='assistant-messages'),
    path('assistant/clear/', ClearConversationView.as_view(), name='assistant-clear'),
]
