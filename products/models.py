from django.db import models
from django.core.validators import MinValueValidator
from shops.models import Shop

class ProductCategory(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    
    def __str__(self):
        return self.name
    
    class Meta:
        verbose_name_plural = "Product Categories"

class ProductSubcategory(models.Model):
    category = models.ForeignKey(ProductCategory, on_delete=models.CASCADE, related_name='subcategories')
    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, related_name='custom_subcategories', null=True, blank=True)
    name = models.CharField(max_length=100)
    
    def __str__(self):
        return f"{self.category.name} > {self.name}"
    
    class Meta:
        verbose_name_plural = "Product Subcategories"

class ProductChildCategory(models.Model):
    subcategory = models.ForeignKey(ProductSubcategory, on_delete=models.CASCADE, related_name='child_categories')
    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, related_name='custom_child_categories', null=True, blank=True)
    name = models.CharField(max_length=100)
    
    def __str__(self):
        return f"{self.subcategory.category.name} > {self.subcategory.name} > {self.name}"
    
    class Meta:
        verbose_name_plural = "Product Child Categories"

class Brand(models.Model):
    name = models.CharField(max_length=100)
    category = models.ForeignKey(ProductCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name='brands')
    subcategory = models.ForeignKey(ProductSubcategory, on_delete=models.SET_NULL, null=True, blank=True, related_name='brands')
    country = models.CharField(max_length=100, blank=True)
    is_verified = models.BooleanField(default=False)
    popularity_score = models.IntegerField(default=0)
    
    def __str__(self):
        return self.name

class ProductTag(models.Model):
    name = models.CharField(max_length=50)
    
    def __str__(self):
        return self.name

class Product(models.Model):
    WARRANTY_CHOICES = [
        ('none', 'No Warranty'),
        ('local', 'Local Seller Warranty'),
        ('brand', 'Brand Warranty'),
        ('international', 'International Warranty'),
    ]

    DANGEROUS_CHOICES = [
        ('none', 'None'),
        ('battery', 'Contains Battery'),
        ('flammable', 'Flammable'),
        ('liquid', 'Liquid'),
    ]

    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, related_name='products')
    category = models.ForeignKey(ProductCategory, on_delete=models.SET_NULL, null=True, blank=True)
    subcategory = models.ForeignKey(ProductSubcategory, on_delete=models.SET_NULL, null=True, blank=True)
    child_category = models.ForeignKey(ProductChildCategory, on_delete=models.SET_NULL, null=True, blank=True)
    brand = models.ForeignKey(Brand, on_delete=models.SET_NULL, null=True, blank=True)
    tags = models.ManyToManyField(ProductTag, blank=True)
    
    name = models.CharField(max_length=255)
    sku = models.CharField(max_length=50, unique=True, blank=True, null=True)
    description = models.TextField(blank=True)
    highlights = models.TextField(blank=True, help_text="Bulleted list of key features")
    
    # Core Attributes
    size = models.CharField(max_length=50, blank=True)
    color = models.CharField(max_length=50, blank=True)
    weight = models.CharField(max_length=50, blank=True, help_text="e.g. 70g, 1kg")
    unit = models.CharField(max_length=20, blank=True, help_text="e.g. pcs, pkt, kg")
    
    cost_price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)], default=0)
    selling_price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)], default=0)
    stock_quantity = models.PositiveIntegerField(default=0)
    wholesale_price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)], null=True, blank=True)
    min_order_quantity = models.PositiveIntegerField(default=1)
    
    barcode = models.CharField(max_length=100, blank=True)
    supplier = models.CharField(max_length=100, blank=True)
    expiry_date = models.DateField(null=True, blank=True)
    
    # Shipping & Dimensions
    package_weight = models.DecimalField(max_digits=6, decimal_places=3, default=0, help_text="Weight in kg")
    package_length = models.DecimalField(max_digits=6, decimal_places=2, default=0, help_text="Length in cm")
    package_width = models.DecimalField(max_digits=6, decimal_places=2, default=0, help_text="Width in cm")
    package_height = models.DecimalField(max_digits=6, decimal_places=2, default=0, help_text="Height in cm")
    
    is_dangerous = models.CharField(max_length=20, choices=DANGEROUS_CHOICES, default='none')
    warranty_type = models.CharField(max_length=20, choices=WARRANTY_CHOICES, default='none')
    warranty_period = models.CharField(max_length=100, blank=True)
    
    content_score = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    moderation_status = models.CharField(
        max_length=20, 
        choices=[('pending', 'Pending'), ('approved', 'Approved'), ('rejected', 'Rejected')], 
        default='pending'
    )
    admin_notes = models.TextField(blank=True)
    is_featured = models.BooleanField(default=False, help_text="Highlight as a top featured product")
    is_sponsored = models.BooleanField(default=False, help_text="Highlight as a paid sponsored product")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    views = models.PositiveIntegerField(default=0)
    
    # Ratings
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    rating_count = models.PositiveIntegerField(default=0)
    def save(self, *args, **kwargs):
        if not self.sku:
            # Generate SKU: [ShopType]-[Category]-[Number]
            # This is a simplified version; in production, you'd use a more robust sequence
            shop_prefix = self.shop.business_type[:3].upper()
            cat_prefix = self.category.name[:3].upper() if self.category else "GEN"
            import random
            random_num = random.randint(100, 999)
            self.sku = f"{shop_prefix}-{cat_prefix}-{random_num}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.sku})"

    class Meta:
        indexes = [
            models.Index(fields=['moderation_status', 'created_at'], name='prod_mod_created_idx'),
            models.Index(fields=['selling_price'], name='prod_price_idx'),
            models.Index(fields=['is_featured', 'is_sponsored', 'created_at'], name='prod_featured_spons_idx'),
            models.Index(fields=['created_at'], name='prod_created_idx'),
        ]

class ProductVariant(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='variants')
    name = models.CharField(max_length=100, help_text="e.g. Red, Small")
    price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    stock = models.PositiveIntegerField(default=0)
    sku = models.CharField(max_length=50, unique=True, blank=True, null=True)

    def __str__(self):
        return f"{self.product.name} - {self.name}"

class ProductImage(models.Model):
    product = models.ForeignKey(Product, related_name='images', on_delete=models.CASCADE)
    image = models.ImageField(upload_to='product_images/')
    is_main = models.BooleanField(default=False)
    
    def __str__(self):
        return f"Image for {self.product.name}"

class ProductReview(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey('accounts.CustomUser', on_delete=models.CASCADE, related_name='product_reviews')
    rating = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('product', 'user')

    def __str__(self):
        return f"{self.user.username}'s {self.rating}-star review for {self.product.name}"