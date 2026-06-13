from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    USER_TYPE_CHOICES = (
        (1, 'Customer'),
        (2, 'Shop Owner'),
    )
    
    user_type = models.PositiveSmallIntegerField(choices=USER_TYPE_CHOICES, default=1)
    phone_number = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    profile_picture = models.ImageField(upload_to='profile_pics/', blank=True)
    is_verified = models.BooleanField(default=False)

    def __str__(self):
        return self.username

    @property
    def is_customer(self):
        return self.user_type == 1

    @property
    def is_shop_owner(self):
        return self.user_type == 2