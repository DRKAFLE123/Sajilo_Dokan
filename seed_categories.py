import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'local_connect.settings')
django.setup()

from products.models import ProductCategory

categories = [
    "Kids' & Baby Fashion",
    "Mobiles & Tablets",
    "Computers & Laptops",
    "TV, Audio / Video, Gaming & Wearables",
    "Cameras",
    "Home Appliances",
    "Health & Beauty",
    "Fashion",
    "Bags and Travel",
    "Sports & Outdoors",
    "Motors",
    "Media, Music & Books",
    "Groceries",
    "Furniture & Decor",
    "Tools, DIY & Outdoor",
    "Laundry & Cleaning",
    "Kitchen & Dining",
    "Stationery & Craft",
    "Bedding & Bath",
    "Digital Goods",
    "Watches Sunglasses Jewellery",
    "Mother & Baby",
    "Special Digital Products",
    "Charity and Donation",
    "Toys & Games",
    "Pet Supplies",
    "Test Product"
]

for cat_name in categories:
    ProductCategory.objects.get_or_create(name=cat_name)

print(f"Successfully seeded {len(categories)} categories.")
