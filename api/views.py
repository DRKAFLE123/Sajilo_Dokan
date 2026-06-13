from rest_framework import viewsets, permissions, status
from django.utils import timezone
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from rest_framework.reverse import reverse
from django.shortcuts import get_object_or_404
from accounts.models import CustomUser
from shops.models import (
    Shop, Conversation, Message, ShopKYC, ShopReview, ShopVoucher, SubscriptionPlan, 
    ShopSubscription, PlatformSettings, ShopRole, ShopSubAccount, ShopSettings, 
    Wishlist, ShopFollow, Notification, CommissionRate, PayoutRequest,
    Province, District, City, Ward, Street, MarketHub, TradeType, ShopCategory, ShopCategoryPermittedProduct
)
from products.models import Product, ProductCategory, ProductSubcategory, ProductChildCategory, Brand, ProductVariant, ProductImage, ProductTag, ProductReview
from orders.models import Order, Dispute
from .serializers import (
    UserSerializer, ShopSerializer, ShopKYCSerializer, ProductSerializer,
    ProductCategorySerializer, ProductSubcategorySerializer, ProductChildCategorySerializer, BrandSerializer,
    ProductTagSerializer, ProductVariantSerializer, ProductImageSerializer, OrderSerializer,
    ConversationSerializer, MessageSerializer,
    ProductReviewSerializer, ShopReviewSerializer, ShopVoucherSerializer,
    SubscriptionPlanSerializer, ShopSubscriptionSerializer, PlatformSettingsSerializer,
    ShopRoleSerializer, ShopSubAccountSerializer, ShopSettingsSerializer,
    WishlistSerializer, ShopFollowSerializer, NotificationSerializer,
    CommissionRateSerializer, PayoutRequestSerializer, DisputeSerializer,
    ProvinceSerializer, DistrictSerializer, CitySerializer, WardSerializer,
    StreetSerializer, MarketHubSerializer, TradeTypeSerializer, ShopCategorySerializer,
    ShopCategoryPermittedProductSerializer
)


# API Root View (standalone function, not inside a class)
@api_view(['GET'])
def api_root(request, format=None):
    return Response({
        'users': reverse('user-list', request=request, format=format),
        'shops': reverse('shop-list', request=request, format=format),
        'products': reverse('product-list', request=request, format=format),
        'orders': reverse('order-list', request=request, format=format),
        'conversations': reverse('conversation-list', request=request, format=format),
        'messages': reverse('message-list', request=request, format=format),
    })

class UserViewSet(viewsets.ModelViewSet):
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    
    def get_permissions(self):
        if self.action == 'me':
            return [permissions.IsAuthenticated()]
        return [permissions.IsAdminUser()]

    @action(detail=False, methods=['get', 'put', 'patch'], url_path='me')
    def me(self, request):
        if request.method == 'GET':
            serializer = self.get_serializer(request.user)
            return Response(serializer.data)
        
        serializer = self.get_serializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        user = self.get_object()
        user.is_active = not user.is_active
        user.save(update_fields=['is_active'])
        return Response({'status': 'active' if user.is_active else 'suspended', 'is_active': user.is_active})

    @action(detail=True, methods=['post'])
    def toggle_verified(self, request, pk=None):
        user = self.get_object()
        user.is_verified = not user.is_verified
        user.save(update_fields=['is_verified'])
        return Response({'status': 'verified' if user.is_verified else 'unverified', 'is_verified': user.is_verified})

