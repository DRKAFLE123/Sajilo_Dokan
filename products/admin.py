from django.contrib import admin
from .models import ProductCategory, ProductSubcategory, Brand, ProductTag, Product, ProductVariant, ProductImage

admin.site.register(ProductCategory)
admin.site.register(ProductSubcategory)
admin.site.register(Brand)
admin.site.register(ProductTag)
admin.site.register(Product)
admin.site.register(ProductVariant)
admin.site.register(ProductImage)
