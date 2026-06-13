# products/views.py
from django.shortcuts import render
from .models import Product


def home_view(request):
    products = Product.objects.all()
    return render(request, 'products/list.html', {'products': products})

products={1: 'Geeks', 2: 'For', 3: 'Geeks'}
def product_list(request):
    products = Product.objects.all()
    return render(request, 'products/list.html', {'products': products})

# from django.views.generic import ListView
# from .models import Product

# class ProductListView(ListView):
#     model = Product
#     template_name = 'products/list.html'
#     context_object_name = 'products'

# def home_view(request):
#     products = Product.objects.all()
#     return render(request, 'products/list.html', {'products': products})