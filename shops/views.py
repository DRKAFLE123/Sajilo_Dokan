from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from .models import Shop
from .forms import ShopForm

def shop_list(request):
    shops = Shop.objects.filter(is_active=True)
    return render(request, 'shops/list.html', {'shops': shops})

def shop_detail(request, pk):
    shop = get_object_or_404(Shop, pk=pk)
    return render(request, 'shops/detail.html', {'shop': shop})

@login_required
def shop_create(request):
    if request.method == 'POST':
        form = ShopForm(request.POST, request.FILES)
        if form.is_valid():
            shop = form.save(commit=False)
            shop.owner = request.user
            shop.save()
            return redirect('shops:detail', pk=shop.pk)
    else:
        form = ShopForm()
    return render(request, 'shops/form.html', {'form': form})

@login_required
def shop_edit(request, pk):
    shop = get_object_or_404(Shop, pk=pk, owner=request.user)
    if request.method == 'POST':
        form = ShopForm(request.POST, request.FILES, instance=shop)
        if form.is_valid():
            form.save()
            return redirect('shops:detail', pk=shop.pk)
    else:
        form = ShopForm(instance=shop)
    return render(request, 'shops/form.html', {'form': form})

@login_required
def shop_dashboard(request):
    shops = Shop.objects.filter(owner=request.user)
    return render(request, 'shops/dashboard.html', {'shops': shops})