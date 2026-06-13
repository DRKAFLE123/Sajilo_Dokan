from django.db import models
from accounts.models import CustomUser
from django.contrib.auth import get_user_model

User = get_user_model()

class ShopCategory(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, blank=True, help_text="Lucide icon name")
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='subcategories')
    
    class Meta:
        verbose_name_plural = "Shop Categories"
        
    def __str__(self):
        full_path = [self.name]
        k = self.parent
        while k is not None:
            full_path.append(k.name)
            k = k.parent
        return " -> ".join(reversed(full_path))


class Shop(models.Model):
    SHOP_TYPE_CHOICES = [
        ('physical', 'Physical Store'),
        ('online', 'Online Store'),
    ]

    BUSINESS_TYPE_CHOICES = [
        ('grocery', 'Grocery'),
        ('electronics', 'Electronics'),
        ('fashion', 'Fashion'),
        ('hardware', 'Hardware'),
        ('pharmacy', 'Pharmacy'),
        ('furniture', 'Furniture'),
        ('restaurant', 'Restaurant'),
        ('cosmetics', 'Cosmetics'),
        ('agriculture', 'Agriculture'),
        ('stationery', 'Stationery'),
        ('mobile', 'Mobile Shop'),
    ]

    owner = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    logo = models.ImageField(upload_to='shop_logos/', blank=True, null=True)
    banner = models.ImageField(upload_to='shop_banners/', blank=True, null=True)
    address = models.TextField(blank=True)
    latitude = models.DecimalField(max_digits=11, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=11, decimal_places=6, null=True, blank=True)
    phone_number = models.CharField(max_length=15, blank=True)
    email = models.EmailField(blank=True)
    shop_type = models.CharField(max_length=10, choices=SHOP_TYPE_CHOICES, default='physical')
    business_type = models.CharField(max_length=20, choices=BUSINESS_TYPE_CHOICES, default='grocery')
    pan_vat_number = models.CharField(max_length=50, blank=True, help_text='PAN/VAT/Registration Number')
    is_verified = models.BooleanField(default=False, help_text='Manually approved by Admin after KYC review')
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False, help_text="Highlight as a top featured shop")
    is_sponsored = models.BooleanField(default=False, help_text="Highlight as a paid sponsored shop")
    
    # Payment Settings
    qr_code = models.ImageField(upload_to='shop_qrs/', blank=True, null=True)
    merchant_code = models.CharField(max_length=100, blank=True)

    promotion_label = models.CharField(max_length=20, default='', blank=True, help_text="Custom promotion text (e.g., Sale, Special Offer, or any custom text)")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Ratings
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    rating_count = models.PositiveIntegerField(default=0)
    views = models.PositiveIntegerField(default=0)
    
    # Verification & Geographic Localization
    verification_tier = models.CharField(
        max_length=20, 
        choices=[('unverified', 'Unverified'), ('personal_verified', 'Identity Verified'), ('business_verified', 'Business Verified')], 
        default='unverified'
    )
    category = models.ForeignKey('ShopCategory', on_delete=models.SET_NULL, null=True, blank=True, related_name='shops')
    province = models.ForeignKey('Province', on_delete=models.SET_NULL, null=True, blank=True, related_name='shops')
    district = models.ForeignKey('District', on_delete=models.SET_NULL, null=True, blank=True, related_name='shops')
    city = models.ForeignKey('City', on_delete=models.SET_NULL, null=True, blank=True, related_name='shops')
    ward = models.ForeignKey('Ward', on_delete=models.SET_NULL, null=True, blank=True, related_name='shops')
    street = models.ForeignKey('Street', on_delete=models.SET_NULL, null=True, blank=True, related_name='shops')
    market_hub = models.ForeignKey('MarketHub', on_delete=models.SET_NULL, null=True, blank=True, related_name='shops')
    trade_types = models.ManyToManyField('TradeType', blank=True, related_name='shops')

    def __str__(self):
        return self.name

    class Meta:
        indexes = [
            models.Index(fields=['latitude', 'longitude'], name='shop_lat_lng_idx'),
            models.Index(fields=['is_featured', 'created_at'], name='shop_featured_created_idx'),
            models.Index(fields=['is_sponsored', 'created_at'], name='shop_sponsored_created_idx'),
            models.Index(fields=['created_at'], name='shop_created_idx'),
        ]


