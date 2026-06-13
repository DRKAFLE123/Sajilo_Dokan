from rest_framework import serializers
from accounts.models import CustomUser
from shops.models import (
    Shop, Conversation, Message, ShopKYC, ShopRole, ShopSubAccount, ShopSettings, 
    ShopReview, ShopVoucher, SubscriptionPlan, ShopSubscription, PlatformSettings, 
    Wishlist, ShopFollow, Notification, CommissionRate, PayoutRequest,
    ShopCategory, TradeType, Province, District, City, Ward, Street, MarketHub, ShopCategoryPermittedProduct
)
from products.models import Product, ProductCategory, ProductReview
from orders.models import Order, OrderItem, Dispute


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'user_type', 'phone_number', 'profile_picture', 'is_verified', 'is_active', 'date_joined']

class ShopCategorySerializer(serializers.ModelSerializer):
    subcategories = serializers.SerializerMethodField()
    parent_name = serializers.ReadOnlyField(source='parent.name')

    class Meta:
        model = ShopCategory
        fields = ['id', 'name', 'description', 'icon', 'parent', 'parent_name', 'subcategories']

    def get_subcategories(self, obj):
        subcategories = obj.subcategories.all()
        return ShopCategorySerializer(subcategories, many=True, context=self.context).data

class TradeTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = TradeType
        fields = '__all__'

class ProvinceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Province
        fields = '__all__'

class DistrictSerializer(serializers.ModelSerializer):
    province_name = serializers.ReadOnlyField(source='province.name')
    class Meta:
        model = District
        fields = '__all__'

class CitySerializer(serializers.ModelSerializer):
    district_name = serializers.ReadOnlyField(source='district.name')
    city_type_display = serializers.CharField(source='get_city_type_display', read_only=True)
    class Meta:
        model = City
        fields = '__all__'

class WardSerializer(serializers.ModelSerializer):
    city_name = serializers.ReadOnlyField(source='city.name')
    class Meta:
        model = Ward
        fields = '__all__'

class StreetSerializer(serializers.ModelSerializer):
    city_name = serializers.ReadOnlyField(source='city.name')
    class Meta:
        model = Street
        fields = '__all__'

class MarketHubSerializer(serializers.ModelSerializer):
    city_name = serializers.ReadOnlyField(source='city.name')
    street_name = serializers.ReadOnlyField(source='street.name')
    class Meta:
        model = MarketHub
        fields = '__all__'

class ShopCategoryPermittedProductSerializer(serializers.ModelSerializer):
    shop_category_name = serializers.ReadOnlyField(source='shop_category.name')
    permitted_product_category_name = serializers.ReadOnlyField(source='permitted_product_category.name')
    class Meta:
        model = ShopCategoryPermittedProduct
        fields = '__all__'

class ShopKYCSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShopKYC
        fields = '__all__'
        read_only_fields = ('shop', 'submitted_at', 'reviewed_at', 'kyc_status', 'admin_notes')

