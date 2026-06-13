from django.contrib import admin
from .models import ShopCategory, Shop, Conversation, Message, ShopKYC

@admin.register(Shop)
class ShopAdmin(admin.ModelAdmin):
    list_display = ('name', 'owner', 'shop_type', 'pan_vat_number', 'is_verified', 'is_active', 'created_at')
    list_filter = ('shop_type', 'is_verified', 'is_active')
    search_fields = ('name', 'owner__username', 'pan_vat_number')
    list_editable = ('is_verified', 'is_active')

@admin.register(ShopKYC)
class ShopKYCAdmin(admin.ModelAdmin):
    list_display = ('shop', 'document_type', 'kyc_status', 'father_name', 'submitted_at')
    list_filter = ('kyc_status', 'document_type')
    list_editable = ('kyc_status',)
    search_fields = ('shop__name',)

admin.site.register(ShopCategory)
admin.site.register(Conversation)
admin.site.register(Message)
