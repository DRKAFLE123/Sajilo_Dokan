"use client";
import React, { useState } from 'react';
import Link from 'next/link';

export default function SubAccountsPage() {
  const [activeTab, setActiveTab] = useState('sub-accounts');

  const subAccounts = [
    { id: 1, name: '*******027', email: 'drkafle@gmail.com', roles: 'Seller Full Access', status: true, isOwner: true }
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="text-sm text-gray-500 flex gap-2 mb-2">
            <Link href="/" className="hover:text-indigo-600">Homepage</Link> &gt; 
            <span>Setting</span> &gt; 
            <span className="font-bold text-gray-800">Manage Sub Accounts</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Sub Accounts</h1>
        </div>
        <div className="flex gap-4">
          <button className="px-4 py-2 border border-[#FF6A00] text-[#FF6A00] rounded hover:bg-orange-50 font-medium text-sm transition-colors">
            Add Sub Account
          </button>
          <button className="px-4 py-2 border border-[#FF6A00] text-[#FF6A00] rounded hover:bg-orange-50 font-medium text-sm transition-colors">
            Add New Role
          </button>
        </div>
      </div>

      <div className="border-b border-gray-200 mb-6 flex gap-6">
        <button 
          className={`pb-3 font-medium text-sm ${activeTab === 'sub-accounts' ? 'text-[#FF6A00] border-b-2 border-[#FF6A00]' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('sub-accounts')}
        >
          Manage Sub Accounts
        </button>
        <button 
          className={`pb-3 font-medium text-sm ${activeTab === 'roles' ? 'text-[#FF6A00] border-b-2 border-[#FF6A00]' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('roles')}
        >
          Manage Roles
        </button>
      </div>

      {activeTab === 'sub-accounts' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex justify-end gap-3 mb-4">
            <select className="border border-gray-300 rounded px-3 py-1.5 text-sm text-gray-600 outline-none focus:border-[#FF6A00]">
              <option>Roles</option>
              <option>Seller Full Access</option>
            </select>
            <select className="border border-gray-300 rounded px-3 py-1.5 text-sm text-gray-600 outline-none focus:border-[#FF6A00]">
              <option>Status</option>
              <option>Active</option>
              <option>Inactive</option>
            </select>
            <input 
              type="text" 
              placeholder="Email" 
              className="border border-gray-300 rounded px-3 py-1.5 text-sm outline-none focus:border-[#FF6A00] w-64"
            />
            <button className="px-4 py-1.5 border border-gray-300 text-gray-600 rounded text-sm hover:bg-gray-50">
              Reset
            </button>
            <button className="px-4 py-1.5 bg-[#FF6A00] text-white rounded text-sm font-medium hover:bg-[#e55f00] transition">
              Search
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 border-b border-t border-gray-100 text-gray-700 font-semibold">
                <tr>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Roles</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Is Owner Account ⓘ</th>
                  <th className="py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {subAccounts.map((account) => (
                  <tr key={account.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-4 px-4">{account.name}</td>
                    <td className="py-4 px-4">{account.email}</td>
                    <td className="py-4 px-4 text-blue-600 cursor-pointer hover:underline">{account.roles}</td>
                    <td className="py-4 px-4">
                      <div className={`w-10 h-5 rounded-full relative cursor-pointer ${account.status ? 'bg-blue-100' : 'bg-gray-200'}`}>
                        <div className={`w-4 h-4 rounded-full bg-blue-500 absolute top-0.5 transition-all ${account.status ? 'right-0.5' : 'left-0.5 bg-white'}`}></div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      {account.isOwner && (
                        <div className="inline-flex items-center justify-center w-5 h-5 rounded-full border border-green-500 text-green-500 text-xs">
                          ✓
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4 text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-800 mr-3">Modify</button>
                      <button className="text-red-500 hover:text-red-700">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-2 mt-4 text-sm">
            <button className="text-gray-400 cursor-not-allowed flex items-center">&lt; Previous</button>
            <button className="w-6 h-6 rounded bg-[#FF6A00] text-white flex items-center justify-center">1</button>
            <button className="text-gray-400 cursor-not-allowed flex items-center">Next &gt;</button>
          </div>
        </div>
      )}

      {activeTab === 'roles' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 text-center text-gray-500">
          <p>Role management interface will be displayed here.</p>
          <button 
            onClick={() => setActiveTab('sub-accounts')}
            className="mt-4 text-[#FF6A00] hover:underline"
          >
            Go back to Sub Accounts
          </button>
        </div>
      )}
    </div>
  );
}
