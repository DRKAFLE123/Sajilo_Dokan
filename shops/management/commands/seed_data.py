from django.core.management.base import BaseCommand
from accounts.models import CustomUser
from shops.models import Shop, ShopCategory, Province, District, City, Ward, Street, MarketHub, TradeType
from products.models import Product, ProductCategory, ProductSubcategory, ProductChildCategory

class Command(BaseCommand):
    help = 'Seeds the database with initial sample data for Local Connect Marketplace'

    def handle(self, *args, **kwargs):
        self.stdout.write('Seeding data...')

        # Clear existing transactional data (preserve categories, provinces, districts, etc.)
        Product.objects.all().delete()
        Shop.objects.all().delete()
        
        # Clear specific users
        CustomUser.objects.filter(username__in=['owner1', 'owner2', 'customer1']).delete()

        # Create Users
        owner1 = CustomUser.objects.create_user(username='owner1', email='owner1@test.com', password='password123', user_type=2)
        owner2 = CustomUser.objects.create_user(username='owner2', email='owner2@test.com', password='password123', user_type=2)
        customer1 = CustomUser.objects.create_user(username='customer1', email='customer1@test.com', password='password123', user_type=1)

        self.stdout.write('Created users.')

        # Retrieve geographic entities (Bagmati, KTM, Lalitpur)
        try:
            province_bagmati = Province.objects.get(name='Bagmati Province')
            dist_ktm = District.objects.get(name='Kathmandu')
            dist_ltp = District.objects.get(name='Lalitpur')
            city_ktm = City.objects.get(name='Kathmandu Metropolitan City')
            city_ltp = City.objects.get(name='Lalitpur Metropolitan City')
            street_newroad = Street.objects.get(name='New Road')
            street_jhamsikhel = Street.objects.get(name='Jhamsikhel')
            hub_bishalbazaar = MarketHub.objects.get(name='Bishal Bazaar')
            hub_ranjanagalli = MarketHub.objects.get(name='Ranjana Galli')
            trade_retail = TradeType.objects.get(code='retail')
        except Exception as e:
            self.stdout.write(self.style.WARNING(f'Geographic references not found. Please run seed_shop_world.py first. Error: {e}'))
            return

        # Retrieve/Get-or-Create Shop Categories (hierarchical)
        cat_retailers, _ = ShopCategory.objects.get_or_create(name='Retailers')
        
        cat_electronics, _ = ShopCategory.objects.get_or_create(
            name='Electronics & Gadgets', parent=cat_retailers, 
            defaults={'description': 'Smartphones, computers, appliances', 'icon': 'Tv'}
        )
        cat_groceries, _ = ShopCategory.objects.get_or_create(
            name='Groceries & Daily Essentials', parent=cat_retailers,
            defaults={'description': 'Fresh food, household goods', 'icon': 'Apple'}
        )
        cat_clothing, _ = ShopCategory.objects.get_or_create(
            name='Fashion & Clothing', parent=cat_retailers,
            defaults={'description': 'Ready-to-wear clothing and shoes', 'icon': 'Footprints'}
        )

        self.stdout.write('Retrieved/Created shop categories.')

        # Create Shops
        shop1 = Shop.objects.create(
            owner=owner1,
            name='Tech Haven',
            description='Your one-stop shop for all things tech and gadgets. Best prices guaranteed!',
            address='Bishal Bazaar, New Road, Kathmandu',
            latitude=27.7043,
            longitude=85.3112,
            phone_number='9800000001',
            category=cat_electronics,
            province=province_bagmati,
            district=dist_ktm,
            city=city_ktm,
            street=street_newroad,
            market_hub=hub_bishalbazaar,
            business_type='electronics'
        )
        shop1.trade_types.add(trade_retail)

        shop2 = Shop.objects.create(
            owner=owner2,
            name='Fresh Mart Grocery',
            description='Fresh, organic, and locally sourced groceries delivered straight to your door.',
            address='Jhamsikhel, Lalitpur',
            latitude=27.6784,
            longitude=85.3101,
            phone_number='9800000002',
            category=cat_groceries,
            province=province_bagmati,
            district=dist_ltp,
            city=city_ltp,
            street=street_jhamsikhel,
            business_type='grocery'
        )
        shop2.trade_types.add(trade_retail)

        shop3 = Shop.objects.create(
            owner=owner1,
            name='Urban Wear',
            description='Modern, stylish, and comfortable clothing for everyday wear.',
            address='Ranjana Galli, New Road, Kathmandu',
            latitude=27.7051,
            longitude=85.3120,
            phone_number='9800000003',
            category=cat_clothing,
            province=province_bagmati,
            district=dist_ktm,
            city=city_ktm,
            street=street_newroad,
            market_hub=hub_ranjanagalli,
            business_type='fashion'
        )
        shop3.trade_types.add(trade_retail)

        self.stdout.write('Created shops with localization.')

        # Retrieve product categories, subcategories, and child categories
        pcat_elec = ProductCategory.objects.get(name='ELECTRONICS')
        pcat_fashion = ProductCategory.objects.get(name='FASHION & APPAREL')
        pcat_grocery = ProductCategory.objects.get(name='GROCERY & FMCG')

        sub_phones = ProductSubcategory.objects.get(category=pcat_elec, name='Mobile & Tablets')
        child_smartphones = ProductChildCategory.objects.get(subcategory=sub_phones, name='Smartphones')

        sub_computers = ProductSubcategory.objects.get(category=pcat_elec, name='Computers')
        child_laptops = ProductChildCategory.objects.get(subcategory=sub_computers, name='Laptops')

        sub_men = ProductSubcategory.objects.get(category=pcat_fashion, name='Men')
        child_tshirts = ProductChildCategory.objects.get(subcategory=sub_men, name='T-Shirts')
        child_jackets = ProductChildCategory.objects.get(subcategory=sub_men, name='Jackets')

        # Get-or-Create Fresh Produce under Grocery
        sub_fresh, _ = ProductSubcategory.objects.get_or_create(category=pcat_grocery, name='Fresh Produce')
        child_fruits, _ = ProductChildCategory.objects.get_or_create(subcategory=sub_fresh, name='Fruits')
        child_veg, _ = ProductChildCategory.objects.get_or_create(subcategory=sub_fresh, name='Vegetables')

        self.stdout.write('Retrieved product categories taxonomy.')

        # Create Products using correct field names (selling_price, stock_quantity)
        Product.objects.create(
            shop=shop1, category=pcat_elec, subcategory=sub_phones, child_category=child_smartphones,
            name='iPhone 15 Pro Max', description='The latest and greatest from Apple.', sku='IP15PM',
            selling_price=150000.00, stock_quantity=10, moderation_status='approved'
        )
        Product.objects.create(
            shop=shop1, category=pcat_elec, subcategory=sub_computers, child_category=child_laptops,
            name='MacBook Air M2', description='Light, fast, and beautiful.', sku='MBA-M2',
            selling_price=165000.00, stock_quantity=5, moderation_status='approved'
        )
        Product.objects.create(
            shop=shop1, category=pcat_elec, subcategory=sub_phones, child_category=child_smartphones,
            name='Samsung Galaxy S24 Ultra', description='Android flagship with incredible cameras.', sku='SGS24U',
            selling_price=175000.00, stock_quantity=15, moderation_status='approved'
        )

        Product.objects.create(
            shop=shop2, category=pcat_grocery, subcategory=sub_fresh, child_category=child_fruits,
            name='Organic Apples (1kg)', description='Freshly picked apples from Mustang, Nepal.', sku='APP-1KG',
            selling_price=350.00, stock_quantity=50, moderation_status='approved'
        )
        Product.objects.create(
            shop=shop2, category=pcat_grocery, subcategory=sub_fresh, child_category=child_veg,
            name='Fresh Tomatoes (1kg)', description='Red, juicy, and perfect for salads.', sku='TOM-1KG',
            selling_price=120.00, stock_quantity=100, moderation_status='approved'
        )

        Product.objects.create(
            shop=shop3, category=pcat_fashion, subcategory=sub_men, child_category=child_tshirts,
            name='Classic White Tee', description='100% Cotton, extremely comfortable.', sku='CWT-M',
            selling_price=1200.00, stock_quantity=30, moderation_status='approved'
        )
        Product.objects.create(
            shop=shop3, category=pcat_fashion, subcategory=sub_men, child_category=child_jackets,
            name='Graphic Hoodie', description='Warm and stylish.', sku='GH-L',
            selling_price=3500.00, stock_quantity=20, moderation_status='approved'
        )

        self.stdout.write(self.style.SUCCESS('Successfully seeded database with localized shop and product data!'))

