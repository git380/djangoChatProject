from django.urls import path
from . import views
urlpatterns = [
    path('login/', views.login, name='login'),
    path('login_ok/', views.login_ok, name='login_ok'),
    path('chat_list/', views.chat_list, name='chat_list'),
    path('chat/', views.chat, name='chat'),
    path('contact/', views.contact, name='contact'),
    path('logout/', views.logout, name='logout'),
    path('info_list/', views.info_list, name='info_list'),
    path('login_info_add/', views.login_info_add, name='login_info_add'),
    path('info_update/<str:login_id>/', views.info_update, name='info_update'),
    path('info_update/', views.info_update, name='info_update_noid'),
    path('delete_info/<str:login_id>/', views.delete_info, name='delete_info'),
    path('delete_info/', views.delete_info, name='delete_info_noid'),
    path('message_history/', views.message_history, name='message_history'),
]