class ShopKYC(models.Model):
    DOCUMENT_TYPE_CHOICES = [
        ('passport', 'Passport'),
        ('national_id', 'National ID Card'),
        ('citizenship', 'Citizenship Certificate'),
        ('driving_license', 'Driving License'),
    ]
    KYC_STATUS_CHOICES = [
        ('pending', 'Pending Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    shop = models.OneToOneField(Shop, on_delete=models.CASCADE, related_name='kyc')
    document_type = models.CharField(max_length=20, choices=DOCUMENT_TYPE_CHOICES)
    document_front = models.ImageField(upload_to='kyc_documents/')
    document_back = models.ImageField(upload_to='kyc_documents/', blank=True, null=True)
    
    # Tiered KYC fields
    kyc_type = models.CharField(
        max_length=20, 
        choices=[('personal', 'Personal ID Verification'), ('business', 'Business Registration Verification')], 
        default='personal'
    )
    business_certificate = models.ImageField(upload_to='kyc_documents/', blank=True, null=True)
    pan_vat_certificate = models.ImageField(upload_to='kyc_documents/', blank=True, null=True)

    father_name = models.CharField(max_length=100, blank=True)
    mother_name = models.CharField(max_length=100, blank=True)
    permanent_address = models.TextField(blank=True)
    kyc_status = models.CharField(max_length=10, choices=KYC_STATUS_CHOICES, default='pending')
    submitted_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    admin_notes = models.TextField(blank=True, help_text='Internal notes from admin review')

    def __str__(self):
        return f"KYC for {self.shop.name} — {self.kyc_status}"


class Conversation(models.Model):
    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, related_name='conversations')
    customer = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='conversations')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('shop', 'customer')
    
    def __str__(self):
        return f"{self.customer.username} - {self.shop.name}"


class Message(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    content = models.TextField(blank=True)
    image = models.ImageField(upload_to='chat_images/', blank=True, null=True)
    audio = models.FileField(upload_to='chat_audio/', blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    
    def __str__(self):
        return f"Message from {self.sender.username}"


class ShopRole(models.Model):
    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, related_name='roles')
    name = models.CharField(max_length=50)
    description = models.TextField(blank=True)
    can_manage_products = models.BooleanField(default=False)
    can_manage_orders = models.BooleanField(default=False)
    can_reply_messages = models.BooleanField(default=False)
    can_view_finance = models.BooleanField(default=False)
    can_manage_settings = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('shop', 'name')

    def __str__(self):
        return f"{self.name} - {self.shop.name}"


class ShopSubAccount(models.Model):
    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, related_name='sub_accounts')
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='shop_sub_account')
    role = models.ForeignKey(ShopRole, on_delete=models.SET_NULL, null=True, related_name='users')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.role.name if self.role else 'No Role'} at {self.shop.name}"


class ShopSettings(models.Model):
    shop = models.OneToOneField(Shop, on_delete=models.CASCADE, related_name='settings')
    
    # Notifications
    email_notifications = models.BooleanField(default=True)
    sms_notifications = models.BooleanField(default=False)
    order_alerts = models.BooleanField(default=True)
    message_alerts = models.BooleanField(default=True)
    
    # Chat Settings
    auto_reply_enabled = models.BooleanField(default=False)
    auto_reply_message = models.TextField(blank=True, help_text="Message sent automatically when customers initiate a chat.")
    quick_replies = models.JSONField(default=list, blank=True, help_text="List of quick reply strings.")
    
    def __str__(self):
        return f"Settings for {self.shop.name}"

from django.core.validators import MinValueValidator

class ShopReview(models.Model):
    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='shop_reviews')
    rating = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('shop', 'user')

    def __str__(self):
        return f"{self.user.username}'s {self.rating}-star review for {self.shop.name}"

class ShopVoucher(models.Model):
    DISCOUNT_TYPE_CHOICES = [
        ('percentage', 'Percentage'),
        ('fixed', 'Fixed Amount'),
    ]
    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, related_name='vouchers')
    code = models.CharField(max_length=20)
    discount_type = models.CharField(max_length=20, choices=DISCOUNT_TYPE_CHOICES, default='percentage')
    discount_value = models.DecimalField(max_digits=10, decimal_places=2, help_text="Percentage (e.g. 10 for 10%) or Fixed Amount (e.g. 500 for NPR 500)")
    minimum_order_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    max_uses = models.PositiveIntegerField(default=100, help_text="Total number of times this voucher can be used")
    used_count = models.PositiveIntegerField(default=0)
    valid_from = models.DateTimeField()
    valid_until = models.DateTimeField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('shop', 'code')

    def __str__(self):
        return f"{self.code} - {self.shop.name}"

class SubscriptionPlan(models.Model):
    name = models.CharField(max_length=50, unique=True)
    price_monthly = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    product_limit = models.PositiveIntegerField(help_text="Max products allowed. 0 means unlimited.", default=50)
    features = models.JSONField(default=list, blank=True, help_text="List of feature strings.")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - NPR {self.price_monthly}/mo"

