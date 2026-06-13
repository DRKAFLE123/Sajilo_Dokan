from django.core.management.base import BaseCommand
from shops.models import SubscriptionPlan


class Command(BaseCommand):
    help = "Seed default subscription plans (Free, Pro, Premium)"

    def handle(self, *args, **options):
        plans = [
            {
                "name": "Free",
                "price_monthly": "0.00",
                "product_limit": 20,
                "features": ["Up to 20 products", "Basic shop listing", "Customer messaging"],
            },
            {
                "name": "Pro",
                "price_monthly": "999.00",
                "product_limit": 200,
                "features": [
                    "Up to 200 products",
                    "Priority Listing",
                    "Marketing Tools",
                    "Verified Badge",
                    "Analytics Dashboard",
                ],
            },
            {
                "name": "Premium",
                "price_monthly": "2499.00",
                "product_limit": 0,
                "features": [
                    "Unlimited Products",
                    "Top Priority Listing",
                    "Marketing Tools",
                    "Verified Badge",
                    "Analytics Dashboard",
                    "Custom Promotions",
                    "Dedicated Customer Support",
                ],
            },
        ]

        for plan_data in plans:
            obj, created = SubscriptionPlan.objects.get_or_create(
                name=plan_data["name"],
                defaults=plan_data,
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"  [OK] Created plan: {obj.name}"))
            else:
                self.stdout.write(f"  – Plan already exists: {obj.name}")

        self.stdout.write(self.style.SUCCESS("Done. Subscription plans are ready."))
