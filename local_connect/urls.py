from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView  # Add this import
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    path('accounts/', include('accounts.urls')),
    path('shops/', include('shops.urls',namespace='shops')),
    # path('', TemplateView.as_view(template_name='home.html'), name='home'),
    path('', include('products.urls', namespace='products')),   # home handled via products app
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