class ShopSerializer(serializers.ModelSerializer):
    is_verified = serializers.ReadOnlyField()
    kyc_status = serializers.SerializerMethodField()
    is_following = serializers.SerializerMethodField()
    
    province_details = ProvinceSerializer(source='province', read_only=True)
    district_details = DistrictSerializer(source='district', read_only=True)
    city_details = CitySerializer(source='city', read_only=True)
    ward_details = WardSerializer(source='ward', read_only=True)
    street_details = StreetSerializer(source='street', read_only=True)
    market_hub_details = MarketHubSerializer(source='market_hub', read_only=True)
    category_details = ShopCategorySerializer(source='category', read_only=True)
    trade_types_details = TradeTypeSerializer(source='trade_types', many=True, read_only=True)

    def get_kyc_status(self, obj):
        try:
            return obj.kyc.kyc_status
        except ShopKYC.DoesNotExist:
            return None

    def get_is_following(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.followers.filter(user=request.user).exists()

    class Meta:
        model = Shop
        fields = '__all__'
        read_only_fields = ('owner', 'is_verified', 'is_featured', 'is_sponsored', 'created_at', 'updated_at', 'average_rating', 'rating_count', 'views')


class ShopRoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShopRole
        fields = '__all__'
        read_only_fields = ('shop', 'created_at')

class ShopSubAccountSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    role_details = ShopRoleSerializer(source='role', read_only=True)

    class Meta:
        model = ShopSubAccount
        fields = '__all__'
        read_only_fields = ('shop', 'created_at')

class ShopSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShopSettings
        fields = '__all__'
        read_only_fields = ('shop',)

from products.models import Product, ProductCategory, ProductSubcategory, ProductChildCategory, Brand, ProductVariant, ProductImage, ProductTag

class ProductCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductCategory
        fields = '__all__'

class ProductSubcategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductSubcategory
        fields = '__all__'

class ProductChildCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductChildCategory
        fields = '__all__'

class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = '__all__'

class ProductTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductTag
        fields = '__all__'

class ProductVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = '__all__'

class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = '__all__'

class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.ReadOnlyField(source='category.name')
    subcategory_name = serializers.ReadOnlyField(source='subcategory.name')
    child_category_name = serializers.ReadOnlyField(source='child_category.name')
    brand_name = serializers.ReadOnlyField(source='brand.name')
    shop_name = serializers.ReadOnlyField(source='shop.name')
    shop_verification_tier = serializers.ReadOnlyField(source='shop.verification_tier')
    variants = ProductVariantSerializer(many=True, read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    tag_names = serializers.StringRelatedField(source='tags', many=True, read_only=True)
    is_wishlisted = serializers.SerializerMethodField()

    def get_is_wishlisted(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.wishlisted_by.filter(user=request.user).exists()
    
    class Meta:
        model = Product
        fields = '__all__'
        read_only_fields = ('shop', 'sku', 'created_at', 'updated_at', 'content_score', 'is_sponsored', 'moderation_status', 'admin_notes')

class OrderItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    
    class Meta:
        model = OrderItem
        fields = '__all__'

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    customer = UserSerializer(read_only=True)
    shop_details = ShopSerializer(source='shop', read_only=True)
    dispute_status = serializers.SerializerMethodField()
    
    # For creation
    order_items = serializers.JSONField(write_only=True)
    voucher_code = serializers.CharField(write_only=True, required=False, allow_blank=True)
    
    class Meta:
        model = Order
        fields = '__all__'
        read_only_fields = ('customer', 'total', 'discount_amount', 'voucher', 'created_at', 'updated_at', 'commission_rate', 'commission_amount')

    def get_dispute_status(self, obj):
        dispute = obj.disputes.first()
        return dispute.status if dispute else None


    def create(self, validated_data):
        from django.db import transaction
        from django.utils import timezone
        
        shop = validated_data.get('shop')
        if shop and shop.verification_tier == 'unverified':
            raise serializers.ValidationError(
                "Orders cannot be placed at this shop because it is not verified."
            )

        items_data = validated_data.pop('order_items')
        voucher_code = validated_data.pop('voucher_code', None)
        
        # Pre-validate all items for stock and MOQ requirements
        for item in items_data:
            try:
                product = Product.objects.get(id=item['product_id'])
                if product.stock_quantity < int(item['quantity']):
                    raise serializers.ValidationError(
                        f"Insufficient stock for '{product.name}'. Only {product.stock_quantity} available."
                    )
                if int(item['quantity']) < product.min_order_quantity:
                    raise serializers.ValidationError(
                        f"Minimum order quantity for '{product.name}' is {product.min_order_quantity} units."
                    )
            except Product.DoesNotExist:
                raise serializers.ValidationError(f"Product with ID {item['product_id']} does not exist.")

        total = 0
        for item in items_data:
            total += float(item['price']) * int(item['quantity'])
            
        discount_amount = 0
        voucher_obj = None
        
        if voucher_code:
            try:
                shop_id = validated_data.get('shop')
                voucher_obj = ShopVoucher.objects.get(code=voucher_code, shop=shop_id)
                now = timezone.now()
                
                if not voucher_obj.is_active or now < voucher_obj.valid_from or now > voucher_obj.valid_until:
                    raise serializers.ValidationError({"voucher_code": "This voucher is expired or inactive."})
                if voucher_obj.used_count >= voucher_obj.max_uses:
                    raise serializers.ValidationError({"voucher_code": "This voucher has reached its maximum usage limit."})
                if total < float(voucher_obj.minimum_order_amount):
                    raise serializers.ValidationError({"voucher_code": f"Minimum order amount of NPR {voucher_obj.minimum_order_amount} required."})
                    
                if voucher_obj.discount_type == 'percentage':
                    discount_amount = total * (float(voucher_obj.discount_value) / 100.0)
                else:
                    discount_amount = float(voucher_obj.discount_value)
                    
                total -= discount_amount
                if total < 0: total = 0
                
            except ShopVoucher.DoesNotExist:
                raise serializers.ValidationError({"voucher_code": "Invalid voucher code."})
        
        with transaction.atomic():
            order = Order.objects.create(total=total, discount_amount=discount_amount, voucher=voucher_obj, **validated_data)
            
            if voucher_obj:
                voucher_obj.used_count += 1
                voucher_obj.save(update_fields=['used_count'])
                
            for item in items_data:
                product = Product.objects.get(id=item['product_id'])
                # Deduct stock
                product.stock_quantity -= int(item['quantity'])
                product.save(update_fields=['stock_quantity'])
                
                OrderItem.objects.create(
                    order=order,
                    product=product,
                    quantity=item['quantity'],
                    price=item['price']
                )
            return order

class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    
    class Meta:
        model = Message
        fields = '__all__'
        read_only_fields = ('sender', 'conversation', 'is_read', 'timestamp')

class ConversationSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)
    customer = UserSerializer(read_only=True)
    shop = ShopSerializer(read_only=True)
    shop_id = serializers.PrimaryKeyRelatedField(
        queryset=Shop.objects.all(), source='shop', write_only=True
    )
    unread_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Conversation
        fields = '__all__'
    
    def get_unread_count(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return 0
        return obj.messages.filter(is_read=False).exclude(sender=request.user).count()

class ProductReviewSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = ProductReview
        fields = ['id', 'product', 'user', 'username', 'rating', 'comment', 'created_at', 'updated_at']
        read_only_fields = ('user', 'created_at', 'updated_at')

class ShopReviewSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = ShopReview
        fields = ['id', 'shop', 'user', 'username', 'rating', 'comment', 'created_at', 'updated_at']
        read_only_fields = ('user', 'created_at', 'updated_at')

class ShopVoucherSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShopVoucher
        fields = '__all__'
        read_only_fields = ('shop', 'used_count', 'created_at')

class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = '__all__'

class ShopSubscriptionSerializer(serializers.ModelSerializer):
    plan_details = SubscriptionPlanSerializer(source='plan', read_only=True)
    
    class Meta:
        model = ShopSubscription
        fields = '__all__'
        read_only_fields = ('shop',)

class PlatformSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlatformSettings
        fields = '__all__'

class WishlistSerializer(serializers.ModelSerializer):
    product_details = ProductSerializer(source='product', read_only=True)

    class Meta:
        model = Wishlist
        fields = ['id', 'product', 'product_details', 'created_at']
        read_only_fields = ('created_at',)

class ShopFollowSerializer(serializers.ModelSerializer):
    shop_details = ShopSerializer(source='shop', read_only=True)

    class Meta:
        model = ShopFollow
        fields = ['id', 'shop', 'shop_details', 'created_at']
        read_only_fields = ('created_at',)

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'title', 'message', 'is_read', 'link', 'created_at']
        read_only_fields = ('created_at',)

class CommissionRateSerializer(serializers.ModelSerializer):
    category_name = serializers.ReadOnlyField(source='category.name')

    class Meta:
        model = CommissionRate
        fields = ['id', 'category', 'category_name', 'rate_percent', 'created_at', 'updated_at']

class PayoutRequestSerializer(serializers.ModelSerializer):
    shop_name = serializers.ReadOnlyField(source='shop.name')

    class Meta:
        model = PayoutRequest
        fields = ['id', 'shop', 'shop_name', 'amount', 'status', 'requested_at', 'processed_at', 'admin_notes']
        read_only_fields = ('shop', 'status', 'requested_at', 'processed_at', 'admin_notes')

    def validate(self, data):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError("Authentication required.")
        
        shop = Shop.objects.filter(owner=request.user).first()
        if not shop:
            raise serializers.ValidationError("Only shop owners can request payouts.")
        
        amount = data.get('amount')
        if amount <= 0:
            raise serializers.ValidationError({"amount": "Payout amount must be greater than zero."})

        from django.db.models import Sum
        total_earned = Order.objects.filter(shop=shop, status='completed').aggregate(Sum('total'))['total__sum'] or 0
        total_commission = Order.objects.filter(shop=shop, status='completed').aggregate(Sum('commission_amount'))['commission_amount__sum'] or 0
        net_earnings = total_earned - total_commission
        
        total_paid_out = PayoutRequest.objects.filter(shop=shop, status__in=['approved', 'paid']).aggregate(Sum('amount'))['amount__sum'] or 0
        withdrawable_balance = net_earnings - total_paid_out
        
        if amount > withdrawable_balance:
            raise serializers.ValidationError({"amount": f"Insufficient funds. Your withdrawable balance is NPR {withdrawable_balance:.2f}."})
            
        return data

class DisputeSerializer(serializers.ModelSerializer):
    customer_username = serializers.ReadOnlyField(source='raised_by.username')
    order_details = serializers.SerializerMethodField()

    class Meta:
        model = Dispute
        fields = ['id', 'order', 'order_details', 'raised_by', 'customer_username', 'reason', 'status', 'resolution_notes', 'created_at', 'updated_at']
        read_only_fields = ('raised_by', 'created_at', 'updated_at')

    def get_order_details(self, obj):
        return {
            'id': obj.order.id,
            'total': str(obj.order.total),
            'status': obj.order.status,
            'shop_name': obj.order.shop.name,
            'customer_username': obj.order.customer.username
        }