class ShopViewSet(viewsets.ModelViewSet):
    queryset = Shop.objects.select_related(
        'owner', 'province', 'district', 'city', 'ward', 'street', 'market_hub', 'category', 'kyc'
    ).prefetch_related('trade_types')
    serializer_class = ShopSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'my_shop']:
            self.permission_classes = [permissions.IsAuthenticated]
        else:
            self.permission_classes = [permissions.AllowAny]
        return super().get_permissions()
    
    def get_queryset(self):
        queryset = super().get_queryset()
        is_featured = self.request.query_params.get('is_featured')
        is_sponsored = self.request.query_params.get('is_sponsored')
        sort = self.request.query_params.get('sort')
        
        category = self.request.query_params.get('category')
        province = self.request.query_params.get('province')
        district = self.request.query_params.get('district')
        city = self.request.query_params.get('city')
        ward = self.request.query_params.get('ward')
        street = self.request.query_params.get('street')
        market_hub = self.request.query_params.get('market_hub')
        trade_type = self.request.query_params.get('trade_type')

        if category:
            queryset = queryset.filter(category_id=category)
        if province:
            queryset = queryset.filter(province_id=province)
        if district:
            queryset = queryset.filter(district_id=district)
        if city:
            queryset = queryset.filter(city_id=city)
        if ward:
            queryset = queryset.filter(ward_id=ward)
        if street:
            queryset = queryset.filter(street_id=street)
        if market_hub:
            queryset = queryset.filter(market_hub_id=market_hub)
        if trade_type:
            queryset = queryset.filter(trade_types__code=trade_type)

        if is_featured:
            queryset = queryset.filter(is_featured=is_featured.lower() == 'true')
        if is_sponsored:
            queryset = queryset.filter(is_sponsored=is_sponsored.lower() == 'true')
            
        if sort == 'featured':
            queryset = queryset.order_by('-is_featured', '-created_at')
        elif sort == 'newest':
            queryset = queryset.order_by('-created_at')
        else:
            queryset = queryset.order_by('-created_at')
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def perform_update(self, serializer):
        if serializer.instance.owner != self.request.user and not self.request.user.is_staff:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not have permission to edit this shop.")
        serializer.save()

    @action(detail=False, methods=['get'], url_path='my_shop')
    def my_shop(self, request):
        shop = self.queryset.filter(owner=request.user).first()
        if not shop:
            return Response({'detail': 'No shop found for this user.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = self.get_serializer(shop)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def toggle_featured(self, request, pk=None):
        shop = self.get_object()
        shop.is_featured = not shop.is_featured
        shop.save(update_fields=['is_featured'])
        return Response({'is_featured': shop.is_featured})

    @action(detail=True, methods=['post'], url_path='request-promotion')
    def request_promotion(self, request, pk=None):
        shop = self.get_object()
        if shop.owner != request.user and not request.user.is_staff:
            return Response({'detail': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
        
        promo_type = request.data.get('type', 'featured')
        admins = CustomUser.objects.filter(is_staff=True)
        for admin in admins:
            Notification.objects.create(
                user=admin,
                title="Shop Promotion Request",
                message=f"Shop '{shop.name}' has requested {promo_type.upper()} placement.",
                link="/saas-admin/shops"
            )
        return Response({'status': 'requested'})


class WishlistViewSet(viewsets.ModelViewSet):
    queryset = Wishlist.objects.all()
    serializer_class = WishlistSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        product_id = request.data.get('product')
        if not product_id:
            return Response({'error': 'product ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        wishlist_item = Wishlist.objects.filter(user=request.user, product_id=product_id).first()
        if wishlist_item:
            wishlist_item.delete()
            return Response({'status': 'removed', 'wishlisted': False}, status=status.HTTP_200_OK)
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user)
        return Response({'status': 'added', 'wishlisted': True, 'data': serializer.data}, status=status.HTTP_201_CREATED)

class ShopFollowViewSet(viewsets.ModelViewSet):
    queryset = ShopFollow.objects.all()
    serializer_class = ShopFollowSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        shop_id = request.data.get('shop')
        if not shop_id:
            return Response({'error': 'shop ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        follow_item = ShopFollow.objects.filter(user=request.user, shop_id=shop_id).first()
        if follow_item:
            follow_item.delete()
            return Response({'status': 'unfollowed', 'following': False}, status=status.HTTP_200_OK)
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user)
        return Response({'status': 'followed', 'following': True, 'data': serializer.data}, status=status.HTTP_201_CREATED)

class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user).order_by('-created_at')

    @action(detail=True, methods=['post'], url_path='mark_read')
    def mark_read(self, request, pk=None):
        notif = self.get_object()
        notif.is_read = True
        notif.save(update_fields=['is_read'])
        return Response({'status': 'marked as read'})

    @action(detail=False, methods=['post'], url_path='mark_all_read')
    def mark_all_read(self, request):
        self.get_queryset().filter(is_read=False).update(is_read=True)
        return Response({'status': 'all marked as read'})

class ProductTagViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ProductTag.objects.all()
    serializer_class = ProductTagSerializer
    permission_classes = [permissions.AllowAny]

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related(
        'shop', 'category', 'subcategory', 'child_category', 'brand'
    ).prefetch_related('tags', 'variants', 'images')
    serializer_class = ProductSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            self.permission_classes = [permissions.IsAuthenticated]
        else:
            self.permission_classes = [permissions.AllowAny]
        return super().get_permissions()
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def approve(self, request, pk=None):
        product = self.get_object()
        product.moderation_status = 'approved'
        product.admin_notes = request.data.get('notes', '')
        product.save(update_fields=['moderation_status', 'admin_notes'])
        return Response({'status': 'approved'})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def reject(self, request, pk=None):
        product = self.get_object()
        product.moderation_status = 'rejected'
        product.admin_notes = request.data.get('notes', '')
        product.save(update_fields=['moderation_status', 'admin_notes'])
        return Response({'status': 'rejected'})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def toggle_featured(self, request, pk=None):
        product = self.get_object()
        product.is_featured = not product.is_featured
        product.save(update_fields=['is_featured'])
        return Response({'is_featured': product.is_featured})
    
    def get_queryset(self):
        from django.db.models import Q
        queryset = super().get_queryset()
        
        # Moderation logic: Staff sees all, others see only approved (plus their own products)
        if not self.request.user.is_staff:
            if self.request.user.is_authenticated:
                queryset = queryset.filter(Q(moderation_status='approved') | Q(shop__owner=self.request.user))
            else:
                queryset = queryset.filter(moderation_status='approved')

        shop_id = self.request.query_params.get('shop_id')
        category_id = self.request.query_params.get('category_id')
        subcategory_id = self.request.query_params.get('subcategory_id')
        child_category_id = self.request.query_params.get('child_category_id')
        search = self.request.query_params.get('search')
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        is_featured = self.request.query_params.get('is_featured')
        is_sponsored = self.request.query_params.get('is_sponsored')
        moderation_status = self.request.query_params.get('moderation_status')
        sort = self.request.query_params.get('sort')
        
        if shop_id:
            queryset = queryset.filter(shop_id=shop_id)
        if moderation_status:
            queryset = queryset.filter(moderation_status=moderation_status)
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        if subcategory_id:
            queryset = queryset.filter(subcategory_id=subcategory_id)
        if child_category_id:
            queryset = queryset.filter(child_category_id=child_category_id)
        if search:
            queryset = queryset.filter(Q(name__icontains=search) | Q(description__icontains=search))
        if min_price:
            queryset = queryset.filter(selling_price__gte=min_price)
        if max_price:
            queryset = queryset.filter(selling_price__lte=max_price)
        if is_featured:
            queryset = queryset.filter(is_featured=is_featured.lower() == 'true')
        if is_sponsored:
            queryset = queryset.filter(is_sponsored=is_sponsored.lower() == 'true')
            
        if sort == 'price_asc':
            queryset = queryset.order_by('selling_price')
        elif sort == 'price_desc':
            queryset = queryset.order_by('-selling_price')
        elif sort == 'newest':
            queryset = queryset.order_by('-created_at')
        elif sort == 'featured':
            queryset = queryset.order_by('-is_featured', '-is_sponsored', '-created_at')
        else:
            queryset = queryset.order_by('-created_at')
            
        return queryset

    def perform_create(self, serializer):
        shop = Shop.objects.filter(owner=self.request.user).order_by('-created_at').first()
        if not shop:
            from rest_framework.exceptions import ValidationError
            raise ValidationError('You must create a shop before adding products.')
        
        # Subscription Enforcement
        try:
            sub = shop.subscription
            if sub.status == 'active' and sub.plan:
                limit = sub.plan.product_limit
                if limit > 0:
                    current_count = Product.objects.filter(shop=shop).count()
                    if current_count >= limit:
                        from rest_framework.exceptions import ValidationError
                        raise ValidationError(f"Product limit reached ({limit}). Please upgrade your plan.")
        except:
            current_count = Product.objects.filter(shop=shop).count()
            if current_count >= 5:
                from rest_framework.exceptions import ValidationError
                raise ValidationError("Free trial limit reached (5 products). Please choose a subscription plan.")
        
        # Calculate initial content score
        score = 0
        data = self.request.data
        if data.get('name'): score += 10
        if data.get('category'): score += 10
        if data.get('subcategory'): score += 10
        if data.get('description'): score += 20
        if data.get('highlights'): score += 10
        if data.get('brand'): score += 10
        if data.get('package_weight'): score += 10
        
        # Check if auto-approval is enabled
        from shops.models import PlatformSettings
        settings = PlatformSettings.objects.first()
        mod_status = 'pending'
        if settings and not settings.product_approval_required:
            mod_status = 'approved'

        serializer.save(shop=shop, content_score=score, moderation_status=mod_status)

    def perform_update(self, serializer):
        if serializer.instance.shop.owner != self.request.user and not self.request.user.is_staff:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not have permission to edit this product.")
        serializer.save()

class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = self.queryset.order_by('-created_at')
        if self.request.user.is_shop_owner:
            queryset = queryset.filter(shop__owner=self.request.user)
        else:
            queryset = queryset.filter(customer=self.request.user)
        
        # Filters
        status = self.request.query_params.get('status')
        order_type = self.request.query_params.get('order_type')
        payment_method = self.request.query_params.get('payment_method')
        payment_status = self.request.query_params.get('payment_status')
        
        if status: queryset = queryset.filter(status=status)
        if order_type: queryset = queryset.filter(order_type=order_type)
        if payment_method: queryset = queryset.filter(payment_method=payment_method)
        if payment_status: queryset = queryset.filter(payment_status=payment_status)
        
        return queryset
    
    def perform_create(self, serializer):
        order = serializer.save(customer=self.request.user)
        try:
            from api.email_utils import send_order_confirmation
            send_order_confirmation(order)
        except Exception:
            pass
        try:
            Notification.objects.create(
                user=order.shop.owner,
                title="New Order Received",
                message=f"You have received a new order #{order.id} for NPR {order.total}.",
                link=f"/dashboard/orders"
            )
        except Exception:
            pass

    @action(detail=True, methods=['patch'], url_path='update-status')
    def update_status(self, request, pk=None):
        order = self.get_object()
        if order.shop.owner != request.user and not request.user.is_staff:
            return Response({'detail': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
        
        status_val = request.data.get('status')
        payment_status_val = request.data.get('payment_status')
        
        old_status = order.status
        
        if status_val and status_val != old_status:
            active_statuses = ['pending', 'confirmed', 'packed', 'shipped', 'delivered', 'completed']
            cancelled_statuses = ['cancelled', 'returned']
            
            # Transitioning from active to cancelled/returned -> restore stock and voucher count
            if old_status in active_statuses and status_val in cancelled_statuses:
                for item in order.items.all():
                    product = item.product
                    product.stock_quantity += item.quantity
                    product.save(update_fields=['stock_quantity'])
                if order.voucher:
                    order.voucher.used_count = max(0, order.voucher.used_count - 1)
                    order.voucher.save(update_fields=['used_count'])
            
            # Transitioning from cancelled/returned back to active -> deduct stock and increment voucher count
            elif old_status in cancelled_statuses and status_val in active_statuses:
                if order.voucher and order.voucher.used_count >= order.voucher.max_uses:
                    from rest_framework.exceptions import ValidationError
                    raise ValidationError("Cannot restore order. The voucher used in this order has reached its maximum usage limit.")
                
                for item in order.items.all():
                    product = item.product
                    if product.stock_quantity < item.quantity:
                        from rest_framework.exceptions import ValidationError
                        raise ValidationError(f"Cannot restore order. Insufficient stock for '{product.name}'. Only {product.stock_quantity} available.")
                
                for item in order.items.all():
                    product = item.product
                    product.stock_quantity -= item.quantity
                    product.save(update_fields=['stock_quantity'])
                if order.voucher:
                    order.voucher.used_count += 1
                    order.voucher.save(update_fields=['used_count'])
            
            order.status = status_val
            
            if status_val == 'completed' and old_status != 'completed':
                try:
                    platform_settings = PlatformSettings.objects.get(id=1)
                    default_rate = platform_settings.default_commission_rate
                except Exception:
                    default_rate = 10.00
                
                item_totals = []
                sum_of_item_totals = 0
                for item in order.items.all():
                    sub = float(item.price * item.quantity)
                    item_totals.append((item, sub))
                    sum_of_item_totals += sub

                total_commission_amount = 0
                if sum_of_item_totals > 0:
                    for item, sub in item_totals:
                        try:
                            rate_obj = CommissionRate.objects.get(category=item.product.category)
                            rate = rate_obj.rate_percent
                        except Exception:
                            rate = default_rate
                        
                        item_share_ratio = sub / sum_of_item_totals
                        item_final_price = item_share_ratio * float(order.total)
                        item_commission = item_final_price * float(rate / 100)
                        total_commission_amount += item_commission
                    
                    order.commission_amount = total_commission_amount
                    order.commission_rate = (total_commission_amount / float(order.total)) * 100 if float(order.total) > 0 else 0
                else:
                    order.commission_rate = default_rate
                    order.commission_amount = 0
            
            elif status_val in ['cancelled', 'returned']:
                order.commission_amount = 0
                order.commission_rate = 0

            try:
                from api.email_utils import send_order_status_update
                send_order_status_update(order)
            except Exception:
                pass
            try:
                Notification.objects.create(
                    user=order.customer,
                    title="Order Status Updated",
                    message=f"Your order #{order.id} status has been updated to: {order.get_status_display().upper()}.",
                    link=f"/orders"
                )
            except Exception:
                pass
            
        if payment_status_val: 
            order.payment_status = payment_status_val
        
        order.save()
        return Response(self.get_serializer(order).data)

    @action(detail=True, methods=['post'], url_path='initiate-khalti')
    def initiate_khalti(self, request, pk=None):
        order = self.get_object()
        if order.customer != request.user:
            return Response({'detail': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
            
        import requests
        from django.conf import settings
        
        khalti_url = "https://a.khalti.com/api/v2/epayment/initiate/"
        return_url = request.data.get('return_url', 'http://localhost:3000/orders/payment-callback')
        website_url = request.data.get('website_url', 'http://localhost:3000')
        
        headers = {
            'Authorization': getattr(settings, 'KHALTI_SECRET_KEY', 'Key 802897a5f4d54ac0a1dbbe4db61f1d17'),
            'Content-Type': 'application/json',
        }
        
        # Amount in paisa
        amount_paisa = int(float(order.total) * 100)
        
        payload = {
            "return_url": return_url,
            "website_url": website_url,
            "amount": amount_paisa,
            "purchase_order_id": str(order.id),
            "purchase_order_name": f"Sajilo Dokan Order #{order.id}",
            "customer_info": {
                "name": order.full_name or request.user.username,
                "email": request.user.email or "customer@example.com",
                "phone": order.phone_number or "9800000000"
            }
        }
        
        try:
            response = requests.post(khalti_url, headers=headers, json=payload)
            data = response.json()
            if response.status_code == 200:
                return Response({
                    'payment_url': data.get('payment_url'),
                    'pidx': data.get('pidx')
                })
            else:
                return Response({'detail': 'Khalti initiation failed', 'error': data}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'detail': f'Error connecting to Khalti: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'], url_path='verify-khalti')
    def verify_khalti(self, request, pk=None):
        order = self.get_object()
        pidx = request.data.get('pidx')
        if not pidx:
            return Response({'detail': 'pidx is required'}, status=status.HTTP_400_BAD_REQUEST)
            
        import requests
        from django.conf import settings
        
        khalti_verify_url = "https://a.khalti.com/api/v2/epayment/lookup/"
        headers = {
            'Authorization': getattr(settings, 'KHALTI_SECRET_KEY', 'Key 802897a5f4d54ac0a1dbbe4db61f1d17'),
            'Content-Type': 'application/json',
        }
        payload = {
            "pidx": pidx
        }
        
        try:
            response = requests.post(khalti_verify_url, headers=headers, json=payload)
            data = response.json()
            if response.status_code == 200 and data.get('status') == 'Completed':
                order.payment_status = 'paid'
                order.save()
                return Response({
                    'status': 'success',
                    'detail': 'Payment verified successfully',
                    'order': OrderSerializer(order).data
                })
            else:
                return Response({
                    'status': 'failed',
                    'detail': 'Payment verification failed',
                    'error': data
                }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'detail': f'Error connecting to Khalti: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['get'], url_path='invoice')
    def download_invoice(self, request, pk=None):
        order = self.get_object()
        
        # Build PDF response
        from django.http import HttpResponse
        from io import BytesIO
        from reportlab.lib.pagesizes import letter
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib import colors
        
        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )
        
        story = []
        styles = getSampleStyleSheet()
        
        # Define modern styles
        title_style = ParagraphStyle(
            'InvoiceTitle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=24,
            leading=28,
            textColor=colors.HexColor('#5C2D91')  # Branding color
        )
        
        normal_style = ParagraphStyle(
            'NormalText',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9,
            leading=13,
            textColor=colors.HexColor('#4B5563')
        )
        
        bold_style = ParagraphStyle(
            'BoldText',
            parent=normal_style,
            fontName='Helvetica-Bold',
            textColor=colors.HexColor('#111827')
        )

        story.append(Paragraph("INVOICE", title_style))
        story.append(Spacer(1, 15))

        # Invoice Header Table (Shop details vs Invoice Details)
        shop = order.shop
        trust_status = "Unverified"
        if shop.verification_tier == 'business_verified':
            trust_status = "Business Verified"
        elif shop.verification_tier == 'personal_verified':
            trust_status = "Identity Verified"
        elif shop.is_verified:
            trust_status = "Verified"
            
        shop_info = f"<b>{shop.name}</b><br/>{shop.address or ''}<br/>Business Type: {shop.get_business_type_display() if hasattr(shop, 'get_business_type_display') else shop.business_type}<br/><b>Verification:</b> {trust_status}"
        if shop.verification_tier == 'business_verified' and shop.pan_vat_number:
            shop_info += f"<br/><b>PAN/VAT:</b> {shop.pan_vat_number}"
            
        invoice_info = f"<b>Invoice No:</b> LC-{order.id}<br/><b>Date:</b> {order.created_at.strftime('%Y-%m-%d %H:%M')}<br/><b>Payment Method:</b> {order.get_payment_method_display()}<br/><b>Payment Status:</b> {order.payment_status.upper()}"
        
        header_data = [
            [Paragraph(shop_info, normal_style), Paragraph(invoice_info, normal_style)]
        ]
        header_table = Table(header_data, colWidths=[270, 270])
        header_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('ALIGN', (1,0), (1,0), 'RIGHT'),
        ]))
        story.append(header_table)
        story.append(Spacer(1, 20))
        
        # Bill To section
        customer_info = f"<b>BILL TO:</b><br/>{order.full_name or order.customer.username}<br/>Phone: {order.phone_number}<br/>Address: {order.shipping_address}, {order.city}"
        customer_table = Table([[Paragraph(customer_info, normal_style)]], colWidths=[540])
        customer_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F9FAFB')),
            ('PADDING', (0,0), (-1,-1), 10),
            ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#E5E7EB')),
        ]))
        story.append(customer_table)
        story.append(Spacer(1, 20))
        
        # Line Items Table
        table_data = [
            [
                Paragraph("<b>Item</b>", normal_style), 
                Paragraph("<b>Qty</b>", normal_style), 
                Paragraph("<b>Unit Price (NPR)</b>", normal_style), 
                Paragraph("<b>Total (NPR)</b>", normal_style)
            ]
        ]
        
        for item in order.items.all():
            table_data.append([
                Paragraph(item.product.name, normal_style),
                Paragraph(str(item.quantity), normal_style),
                Paragraph(f"{item.price:.2f}", normal_style),
                Paragraph(f"{(item.price * item.quantity):.2f}", normal_style),
            ])
            
        # Add totals
        subtotal = sum(item.price * item.quantity for item in order.items.all())
        table_data.append([
            "", "", 
            Paragraph("<b>Subtotal:</b>", normal_style), 
            Paragraph(f"NPR {subtotal:.2f}", bold_style)
        ])
        
        if order.discount_amount > 0:
            table_data.append([
                "", "", 
                Paragraph("<b>Discount:</b>", normal_style), 
                Paragraph(f"- NPR {order.discount_amount:.2f}", bold_style)
            ])
            
        table_data.append([
            "", "", 
            Paragraph("<b>Grand Total:</b>", normal_style), 
            Paragraph(f"NPR {order.total:.2f}", ParagraphStyle('TotalText', parent=bold_style, textColor=colors.HexColor('#5C2D91'), fontSize=11))
        ])
        
        item_table = Table(table_data, colWidths=[240, 60, 120, 120])
        item_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#F3F4F6')),
            ('BOTTOMPADDING', (0,0), (-1,0), 8),
            ('TOPPADDING', (0,0), (-1,0), 8),
            ('ALIGN', (1,0), (-1,-1), 'CENTER'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('LINEBELOW', (0,0), (-1,-2), 0.5, colors.HexColor('#E5E7EB')),
            ('LINEBELOW', (0,0), (-1,0), 1.5, colors.HexColor('#D1D5DB')),
            ('LINEBELOW', (0,-1), (-1,-1), 1.5, colors.HexColor('#5C2D91')),
            ('PADDING', (0,1), (-1,-1), 8),
        ]))
        story.append(item_table)
        story.append(Spacer(1, 40))
        
        # Footer
        footer_text = "<para align=center>Thank you for shopping with us!<br/>Sajilo Dokan Local Connect Marketplace</para>"
        story.append(Paragraph(footer_text, normal_style))
        
        doc.build(story)
        buffer.seek(0)
        
        response = HttpResponse(buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="invoice-{order.id}.pdf"'
        return response

from django.db.models import Q

class ConversationViewSet(viewsets.ModelViewSet):
    queryset = Conversation.objects.all()
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = Conversation.objects.all().select_related('customer', 'shop', 'shop__owner').prefetch_related('messages')
        role = self.request.query_params.get('role', None)
        
        if role == 'customer':
            return queryset.filter(customer=self.request.user).order_by('-updated_at')
        elif role == 'shop_owner':
            return queryset.filter(shop__owner=self.request.user).order_by('-updated_at')
            
        # Fallback: All conversations where user is either customer or owner
        if self.request.user.is_authenticated:
            return queryset.filter(
                Q(customer=self.request.user) | Q(shop__owner=self.request.user)
            ).distinct().order_by('-updated_at')
        return queryset.none()
        
    def create(self, request, *args, **kwargs):
        # Prevent duplicate conversations between the same customer and shop
        shop_id = request.data.get('shop_id')
        if not shop_id:
            return Response({'error': 'shop_id is required'}, status=status.HTTP_400_BAD_REQUEST)
            
        conversation, created = Conversation.objects.get_or_create(
            customer=request.user,
            shop_id=shop_id
        )
        serializer = self.get_serializer(conversation)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    def perform_destroy(self, instance):
        # Ensure user can only delete their own conversation participants
        if instance.customer == self.request.user or instance.shop.owner == self.request.user:
            instance.delete()
        else:
            raise permissions.PermissionDenied("You cannot delete this conversation.")

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        conversation = self.get_object()
        conversation.messages.exclude(sender=request.user).update(is_read=True)
        return Response({'status': 'messages marked as read'})
        
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        from shops.models import Message
        role = request.query_params.get('role', None)
        
        if role == 'customer':
            count = Message.objects.filter(
                conversation__customer=request.user,
                is_read=False
            ).exclude(sender=request.user).count()
        elif role == 'shop_owner' and request.user.is_shop_owner:
            count = Message.objects.filter(
                conversation__shop__owner=request.user,
                is_read=False
            ).exclude(sender=request.user).count()
        else:
            if request.user.is_shop_owner:
                count = Message.objects.filter(
                    conversation__shop__owner=request.user,
                    is_read=False
                ).exclude(sender=request.user).count()
            else:
                count = Message.objects.filter(
                    conversation__customer=request.user,
                    is_read=False
                ).exclude(sender=request.user).count()
        return Response({'unread_count': count})

    @action(detail=True, methods=['post'])
    def send_message(self, request, pk=None):
        conversation = self.get_object()
        serializer = MessageSerializer(data=request.data)
        if serializer.is_valid():
            message = serializer.save(
                conversation=conversation,
                sender=request.user
            )
            
            # Broadcast the new message via Django Channels group
            try:
                from asgiref.sync import async_to_sync
                from channels.layer import get_channel_layer
                channel_layer = get_channel_layer()
                if channel_layer:
                    async_to_sync(channel_layer.group_send)(
                        f'chat_{conversation.id}',
                        {
                            'type': 'chat_message',
                            'message_data': serializer.data
                        }
                    )
            except Exception as e:
                pass
                
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class MessageViewSet(viewsets.ModelViewSet):
    queryset = Message.objects.all()
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return self.queryset.filter(
            Q(conversation__customer=self.request.user) | 
            Q(conversation__shop__owner=self.request.user)
        )
        
    def perform_destroy(self, instance):
        if instance.sender == self.request.user:
            instance.delete()
        else:
            raise permissions.PermissionDenied("You can only unsend your own messages.")

class ShopKYCViewSet(viewsets.ModelViewSet):
    queryset = ShopKYC.objects.all()
    serializer_class = ShopKYCSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(shop__owner=self.request.user)

    def perform_create(self, serializer):
        shop = Shop.objects.filter(owner=self.request.user).order_by('-created_at').first()
        if not shop:
            from rest_framework.exceptions import ValidationError
            raise ValidationError('You must create a shop before submitting KYC.')
        if ShopKYC.objects.filter(shop=shop).exists():
            from rest_framework.exceptions import ValidationError
            raise ValidationError('KYC documents already submitted for this shop.')
        serializer.save(shop=shop)

class ProductCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ProductCategory.objects.all()
    serializer_class = ProductCategorySerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return self.queryset.exclude(name='Test Product')

class ProductSubcategoryViewSet(viewsets.ModelViewSet):
    queryset = ProductSubcategory.objects.all()
    serializer_class = ProductSubcategorySerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            self.permission_classes = [permissions.IsAuthenticated]
        else:
            self.permission_classes = [permissions.AllowAny]
        return super().get_permissions()
    
    def get_queryset(self):
        from django.db.models import Q
        queryset = super().get_queryset()
        
        if self.request.user.is_authenticated and getattr(self.request.user, 'is_shop_owner', False):
            queryset = queryset.filter(Q(shop__isnull=True) | Q(shop__owner=self.request.user))
        else:
            queryset = queryset.filter(shop__isnull=True)
            
        category_id = self.request.query_params.get('category_id')
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        return queryset

    def perform_create(self, serializer):
        if self.request.user.is_authenticated and getattr(self.request.user, 'is_shop_owner', False):
            shop = Shop.objects.filter(owner=self.request.user).first()
            serializer.save(shop=shop)
        else:
            serializer.save()

class ProductChildCategoryViewSet(viewsets.ModelViewSet):
    queryset = ProductChildCategory.objects.all()
    serializer_class = ProductChildCategorySerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            self.permission_classes = [permissions.IsAuthenticated]
        else:
            self.permission_classes = [permissions.AllowAny]
        return super().get_permissions()
    
    def get_queryset(self):
        from django.db.models import Q
        queryset = super().get_queryset()
        
        if self.request.user.is_authenticated and getattr(self.request.user, 'is_shop_owner', False):
            queryset = queryset.filter(Q(shop__isnull=True) | Q(shop__owner=self.request.user))
        else:
            queryset = queryset.filter(shop__isnull=True)
            
        subcategory_id = self.request.query_params.get('subcategory_id')
        if subcategory_id:
            queryset = queryset.filter(subcategory_id=subcategory_id)
        return queryset

    def perform_create(self, serializer):
        if self.request.user.is_authenticated and getattr(self.request.user, 'is_shop_owner', False):
            shop = Shop.objects.filter(owner=self.request.user).first()
            serializer.save(shop=shop)
        else:
            serializer.save()

class BrandViewSet(viewsets.ModelViewSet):
    queryset = Brand.objects.all().order_by('-popularity_score', 'name')
    serializer_class = BrandSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            self.permission_classes = [permissions.IsAuthenticated]
        else:
            self.permission_classes = [permissions.AllowAny]
        return super().get_permissions()

    def get_queryset(self):
        queryset = super().get_queryset()
        category_id = self.request.query_params.get('category_id')
        subcategory_id = self.request.query_params.get('subcategory_id')
        
        if category_id:
            from django.db.models import Q
            # Filter by category or global brands (category is null)
            queryset = queryset.filter(Q(category_id=category_id) | Q(category__isnull=True))
        if subcategory_id:
            queryset = queryset.filter(subcategory_id=subcategory_id)
        return queryset

class ProductImageViewSet(viewsets.ModelViewSet):
    queryset = ProductImage.objects.all()
    serializer_class = ProductImageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(product__shop__owner=self.request.user)

from rest_framework.views import APIView
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.db.models import Avg

class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')
        user_type = request.data.get('user_type', 1)

        if not username or not email or not password:
            return Response({'error': 'Please provide username, email, and password.'}, status=status.HTTP_400_BAD_REQUEST)

        if CustomUser.objects.filter(username=username).exists():
            return Response({'error': 'Username already exists.'}, status=status.HTTP_400_BAD_REQUEST)

        user = CustomUser.objects.create_user(
            username=username,
            email=email,
            password=password,
            user_type=user_type
        )
        token, _ = Token.objects.get_or_create(user=user)
        try:
            from api.email_utils import send_welcome_email
            send_welcome_email(user)
        except Exception:
            pass

        return Response({
            'token': token.key,
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)

class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        if not username or not password:
            return Response({'error': 'Please provide both username and password.'}, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(username=username, password=password)
        if not user:
            return Response({'error': 'Invalid credentials.'}, status=status.HTTP_400_BAD_REQUEST)

        if not user.is_active:
            return Response({'error': 'User account is suspended.'}, status=status.HTTP_400_BAD_REQUEST)

        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user': UserSerializer(user).data
        })

class ShopRoleViewSet(viewsets.ModelViewSet):
    queryset = ShopRole.objects.all()
    serializer_class = ShopRoleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return self.queryset
        shop = Shop.objects.filter(owner=self.request.user).first()
        if shop:
            return self.queryset.filter(shop=shop)
        sub = ShopSubAccount.objects.filter(user=self.request.user).first()
        if sub:
            return self.queryset.filter(shop=sub.shop)
        return self.queryset.none()

    def perform_create(self, serializer):
        shop = Shop.objects.filter(owner=self.request.user).first()
        if not shop:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("You must be a shop owner to create roles.")
        serializer.save(shop=shop)

class ShopSubAccountViewSet(viewsets.ModelViewSet):
    queryset = ShopSubAccount.objects.all()
    serializer_class = ShopSubAccountSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return self.queryset
        shop = Shop.objects.filter(owner=self.request.user).first()
        if shop:
            return self.queryset.filter(shop=shop)
        sub = ShopSubAccount.objects.filter(user=self.request.user).first()
        if sub:
            return self.queryset.filter(shop=sub.shop)
        return self.queryset.none()

    def perform_create(self, serializer):
        shop = Shop.objects.filter(owner=self.request.user).first()
        if not shop:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("Only shop owners can create sub-accounts.")
        serializer.save(shop=shop)

class ShopSettingsViewSet(viewsets.ModelViewSet):
    queryset = ShopSettings.objects.all()
    serializer_class = ShopSettingsSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return self.queryset
        shop = Shop.objects.filter(owner=self.request.user).first()
        if shop:
            return self.queryset.filter(shop=shop)
        return self.queryset.none()

    @action(detail=False, methods=['get', 'put', 'patch'], url_path='my_settings')
    def my_settings(self, request):
        shop = get_object_or_404(Shop, owner=request.user)
        settings_obj, created = ShopSettings.objects.get_or_create(shop=shop)
        if request.method == 'GET':
            serializer = self.get_serializer(settings_obj)
            return Response(serializer.data)
        
        serializer = self.get_serializer(settings_obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ProductReviewViewSet(viewsets.ModelViewSet):
    queryset = ProductReview.objects.all()
    serializer_class = ProductReviewSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        queryset = self.queryset
        product_id = self.request.query_params.get('product_id')
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        return queryset

    def perform_create(self, serializer):
        review = serializer.save(user=self.request.user)
        self.update_product_rating(review.product)

    def perform_update(self, serializer):
        review = serializer.save()
        self.update_product_rating(review.product)

    def perform_destroy(self, instance):
        product = instance.product
        instance.delete()
        self.update_product_rating(product)

    def update_product_rating(self, product):
        avg_rating = ProductReview.objects.filter(product=product).aggregate(Avg('rating'))['rating__avg'] or 0.0
        product.average_rating = avg_rating
        product.save(update_fields=['average_rating'])

class ShopReviewViewSet(viewsets.ModelViewSet):
    queryset = ShopReview.objects.all()
    serializer_class = ShopReviewSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        queryset = self.queryset
        shop_id = self.request.query_params.get('shop_id')
        if shop_id:
            queryset = queryset.filter(shop_id=shop_id)
        return queryset

    def perform_create(self, serializer):
        review = serializer.save(user=self.request.user)
        self.update_shop_rating(review.shop)

    def perform_update(self, serializer):
        review = serializer.save()
        self.update_shop_rating(review.shop)

    def perform_destroy(self, instance):
        shop = instance.shop
        instance.delete()
        self.update_shop_rating(shop)

    def update_shop_rating(self, shop):
        avg_rating = ShopReview.objects.filter(shop=shop).aggregate(Avg('rating'))['rating__avg'] or 0.0
        shop.average_rating = avg_rating
        shop.save(update_fields=['average_rating'])

import math

def _haversine_km(lat1, lon1, lat2, lon2):
    """Return distance in km between two lat/lon points."""
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

class UnifiedSearchView(APIView):
    """
    GET /api/search/?q=shoes&lat=27.7172&lng=85.3240&filter=delivery&radius=10&page=1&page_size=20

    Returns a ranked mixed feed of Products + Shops.
    """
    permission_classes = [permissions.AllowAny]

    @staticmethod
    def _relevance(obj, q: str) -> float:
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
        if km is None:
            return 0.5
        if km <= 1:
            return 1.0
        if km >= 50:
            return 0.0
        return max(0.0, 1.0 - (km / 50))

    @staticmethod
    def _rating_score(avg_rating) -> float:
        try:
            return float(avg_rating) / 5.0
        except (TypeError, ValueError):
            return 0.0

    @staticmethod
    def _popularity_score(obj) -> float:
        views = getattr(obj, 'views', 0) or 0
        bonus = 0.2 if getattr(obj, 'is_featured', False) else 0.0
        bonus += 0.1 if getattr(obj, 'is_sponsored', False) else 0.0
        return min(0.7, views / max(views + 100, 1)) + bonus

    @staticmethod
    def _availability_score(obj) -> float:
        stock = getattr(obj, 'stock_quantity', 1)
        if stock > 0:
            return 1.0
        return 0.0

    def get(self, request):
        q = request.query_params.get('q', '').strip()
        lat_str = request.query_params.get('lat')
        lng_str = request.query_params.get('lng')
        radius_str = request.query_params.get('radius')
        page_str = request.query_params.get('page', '1')
        page_size_str = request.query_params.get('page_size', '20')

        lat, lng, radius = None, None, None
        try:
            if lat_str and lng_str:
                lat = float(lat_str)
                lng = float(lng_str)
            if radius_str:
                radius = float(radius_str)
        except ValueError:
            pass

        try:
            page = int(page_str)
            page_size = int(page_size_str)
        except ValueError:
            page = 1
            page_size = 20

        products = Product.objects.filter(moderation_status='approved').select_related(
            'shop', 'category', 'subcategory', 'child_category', 'brand'
        ).prefetch_related(
            'tags', 'variants', 'images'
        )
        shops = Shop.objects.all().select_related(
            'owner', 'province', 'district', 'city', 'ward', 'street', 'market_hub', 'category', 'kyc'
        ).prefetch_related(
            'trade_types'
        )

        if lat is not None and lng is not None and radius is not None:
            # 1 degree of latitude is ~111.12 km
            lat_delta = radius / 111.12
            cos_lat = math.cos(math.radians(lat))
            # Safe check to avoid divide by zero near poles
            if cos_lat > 0.01:
                lng_delta = radius / (111.12 * cos_lat)
            else:
                lng_delta = radius / 1.11
            
            lat_min, lat_max = lat - lat_delta, lat + lat_delta
            lng_min, lng_max = lng - lng_delta, lng + lng_delta

            # Filter shops and products utilizing bounding box range query
            shops = shops.filter(
                latitude__range=(lat_min, lat_max),
                longitude__range=(lng_min, lng_max)
            )
            products = products.filter(
                shop__latitude__range=(lat_min, lat_max),
                shop__longitude__range=(lng_min, lng_max)
            )

        if q:
            products = products.filter(Q(name__icontains=q) | Q(description__icontains=q))
            shops = shops.filter(Q(name__icontains=q) | Q(description__icontains=q))

        results_list = []

        for s in shops:
            dist = None
            if lat is not None and lng is not None and s.latitude is not None and s.longitude is not None:
                dist = _haversine_km(lat, lng, float(s.latitude), float(s.longitude))
                if radius is not None and dist > radius:
                    continue

            rel = self._relevance(s, q)
            ds = self._distance_score(dist)
            rs = self._rating_score(s.average_rating)
            ps = self._popularity_score(s)
            av = 1.0
            
            score = (rel * 0.40) + (ds * 0.25) + (rs * 0.20) + (ps * 0.10) + (av * 0.05)
            
            results_list.append({
                'type': 'shop',
                'id': s.id,
                'score': score,
                'distance': dist,
                'object': s
            })

        for p in products:
            dist = None
            s = p.shop
            if lat is not None and lng is not None and s.latitude is not None and s.longitude is not None:
                dist = _haversine_km(lat, lng, float(s.latitude), float(s.longitude))
                if radius is not None and dist > radius:
                    continue

            rel = self._relevance(p, q)
            ds = self._distance_score(dist)
            rs = self._rating_score(p.average_rating)
            ps = self._popularity_score(p)
            av = self._availability_score(p)
            
            score = (rel * 0.40) + (ds * 0.25) + (rs * 0.20) + (ps * 0.10) + (av * 0.05)
            
            results_list.append({
                'type': 'product',
                'id': p.id,
                'score': score,
                'distance': dist,
                'object': p
            })

        results_list.sort(key=lambda x: x['score'], reverse=True)

        total = len(results_list)
        start = (page - 1) * page_size
        end = start + page_size
        paginated_data = results_list[start:end]

        final_results = []
        for item in paginated_data:
            if item['type'] == 'shop':
                serialized_data = ShopSerializer(item['object'], context={'request': request}).data
            else:
                serialized_data = ProductSerializer(item['object'], context={'request': request}).data
            
            final_results.append({
                'type': item['type'],
                'id': item['id'],
                'score': item['score'],
                'distance': item['distance'],
                'data': serialized_data
            })

        return Response({
            'count': total,
            'page': page,
            'page_size': page_size,
            'results': final_results
        })

class ShopVoucherViewSet(viewsets.ModelViewSet):
    queryset = ShopVoucher.objects.all()
    serializer_class = ShopVoucherSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return self.queryset
        if self.request.user.user_type == 2:
            shop = Shop.objects.filter(owner=self.request.user).first()
            if shop:
                return self.queryset.filter(shop=shop)
            return self.queryset.none()
        return self.queryset.all()

    def perform_create(self, serializer):
        shop = Shop.objects.filter(owner=self.request.user).first()
        if not shop:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("Only shop owners can create vouchers.")
        serializer.save(shop=shop)

class ValidateVoucherView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        code = request.data.get('code')
        shop_id = request.data.get('shop_id')
        total_str = request.data.get('total')

        if not code or not shop_id or not total_str:
            return Response({'error': 'Please provide code, shop_id, and total.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            total = float(total_str)
        except ValueError:
            return Response({'error': 'Invalid total amount.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            voucher = ShopVoucher.objects.get(code=code, shop_id=shop_id)
            now = timezone.now()
            
            if not voucher.is_active or now < voucher.valid_from or now > voucher.valid_until:
                return Response({'valid': False, 'error': 'Voucher is expired or inactive.'}, status=status.HTTP_400_BAD_REQUEST)
                
            if voucher.used_count >= voucher.max_uses:
                return Response({'valid': False, 'error': 'Voucher has reached its maximum usage limit.'}, status=status.HTTP_400_BAD_REQUEST)
                
            if total < float(voucher.minimum_order_amount):
                return Response({'valid': False, 'error': f'Minimum order amount of NPR {voucher.minimum_order_amount} required.'}, status=status.HTTP_400_BAD_REQUEST)
                
            if voucher.discount_type == 'percentage':
                discount = total * (float(voucher.discount_value) / 100.0)
            else:
                discount = float(voucher.discount_value)
                
            discount = min(discount, total)
            
            return Response({
                'valid': True,
                'discount_amount': discount,
                'discount_type': voucher.discount_type,
                'discount_value': voucher.discount_value
            })
            
        except ShopVoucher.DoesNotExist:
            return Response({'valid': False, 'error': 'Invalid voucher code.'}, status=status.HTTP_404_NOT_FOUND)

class SubscriptionPlanViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = SubscriptionPlan.objects.all()
    serializer_class = SubscriptionPlanSerializer
    permission_classes = [permissions.AllowAny]

class ShopSubscriptionViewSet(viewsets.ModelViewSet):
    queryset = ShopSubscription.objects.all()
    serializer_class = ShopSubscriptionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return self.queryset
        shop = Shop.objects.filter(owner=self.request.user).first()
        if shop:
            return self.queryset.filter(shop=shop)
        return self.queryset.none()

    def perform_create(self, serializer):
        shop = Shop.objects.filter(owner=self.request.user).first()
        if not shop:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("You must create a shop before subscribing.")
        
        if ShopSubscription.objects.filter(shop=shop).exists():
            from rest_framework.exceptions import ValidationError
            raise ValidationError("Shop already has a subscription.")
        serializer.save(shop=shop)

class AdminStatsView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        from django.db.models import Sum
        total_shops = Shop.objects.count()
        total_customers = CustomUser.objects.filter(user_type=1).count()
        total_revenue = Order.objects.filter(status='completed').aggregate(Sum('total'))['total__sum'] or 0
        pending_products = Product.objects.filter(moderation_status='pending').count()

        return Response({
            'total_shops': total_shops,
            'total_customers': total_customers,
            'total_revenue': total_revenue,
            'pending_products': pending_products
        })

class AdminShopKYCViewSet(viewsets.ModelViewSet):
    queryset = ShopKYC.objects.all()
    serializer_class = ShopKYCSerializer
    permission_classes = [permissions.IsAdminUser]

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        kyc = self.get_object()
        kyc.kyc_status = 'approved'
        kyc.reviewed_at = timezone.now()
        kyc.save()
        
        shop = kyc.shop
        shop.is_verified = True
        if kyc.kyc_type == 'business':
            shop.verification_tier = 'business_verified'
        else:
            shop.verification_tier = 'personal_verified'
        shop.save(update_fields=['is_verified', 'verification_tier'])
        
        try:
            from api.email_utils import send_kyc_result
            send_kyc_result(shop, approved=True)
        except Exception:
            pass
        try:
            Notification.objects.create(
                user=shop.owner,
                title="KYC Verification Approved",
                message=f"Your shop KYC verification for '{shop.name}' has been APPROVED.",
                link="/dashboard"
            )
        except Exception:
            pass
            
        return Response({'status': 'approved'})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        kyc = self.get_object()
        kyc.kyc_status = 'rejected'
        kyc.reviewed_at = timezone.now()
        kyc.admin_notes = request.data.get('notes', '')
        kyc.save()
        
        try:
            from api.email_utils import send_kyc_result
            send_kyc_result(kyc.shop, approved=False, admin_notes=kyc.admin_notes)
        except Exception:
            pass
        try:
            Notification.objects.create(
                user=kyc.shop.owner,
                title="KYC Verification Rejected",
                message=f"Your shop KYC verification for '{kyc.shop.name}' has been REJECTED. Reason: {kyc.admin_notes}",
                link="/dashboard"
            )
        except Exception:
            pass
            
        return Response({'status': 'rejected'})

class ShopStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from django.db.models import Sum, Count, Q
        shop = get_object_or_404(Shop, owner=request.user)
        total_revenue = Order.objects.filter(shop=shop, status='completed').aggregate(Sum('total'))['total__sum'] or 0
        commission_deducted = Order.objects.filter(shop=shop, status='completed').aggregate(Sum('commission_amount'))['commission_amount__sum'] or 0
        net_earnings = float(total_revenue) - float(commission_deducted)
        
        total_paid_out = PayoutRequest.objects.filter(shop=shop, status__in=['approved', 'paid']).aggregate(Sum('amount'))['amount__sum'] or 0
        withdrawable_balance = net_earnings - float(total_paid_out)
        
        pending_orders = Order.objects.filter(shop=shop, status='pending').count()
        new_orders = Order.objects.filter(shop=shop).filter(Q(status='pending') | Q(status='confirmed')).count()
        low_stock_count = Product.objects.filter(shop=shop, stock_quantity__lt=5).count()
        recent_orders = OrderSerializer(Order.objects.filter(shop=shop).order_by('-created_at')[:5], many=True).data

        return Response({
            'total_revenue': total_revenue,
            'commission_deducted': commission_deducted,
            'net_earnings': net_earnings,
            'total_paid_out': total_paid_out,
            'withdrawable_balance': withdrawable_balance,
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

class CommissionRateViewSet(viewsets.ModelViewSet):
    queryset = CommissionRate.objects.all()
    serializer_class = CommissionRateSerializer
    permission_classes = [permissions.IsAdminUser]

class PayoutRequestViewSet(viewsets.ModelViewSet):
    queryset = PayoutRequest.objects.all()
    serializer_class = PayoutRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return self.queryset.order_by('-requested_at')
        shop = Shop.objects.filter(owner=self.request.user).first()
        if shop:
            return self.queryset.filter(shop=shop).order_by('-requested_at')
        return self.queryset.none()

    def perform_create(self, serializer):
        shop = Shop.objects.filter(owner=self.request.user).first()
        if not shop:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("Only shop owners can request payouts.")
        serializer.save(shop=shop)
        
        admins = CustomUser.objects.filter(is_staff=True)
        for admin in admins:
            Notification.objects.create(
                user=admin,
                title="New Payout Request",
                message=f"Shop '{shop.name}' has requested a payout of NPR {serializer.validated_data['amount']}.",
                link="/saas-admin/financials"
            )

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def approve(self, request, pk=None):
        payout = self.get_object()
        payout.status = 'approved'
        payout.processed_at = timezone.now()
        payout.admin_notes = request.data.get('notes', '')
        payout.save()
        
        Notification.objects.create(
            user=payout.shop.owner,
            title="Payout Request Approved",
            message=f"Your payout request of NPR {payout.amount} has been APPROVED.",
            link="/dashboard/financials"
        )
        return Response({'status': 'approved'})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def reject(self, request, pk=None):
        payout = self.get_object()
        payout.status = 'rejected'
        payout.processed_at = timezone.now()
        payout.admin_notes = request.data.get('notes', '')
        payout.save()
        
        Notification.objects.create(
            user=payout.shop.owner,
            title="Payout Request Rejected",
            message=f"Your payout request of NPR {payout.amount} has been REJECTED. Reason: {payout.admin_notes}",
            link="/dashboard/financials"
        )
        return Response({'status': 'rejected'})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def mark_paid(self, request, pk=None):
        payout = self.get_object()
        payout.status = 'paid'
        payout.processed_at = timezone.now()
        payout.admin_notes = request.data.get('notes', payout.admin_notes)
        payout.save()
        
        Notification.objects.create(
            user=payout.shop.owner,
            title="Payout Transferred",
            message=f"Your payout request of NPR {payout.amount} has been PAID.",
            link="/dashboard/financials"
        )
        return Response({'status': 'paid'})

class DisputeViewSet(viewsets.ModelViewSet):
    queryset = Dispute.objects.all()
    serializer_class = DisputeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return self.queryset.order_by('-created_at')
        if self.request.user.user_type == 2:
            return self.queryset.filter(order__shop__owner=self.request.user).order_by('-created_at')
        return self.queryset.filter(raised_by=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        order_id = self.request.data.get('order')
        order = get_object_or_404(Order, id=order_id)
        if order.customer != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only open disputes on your own orders.")
            
        serializer.save(raised_by=self.request.user)
        
        Notification.objects.create(
            user=order.shop.owner,
            title="Dispute Raised on Order",
            message=f"Customer '{self.request.user.username}' raised a dispute on Order #{order.id}.",
            link="/dashboard/orders"
        )
        
        admins = CustomUser.objects.filter(is_staff=True)
        for admin in admins:
            Notification.objects.create(
                user=admin,
                title="New Order Dispute",
                message=f"Dispute raised on Order #{order.id} for shop '{order.shop.name}'.",
                link="/saas-admin/disputes"
            )

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def update_status(self, request, pk=None):
        dispute = self.get_object()
        status_val = request.data.get('status')
        notes = request.data.get('notes', '')
        
        if status_val not in ['open', 'in_review', 'resolved', 'closed']:
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
            
        dispute.status = status_val
        dispute.resolution_notes = notes
        dispute.save()
        
        Notification.objects.create(
            user=dispute.raised_by,
            title="Dispute Status Updated",
            message=f"Your dispute on Order #{dispute.order.id} status is now: {status_val.upper()}.",
            link="/orders"
        )
        
        Notification.objects.create(
            user=dispute.order.shop.owner,
            title="Dispute Status Updated",
            message=f"The dispute on Order #{dispute.order.id} status is now: {status_val.upper()}.",
            link="/dashboard/orders"
        )
        
        return Response({'status': status_val})


class ProvinceViewSet(viewsets.ModelViewSet):
    queryset = Province.objects.all()
    serializer_class = ProvinceSerializer
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAdminUser()]
        return [permissions.AllowAny()]

class DistrictViewSet(viewsets.ModelViewSet):
    queryset = District.objects.all()
    serializer_class = DistrictSerializer
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAdminUser()]
        return [permissions.AllowAny()]
    def get_queryset(self):
        queryset = self.queryset.all()
        province_id = self.request.query_params.get('province')
        if province_id:
            queryset = queryset.filter(province_id=province_id)
        return queryset

class CityViewSet(viewsets.ModelViewSet):
    queryset = City.objects.all()
    serializer_class = CitySerializer
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAdminUser()]
        return [permissions.AllowAny()]
    def get_queryset(self):
        queryset = self.queryset.all()
        district_id = self.request.query_params.get('district')
        if district_id:
            queryset = queryset.filter(district_id=district_id)
        return queryset

class WardViewSet(viewsets.ModelViewSet):
    queryset = Ward.objects.all()
    serializer_class = WardSerializer
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAdminUser()]
        return [permissions.AllowAny()]
    def get_queryset(self):
        queryset = self.queryset.all()
        city_id = self.request.query_params.get('city')
        if city_id:
            queryset = queryset.filter(city_id=city_id)
        return queryset

class StreetViewSet(viewsets.ModelViewSet):
    queryset = Street.objects.all()
    serializer_class = StreetSerializer
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAdminUser()]
        return [permissions.AllowAny()]
    def get_queryset(self):
        queryset = self.queryset.all()
        city_id = self.request.query_params.get('city')
        if city_id:
            queryset = queryset.filter(city_id=city_id)
        return queryset

class MarketHubViewSet(viewsets.ModelViewSet):
    queryset = MarketHub.objects.all()
    serializer_class = MarketHubSerializer
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAdminUser()]
        return [permissions.AllowAny()]
    def get_queryset(self):
        from django.db.models import Q
        queryset = self.queryset.all()
        q = self.request.query_params.get('q')
        city_id = self.request.query_params.get('city')
        street_id = self.request.query_params.get('street')
        district_id = self.request.query_params.get('district')
        province_id = self.request.query_params.get('province')
        if q:
            queryset = queryset.filter(Q(name__icontains=q) | Q(description__icontains=q))
        if city_id:
            queryset = queryset.filter(city_id=city_id)
        if street_id:
            queryset = queryset.filter(street_id=street_id)
        if district_id:
            queryset = queryset.filter(city__district_id=district_id)
        if province_id:
            queryset = queryset.filter(city__district__province_id=province_id)
        return queryset

class TradeTypeViewSet(viewsets.ModelViewSet):
    queryset = TradeType.objects.all()
    serializer_class = TradeTypeSerializer
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAdminUser()]
        return [permissions.AllowAny()]

class ShopCategoryViewSet(viewsets.ModelViewSet):
    queryset = ShopCategory.objects.all()
    serializer_class = ShopCategorySerializer
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAdminUser()]
        return [permissions.AllowAny()]
    def get_queryset(self):
        queryset = self.queryset.all()
        parent = self.request.query_params.get('parent')
        if parent == 'null':
            queryset = queryset.filter(parent__isnull=True)
        elif parent:
            queryset = queryset.filter(parent_id=parent)
        return queryset

class ShopCategoryPermittedProductViewSet(viewsets.ModelViewSet):
    queryset = ShopCategoryPermittedProduct.objects.all()
    serializer_class = ShopCategoryPermittedProductSerializer
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAdminUser()]
        return [permissions.AllowAny()]

