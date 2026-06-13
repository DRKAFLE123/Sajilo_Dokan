import os
import django
import sys

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'local_connect.settings')
django.setup()

from products.models import ProductCategory, ProductSubcategory, ProductChildCategory

DATA = {
    "ELECTRONICS": {
        "Mobile & Tablets": ["Smartphones", "Android Phones", "iPhones", "Feature Phones", "Tablets", "Android Tablets", "iPads", "Kids Tablets", "Refurbished Devices", "Refurbished Phones", "Refurbished Tablets"],
        "Mobile Accessories": ["Chargers", "Fast Chargers", "Wireless Chargers", "Car Chargers", "Cables", "USB-A Cables", "Type-C Cables", "Lightning Cables", "Protection", "Phone Cases", "Screen Protectors", "Mounts & Holders", "Car Holders", "Bike Mounts"],
        "Audio Devices": ["Earphones", "Wired Earphones", "Wireless Earbuds", "Headphones", "Over-ear", "On-ear", "Speakers", "Bluetooth Speakers", "Smart Speakers"],
        "Computers": ["Laptops", "Gaming Laptops", "Business Laptops", "Desktops", "All-in-One PCs", "Custom PCs", "Peripherals", "Keyboard", "Mouse", "Monitor"],
        "Computer Components": ["Storage", "SSD", "HDD", "Memory", "RAM", "Graphics", "GPU", "Power", "PSU"],
        "Smart Devices": ["Wearables", "Smart Watches", "Fitness Bands", "Smart Home", "Smart Lights", "Smart Plugs", "Smart Cameras"]
    },
    "FASHION & APPAREL": {
        "Men": ["Top Wear", "T-Shirts", "Shirts", "Jackets", "Bottom Wear", "Jeans", "Trousers", "Ethnic Wear", "Kurta", "Dhaka Topi Sets"],
        "Women": ["Western Wear", "Dresses", "Tops", "Ethnic Wear", "Sarees", "Kurtis", "Bottom Wear", "Leggings", "Jeans"],
        "Kids": ["Boys Clothing", "Girls Clothing", "Baby Clothing"],
        "Footwear": ["Casual Shoes", "Formal Shoes", "Sports Shoes", "Sandals", "Slippers"],
        "Accessories": ["Bags", "Handbags", "Backpacks", "Watches", "Belts", "Sunglasses"]
    },
    "GROCERY & FMCG": {
        "Staples": ["Rice", "Basmati", "Local Rice", "Flour", "Lentils"],
        "Snacks": ["Chips", "Biscuits", "Noodles"],
        "Beverages": ["Tea", "Coffee", "Soft Drinks", "Juices"],
        "Dairy": ["Milk", "Butter", "Cheese", "Yogurt"],
        "Cooking Essentials": ["Oil", "Salt", "Sugar", "Spices"],
        "Household Supplies": ["Cleaning Products", "Detergents", "Toiletries"]
    },
    "HOME & LIVING": {
        "Furniture": ["Sofa", "Bed", "Tables", "Chairs"],
        "Kitchen Appliances": ["Refrigerator", "Microwave", "Blender", "Rice Cooker"],
        "Cookware": ["Pots", "Pans", "Pressure Cooker"],
        "Home Decor": ["Curtains", "Lighting", "Wall Art", "Clocks"],
        "Storage": ["Cabinets", "Boxes", "Shelves"]
    },
    "BEAUTY & PERSONAL CARE": {
        "Skincare": ["Face Wash", "Moisturizer", "Sunscreen"],
        "Haircare": ["Shampoo", "Conditioner", "Hair Oil"],
        "Makeup": ["Lipstick", "Foundation", "Kajal"],
        "Grooming": ["Razors", "Trimmers"],
        "Fragrance": ["Perfume", "Deodorant"]
    },
    "HEALTH & PHARMACY": {
        "Medicines": ["Pain Relief", "Cold & Flu", "Antibiotics"],
        "Medical Devices": ["Thermometer", "BP Monitor", "Glucometer"],
        "Supplements": ["Vitamins", "Protein"],
        "Baby Care": ["Diapers", "Baby Food"]
    },
    "SPORTS & FITNESS": {
        "Gym Equipment": ["Dumbbells", "Treadmills"],
        "Outdoor Sports": ["Football", "Cricket Kits"],
        "Fitness Accessories": ["Yoga Mats", "Gloves"]
    },
    "BOOKS & STATIONERY": {
        "Books": ["Academic", "Fiction", "Competitive Exams"],
        "Office Supplies": ["Pens", "Notebooks", "Files"],
        "School Supplies": ["Bags", "Geometry Sets"]
    },
    "HARDWARE & TOOLS": {
        "Electrical": ["Switches", "Wires", "Bulbs"],
        "Plumbing": ["Pipes", "Faucets"],
        "Construction Tools": ["Drill Machine", "Hammer"]
    },
    "AUTOMOTIVE": {
        "Bikes": ["Helmets", "Accessories"],
        "Cars": ["Seat Covers", "Mats"],
        "Spare Parts": ["Engine Parts", "Filters"]
    },
    "AGRICULTURE": {
        "Seeds": ["Vegetables", "Grains"],
        "Fertilizers": ["Organic", "Chemical"],
        "Tools": ["Sprayers", "Shovels"]
    },
    "PET SUPPLIES": {
        "Food": ["Dog Food", "Cat Food"],
        "Accessories": ["Collars", "Leashes"],
        "Grooming": ["Shampoo", "Brushes"]
    },
    "GIFTS & TOYS": {
        "Toys": ["Educational Toys", "Remote Control"],
        "Gifts": ["Hampers", "Personalized Gifts"]
    },
    "FOOD & RESTAURANT": {
        "Meals": ["Breakfast", "Lunch", "Dinner"],
        "Fast Food": ["Pizza", "Burger", "Momo"],
        "Desserts": ["Cakes", "Ice Cream"]
    },
    "SERVICES": {
        "Digital Services": ["Web Design", "Graphic Design", "SEO"],
        "Repair Services": ["Mobile Repair", "Laptop Repair"],
        "Home Services": ["Plumbing", "Electrician", "Cleaning"],
        "Education": ["Tuition", "Training"]
    }
}

def seed():
    print("Clearing global categories...")
    # This will cascade and delete subcategories and child categories as well
    ProductCategory.objects.all().delete()
    print("Categories cleared.")
    
    for cat_name, subcategories in DATA.items():
        cat = ProductCategory.objects.create(name=cat_name)
        print(f"Created Category: {cat_name}")
            
        for subcat_name, child_categories in subcategories.items():
            subcat = ProductSubcategory.objects.create(
                category=cat, 
                name=subcat_name,
                shop=None  # Global subcategory
            )
            print(f"  Created Subcategory: {subcat_name}")
                
            for child_name in child_categories:
                ProductChildCategory.objects.create(
                    subcategory=subcat,
                    name=child_name,
                    shop=None # Global child category
                )
                print(f"    Created Child Category: {child_name}")

if __name__ == "__main__":
    seed()
    print("Seeding complete.")
