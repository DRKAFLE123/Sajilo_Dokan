"use client";
import React, { useState, useEffect } from 'react';
import { api } from '@/lib/apiClient';
import { 
  Users, Search, ShieldCheck, ShieldAlert, Trash2, 
  UserCheck, UserMinus, Mail, Phone, Calendar, Filter
} from 'lucide-react';

interface User {
  id: number;
  username: string;
  email: string;
  user_type: number;
  phone_number: string;
  is_verified: boolean;
  is_active: boolean;
  date_joined: string;
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<number | 'all'>('all');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users/');
      setUsers(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch (err) {
      console.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (id: number) => {
    setActionLoading(id);
    try {
      await api.post(`/users/${id}/toggle_active/`);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, is_active: !u.is_active } : u));
    } catch (err) {
      console.error('Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const toggleVerified = async (id: number) => {
    setActionLoading(id);
    try {
      await api.post(`/users/${id}/toggle_verified/`);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, is_verified: !u.is_verified } : u));
    } catch (err) {
      console.error('Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.username.toLowerCase().includes(search.toLowerCase()) || 
                         u.email.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || u.user_type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-1">Sajilo Platform</p>
        <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-3">
          User Management
          <span className="text-base bg-indigo-100 text-indigo-600 font-black rounded-full px-3 py-0.5">
            {filteredUsers.length}
          </span>
        </h1>
        <p className="text-gray-500 mt-1">Manage platform-wide users, verify identities, and handle suspensions.</p>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search username or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition shadow-sm"
          />
        </div>
        
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-gray-200 shadow-sm">
          {[
            { label: 'All', value: 'all' },
            { label: 'Customers', value: 1 },
            { label: 'Shop Owners', value: 2 },
          ].map(opt => (
            <button
              key={opt.label}
              onClick={() => setTypeFilter(opt.value as any)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                typeFilter === opt.value ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-wider text-gray-400">User</th>
                  <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-wider text-gray-400">Role</th>
                  <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-wider text-gray-400">Status</th>
                  <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-wider text-gray-400">Joined</th>
                  <th className="text-right px-6 py-4 text-[10px] font-black uppercase tracking-wider text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-medium italic">No users found matching your criteria.</td>
                  </tr>
                ) : filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center font-black text-indigo-600 text-sm">
                          {user.username[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{user.username}</p>
                          <p className="text-xs text-gray-400 flex items-center gap-1"><Mail size={10} /> {user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${
                        user.user_type === 2 ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'
                      }`}>
                        {user.user_type === 2 ? 'Shop Owner' : 'Customer'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                          <div className={`h-1.5 w-1.5 rounded-full ${user.is_active ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`} />
                          <span className="text-xs font-bold text-gray-700">{user.is_active ? 'Active' : 'Suspended'}</span>
                        </div>
                        {user.is_verified && (
                          <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-600">
                            <ShieldCheck size={10} /> Verified
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-gray-500">
                      {new Date(user.date_joined).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition">
                        <button 
                          onClick={() => toggleVerified(user.id)}
                          disabled={actionLoading === user.id}
                          className={`p-2 rounded-xl transition ${
                            user.is_verified ? 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100' : 'text-gray-400 hover:bg-gray-100 hover:text-indigo-600'
                          }`}
                          title={user.is_verified ? "Unverify User" : "Verify User"}
                        >
                          <ShieldCheck size={18} />
                        </button>
                        <button 
                          onClick={() => toggleActive(user.id)}
                          disabled={actionLoading === user.id}
                          className={`p-2 rounded-xl transition ${
                            user.is_active ? 'text-red-400 hover:bg-red-50 hover:text-red-600' : 'text-green-500 bg-green-50 hover:bg-green-100'
                          }`}
                          title={user.is_active ? "Suspend User" : "Activate User"}
                        >
                          {user.is_active ? <UserMinus size={18} /> : <UserCheck size={18} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
