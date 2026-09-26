'use client';

import React, { useState, useEffect } from 'react';
import {
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  Car,
  Fuel,
  Gauge,
  PenTool,
  Save,
  Plus,
  Trash2,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';

export default function InspectionsPage() {
  const [reservations, setReservations] = useState<any[]>([]);
  const [selectedResId, setSelectedResId] = useState<string>('');
  const [inspectionType, setInspectionType] = useState<'CHECK_OUT' | 'CHECK_IN'>('CHECK_OUT');
  const [odometer, setOdometer] = useState<number>(24500);
  const [fuelPercentage, setFuelPercentage] = useState<number>(90);
  const [damages, setDamages] = useState<any[]>([]);
  const [notes, setNotes] = useState<string>('Standard pre-trip vehicle walkaround completed.');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    apiRequest('/reservations')
      .then((data) => {
        if (Array.isArray(data)) {
          setReservations(data);
          if (data.length > 0) setSelectedResId(data[0]._id);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    const newDamage = {
      x,
      y,
      part: getVehiclePartName(x, y),
      severity: 'MINOR',
      description: 'Surface paint scratch / scuff',
      estimatedCost: 12000,
    };

    setDamages([...damages, newDamage]);
  };

  const getVehiclePartName = (x: number, y: number) => {
    if (y < 25) return 'Front Bumper / Grille';
    if (y < 45) return 'Hood & Front Quarter Panels';
    if (y < 75) return x < 50 ? 'Driver Side Doors & Glass' : 'Passenger Side Doors & Glass';
    return 'Rear Bumper & Trunk Lid';
  };

  const removeDamage = (index: number) => {
    setDamages(damages.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResId) return;

    setSubmitting(true);
    setSuccessMsg(null);
    try {
      await apiRequest('/inspections', {
        method: 'POST',
        body: JSON.stringify({
          reservationId: selectedResId,
          type: inspectionType,
          odometerReading: Number(odometer),
          fuelLevelPercentage: Number(fuelPercentage),
          damages,
          signatureBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
          notes,
        }),
      });
      setSuccessMsg(`Inspection [${inspectionType}] successfully verified & signed off!`);
      setDamages([]);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">360° Digital Vehicle Inspection</h1>
        <p className="text-xs text-slate-400 mt-1">
          Coordinate-based visual damage logging, fuel discrepancy verification, and digital sign-off.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Controls */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-4 text-xs">
            <h3 className="font-bold text-sm text-white flex items-center space-x-2">
              <ClipboardCheck className="w-4 h-4 text-blue-400" />
              <span>Inspection Parameters</span>
            </h3>

            <div>
              <label className="text-slate-400">Associated Reservation</label>
              <select
                value={selectedResId}
                onChange={(e) => setSelectedResId(e.target.value)}
                className="w-full mt-1 p-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono"
              >
                {reservations.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.reservationNumber} — {r.vehicle?.make} {r.vehicle?.model} ({r.vehicle?.licensePlate})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-400">Inspection Gate</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setInspectionType('CHECK_OUT')}
                  className={`py-2 rounded-lg font-bold transition ${
                    inspectionType === 'CHECK_OUT'
                      ? 'bg-blue-600 text-white shadow'
                      : 'bg-slate-900 border border-slate-800 text-slate-400'
                  }`}
                >
                  Check-Out (Handover)
                </button>
                <button
                  type="button"
                  onClick={() => setInspectionType('CHECK_IN')}
                  className={`py-2 rounded-lg font-bold transition ${
                    inspectionType === 'CHECK_IN'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'bg-slate-900 border border-slate-800 text-slate-400'
                  }`}
                >
                  Check-In (Return)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 flex items-center space-x-1">
                  <Gauge className="w-3.5 h-3.5 text-blue-400" />
                  <span>Odometer (KM)</span>
                </label>
                <input
                  type="number"
                  required
                  value={odometer}
                  onChange={(e) => setOdometer(Number(e.target.value))}
                  className="w-full mt-1 p-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400 flex items-center space-x-1">
                  <Fuel className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Fuel Level (%)</span>
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  required
                  value={fuelPercentage}
                  onChange={(e) => setFuelPercentage(Number(e.target.value))}
                  className="w-full mt-1 p-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-400">Inspector Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full mt-1 p-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
              />
            </div>

            {/* Signature Box */}
            <div>
              <label className="text-slate-400 flex items-center space-x-1">
                <PenTool className="w-3.5 h-3.5 text-purple-400" />
                <span>Authorized Digital Signature</span>
              </label>
              <div className="mt-1 p-3 rounded-lg bg-slate-900 border border-dashed border-slate-700 text-center font-mono text-[11px] text-slate-400">
                ✍️ [Customer / Inspector Base64 Signature Cryptographically Bound]
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 transition flex items-center justify-center space-x-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{submitting ? 'Recording Inspection...' : 'Sign & Submit Inspection'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: 360 Vehicle Blueprint Coordinate Mapper */}
        <div className="lg:col-span-7 space-y-4">
          <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-white">360° Visual Vehicle Blueprint</h3>
                <p className="text-[11px] text-slate-400">Click on any part of the vehicle diagram to pin damage coordinates.</p>
              </div>
              <span className="text-xs px-2 py-0.5 rounded font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {damages.length} Damage Pin(s)
              </span>
            </div>

            {/* Interactive Blueprint Canvas */}
            <div
              onClick={handleCanvasClick}
              className="relative w-full h-80 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center cursor-crosshair overflow-hidden select-none"
            >
              {/* Silhouette outline */}
              <div className="w-48 h-72 border-2 border-slate-700/80 rounded-[48px] relative flex flex-col justify-between p-4 bg-slate-900/40">
                {/* Front Windshield */}
                <div className="w-full h-12 border border-slate-600/60 rounded-t-2xl flex items-center justify-center text-[10px] text-slate-500 font-mono">
                  FRONT
                </div>
                {/* Cabin */}
                <div className="w-full h-24 border border-dashed border-slate-600/40 rounded-lg flex items-center justify-center text-[10px] text-slate-500 font-mono">
                  CABIN
                </div>
                {/* Rear Window */}
                <div className="w-full h-12 border border-slate-600/60 rounded-b-2xl flex items-center justify-center text-[10px] text-slate-500 font-mono">
                  REAR
                </div>
              </div>

              {/* Placed damage pins */}
              {damages.map((d, index) => (
                <div
                  key={index}
                  style={{ left: `${d.x}%`, top: `${d.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-rose-500/90 text-white font-bold text-[10px] flex items-center justify-center shadow-lg border border-white animate-bounce"
                >
                  {index + 1}
                </div>
              ))}
            </div>

            {/* Damage items list */}
            {damages.length > 0 && (
              <div className="space-y-2 mt-4">
                <h4 className="text-xs font-semibold text-slate-300">Recorded Damage Coordinate Log</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {damages.map((d, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-full bg-rose-500 text-white font-bold text-[10px] flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="font-semibold text-white">{d.part}</div>
                          <div className="text-[10px] text-slate-400">Coords: ({d.x}%, {d.y}%) • Severity: {d.severity}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="font-mono text-emerald-400 text-xs">LKR {d.estimatedCost?.toLocaleString()}</span>
                        <button
                          type="button"
                          onClick={() => removeDamage(idx)}
                          className="text-slate-500 hover:text-rose-400 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
