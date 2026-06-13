# Sajilo Dokan (Sajilo Dokan) — Local Connect Marketplace

*Sajilo Dokan* is a comprehensive multi-vendor SaaS platform connecting local shop owners with customers throughout Nepal. The platform enables online storefronts, real-time communication, and local geolocation-based shopping.

## Tech Stack

- **Backend:** Python 3.x, Django 5.0.6, Django REST Framework
- **Database:** MySQL (Local Dev) / Postgres (Prod)
- **Real-time Communication:** Django Channels, Redis
- **Frontend:** React, Next.js 14 (App Router), Tailwind CSS
- **Media/Storage:** Cloudflare R2 / Cloudinary

---

## Key Features

### 1. High-Performance Geolocation Search (SaaS Scale)
- **SQL Bounding Box Pre-filtering**: Geolocation proximity search is optimized using database-level lat/lon boundaries. Full-table Haversine logic loops are bypassed by doing direct database indexing lookups.
- **Delayed Serialization**: Search results are scored and sorted as raw DB models. Django REST Framework serializers run *only* on the paginated page slice (e.g., 20 items), preventing CPU/memory spikes under heavy traffic.
- **Optimized SQL Joins**: Integrated `select_related` and `prefetch_related` on ViewSets and search routes, reducing queries per request to a single digits (eliminates N+1 query bottlenecks).

### 2. Nepal Administrative Divisions (Shop World)
- Structured geolocation mappings tailored specifically for Nepal:
  - `Province` -> `District` -> `City` -> `Ward` -> `Street` -> `MarketHub`.
- Allows buyers to walk through localized streets and virtual bazaars.

### 3. Tiered Verification Seals
- **Identity Verified Badge** (Silver/Blue) for individual sellers who complete personal KYC.
- **Business Verified Badge** (Gold/Green) for stores submitting verified corporate/PAN/VAT registration credentials.
- Promotes trust and filters fraudulent shops.

### 4. Wholesale Pricing & Minimum Order Quantity (MOQ)
- Supports wholesale listing configurations with custom `wholesale_price` and `min_order_quantity` requirements.
- Cart and checkout processes dynamically enforce shop verification levels and MOQ limits before order placement.

### 5. Interactive Reviews & Star Ratings
- Integrated star-rating systems and comments for both **Products** and **Shops** directly in Next.js.
- Dynamically recalculates average ratings and review counts at the database level.

---

## Schema Indexes

Optimized search and sorting queries by introducing target database indexes:
- **`Shop` Indexes**:
  - `shop_lat_lng_idx` -> Compound index on `(latitude, longitude)` for spatial boundary checks.
  - `shop_featured_created_idx` -> Sorting index on `(is_featured, created_at)`.
  - `shop_sponsored_created_idx` -> Sorting index on `(is_sponsored, created_at)`.
  - `shop_created_idx` -> Index on `created_at`.
- **`Product` Indexes**:
  - `prod_mod_created_idx` -> Compound index on `(moderation_status, created_at)`.
  - `prod_price_idx` -> Index on `selling_price`.
  - `prod_featured_spons_idx` -> Composite index on `(is_featured, is_sponsored, created_at)`.
  - `prod_created_idx` -> Index on `created_at`.

---

## Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/DRKAFLE123/Sajilo_Dokan.git
   cd local_connect_marketplace
   ```

2. **Create and activate a virtual environment:**
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Database Migration:**
   Ensure MySQL is running (e.g., via XAMPP) and run:
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

5. **Seed Geolocation & Store Data:**
   Initialize geographic administrative divisions and shop categories:
   ```bash
   python seed_shop_world.py
   python seed_full_categories.py
   ```

6. **Start Backend Server:**
   ```bash
   python manage.py runserver
   ```

7. **Start Frontend Next.js Server:**
   Navigate to the frontend folder and launch:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## License
MIT License
