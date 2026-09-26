'use client';

import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Download,
  DollarSign,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  FileText,
  Car,
} from 'lucide-react';
import { apiRequest, API_BASE, getAuthToken } from '@/lib/api';

export default function BillingPage() {
  const [reservations, setReservations] = useState<any[]>([]);
  const [selectedResId, setSelectedResId] = useState<string>('');
  const [settlement, setSettlement] = useState<any | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    apiRequest('/reservations')
      .then((data) => {
        if (Array.isArray(data)) {
          setReservations(data);
          if (data.length > 0) {
            setSelectedResId(data[0]._id);
          }
        }
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    if (!selectedResId) return;
    apiRequest(`/billing/settlement/${selectedResId}`)
      .then((data) => setSettlement(data))
      .catch((err) => console.error(err));
  }, [selectedResId]);

  const handleDownloadPdf = async () => {
    if (!selectedResId) return;
    setDownloading(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_BASE}/billing/invoice/${selectedResId}/pdf`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Failed to generate PDF');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `VMS-Invoice-${settlement?.reservationNumber || selectedResId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Settlement & Automated Invoicing</h1>
          <p className="text-xs text-slate-400 mt-1">
            Excess mileage surcharges, fuel deficit penalties, and cryptographic PDF invoice statements.
          </p>
        </div>

        <button
          onClick={handleDownloadPdf}
          disabled={!settlement || downloading}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white shadow-lg shadow-blue-500/20 transition flex items-center space-x-1.5"
        >
          <Download className="w-4 h-4" />
          <span>{downloading ? 'Compiling PDF...' : 'Download Official PDF Invoice'}</span>
        </button>
      </div>

      {/* Reservation Selector */}
      <div className="glass-card p-4 rounded-xl border border-slate-800 flex items-center space-x-3 text-xs">
        <label className="text-slate-400 font-medium">Select Rental File:</label>
        <select
          value={selectedResId}
          onChange={(e) => setSelectedResId(e.target.value)}
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-white font-mono flex-1 max-w-md"
        >
          {reservations.map((r) => (
            <option key={r._id} value={r._id}>
              {r.reservationNumber} — {r.vehicle?.make} {r.vehicle?.model} ({r.vehicle?.licensePlate})
            </option>
          ))}
        </select>
      </div>

      {/* Settlement Breakdown Card */}
      {settlement && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Line items Breakdown */}
          <div className="lg:col-span-8 glass-card p-6 rounded-2xl border border-slate-800 space-y-6 text-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-base text-white">
                  Rental Settlement Statement: {settlement.reservationNumber}
                </h3>
                <div className="text-slate-400 mt-0.5">
                  Vehicle: {settlement.vehicle.make} {settlement.vehicle.model} ({settlement.vehicle.plate})
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase">Duration</span>
                <div className="font-extrabold text-white text-sm">{settlement.durationDays} Rental Days</div>
              </div>
            </div>

            {/* Line items table */}
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-slate-800/80 text-slate-300">
                <span>Base Rental Charge ({settlement.durationDays} Days)</span>
                <span className="font-mono font-bold text-white">LKR {settlement.baseRentalFee?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800/80 text-slate-300">
                <div>
                  <span>Excess Mileage Surcharge</span>
                  <div className="text-[10px] text-slate-500">
                    Driven: {settlement.metrics.totalDrivenKm} km | Allowance: {settlement.metrics.allowedKm} km ({settlement.metrics.excessKm} excess @ LKR 120/km)
                  </div>
                </div>
                <span className="font-mono text-amber-400">LKR {settlement.metrics.excessKmFee?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800/80 text-slate-300">
                <div>
                  <span>Fuel Deficit Penalty</span>
                  <div className="text-[10px] text-slate-500">{settlement.metrics.fuelDeficitPercent}% Fuel Deficit @ LKR 450/%</div>
                </div>
                <span className="font-mono text-amber-400">LKR {settlement.metrics.fuelPenalty?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800/80 text-slate-300">
                <div>
                  <span>Accrued Damage Surcharge</span>
                  <div className="text-[10px] text-slate-500">From verified 360° return inspection report</div>
                </div>
                <span className="font-mono text-rose-400">LKR {settlement.metrics.damageCharges?.toLocaleString()}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-between items-center text-sm">
              <span className="font-bold text-slate-300">Total Additional Penalties & Surcharges</span>
              <span className="font-mono font-extrabold text-rose-400">
                LKR {settlement.metrics.totalDeductions?.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Deposit Summary Box */}
          <div className="lg:col-span-4 space-y-4">
            <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4 text-xs">
              <h3 className="font-bold text-sm text-white">Deposit & Net Settlement</h3>

              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase">Security Deposit Held</span>
                  <div className="text-lg font-black text-white mt-0.5">
                    LKR {settlement.initialDeposit?.toLocaleString()}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase">Deductions Applied</span>
                  <div className="text-base font-bold text-rose-400 mt-0.5">
                    - LKR {settlement.settlement.totalDeductionsFromDeposit?.toLocaleString()}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                  <span className="text-[10px] text-emerald-400 uppercase font-bold">Net Deposit Refundable</span>
                  <div className="text-2xl font-black text-emerald-400 mt-1">
                    LKR {settlement.settlement.netDepositRefundToCustomer?.toLocaleString()}
                  </div>
                </div>

                {settlement.settlement.additionalBalanceDueFromCustomer > 0 && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30">
                    <span className="text-[10px] text-rose-400 uppercase font-bold">Balance Owed by Customer</span>
                    <div className="text-lg font-black text-rose-400 mt-0.5">
                      LKR {settlement.settlement.additionalBalanceDueFromCustomer?.toLocaleString()}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handleDownloadPdf}
                disabled={downloading}
                className="w-full py-2.5 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg transition flex items-center justify-center space-x-1.5"
              >
                <FileText className="w-4 h-4" />
                <span>Download Invoice Statement</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
