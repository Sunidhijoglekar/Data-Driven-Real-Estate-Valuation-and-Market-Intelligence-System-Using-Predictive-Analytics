import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2, Building2, Sparkles } from 'lucide-react';

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 space-y-12">
      
      {/* Header Banner */}
      <div className="max-w-4xl mx-auto text-center space-y-3">
        <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 px-3.5 py-1 rounded-full text-xs font-bold">
          <Mail className="w-3.5 h-3.5 text-blue-600" />
          Get in Touch
        </div>
        <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Contact RealEstate<span className="text-blue-600">.AI</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
          Have questions about property valuations, live auctions, or market analytics? Our team is here to assist you.
        </p>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Contact Info Sidebar */}
        <div className="md:col-span-5 bg-gradient-to-br from-slate-900 to-blue-950 text-white p-8 rounded-3xl shadow-xl space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="font-heading font-bold text-lg block leading-tight">RealEstate.AI</span>
              <span className="text-[10px] text-blue-300 font-semibold uppercase tracking-wider">Market Intelligence System</span>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Reach out to our real estate intelligence specialists for support with buyer searches, seller auction listings, or investor data API access.
          </p>

          <div className="space-y-4 pt-2 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-blue-400 shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Email Us</span>
                <span className="font-medium text-slate-200">support@realestate.ai</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-blue-400 shrink-0">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Call Us</span>
                <span className="font-medium text-slate-200">+91 1800 266 8900</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-blue-400 shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Headquarters</span>
                <span className="font-medium text-slate-200">Tech Park, Whitefield, Bengaluru, KA 560066</span>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="md:col-span-7 bg-white p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <h2 className="font-heading text-xl font-extrabold text-slate-900">Send Us a Message</h2>

          {submitted ? (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-emerald-900 text-sm">Thank You for Reaching Out!</h3>
              <p className="text-xs text-emerald-700">
                Your message has been received. Our support team will get back to you shortly.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-2 text-xs font-bold text-emerald-800 underline cursor-pointer"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Your Name</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="Sunidhi Joglekar"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Email Address</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Subject</label>
                <input
                  type="text"
                  required
                  value={form.subject}
                  onChange={e => setForm({ ...form, subject: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="Inquiry regarding auction pass or ML valuation"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Message</label>
                <textarea
                  rows={4}
                  required
                  value={form.message}
                  onChange={e => setForm({ ...form, message: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="Type your query here..."
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Send Message</span>
              </button>
            </form>
          )}
        </div>

      </div>

    </div>
  );
}
