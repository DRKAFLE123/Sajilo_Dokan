import sys
import os
sys.path.append(r"e:\Projects\local_connect_marketplace")
import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "local_connect.settings")
django.setup()

import api.views
import inspect

print("Classes defined in api.views:")
for name, obj in inspect.getmembers(api.views, inspect.isclass):
    if obj.__module__ == 'api.views':
        print(f" - {name}")
