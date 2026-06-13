"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/apiClient';

interface Category {
  id: number;
  name: string;
}

interface Subcategory {
  id: number;
  name: string;
  category: number;
}

interface ChildCategory {
  id: number;
  name: string;
  subcategory: number;
}

export default function ManageSubcategoriesPage() {
  const { isAuthenticated } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [childCategories, setChildCategories] = useState<ChildCategory[]>([]);
  
  const [newSubcatName, setNewSubcatName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | ''>('');

  const [newChildName, setNewChildName] = useState('');
  const [selectedParentSubcategory, setSelectedParentSubcategory] = useState<number | ''>('');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [catRes, subcatRes, childRes] = await Promise.all([
        api.get('/product-categories/'),
        api.get('/product-subcategories/'),
        api.get('/product-child-categories/')
      ]);
      setCategories(catRes.data.results || catRes.data);
      setSubcategories(subcatRes.data.results || subcatRes.data);
      setChildCategories(childRes.data.results || childRes.data);
    } catch (err) {
      console.error("Failed to fetch data", err);
      setError("Failed to load categories.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory || !newSubcatName.trim()) {
      setError("Please select a category and enter a subcategory name.");
      return;
    }

    setError('');
    setSuccess('');
    
    try {
      const res = await api.post('/product-subcategories/', {
        name: newSubcatName,
        category: selectedCategory
      });
      
      setSuccess("Subcategory added successfully!");
      setNewSubcatName('');
      
      // Refresh the list
      setSubcategories([...subcategories, res.data]);
    } catch (err: any) {
      setError(err.response?.data?.name?.[0] || "Failed to add subcategory.");
    }
  };

  const handleAddChildCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParentSubcategory || !newChildName.trim()) {
      setError("Please select a subcategory and enter a child category name.");
      return;
    }

    setError('');
    setSuccess('');
    
    try {
      const res = await api.post('/product-child-categories/', {
        name: newChildName,
        subcategory: selectedParentSubcategory
      });
      
      setSuccess("Child category added successfully!");
      setNewChildName('');
      
      // Refresh the list
      setChildCategories([...childCategories, res.data]);
    } catch (err: any) {
      setError(err.response?.data?.name?.[0] || "Failed to add child category.");
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Manage Categories</h1>
        <p className="text-gray-500 text-sm mt-1">Create subcategories and child categories for your products. Note: Categories created here will be private and available only for your shop.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Add New Subcategory Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Add New Subcategory</h2>
            
            {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}
            {success && <div className="mb-4 p-3 bg-green-50 text-green-600 text-sm rounded-lg">{success}</div>}
            
            <form onSubmit={handleAddSubcategory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parent Category <span className="text-red-500">*</span></label>
                <select 
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(Number(e.target.value) || '')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white"
                >
                  <option value="">-- Select Category --</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subcategory Name <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  value={newSubcatName}
                  onChange={(e) => setNewSubcatName(e.target.value)}
                  placeholder="E.g., Smartphones, Laptops..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              
              <button 
                type="submit" 
                className="w-full bg-[#FF6A00] text-white rounded-lg py-2 font-medium hover:bg-[#e55f00] transition"
              >
                Add Subcategory
              </button>
            </form>
          </div>
        </div>

        {/* Existing Subcategories List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">Existing Subcategories</h2>
              <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-bold">
                {subcategories.length} total
              </span>
            </div>
            
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-white border-b border-gray-100 text-gray-700 font-semibold sticky top-0">
                  <tr>
                    <th className="py-3 px-4">Subcategory Name</th>
                    <th className="py-3 px-4">Parent Category</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {subcategories.length > 0 ? (
                    subcategories.map(sub => {
                      const parentCat = categories.find(c => c.id === sub.category);
                      return (
                        <tr key={sub.id} className="hover:bg-gray-50/50">
                          <td className="py-3 px-4 font-medium text-gray-800">{sub.name}</td>
                          <td className="py-3 px-4 text-indigo-600">{parentCat?.name || `ID: ${sub.category}`}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={2} className="py-8 text-center text-gray-400">
                        No subcategories found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Add New Child Category Form */}
        <div className="lg:col-span-1 mt-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Add New Child Category</h2>
            
            <form onSubmit={handleAddChildCategory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parent Subcategory <span className="text-red-500">*</span></label>
                <select 
                  value={selectedParentSubcategory}
                  onChange={(e) => setSelectedParentSubcategory(Number(e.target.value) || '')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white"
                >
                  <option value="">-- Select Subcategory --</option>
                  {subcategories.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Child Category Name <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  value={newChildName}
                  onChange={(e) => setNewChildName(e.target.value)}
                  placeholder="E.g., Chargers, Shirts..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              
              <button 
                type="submit" 
                className="w-full bg-[#FF6A00] text-white rounded-lg py-2 font-medium hover:bg-[#e55f00] transition"
              >
                Add Child Category
              </button>
            </form>
          </div>
        </div>

        {/* Existing Child Categories List */}
        <div className="lg:col-span-2 mt-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">Existing Child Categories</h2>
              <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-bold">
                {childCategories.length} total
              </span>
            </div>
            
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-white border-b border-gray-100 text-gray-700 font-semibold sticky top-0">
                  <tr>
                    <th className="py-3 px-4">Child Category Name</th>
                    <th className="py-3 px-4">Parent Subcategory</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {childCategories.length > 0 ? (
                    childCategories.map(child => {
                      const parentSub = subcategories.find(s => s.id === child.subcategory);
                      return (
                        <tr key={child.id} className="hover:bg-gray-50/50">
                          <td className="py-3 px-4 font-medium text-gray-800">{child.name}</td>
                          <td className="py-3 px-4 text-indigo-600">{parentSub?.name || `ID: ${child.subcategory}`}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={2} className="py-8 text-center text-gray-400">
                        No child categories found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
