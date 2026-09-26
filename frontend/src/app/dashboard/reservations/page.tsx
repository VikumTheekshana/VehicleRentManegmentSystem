'use client';

import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Plus,
  ShieldCheck,
  Clock,
  Car,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [form, setForm] = useState({
    vehicleId: '',
    pickupDate: '',
    returnDate: '',
    notes: '',
  });

  const loadData = () => {
    apiRequest('/reservations')
      .then((data) => setReservations(data || []))
      .catch((err) => console.error(err));

    apiRequest('/fleet')
      .then((data) => {
        if (Array.isArray(data)) {
          setVehicles(data);
          if (data.length > 0 && !form.vehicleId) {
            setForm((prev) => ({ ...prev, vehicleId: data[0]._id }));
          }
        }
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    loadData();
    // Default dates: tomorrow to +4 days
    const tmrw = new Date();
    tmrw.setDate(tmrw.getDate() + 1);
    const ret = new Date();
    ret.setDate(ret.getDate() + 5);
    setForm((prev) => ({
      ...prev,
      pickupDate: tmrw.toISOString().split('T')[0],
      returnDate: ret.toISOString().split('T')[0],
    }));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await apiRequest('/reservations', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setShowModal(false);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Reservation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this reservation?')) return;
    try {
      await apiRequest(`/reservations/${id}/cancel`, { method: 'POST' });
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Atomic Reservation Engine</h1>
          <p className="text-xs text-slate-400 mt-1">
            Zero-Double-Booking concurrency guarantees powered by MongoDB replica set transactions.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 transition flex items-center space-x-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>New Atomic Booking</span>
        </button>
      </div>

      {/* Reservations Table */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Reservation #</th>
                <th className="py-3 px-4">Vehicle</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Rental Window</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-200">
              {reservations.map((r) => (
                <tr key={r._id} className="hover:bg-slate-800/30 transition">
                  <td className="py-3 px-4 font-mono font-bold text-blue-400">{r.reservationNumber}</td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-white">{r.vehicle?.make} {r.vehicle?.model}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{r.vehicle?.licensePlate}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-slate-300 font-medium">{r.customer?.fullName || 'Customer'}</div>
                    <div className="text-[10px] text-slate-500">{r.customer?.email}</div>
                  </td>
                  <td className="py-3 px-4 text-[11px] font-mono">
                    <div>{r.pickupDate?.split('T')[0]} → {r.returnDate?.split('T')[0]}</div>
                    <div className="text-slate-500 text-[10px]">{r.totalDays} Rental Day(s)</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-extrabold text-white">LKR {r.totalAmount?.toLocaleString()}</div>
                    <div className="text-[10px] text-slate-400">Deposit: LKR {r.securityDeposit?.toLocaleString()}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        r.status === 'ACTIVE'
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : r.status === 'CONFIRMED'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : r.status === 'COMPLETED'
                          ? 'bg-slate-800 text-slate-300 border border-slate-700'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {r.status !== 'CANCELLED' && r.status !== 'COMPLETED' && (
                      <button
                        onClick={() => handleCancel(r._id)}
                        className="px-2.5 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[11px] font-medium border border-rose-500/20 transition"
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {reservations.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No reservations found. Click "New Atomic Booking" to schedule one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Reservation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white">Create Atomic Reservation</h3>
            </div>
            <p className="text-xs text-slate-400">
              MongoDB ACID transaction guarantees zero double-bookings on overlapping dates.
            </p>

            {errorMsg && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400">Select Vehicle</label>
                <select
                  value={form.vehicleId}
                  onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
                  className="w-full mt-1 p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white"
                >
                  {vehicles.map((v) => (
                    <option key={v._id} value={v._id}>
                      {v.make} {v.model} ({v.licensePlate}) — LKR {v.dailyRate?.toLocaleString()}/day
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400">Pickup Date</label>
                  <input
                    type="date"
                    required
                    value={form.pickupDate}
                    onChange={(e) => setForm({ ...form, pickupDate: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400">Return Date</label>
                  <input
                    type="date"
                    required
                    value={form.returnDate}
                    onChange={(e) => setForm({ ...form, returnDate: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400">Notes / Remarks</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  className="w-full mt-1 p-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  placeholder="Optional customer requirements..."
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-lg shadow-emerald-600/20"
                >
                  {submitting ? 'Verifying Lock...' : 'Lock & Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
