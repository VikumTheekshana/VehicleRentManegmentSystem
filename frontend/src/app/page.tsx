'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Car,
  ShieldCheck,
  Radio,
  Zap,
  CheckCircle2,
  Lock,
  ArrowRight,
  Sparkles,
  Users,
  Compass,
  FileText,
  KeyRound,
  ExternalLink,
} from 'lucide-react';
import { API_BASE, setAuthSession } from '@/lib/api';

export default function LandingPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [loadingRole, setLoadingRole] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/fleet`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setVehicles(data);
      })
      .catch((err) => console.error('Failed to load fleet:', err));
  }, []);

  const handleQuickLogin = async (email: string, password: string, roleName: string) => {
    setLoadingRole(roleName);
    setErrorMsg(null);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');

      setAuthSession(data.accessToken, data.user);
      router.push('/dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication error');
    } finally {
      setLoadingRole(null);
    }
  };

  const categories = ['ALL', 'SUV', 'LUXURY', 'VAN', 'SEDAN', 'COMPACT'];

  const filteredVehicles =
    selectedCategory === 'ALL'
      ? vehicles
      : vehicles.filter((v) => v.category === selectedCategory);

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 flex flex-col">
      {/* Top Bar */}
      <header className="border-b border-slate-800/80 bg-[#090e18]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Car className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-blue-300 bg-clip-text text-transparent">
                ApexFleet VMS
              </span>
              <span className="hidden sm:inline-block ml-2 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Enterprise v1.0
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="hidden md:flex items-center space-x-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Atlas M0 Replica Set Live</span>
            </div>

            <a
              href="http://localhost:5000/api/docs"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-slate-700/80 hover:bg-slate-800 transition flex items-center space-x-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span>Swagger API</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>

            <button
              onClick={() => handleQuickLogin('admin@vms.com', 'Admin@12345', 'SUPER_ADMIN')}
              className="text-xs font-medium px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition shadow-lg shadow-blue-600/20 flex items-center space-x-1.5"
            >
              <span>Admin Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-blue-500/30 text-blue-300">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Autonomous Enterprise Vehicle Rental Architecture</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Intelligent Fleet Operations &{' '}
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-teal-300 bg-clip-text text-transparent">
              Zero-Double-Booking
            </span>{' '}
            Rental Core
          </h1>

          <p className="text-slate-400 text-base sm:text-lg">
            Engineered with NestJS micro-modular services, MongoDB Atlas transactions, real-time WebSocket GPS telemetry, 360° digital damage coordinate inspection, and automated settlement billing.
          </p>

          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-lg text-sm max-w-md mx-auto">
              {errorMsg}
            </div>
          )}
        </div>

        {/* 1-Click Role Switcher */}
        <div className="mt-10 p-6 glass-card rounded-2xl border border-slate-800 shadow-2xl max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <KeyRound className="w-5 h-5 text-amber-400" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
                1-Click Interactive Role Switcher (Pre-Seeded Credentials)
              </h2>
            </div>
            <span className="text-xs text-slate-400">Click any role to test live</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { role: 'SUPER_ADMIN', name: 'SuperAdmin (CEO)', email: 'admin@vms.com', pass: 'Admin@12345', color: 'from-purple-600 to-indigo-600', badge: 'Full Clearance' },
              { role: 'FLEET_MANAGER', name: 'Fleet Manager', email: 'manager@vms.com', pass: 'Manager@12345', color: 'from-blue-600 to-cyan-600', badge: 'Fleet & Telemetry' },
              { role: 'AGENT', name: 'Rental Agent', email: 'agent@vms.com', pass: 'Agent@12345', color: 'from-emerald-600 to-teal-600', badge: 'Handover / Inspect' },
              { role: 'MECHANIC', name: 'Lead Mechanic', email: 'mechanic@vms.com', pass: 'Mechanic@12345', color: 'from-amber-600 to-orange-600', badge: 'Work Orders' },
              { role: 'CUSTOMER', name: 'VIP Customer', email: 'customer@vms.com', pass: 'Customer@12345', color: 'from-rose-600 to-pink-600', badge: 'Client Portal' },
            ].map((btn) => (
              <button
                key={btn.role}
                onClick={() => handleQuickLogin(btn.email, btn.pass, btn.role)}
                disabled={loadingRole !== null}
                className="group p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 hover:bg-slate-850 text-left transition flex flex-col justify-between h-24 hover:scale-[1.02]"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white group-hover:text-blue-400 transition">
                      {btn.name}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 truncate block mt-0.5">{btn.email}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {btn.badge}
                  </span>
                  <span className="text-[10px] text-blue-400 font-semibold group-hover:translate-x-0.5 transition">
                    {loadingRole === btn.role ? '...' : '→'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Feature Highlights Pills */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 max-w-5xl mx-auto">
          {[
            { icon: ShieldCheck, title: 'Zero Double-Booking', desc: 'ACID MongoDB Replica Set Transactions', color: 'text-emerald-400' },
            { icon: Radio, title: 'Real-Time Telemetry', desc: 'Live WebSocket GPS & Remote Immobilizer', color: 'text-blue-400' },
            { icon: Compass, title: '360° Damage Logging', desc: 'Coordinate pinpoint coordinate mapping', color: 'text-amber-400' },
            { icon: Lock, title: 'AES-256-GCM FLE', desc: 'Client PII encrypted at rest & masked in UI', color: 'text-indigo-400' },
          ].map((f, i) => (
            <div key={i} className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80 flex items-start space-x-3">
              <f.icon className={`w-5 h-5 ${f.color} flex-shrink-0 mt-0.5`} />
              <div>
                <h4 className="text-xs font-bold text-white">{f.title}</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Fleet Catalog Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full flex-1">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white">Live Enterprise Fleet Catalog</h2>
            <p className="text-sm text-slate-400 mt-1">Available vehicles ready for instant atomic reservation</p>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Vehicles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredVehicles.map((v) => (
            <div
              key={v._id}
              className="glass-card rounded-2xl overflow-hidden border border-slate-800/80 flex flex-col justify-between glass-card-hover group"
            >
              <div className="relative h-44 w-full bg-slate-900 overflow-hidden">
                <img
                  src={v.imageUrl}
                  alt={`${v.make} ${v.model}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute top-3 left-3 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900/90 backdrop-blur-md text-slate-200 border border-white/10 uppercase">
                  {v.category}
                </div>
                <div
                  className={`absolute top-3 right-3 px-2 py-0.5 rounded text-[10px] font-bold uppercase backdrop-blur-md ${
                    v.status === 'AVAILABLE'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : v.status === 'RENTED'
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {v.status}
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-base text-white group-hover:text-blue-400 transition truncate">
                    {v.make} {v.model}
                  </h3>
                  <div className="flex items-center space-x-2 text-xs text-slate-400 mt-1">
                    <span>{v.year}</span>
                    <span>•</span>
                    <span>{v.fuelType}</span>
                    <span>•</span>
                    <span>{v.transmission}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-1">
                    Plate: {v.licensePlate}
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Daily Rate</div>
                    <div className="text-base font-extrabold text-white">
                      LKR {v.dailyRate?.toLocaleString()}
                    </div>
                  </div>

                  <button
                    onClick={() => handleQuickLogin('customer@vms.com', 'Customer@12345', 'CUSTOMER')}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow transition"
                  >
                    Reserve
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#06090f] py-8 text-center text-xs text-slate-500">
        <p>
          Architected by <span className="text-slate-300 font-medium">Vikum Theekshana Dahanayake</span> • Enterprise Vehicle Rental & Fleet Management System (VMS)
        </p>
        <p className="mt-1">
          NestJS • Next.js 14 App Router • MongoDB Atlas M0 Replica Set • WebSockets Telemetry • AES-256-GCM
        </p>
      </footer>
    </div>
  );
}
