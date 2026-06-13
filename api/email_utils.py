import logging
from django.core.mail import send_mail
from django.utils.html import strip_tags
from django.conf import settings

logger = logging.getLogger(__name__)

def send_welcome_email(user):
    if not user.email:
        return
    subject = "Welcome to Sajilo Dokan!"
    recipient_list = [user.email]
    
    html_message = f"""
    <html>
        <body>
            <h2>Welcome to Sajilo Dokan, {user.username}!</h2>
            <p>We are excited to have you on our Local Connect Marketplace. Your account has been registered successfully.</p>
            <p>Feel free to explore our shop selections or start listing your own products if you are a shop owner!</p>
            <br/>
            <p>Best regards,</p>
            <p>The Sajilo Dokan Team</p>
        </body>
    </html>
    """
    plain_message = strip_tags(html_message)
    
    try:
        send_mail(
            subject,
            plain_message,
            settings.DEFAULT_FROM_EMAIL,
            recipient_list,
            html_message=html_message,
            fail_silently=False
        )
        logger.info(f"Welcome email sent to {user.email}")
    except Exception as e:
        logger.error(f"Failed to send welcome email to {user.email}: {e}")

def send_order_confirmation(order):
    if not order.customer.email:
        return
    subject = f"Order Confirmation - Order #{order.id}"
    recipient_list = [order.customer.email]
    
    items_html = ""
    for item in order.items.all():
        items_html += f"<li>{item.quantity}x {item.product.name} - NPR {item.price * item.quantity}</li>"
        
    html_message = f"""
    <html>
        <body>
            <h2>Thank you for your order, {order.customer.username}!</h2>
            <p>Your order <b>#{order.id}</b> from shop <b>{order.shop.name}</b> has been received and is being processed.</p>
            <h3>Order Details:</h3>
            <ul>
                {items_html}
            </ul>
            <p><b>Total Amount:</b> NPR {order.total}</p>
            <p><b>Payment Method:</b> {order.get_payment_method_display()}</p>
            <p><b>Delivery Address:</b> {order.shipping_address or 'Store Pickup'}</p>
            <br/>
            <p>We will update you as soon as the shop owner updates the order status.</p>
            <p>Best regards,</p>
            <p>The Sajilo Dokan Team</p>
        </body>
    </html>
    """
    plain_message = strip_tags(html_message)
    
    try:
        send_mail(
            subject,
            plain_message,
            settings.DEFAULT_FROM_EMAIL,
            recipient_list,
            html_message=html_message,
            fail_silently=False
        )
        logger.info(f"Order confirmation email sent to {order.customer.email}")
    except Exception as e:
        logger.error(f"Failed to send order confirmation to {order.customer.email}: {e}")

def send_order_status_update(order):
    if not order.customer.email:
        return
    subject = f"Order #{order.id} Status Update"
    recipient_list = [order.customer.email]
    
    html_message = f"""
    <html>
        <body>
            <h2>Hello, {order.customer.username}!</h2>
            <p>Your order <b>#{order.id}</b> status has been updated to: <b>{order.get_status_display().upper()}</b>.</p>
            <p><b>Payment Status:</b> {order.payment_status.upper()}</p>
            <br/>
            <p>You can view the full details of your order on your <a href="http://localhost:3000/orders">Order History</a> page.</p>
            <p>Thank you for shopping with Sajilo Dokan!</p>
        </body>
    </html>
    """
    plain_message = strip_tags(html_message)
    
    try:
        send_mail(
            subject,
            plain_message,
            settings.DEFAULT_FROM_EMAIL,
            recipient_list,
            html_message=html_message,
            fail_silently=False
        )
        logger.info(f"Order status update email sent to {order.customer.email}")
    except Exception as e:
        logger.error(f"Failed to send order status update email to {order.customer.email}: {e}")

def send_kyc_result(shop, approved: bool, admin_notes: str = ""):
    if not shop.owner.email:
        return
    subject = "Shop KYC Verification Result"
    recipient_list = [shop.owner.email]
    
    status_text = "APPROVED" if approved else "REJECTED"
    notes_html = f"<p><b>Notes from Admin:</b> {admin_notes}</p>" if admin_notes else ""
    
    html_message = f"""
    <html>
        <body>
            <h2>Hello, {shop.owner.username}!</h2>
            <p>We are writing to inform you that your shop KYC verification for <b>{shop.name}</b> has been <b>{status_text}</b>.</p>
            {notes_html}
            <p>{"Congratulations! You can now start using all features of our marketplace." if approved else "Please review the notes, update your documents, and resubmit them for verification."}</p>
            <br/>
            <p>Best regards,</p>
            <p>The Sajilo Dokan Team</p>
        </body>
    </html>
    """
    plain_message = strip_tags(html_message)
    
    try:
        send_mail(
            subject,
            plain_message,
            settings.DEFAULT_FROM_EMAIL,
            recipient_list,
            html_message=html_message,
            fail_silently=False
        )
        logger.info(f"KYC result email sent to {shop.owner.email}")
    except Exception as e:
        logger.error(f"Failed to send KYC email to {shop.owner.email}: {e}")
