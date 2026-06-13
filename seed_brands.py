import os
import django
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'local_connect.settings')
django.setup()

from products.models import ProductCategory, Brand

BRAND_DATA = {
    "ELECTRONICS": [
        # Mobile & Tablets
        "Apple", "Samsung", "Xiaomi", "OnePlus", "Oppo", "Vivo", "Realme", "Nokia", "Motorola", "Huawei",
        # Mobile Accessories
        "Anker", "Baseus", "UGREEN", "Belkin", "Sony", "JBL", "boAt", "Mi",
        # Audio Devices
        "Bose", "Sennheiser", "Skullcandy", 
        # Computers
        "Dell", "HP", "Lenovo", "Asus", "Acer", "MSI",
        # Computer Components
        "Intel", "AMD", "NVIDIA", "Kingston", "Corsair", "Seagate", "Western Digital",
        # Smart Devices
        "Google", "Amazon", "Fitbit"
    ],
    "FASHION & APPAREL": [
        "Nike", "Adidas", "Puma", "Levi's", "Zara", "H&M", "Uniqlo", "Gucci", "Louis Vuitton", "Calvin Klein", "Under Armour", "Gap",
        "Reebok", "Skechers", "Bata", "Converse", "Vans",
        "Ray-Ban", "Fossil", "Titan", "Casio", "Michael Kors"
    ],
    "GROCERY & FMCG": [
        "Nestlé", "Unilever", "ITC", "Britannia", "Kellogg's", "Wai Wai", "Chaudhary Group (CG Foods)", "Hulas",
        "Coca-Cola", "Pepsi", "Red Bull", "Tata Tea", "Lipton",
        "Amul"
    ],
    "HOME & LIVING": [
        "LG", "Whirlpool", "Bosch", "Philips", "Hitachi",
        "IKEA", "Godrej Interio", "Durian", "Nilkamal", "Urban Ladder",
        "Prestige", "Hawkins", "Bajaj", "Tefal", "Pigeon"
    ],
    "BEAUTY & PERSONAL CARE": [
        "L'Oréal", "Nivea", "Dove", "Garnier", "Himalaya", "Olay",
        "Maybelline", "Lakmé", "MAC", "NYX", "Revlon",
        "Braun"
    ],
    "HEALTH & PHARMACY": [
        "Cipla", "Sun Pharma", "Abbott", "Dr. Reddy's", "Pfizer",
        "Omron", "Dr Trust", "Accu-Chek", "Beurer"
    ],
    "SPORTS & FITNESS": [
        "Decathlon", "Yonex", "Cosco"
    ],
    "BOOKS & STATIONERY": [
        "Classmate", "Navneet", "Oxford", "Cambridge University Press", "Pearson", "Pilot", "Parker"
    ],
    "HARDWARE & TOOLS": [
        "Makita", "Black+Decker", "Stanley", "Dewalt", "Hilti", "INGCO"
    ],
    "AUTOMOTIVE": [
        "Honda", "Yamaha", "Hero", "TVS",
        "Toyota", "Hyundai", "Suzuki", "Mahindra", "Tata Motors",
        "Castrol", "Shell", "Mobil"
    ],
    "AGRICULTURE": [
        "Syngenta", "Bayer Crop Science", "UPL", "Pioneer Seeds"
    ],
    "PET SUPPLIES": [
        "Pedigree", "Royal Canin", "Whiskas", "Drools", "Himalaya Pet Care"
    ],
    "GIFTS & TOYS": [
        "LEGO", "Mattel", "Hasbro", "Funskool", "Barbie"
    ],
    "FOOD & RESTAURANT": [
        "KFC", "McDonald's", "Domino's", "Pizza Hut", "Subway", "Burger King"
    ],
}

NEPAL_BRANDS = [
    ("ELECTRONICS", "CG Digital"),
    ("ELECTRONICS", "Neo Store"),
    ("GROCERY & FMCG", "Rara Noodles"),
    ("GROCERY & FMCG", "Shree Noodles"),
]

def seed():
    Brand.objects.all().delete()
    print("Cleared existing brands.")
    
    for cat_name, brands in BRAND_DATA.items():
        try:
            cat = ProductCategory.objects.get(name=cat_name)
        except ProductCategory.DoesNotExist:
            print(f"Warning: Category {cat_name} not found. Brands will be global.")
            cat = None
            
        for b_name in set(brands):
            Brand.objects.get_or_create(
                name=b_name,
                category=cat,
                defaults={'is_verified': True, 'popularity_score': 100}
            )
            print(f"Created Brand: {b_name} (Category: {cat_name})")
            
    # Nepal specific
    for cat_name, b_name in NEPAL_BRANDS:
        try:
            cat = ProductCategory.objects.get(name=cat_name)
        except ProductCategory.DoesNotExist:
            cat = None
        Brand.objects.get_or_create(
            name=b_name,
            category=cat,
            defaults={'country': 'Nepal', 'is_verified': True, 'popularity_score': 200}
        )
        print(f"Created Nepali Brand: {b_name} (Category: {cat_name})")

if __name__ == "__main__":
    seed()
