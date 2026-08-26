import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, UserCheck, Lock, Mail, ArrowRight } from 'lucide-react';
import { apiService } from '../services/api';

export default function Login({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [role, setRole] = useState('Buyer');
  const [email, setEmail] = useState('buyer@example.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    if (selectedRole === 'Buyer') setEmail('buyer@example.com');
    if (selectedRole === 'Seller') setEmail('seller@apexrealty.com');
    if (selectedRole === 'Investor') setEmail('investor@example.com');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await apiService.login({ role, email, password });
      onLoginSuccess(res.user);

      if (role === 'Buyer') navigate('/buyer');
      else if (role === 'Seller') navigate('/seller');
      else if (role === 'Investor') navigate('/investor');
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 via-slate-100/50 to-slate-50">
      <div className="max-w-md w-full space-y-6">
        
        {/* Title Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white mx-auto shadow-lg shadow-blue-500/20">
            <Building2 className="w-7 h-7" />
          </div>
          <h1 className="font-heading text-2xl font-extrabold text-slate-900 tracking-tight">
            Apex<span className="text-blue-600">Realty</span> Portal
          </h1>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Commercial Real Estate Valuation & Market Intelligence Platform
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6">
          
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Login As Selector */}
            <div>
              <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-2">
                Login As Role
              </label>

              <div className="grid grid-cols-3 gap-2">
                {['Buyer', 'Seller', 'Investor'].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => handleRoleSelect(r)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                      role === r
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 ring-2 ring-blue-600 ring-offset-1'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <UserCheck className="w-4 h-4" />
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="Enter email..."
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="Enter password..."
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>Login to {role} Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Access Switcher */}
          <div className="pt-4 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block text-center mb-2">
              Quick One-Click Demo Personas
            </span>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => { handleRoleSelect('Buyer'); }}
                className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-[11px] font-semibold text-center border border-blue-200/60 cursor-pointer"
              >
                Buyer Portal
              </button>
              <button
                type="button"
                onClick={() => { handleRoleSelect('Seller'); }}
                className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-[11px] font-semibold text-center border border-emerald-200/60 cursor-pointer"
              >
                Seller Portal
              </button>
              <button
                type="button"
                onClick={() => { handleRoleSelect('Investor'); }}
                className="p-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-[11px] font-semibold text-center border border-purple-200/60 cursor-pointer"
              >
                Investor Portal
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
