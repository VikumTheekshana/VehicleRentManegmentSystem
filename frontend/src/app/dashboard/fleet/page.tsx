'use client';

import React, { useState, useEffect } from 'react';
import {
  Car,
  Plus,
  Shield,
  Search,
  Fuel,
  Gauge,
  Calendar,
  Power,
  CheckCircle,
  AlertTriangle,
  Lock,
  Unlock,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';

export default function FleetManagementPage() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    vin: '',
    licensePlate: '',
    make: '',
    model: '',
    year: 2024,
    category: 'SUV',
    transmission: 'Automatic',
    fuelType: 'Petrol',
    dailyRate: 25000,
    securityDeposit: 50000,
    insuranceExpiry: '2027-01-01',
    revenueLicenseExpiry: '2027-01-01',
  });

  const loadVehicles = () => {
    apiRequest('/fleet')
      .then((data) => setVehicles(data || []))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  const handleToggleImmobilize = async (id: string, currentImmobilized: boolean) => {
    setLoadingAction(id);
    try {
      await apiRequest(`/fleet/${id}/immobilize`, {
        method: 'PATCH',
        body: JSON.stringify({ immobilize: !currentImmobilized }),
      });
      loadVehicles();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/fleet', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          dailyRate: Number(formData.dailyRate),
          securityDeposit: Number(formData.securityDeposit),
          year: Number(formData.year),
        }),
      });
      setShowAddModal(false);
      loadVehicles();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filtered = vehicles.filter((v) => {
    const matchCat = selectedCategory === 'ALL' || v.category === selectedCategory;
    const matchSearch =
      v.make.toLowerCase().includes(search.toLowerCase()) ||
      v.model.toLowerCase().includes(search.toLowerCase()) ||
      v.licensePlate.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Fleet Asset Inventory</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time status, document expiry dates, and remote anti-theft immobilizer controls.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 transition flex items-center space-x-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Register Vehicle</span>
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by plate, make, model..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 self-start sm:self-auto">
          {['ALL', 'SUV', 'LUXURY', 'VAN', 'SEDAN', 'COMPACT'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                selectedCategory === cat ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Vehicles Table / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((v) => (
          <div key={v._id} className="glass-card rounded-2xl border border-slate-800 overflow-hidden flex flex-col justify-between">
            <div className="relative h-44 bg-slate-900">
              <img src={v.imageUrl} alt={v.model} className="w-full h-full object-cover" />
              <div className="absolute top-3 left-3 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-950/80 backdrop-blur-md text-white border border-white/10 uppercase">
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
              {v.isImmobilized && (
                <div className="absolute bottom-3 left-3 px-2 py-1 rounded bg-rose-500/90 text-white text-[10px] font-bold flex items-center space-x-1 shadow-lg">
                  <Lock className="w-3 h-3" />
                  <span>ENGINE IMMOBILIZED</span>
                </div>
              )}
            </div>

            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base text-white">{v.make} {v.model}</h3>
                  <span className="text-xs font-mono font-bold text-blue-400">{v.licensePlate}</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 font-mono">VIN: {v.vin}</div>

                {/* Specs Row */}
                <div className="grid grid-cols-2 gap-2 mt-4 text-xs text-slate-300">
                  <div className="flex items-center space-x-1.5 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                    <Gauge className="w-3.5 h-3.5 text-blue-400" />
                    <span>{v.mileage?.toLocaleString()} km</span>
                  </div>
                  <div className="flex items-center space-x-1.5 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                    <Fuel className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{v.fuelLevelPercentage}% Fuel</span>
                  </div>
                </div>

                <div className="mt-3 text-[11px] text-slate-400 space-y-1">
                  <div>Insurance Expiry: <span className="text-slate-200">{v.insuranceExpiry?.split('T')[0]}</span></div>
                  <div>Revenue Expiry: <span className="text-slate-200">{v.revenueLicenseExpiry?.split('T')[0]}</span></div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase">Daily Rate</span>
                  <div className="text-sm font-black text-white">LKR {v.dailyRate?.toLocaleString()}</div>
                </div>

                <button
                  onClick={() => handleToggleImmobilize(v._id, v.isImmobilized)}
                  disabled={loadingAction === v._id}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition ${
                    v.isImmobilized
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{v.isImmobilized ? 'Mobilize Engine' : 'Immobilize Engine'}</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Vehicle Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Register New Fleet Asset</h3>
            <form onSubmit={handleCreateVehicle} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400">Make (e.g. Toyota)</label>
                  <input
                    type="text"
                    required
                    value={formData.make}
                    onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400">Model (e.g. Prado)</label>
                  <input
                    type="text"
                    required
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400">License Plate</label>
                  <input
                    type="text"
                    required
                    value={formData.licensePlate}
                    onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-800 border border-slate-700 rounded-lg text-white uppercase"
                  />
                </div>
                <div>
                  <label className="text-slate-400">VIN (17 Characters)</label>
                  <input
                    type="text"
                    required
                    value={formData.vin}
                    onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-800 border border-slate-700 rounded-lg text-white uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  >
                    <option value="SUV">SUV</option>
                    <option value="LUXURY">LUXURY</option>
                    <option value="SEDAN">SEDAN</option>
                    <option value="VAN">VAN</option>
                    <option value="COMPACT">COMPACT</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400">Daily Rate (LKR)</label>
                  <input
                    type="number"
                    required
                    value={formData.dailyRate}
                    onChange={(e) => setFormData({ ...formData, dailyRate: Number(e.target.value) })}
                    className="w-full mt-1 p-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400">Deposit (LKR)</label>
                  <input
                    type="number"
                    required
                    value={formData.securityDeposit}
                    onChange={(e) => setFormData({ ...formData, securityDeposit: Number(e.target.value) })}
                    className="w-full mt-1 p-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg"
                >
                  Save Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