class ShopSubscription(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('past_due', 'Past Due'),
        ('cancelled', 'Cancelled'),
    ]
    shop = models.OneToOneField(Shop, on_delete=models.CASCADE, related_name='subscription')
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.SET_NULL, null=True, related_name='subscriptions')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    start_date = models.DateTimeField(auto_now_add=True)
    end_date = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.shop.name} - {self.plan.name if self.plan else 'No Plan'}"

class PlatformSettings(models.Model):
    shop_approval_required = models.BooleanField(default=True)
    product_approval_required = models.BooleanField(default=True)
    default_commission_rate = models.DecimalField(max_digits=5, decimal_places=2, default=10.00)
    minimum_payout_amount = models.DecimalField(max_digits=10, decimal_places=2, default=1000.00)
    enable_chat = models.BooleanField(default=True)
    enable_reviews = models.BooleanField(default=True)
    enable_cod = models.BooleanField(default=True)
    marketplace_name = models.CharField(max_length=100, default="Sajilo Dokan")
    
    class Meta:
        verbose_name_plural = "Platform Settings"

    def __str__(self):
        return "Global Platform Settings"
    
    def save(self, *args, **kwargs):
        if not self.pk and PlatformSettings.objects.exists():
            return
        super().save(*args, **kwargs)

class Wishlist(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='wishlist')
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE, related_name='wishlisted_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'product')

    def __str__(self):
        return f"{self.user.username} - {self.product.name}"

class ShopFollow(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='following_shops')
    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, related_name='followers')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'shop')

    def __str__(self):
        return f"{self.user.username} follows {self.shop.name}"

class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    link = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Notification for {self.user.username}: {self.title}"


class CommissionRate(models.Model):
    category = models.OneToOneField('products.ProductCategory', on_delete=models.CASCADE, related_name='commission_rate')
    rate_percent = models.DecimalField(max_digits=5, decimal_places=2, default=10.00)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.category.name} - {self.rate_percent}%"


class PayoutRequest(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('paid', 'Paid'),
        ('rejected', 'Rejected'),
    ]
    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, related_name='payout_requests')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    requested_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    admin_notes = models.TextField(blank=True)

    def __str__(self):
        return f"Payout Request #{self.id} - {self.shop.name} - NPR {self.amount}"





class TradeType(models.Model):
    name = models.CharField(max_length=50, unique=True)
    code = models.CharField(max_length=20, unique=True)

    def __str__(self):
        return self.name


class Province(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name


class District(models.Model):
    province = models.ForeignKey(Province, on_delete=models.CASCADE, related_name='districts')
    name = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.province.name} > {self.name}"


class City(models.Model):
    district = models.ForeignKey(District, on_delete=models.CASCADE, related_name='cities')
    name = models.CharField(max_length=100)
    city_type = models.CharField(max_length=50, choices=[
        ('metro', 'Metropolitan City'),
        ('sub_metro', 'Sub-Metropolitan City'),
        ('municipality', 'Municipality'),
        ('rural_municipality', 'Rural Municipality / Village')
    ])

    def __str__(self):
        return f"{self.name} ({self.get_city_type_display()})"


class Ward(models.Model):
    city = models.ForeignKey(City, on_delete=models.CASCADE, related_name='wards')
    number = models.PositiveIntegerField()

    class Meta:
        unique_together = ('city', 'number')

    def __str__(self):
        return f"{self.city.name} - Ward {self.number}"


class Street(models.Model):
    city = models.ForeignKey(City, on_delete=models.CASCADE, related_name='streets')
    name = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.city.name} > {self.name}"


class MarketHub(models.Model):
    name = models.CharField(max_length=100)
    city = models.ForeignKey(City, on_delete=models.CASCADE, related_name='market_hubs')
    street = models.ForeignKey(Street, on_delete=models.SET_NULL, null=True, blank=True, related_name='market_hubs')
    description = models.TextField(blank=True)
    banner = models.ImageField(upload_to='market_banners/', blank=True, null=True)
    latitude = models.DecimalField(max_digits=11, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=11, decimal_places=6, null=True, blank=True)

    def __str__(self):
        return f"{self.name} ({self.city.name})"


class ShopCategoryPermittedProduct(models.Model):
    shop_category = models.ForeignKey(ShopCategory, on_delete=models.CASCADE, related_name='permitted_products')
    permitted_product_category = models.ForeignKey('products.ProductCategory', on_delete=models.CASCADE, related_name='permitted_shops')

    class Meta:
        unique_together = ('shop_category', 'permitted_product_category')

    def __str__(self):
        return f"{self.shop_category.name} permits {self.permitted_product_category.name}"