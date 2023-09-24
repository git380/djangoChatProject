from django.urls import path
from . import views
urlpatterns = [
    path('login/', views.login, name='login'),
    path('chat/', views.chat, name='chat'),
    path('contact/', views.contact, name='contact'),
    path('logout/', views.logout, name='logout'),
    path('info_list/', views.info_list, name='info_list'),
    path('info_update/<str:login_id>/', views.info_update, name='info_update'),
    path('login_info_add/', views.login_info_add, name='login_info_add'),
]
