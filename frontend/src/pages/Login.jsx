import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, UserCheck, Lock, Mail, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { apiService } from '../services/api';

const roleDescriptions = {
  Buyer: 'Browse auctions, request access and place approved bids.',
  Seller: 'Manage your properties, approve buyer requests and control auctions.',
  Investor: 'Explore property valuations and market intelligence.'
};

export default function Login({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [registering, setRegistering] = useState(false);
  const [role, setRole] = useState('Buyer');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const changeMode = value => {
    setRegistering(value); setError(''); setPassword(''); setConfirmation('');
  };
  const handleSubmit = async event => {
    event.preventDefault();
    setError('');
    if (registering && password !== confirmation) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      const { user } = await apiService[registering ? 'register' : 'login']({ role, email: email.trim().toLowerCase(), password, ...(registering ? { name: name.trim() } : {}) });
      onLoginSuccess(user);
      navigate({ Buyer: '/buyer', Seller: '/seller', Investor: '/investor' }[user.role], { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to sign in. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white mx-auto"><Building2 className="w-7 h-7" /></div>
          <h1 className="font-heading text-2xl font-extrabold text-slate-900">Apex<span className="text-blue-600">Realty</span> Portal</h1>
          <p className="text-xs text-slate-500">Sign in to your account or create one to get started.</p>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-5">
          <div className="grid grid-cols-2 gap-2" aria-label="Account access">
            <button type="button" disabled={loading} onClick={() => changeMode(false)} aria-pressed={!registering} className={`rounded-xl py-2 text-sm font-bold ${!registering ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}>Sign in</button>
            <button type="button" disabled={loading} onClick={() => changeMode(true)} aria-pressed={registering} className={`rounded-xl py-2 text-sm font-bold ${registering ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}>Create account</button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <fieldset disabled={loading} className="space-y-4">
              <legend className="text-xs font-extrabold uppercase text-slate-700 mb-2">{registering ? 'Choose your account role' : 'Choose your portal'}</legend>
              <div className="grid grid-cols-3 gap-2">
                {Object.keys(roleDescriptions).map(value => <button key={value} type="button" aria-pressed={role === value} onClick={() => { setRole(value); setError(''); }} className={`py-2.5 rounded-xl text-xs font-bold flex flex-col items-center gap-1 ${role === value ? 'bg-blue-600 text-white' : 'bg-slate-50 border text-slate-600'}`}><UserCheck className="w-4 h-4" />{value}</button>)}
              </div>
              <p className="text-xs text-slate-500">{roleDescriptions[role]}</p>
              {registering && <label className="block text-xs font-bold text-slate-700">Full name
                <input required maxLength={100} autoComplete="name" value={name} onChange={e => setName(e.target.value)} className="mt-1 w-full px-3 py-2.5 bg-slate-50 border rounded-xl" />
              </label>}
              <label className="block text-xs font-bold text-slate-700">Email address
                <div className="relative mt-1"><Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" /><input type="email" required autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your registered email" className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border rounded-xl" /></div>
              </label>
              <label className="block text-xs font-bold text-slate-700" htmlFor="account-password">Password</label>
              <div className="relative"><Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" /><input id="account-password" type={showPassword ? 'text' : 'password'} required minLength={8} autoComplete={registering ? 'new-password' : 'current-password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border rounded-xl text-xs" /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-slate-500">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div>
              {registering && <label className="block text-xs font-bold text-slate-700">Confirm password
                <input type="password" required minLength={8} autoComplete="new-password" value={confirmation} onChange={e => setConfirmation(e.target.value)} className="mt-1 w-full px-3 py-2.5 bg-slate-50 border rounded-xl" />
              </label>}
              {error && <p role="alert" className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold">{error}</p>}
              <button type="submit" className="w-full py-3 bg-blue-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">{loading ? 'Please wait...' : registering ? `Create ${role} account` : `Sign in as ${role}`}<ArrowRight className="w-4 h-4" /></button>
            </fieldset>
          </form>
          <p className="text-xs text-slate-500">Use the role you registered with. Each email belongs to one role. There is no default password.</p>
          <p className="text-xs text-slate-500">Testing buyer and seller together? Open separate tabs and sign in to each account. Each tab keeps its own login.</p>
        </div>
      </div>
    </div>
  );
}
