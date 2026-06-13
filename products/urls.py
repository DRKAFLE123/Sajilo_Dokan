# products/urls.py
from django.urls import path
from .views import home_view, product_list

app_name = 'products'  # This registers the namespace


urlpatterns = [
    path('', home_view, name='home'),  # For the home page
    path('list/', product_list, name='list'),  # For product listing
    # products/urls.py
    # path('<int:pk>/review/', add_review, name='add_review'),
]

# from django.urls import path
# from .views import ProductListView

# urlpatterns = [
#     path('', ProductListView.as_view(), name='list'),
# ]