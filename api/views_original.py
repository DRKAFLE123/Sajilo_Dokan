from rest_framework import viewsets, permissions, status
from django.utils import timezone
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from rest_framework.reverse import reverse
from django.shortcuts import get_object_or_404
from accounts.models import CustomUser
from shops.models import Shop, Conversation, Message, ShopKYC, ShopReview, ShopVoucher, SubscriptionPlan, ShopSubscription, PlatformSettings
from products.models import Product, ProductCategory, ProductSubcategory, ProductChildCategory, Brand, ProductVariant, ProductImage, ProductTag, ProductReview
from orders.models import Order
from .serializers import (
    UserSerializer, ShopSerializer, ShopKYCSerializer, ProductSerializer,
    ProductCategorySerializer, ProductSubcategorySerializer, ProductChildCategorySerializer, BrandSerializer,
    ProductTagSerializer, ProductVariantSerializer, ProductImageSerializer, OrderSerializer,
    ConversationSerializer, MessageSerializer,
    ProductReviewSerializer, ShopReviewSerializer, ShopVoucherSerializer,
    SubscriptionPlanSerializer, ShopSubscriptionSerializer, PlatformSettingsSerializer
)

# API Root View (standalone function, not inside a class)
@api_view(['GET'])
def api_root(request, format=None):
    return Response({
        'users': reverse('user-list', request=request, format=format),
        'shops': reverse('shop-list', request=request, format=format),
        'products': reverse('product-list'

from rest_framework.views import APIView as _APIView  # already imported, but keep explicit
import math

def _haversine_km(lat1, lon1, lat2, lon2):
    """Return distance in km between two lat/lon points."""
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


class UnifiedSearchView(_APIView):
    """
    GET /api/search/?q=shoes&lat=27.7172&lng=85.3240&filter=delivery&radius=10&page=1&page_size=20

    Returns a ranked mixed feed of Products + Shops.

    Scoring formula
    ---------------
    Score = (Relevance × 0.40)
           + (Distance  × 0.25)   # only when lat/lng provided
           + (Rating    × 0.20)
           + (Popularity× 0.10)
           + (Availability × 0.05)

    All sub-scores are normalised to [0, 1].
    """
    permission_classes = [permissions.AllowAny]

    # ── helpers ────────────────────────────────────────────────
    @staticmethod
    def _relevance(obj, q: str) -> float:
        """Simple keyword relevance: exact name match = 1.0, partial = 0.6, desc only = 0.3."""
        if not q:
            return 1.0
        q = q.lower()
        name = getattr(obj, 'name', '').lower()
        desc = getattr(obj, 'description', '').lower()
        if q == name:
            return 1.0
        if q in name:
            return 0.8
        if any(w in name for w in q.split()):
            return 0.6
        if q in desc:
            return 0.3
        return 0.1

    @staticmethod
    def _distance_score(km: float | None) -> float:
        """Closer = higher score. Returns 1.0 when km is None (no location filter)."""
        if km is None:
            return 0.5  # neutral when no location given
        if km <= 1:
            return 1.0
        if km >= 50:
            return 0.0
        return max(0.0, 1.0 - (km / 50))

    @staticmethod
    def _rating_score(avg_rating) -> float:
        """Normalise 0-5 star rating to [0, 1]."""
        try:
            return float(avg_rating) / 5.0
        except (TypeError, ValueError):
            return 0.0

    @staticmethod
    def _popularity_score(obj) -> float:
        """Use views + featured/sponsored flags."""
        views = getattr(obj, 'views', 0) or 0
        bonus = 0.2 if getattr(obj, 'is_featured', False) else 0.0
        bonus += 0.1 if getattr(obj, 'is_sponsored', False) else 0.0
        # cap views contribution at 0.7
        return min(0.7, views / max(views + 100, 1)) + bonus

    @staticmethod
    def _availability_score(obj) -> float:
        """For products: stock > 0. For shops: always available."""
        stock = getattr(obj, 'sto
        recent_orders = OrderSerializer(Order.objects.filter(shop=shop).order_by('-created_at')[:5], many=True).data

        return Response({
            'total_revenue': total_revenue,
            'new_orders': new_orders,
            'pending_orders': pending_orders,
            'low_stock_count': low_stock_count,
            'recent_orders': recent_orders
        })

class PlatformSettingsViewSet(viewsets.ModelViewSet):
    queryset = PlatformSettings.objects.all()
    serializer_class = PlatformSettingsSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_object(self):
        # Always return the singleton instance
        obj, created = PlatformSettings.objects.get_or_create(id=1)
        return obj

    @action(detail=False, methods=['get', 'patch'])
    def global_settings(self, request):
        obj = self.get_object()
        if request.method == 'GET':
            serializer = self.get_serializer(obj)
            return Response(serializer.data)
        
        serializer = self.get_serializer(obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


    def toggle_featured(self, request, pk=None):
        shop = self.get_object()
        shop.is_featured = not shop.is_featured
        shop.save(update_fields=['is_featured'])
        return Response({'is_featured': shop.is_featured})
