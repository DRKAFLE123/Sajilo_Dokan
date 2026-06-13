import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'local_connect.settings')
django.setup()

from products.models import ProductCategory, ProductSubcategory, Brand

def seed():
    # Brands
    brands = ["Apple", "Samsung", "Sony", "Nike", "Adidas", "LG", "Dell", "HP", "Panasonic", "Zara"]
    for b_name in brands:
        Brand.objects.get_or_create(name=b_name)
    
    # Subcategories for some main categories
    cat_subs = {
        "Mobiles & Tablets": ["Smartphones", "Feature Phones", "Tablets", "Accessories"],
        "Computers & Laptops": ["Laptops", "Desktops", "Gaming Laptops", "Monitors"],
        "Fashion": ["Men's Clothing", "Women's Clothing", "Kids' Clothing", "Accessories"],
        "Home Appliances": ["Refrigerators", "Washing Machines", "Air Conditioners", "Microwaves"],
        "Health & Beauty": ["Skincare", "Haircare", "Makeup", "Fragrance"],
    }
    
    for cat_name, subs in cat_subs.items():
        try:
            cat = ProductCategory.objects.get(name=cat_name)
            for sub_name in subs:
                ProductSubcategory.objects.get_or_create(category=cat, name=sub_name)
        except ProductCategory.DoesNotExist:
            print(f"Category {cat_name} not found, skipping subcategories.")

    print("Successfully seeded brands and subcategories.")

if __name__ == "__main__":
    seed()
