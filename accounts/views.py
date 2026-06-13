
from django.shortcuts import render, redirect
from django.contrib.auth import login
from django.contrib.auth.decorators import login_required
from django.views.generic import CreateView
from django.urls import reverse_lazy
from .forms import CustomerSignUpForm, ShopOwnerSignUpForm, ProfileUpdateForm 
from .models import CustomUser

def account_root(request):
    if request.user.is_authenticated:
        return redirect('profile')
    return redirect('login')

class CustomerSignUpView(CreateView):
    model = CustomUser
    form_class = CustomerSignUpForm
    template_name = 'accounts/signup.html'
    
    def get_context_data(self, **kwargs):
        kwargs['user_type'] = 'customer'
        return super().get_context_data(**kwargs)
    
    def form_valid(self, form):
        user = form.save()
        login(self.request, user)
        return redirect('home')

class ShopOwnerSignUpView(CreateView):
    model = CustomUser
    form_class = ShopOwnerSignUpForm
    template_name = 'accounts/signup.html'
    
    def get_context_data(self, **kwargs):
        kwargs['user_type'] = 'shop_owner'
        return super().get_context_data(**kwargs)
    
    def form_valid(self, form):
        user = form.save()
        login(self.request, user)
        return redirect('home')

@login_required
def profile_view(request):
    return render(request, 'accounts/profile.html')

@login_required
def profile_update(request):
    if request.method == 'POST':
        form = ProfileUpdateForm(request.POST, request.FILES, instance=request.user)
        if form.is_valid():
            form.save()
            return redirect('profile')
    else:
        form = ProfileUpdateForm(instance=request.user)
    
    return render(request, 'accounts/profile_update.html', {'form': form})