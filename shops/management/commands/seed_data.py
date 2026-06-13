from django.core.management.base import BaseCommand
from accounts.models import CustomUser
from shops.models import Shop, ShopCategory
from products.models import Product, ProductCategory

class Command(BaseCommand):
    help = 'Seeds the database with initial sample data for Local Connect Marketplace'

    def handle(self, *args, **kwargs):
        self.stdout.write('Seeding data...')

        # Clear existing data
        Product.objects.all().delete()
        ProductCategory.objects.all().delete()
        Shop.objects.all().delete()
        ShopCategory.objects.all().delete()
        CustomUser.objects.filter(username__in=['owner1', 'owner2', 'customer1']).delete()

        # Create Users
        owner1 = CustomUser.objects.create_user(username='owner1', email='owner1@test.com', password='password123', user_type=2)
        owner2 = CustomUser.objects.create_user(username='owner2', email='owner2@test.com', password='password123', user_type=2)
        customer1 = CustomUser.objects.create_user(username='customer1', email='customer1@test.com', password='password123', user_type=1)

        self.stdout.write('Created users.')

        # Create Shop Categories
        cat_electronics = ShopCategory.objects.create(name='Electronics & Gadgets', description='Tech stuff')
        cat_groceries = ShopCategory.objects.create(name='Groceries & Fresh Food', description='Daily needs')
        cat_clothing = ShopCategory.objects.create(name='Clothing & Apparel', description='Fashion')

        self.stdout.write('Created shop categories.')

        # Create Shops
        shop1 = Shop.objects.create(
            owner=owner1,
            name='Tech Haven',
            description='Your one-stop shop for all things tech and gadgets. Best prices guaranteed!',
            address='123 Digital Ave, Kathmandu',
            latitude=27.7172,
            longitude=85.3240,
            phone_number='9800000001'
        )

        shop2 = Shop.objects.create(
            owner=owner2,
            name='Fresh Mart Grocery',
            description='Fresh, organic, and locally sourced groceries delivered straight to your door.',
            address='456 Organic Lane, Patan',
            latitude=27.6644,
            longitude=85.3188,
            phone_number='9800000002'
        )

        shop3 = Shop.objects.create(
            owner=owner1,
            name='Urban Wear',
            description='Modern, stylish, and comfortable clothing for everyday wear.',
            address='789 Fashion St, Thamel',
            latitude=27.7153,
            longitude=85.3110,
            phone_number='9800000003'
        )

        self.stdout.write('Created shops.')

        # Create Product Categories
        pcat_phones = ProductCategory.objects.create(name='Smartphones')
        pcat_laptops = ProductCategory.objects.create(name='Laptops')
        pcat_fruits = ProductCategory.objects.create(name='Fruits')
        pcat_veg = ProductCategory.objects.create(name='Vegetables')
        pcat_shirts = ProductCategory.objects.create(name='T-Shirts')

        self.stdout.write('Created product categories.')

        # Create Products
        Product.objects.create(
            shop=shop1, category=pcat_phones, name='iPhone 15 Pro Max',
            description='The latest and greatest from Apple.', sku='IP15PM',
            price=1500.00, stock=10
        )
        Product.objects.create(
            shop=shop1, category=pcat_laptops, name='MacBook Air M2',
            description='Light, fast, and beautiful.', sku='MBA-M2',
            price=1200.00, stock=5
        )
        Product.objects.create(
            shop=shop1, category=pcat_phones, name='Samsung Galaxy S24 Ultra',
            description='Android flagship with incredible cameras.', sku='SGS24U',
            price=1400.00, stock=15
        )

        Product.objects.create(
            shop=shop2, category=pcat_fruits, name='Organic Apples (1kg)',
            description='Freshly picked apples from the Himalayas.', sku='APP-1KG',
            price=3.50, stock=50
        )
        Product.objects.create(
            shop=shop2, category=pcat_veg, name='Fresh Tomatoes (1kg)',
            description='Red, juicy, and perfect for salads.', sku='TOM-1KG',
            price=2.00, stock=100
        )

        Product.objects.create(
            shop=shop3, category=pcat_shirts, name='Classic White Tee',
            description='100% Cotton, extremely comfortable.', sku='CWT-M',
            price=15.99, stock=30
        )
        Product.objects.create(
            shop=shop3, category=pcat_shirts, name='Graphic Hoodie',
            description='Warm and stylish.', sku='GH-L',
            price=45.00, stock=20
        )

        self.stdout.write(self.style.SUCCESS('Successfully seeded database with sample data!'))
