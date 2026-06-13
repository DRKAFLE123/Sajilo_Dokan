export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <img src="/logo.png" alt="Sajilo Dokan" className="h-10 w-10 object-contain" />
            <span className="font-black text-xl text-white tracking-tighter">Sajilo<span className="text-indigo-400">Dokan</span></span>
          </div>
          <p className="text-sm text-gray-400">
            Empowering local businesses and connecting them with their community.
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-white mb-4">For Customers</h3>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-white">Browse Shops</a></li>
            <li><a href="#" className="hover:text-white">Categories</a></li>
            <li><a href="#" className="hover:text-white">Store Pickup</a></li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-white mb-4">For Shop Owners</h3>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-white">Open a Shop</a></li>
            <li><a href="#" className="hover:text-white">Seller Dashboard</a></li>
            <li><a href="#" className="hover:text-white">Pricing</a></li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-white mb-4">Support</h3>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-white">Help Center</a></li>
            <li><a href="#" className="hover:text-white">Contact Us</a></li>
            <li><a href="#" className="hover:text-white">Terms of Service</a></li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-gray-800 text-sm text-center text-gray-400">
        &copy; {new Date().getFullYear()} Sajilo Dokan. All rights reserved.
      </div>
    </footer>
  );
}
