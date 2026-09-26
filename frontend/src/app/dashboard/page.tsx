'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Car,
  CalendarDays,
  ShieldCheck,
  AlertTriangle,
  Radio,
  FileText,
  DollarSign,
  ArrowUpRight,
  TrendingUp,
  Activity,
  CheckCircle,
  ClipboardCheck,
  Receipt,
  ShieldAlert,
} from 'lucide-react';
import { API_BASE, getStoredUser, apiRequest } from '@/lib/api';

export default function DashboardOverviewPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [expiries, setExpiries] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    setUser(getStoredUser());

    apiRequest('/fleet')
      .then((data) => setVehicles(data || []))
      .catch((err) => console.error(err));

    apiRequest('/reservations')
      .then((data) => setReservations(data || []))
      .catch((err) => console.error(err));

    apiRequest('/fleet/document-expiries?days=30')
      .then((data) => setExpiries(data))
      .catch((err) => console.error(err));
  }, []);

  const totalFleet = vehicles.length;
  const availableCount = vehicles.filter((v) => v.status === 'AVAILABLE').length;
  const rentedCount = vehicles.filter((v) => v.status === 'RENTED').length;
  const maintenanceCount = vehicles.filter((v) => v.status === 'MAINTENANCE').length;
  const activeReservationsCount = reservations.filter((r) => r.status === 'ACTIVE' || r.status === 'CONFIRMED').length;

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Executive Fleet Intelligence</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time telemetry, double-booking prevention guards, and document compliance monitor.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => router.push('/dashboard/reservations')}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 transition flex items-center space-x-1.5"
          >
            <CalendarDays className="w-4 h-4" />
            <span>New Reservation</span>
          </button>
        </div>
      </div>

      {/* Document Expiry Alert Banner */}
      {expiries && (expiries.expiringInsuranceCount > 0 || expiries.expiringRevenueCount > 0) && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <h4 className="font-bold text-amber-300">Statutory Document Expiry Warnings (Next 30 Days)</h4>
            <div className="mt-1 flex flex-wrap gap-3 text-slate-300">
              {expiries.expiringInsurance?.map((v: any) => (
                <span key={v.id} className="bg-amber-950/40 border border-amber-500/20 px-2 py-0.5 rounded font-mono text-[11px]">
                  Insurance: {v.plate} ({v.make} {v.model})
                </span>
              ))}
              {expiries.expiringRevenue?.map((v: any) => (
                <span key={v.id} className="bg-amber-950/40 border border-amber-500/20 px-2 py-0.5 rounded font-mono text-[11px]">
                  Revenue License: {v.plate} ({v.make} {v.model})
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Fleet Size', value: totalFleet, sub: 'All Categories', icon: Car, color: 'text-blue-400' },
          { label: 'Available Vehicles', value: availableCount, sub: 'Ready for Dispatch', icon: CheckCircle, color: 'text-emerald-400' },
          { label: 'Active Rentals On Road', value: rentedCount, sub: 'Live Telemetry Active', icon: Activity, color: 'text-purple-400' },
          { label: 'Active Bookings', value: activeReservationsCount, sub: 'Zero Double-Booking', icon: ShieldCheck, color: 'text-amber-400' },
        ].map((card, idx) => (
          <div key={idx} className="p-5 glass-card rounded-2xl border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">{card.label}</span>
              <card.icon className={`w-4 h-4 ${card.color}`} />
            </div>
            <div className="mt-4">
              <div className="text-2xl font-black text-white">{card.value}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{card.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Launchpad Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            title: 'Fleet Management',
            desc: 'View vehicle inventory, specifications, odometer readings, and toggle remote anti-theft engine immobilizer.',
            href: '/dashboard/fleet',
            icon: Car,
            color: 'from-blue-600 to-indigo-600',
          },
          {
            title: 'Atomic Reservations',
            desc: 'Reserve vehicles with MongoDB replica set ACID locking guaranteeing zero concurrent double-booking.',
            href: '/dashboard/reservations',
            icon: CalendarDays,
            color: 'from-emerald-600 to-teal-600',
          },
          {
            title: '360° Damage Inspection',
            desc: 'Digital check-in / check-out inspection pad with 360° visual coordinate damage pinpointing and signature.',
            href: '/dashboard/inspections',
            icon: ClipboardCheck,
            color: 'from-amber-600 to-orange-600',
          },
          {
            title: 'Live GPS Telemetry',
            desc: 'WebSocket radar streaming real-time vehicle coordinates, speeds, fuel, battery, and geofence alerts.',
            href: '/dashboard/telemetry',
            icon: Radio,
            color: 'from-cyan-600 to-blue-600',
          },
          {
            title: 'Settlement & PDF Invoicing',
            desc: 'Compute excess mileage and fuel discrepancy penalties and download formal PDF rental invoices.',
            href: '/dashboard/billing',
            icon: Receipt,
            color: 'from-purple-600 to-pink-600',
          },
          {
            title: 'Forensic Audit Trail',
            desc: 'Immutable append-only audit log tracking every login, reservation mutation, and engine immobilizer command.',
            href: '/dashboard/audit',
            icon: ShieldAlert,
            color: 'from-rose-600 to-red-600',
          },
        ].map((mod, i) => (
          <div
            key={i}
            onClick={() => router.push(mod.href)}
            className="p-6 glass-card rounded-2xl border border-slate-800 glass-card-hover cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/80 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <mod.icon className="w-5 h-5 text-blue-400 group-hover:text-blue-300 transition" />
              </div>
              <h3 className="font-bold text-base text-white group-hover:text-blue-400 transition flex items-center justify-between">
                <span>{mod.title}</span>
                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">{mod.desc}</p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-blue-400 font-semibold">
              <span>Open Module</span>
              <span>→</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
