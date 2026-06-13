import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'local_connect.settings')
django.setup()

from products.models import ProductCategory, ProductSubcategory, ProductTag

def seed_universal():
    # 1. Product Tags
    tags = ["Fast Moving", "Seasonal", "Expiring Soon", "Premium", "Discounted", "New Arrival"]
    for t_name in tags:
        ProductTag.objects.get_or_create(name=t_name)
    
    # 2. Universal Categories and Subcategories
    data = {
        "Food & Grocery": ["Rice / Flour", "Snacks", "Beverages", "Dairy", "Frozen", "Spices"],
        "Electronics": ["Mobiles", "Accessories", "Computers", "Audio", "Smart Devices"],
        "Fashion": ["Men", "Women", "Kids", "Footwear", "Accessories"],
        "Home & Living": ["Kitchen", "Furniture", "Decor", "Cleaning"],
        "Health & Beauty": ["Skincare", "Haircare", "Makeup", "Medicine"],
        "Tools & Hardware": ["Electrical", "Plumbing", "Construction"]
    }

    for cat_name, subs in data.items():
        cat, created = ProductCategory.objects.get_or_create(name=cat_name)
        for sub_name in subs:
            ProductSubcategory.objects.get_or_create(category=cat, name=sub_name)

    print("Successfully seeded universal inventory categories, subcategories, and tags.")

if __name__ == "__main__":
    seed_universal()
