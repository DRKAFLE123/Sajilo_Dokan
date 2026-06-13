from django.urls import path
from . import views

app_name = 'shops'

urlpatterns = [
    path('', views.shop_list, name='list'),
    path('create/', views.shop_create, name='create'),
    path('<int:pk>/', views.shop_detail, name='detail'),
    path('<int:pk>/edit/', views.shop_edit, name='edit'),
    path('dashboard/', views.shop_dashboard, name='dashboard'),
]