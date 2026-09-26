'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/navigation';
import { usePathname, useRouter } from 'next/navigation';
import {
  Car,
  LayoutDashboard,
  CalendarDays,
  ClipboardCheck,
  Radio,
  Receipt,
  ShieldAlert,
  LogOut,
  FileCode2,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react';
import { getStoredUser, clearAuthSession } from '@/lib/api';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) {
      router.push('/');
    } else {
      setUser(stored);
    }
  }, [router]);

  const handleLogout = () => {
    clearAuthSession();
    router.push('/');
  };

  const navItems = [
    { label: 'Executive Overview', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Fleet Management', href: '/dashboard/fleet', icon: Car },
    { label: 'Atomic Reservations', href: '/dashboard/reservations', icon: CalendarDays },
    { label: '360° Damage Inspection', href: '/dashboard/inspections', icon: ClipboardCheck },
    { label: 'Live GPS Telemetry', href: '/dashboard/telemetry', icon: Radio },
    { label: 'Billing & PDF Invoices', href: '/dashboard/billing', icon: Receipt },
    { label: 'Forensic Audit Trail', href: '/dashboard/audit', icon: ShieldAlert },
  ];

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-slate-800/80 bg-[#090d16] p-4 justify-between sticky top-0 h-screen">
        <div className="space-y-6">
          {/* Brand */}
          <div className="flex items-center space-x-3 px-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Car className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-base bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">
                ApexFleet VMS
              </span>
              <span className="block text-[10px] text-blue-400 font-mono">Zero-Trust Core</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                    active
                      ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-blue-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Card & Logout */}
        <div className="pt-4 border-t border-slate-800/80 space-y-3">
          <a
            href="http://localhost:5000/api/docs"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white hover:border-slate-700 transition"
          >
            <div className="flex items-center space-x-2">
              <FileCode2 className="w-4 h-4 text-blue-400" />
              <span>Swagger API Docs</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
          </a>

          {user && (
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white truncate max-w-[120px]">
                  {user.fullName}
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {user.role}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 truncate block mt-0.5">{user.email}</span>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out Session</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <div className="lg:hidden border-b border-slate-800 bg-[#090d16] p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Car className="w-5 h-5 text-blue-400" />
            <span className="font-bold text-sm text-white">ApexFleet VMS</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-slate-800 text-slate-300"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden bg-slate-900 border-b border-slate-800 p-4 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.href}
                onClick={() => {
                  router.push(item.href);
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800"
              >
                {item.label}
              </button>
            ))}
            <button
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 rounded-lg text-sm text-rose-400 hover:bg-rose-500/10"
            >
              Sign Out
            </button>
          </div>
        )}

        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">{children}</main>
      </div>
    </div>
  );
}
