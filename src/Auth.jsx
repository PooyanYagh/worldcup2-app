import React, { useState } from 'react';
import { supabase } from './supabaseClient';

export default function Auth({ onLoginSuccess }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) return;

    setLoading(true);
    
    let { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('first_name', firstName.trim())
      .eq('last_name', lastName.trim())
      .maybeSingle();

    if (!profile && !error) {
      const { data: newProfile } = await supabase
        .from('profiles')
        .insert([{ first_name: firstName.trim(), last_name: lastName.trim() }])
        .select()
        .single();
        
      profile = newProfile;
    }

    setLoading(false);

    if (profile) {
      localStorage.setItem('worldcup_user', JSON.stringify(profile));
      onLoginSuccess(profile);
    } else {
      alert('خطایی رخ داد، مجدداً تلاش کنید.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-4">
      <div className="w-full max-w-md bg-slate-800 p-6 rounded-2xl shadow-xl border border-slate-700">
        <h1 className="text-2xl font-black text-center mb-2 text-amber-400">پیش‌بینی جام جهانی ۲۰۲۶</h1>
        <p className="text-sm text-slate-400 text-center mb-6">نام و فامیل خودت رو وارد کن تا وارد مسابقه بشی</p>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">نام</label>
            <input 
              type="text" 
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-400 text-right"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">نام خانوادگی</label>
            <input 
              type="text" 
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-400 text-right"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-slate-700 text-slate-950 font-bold py-3 rounded-xl transition duration-200"
          >
            {loading ? 'در حال ورود...' : 'ورود به برنامه'}
          </button>
        </form>
      </div>
    </div>
  );
}