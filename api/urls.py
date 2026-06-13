from django.urls import path, include
from rest_framework.routers import DefaultRouter
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from .views import (
    UserViewSet, ShopViewSet, ProductViewSet, ProductCategoryViewSet,
    ProductSubcategoryViewSet, ProductChildCategoryViewSet, BrandViewSet, ProductTagViewSet,
    OrderViewSet, ConversationViewSet, MessageViewSet, ShopKYCViewSet,
    ShopRoleViewSet, ShopSubAccountViewSet, ShopSettingsViewSet,
    ProductImageViewSet,
    ProductReviewViewSet, ShopReviewViewSet,
    UnifiedSearchView,
    ShopVoucherViewSet, ValidateVoucherView,
    SubscriptionPlanViewSet, ShopSubscriptionViewSet,
    AdminStatsView, AdminShopKYCViewSet, PlatformSettingsViewSet,
    ShopStatsView,
    api_root, RegisterView, LoginView,
    WishlistViewSet, ShopFollowViewSet, NotificationViewSet,
    CommissionRateViewSet, PayoutRequestViewSet, DisputeViewSet,
    ProvinceViewSet, DistrictViewSet, CityViewSet, WardViewSet,
    StreetViewSet, MarketHubViewSet, TradeTypeViewSet, ShopCategoryViewSet,
    ShopCategoryPermittedProductViewSet
)

schema_view = get_schema_view(
   openapi.Info(
      title="LocalConnect API",
      default_version='v1',
      description="API documentation for LocalConnect",
   ),
   public=True,
)


router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'shops', ShopViewSet)
router.register(r'products', ProductViewSet)
router.register(r'product-categories', ProductCategoryViewSet)
router.register(r'product-subcategories', ProductSubcategoryViewSet)
router.register(r'product-child-categories', ProductChildCategoryViewSet)
router.register(r'product-tags', ProductTagViewSet)
router.register(r'brands', BrandViewSet)
router.register(r'orders', OrderViewSet)
router.register(r'conversations', ConversationViewSet)
router.register(r'messages', MessageViewSet)
router.register(r'kyc', ShopKYCViewSet)
router.register(r'shop-roles', ShopRoleViewSet)
router.register(r'shop-subaccounts', ShopSubAccountViewSet)
router.register(r'shop-settings', ShopSettingsViewSet)
router.register(r'product-images', ProductImageViewSet)
router.register(r'product-reviews', ProductReviewViewSet)
router.register(r'shop-reviews', ShopReviewViewSet)
router.register(r'vouchers', ShopVoucherViewSet)
router.register(r'subscription-plans', SubscriptionPlanViewSet)
router.register(r'shop-subscriptions', ShopSubscriptionViewSet)
router.register(r'wishlist', WishlistViewSet, basename='wishlist')
router.register(r'shop-follows', ShopFollowViewSet, basename='shop-follows')
router.register(r'notifications', NotificationViewSet, basename='notifications')
router.register(r'admin/kyc', AdminShopKYCViewSet, basename='admin-kyc')
router.register(r'platform-settings', PlatformSettingsViewSet, basename='platform-settings')
router.register(r'commission-rates', CommissionRateViewSet, basename='commission-rates')
router.register(r'payout-requests', PayoutRequestViewSet, basename='payout-requests')
router.register(r'disputes', DisputeViewSet, basename='disputes')
router.register(r'provinces', ProvinceViewSet)
router.register(r'districts', DistrictViewSet)
router.register(r'cities', CityViewSet)
router.register(r'wards', WardViewSet)
router.register(r'streets', StreetViewSet)
router.register(r'market-hubs', MarketHubViewSet)
router.register(r'trade-types', TradeTypeViewSet)
router.register(r'shop-categories', ShopCategoryViewSet)
router.register(r'shop-category-permitted-products', ShopCategoryPermittedProductViewSet)

urlpatterns = [
    # path('', api_root, name='api-root'),
    path('login/', LoginView.as_view(), name='api_token_auth'),
    path('register/', RegisterView.as_view(), name='api_register'),
    path('search/', UnifiedSearchView.as_view(), name='unified_search'),
    path('vouchers/validate/', ValidateVoucherView.as_view(), name='validate_voucher'),
    path('admin/stats/', AdminStatsView.as_view(), name='admin_stats'),
    path('shop-stats/', ShopStatsView.as_view(), name='shop-stats'),
    path('', include(router.urls)),
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0)),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0)),
]