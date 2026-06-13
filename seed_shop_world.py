import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'local_connect.settings')
django.setup()

from shops.models import Province, District, City, Ward, Street, MarketHub, TradeType, ShopCategory
from products.models import ProductCategory

def seed():
    # 1. Trade Types
    trade_types = [
        ('Wholesale', 'wholesale'),
        ('Retail', 'retail'),
        ('Direct Sourcing', 'sourcing'),
    ]
    for name, code in trade_types:
        TradeType.objects.get_or_create(name=name, code=code)
    print("Trade types seeded.")

    # 2. Shop Categories (Hierarchical)
    categories = {
        'Wholesalers': {
            'desc': 'Businesses that sell products in large quantities to retailers',
            'icon': 'Boxes',
            'subcategories': {
                'Wholesale Grocery': {'desc': 'Bulk food and beverage sourcing', 'icon': 'ShoppingBag'},
                'Wholesale Hardware': {'desc': 'Bulk tools, construction material', 'icon': 'Wrench'},
                'Wholesale Apparel': {'desc': 'Bulk garments and clothing items', 'icon': 'Shirt'},
            }
        },
        'Retailers': {
            'desc': 'Businesses selling products directly to end consumers',
            'icon': 'Store',
            'subcategories': {
                'Groceries & Daily Essentials': {'desc': 'Fresh food, household goods', 'icon': 'Apple'},
                'Medical & Pharmacy': {'desc': 'Medicines, supplements, clinical equipment', 'icon': 'Activity'},
                'Fashion & Clothing': {'desc': 'Ready-to-wear clothing and shoes', 'icon': 'Footprints'},
                'Hardware & Construction': {'desc': 'Paint, tools, cement, pipes', 'icon': 'Hammer'},
                'Electronics & Gadgets': {'desc': 'Smartphones, computers, appliances', 'icon': 'Tv'},
                'Furniture & Living': {'desc': 'Home decor and wooden furniture', 'icon': 'Sofa'},
                'Restaurants & Cafes': {'desc': 'Prepared food, drinks, bakery items', 'icon': 'Utensils'},
            }
        }
    }

    for cat_name, cat_info in categories.items():
        cat, _ = ShopCategory.objects.get_or_create(
            name=cat_name,
            defaults={'description': cat_info['desc'], 'icon': cat_info['icon']}
        )
        for sub_name, sub_info in cat_info['subcategories'].items():
            ShopCategory.objects.get_or_create(
                name=sub_name,
                parent=cat,
                defaults={'description': sub_info['desc'], 'icon': sub_info['icon']}
            )
    print("Hierarchical shop categories seeded.")

    # 3. Provinces, Districts, Cities, Wards, Streets, MarketHubs
    # Bagmati Province
    p_bagmati, _ = Province.objects.get_or_create(name='Bagmati Province')
    
    # Districts in Bagmati
    d_ktm, _ = District.objects.get_or_create(province=p_bagmati, name='Kathmandu')
    d_ltp, _ = District.objects.get_or_create(province=p_bagmati, name='Lalitpur')
    
    # Cities in Kathmandu
    c_ktm_metro, _ = City.objects.get_or_create(district=d_ktm, name='Kathmandu Metropolitan City', defaults={'city_type': 'metro'})
    # Lalitpur Metro
    c_ltp_metro, _ = City.objects.get_or_create(district=d_ltp, name='Lalitpur Metropolitan City', defaults={'city_type': 'metro'})

    # Wards
    for w_num in [1, 2, 3, 22, 23, 24, 25]:
        Ward.objects.get_or_create(city=c_ktm_metro, number=w_num)
    for w_num in [1, 2, 3, 10, 11]:
        Ward.objects.get_or_create(city=c_ltp_metro, number=w_num)
        
    # Streets in Kathmandu
    s_newroad, _ = Street.objects.get_or_create(city=c_ktm_metro, name='New Road')
    s_durbarmarg, _ = Street.objects.get_or_create(city=c_ktm_metro, name='Durbar Marg')
    s_lazimpat, _ = Street.objects.get_or_create(city=c_ktm_metro, name='Lazimpat')

    # Streets in Lalitpur
    s_pulchowk, _ = Street.objects.get_or_create(city=c_ltp_metro, name='Pulchowk')
    s_jhamsikhel, _ = Street.objects.get_or_create(city=c_ltp_metro, name='Jhamsikhel')

    # Market Hubs
    MarketHub.objects.get_or_create(
        name='Bishal Bazaar',
        city=c_ktm_metro,
        street=s_newroad,
        defaults={'description': 'Historic shopping mall in Kathmandu offering jewelry, clothing, and electronics.'}
    )
    MarketHub.objects.get_or_create(
        name='Ranjana Galli',
        city=c_ktm_metro,
        street=s_newroad,
        defaults={'description': 'Famous wholesale and retail clothing street in Kathmandu.'}
    )
    MarketHub.objects.get_or_create(
        name='Labim Mall',
        city=c_ltp_metro,
        street=s_pulchowk,
        defaults={'description': 'Premium modern shopping mall in Pulchowk, Lalitpur.'}
    )

    print("Geographical localizations seeded successfully.")

if __name__ == '__main__':
    seed()
