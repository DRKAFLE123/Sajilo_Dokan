"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { MessageSquare, Zap, Clock } from 'lucide-react';

export default function ChatSettingsPage() {
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(false);
  const [autoReplyMessage, setAutoReplyMessage] = useState("Hi there! Thanks for reaching out. We will get back to you shortly.");
  
  const [quickReplies, setQuickReplies] = useState([
    "Yes, this item is in stock.",
    "Shipping usually takes 2-3 business days.",
    "Please check the description for dimensions."
  ]);
  const [newQuickReply, setNewQuickReply] = useState("");

  const handleAddQuickReply = () => {
    if (newQuickReply.trim()) {
      setQuickReplies([...quickReplies, newQuickReply]);
      setNewQuickReply("");
    }
  };

  const removeQuickReply = (index: number) => {
    setQuickReplies(quickReplies.filter((_, i) => i !== index));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="text-sm text-gray-500 flex gap-2 mb-6">
        <Link href="/" className="hover:text-indigo-600">Homepage</Link> &gt; 
        <span>Setting</span> &gt; 
        <span className="font-bold text-gray-800">Chat Settings</span>
      </div>
      
      <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <MessageSquare className="text-indigo-600" /> Chat Settings
      </h1>
      
      <div className="space-y-6">
        
        {/* Auto Reply Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Clock size={20} className="text-[#FF6A00]" /> Auto Reply
              </h2>
              <p className="text-sm text-gray-500 mt-1">Automatically send a greeting when a customer initiates a chat.</p>
            </div>
            
            <div 
              className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${autoReplyEnabled ? 'bg-[#FF6A00]' : 'bg-gray-300'}`}
              onClick={() => setAutoReplyEnabled(!autoReplyEnabled)}
            >
              <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${autoReplyEnabled ? 'right-0.5' : 'left-0.5'}`}></div>
            </div>
          </div>
          
          {autoReplyEnabled && (
            <div className="mt-4 pt-4 border-t border-gray-100 animate-in fade-in slide-in-from-top-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Auto Reply Message</label>
              <textarea 
                rows={3}
                value={autoReplyMessage}
                onChange={(e) => setAutoReplyMessage(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:border-[#FF6A00] focus:ring-1 focus:ring-[#FF6A00]"
                placeholder="Enter your auto reply message..."
              />
            </div>
          )}
        </div>

        {/* Quick Replies Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Zap size={20} className="text-indigo-600" /> Quick Replies
            </h2>
            <p className="text-sm text-gray-500 mt-1">Save frequently used messages to reply to customers instantly.</p>
          </div>
          
          <div className="space-y-3 mb-6">
            {quickReplies.map((reply, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-50 border border-gray-100 p-3 rounded-lg group">
                <span className="text-sm text-gray-700">{reply}</span>
                <button 
                  onClick={() => removeQuickReply(index)}
                  className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
          
          <div className="flex gap-3">
            <input 
              type="text" 
              value={newQuickReply}
              onChange={(e) => setNewQuickReply(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddQuickReply()}
              placeholder="E.g., Thank you for your purchase!"
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            <button 
              onClick={handleAddQuickReply}
              className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg font-medium text-sm hover:bg-indigo-100 transition"
            >
              Add Shortcut
            </button>
          </div>
        </div>
        
        {/* Save Button */}
        <div className="flex justify-end">
          <button className="px-6 py-2 bg-[#FF6A00] text-white rounded-lg font-medium hover:bg-[#e55f00] transition shadow-sm">
            Save Chat Settings
          </button>
        </div>

      </div>
    </div>
  );
}
