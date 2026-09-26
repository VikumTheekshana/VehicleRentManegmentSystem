'use client';

import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  Radio,
  Car,
  Gauge,
  Fuel,
  Zap,
  MapPin,
  ShieldAlert,
  Lock,
  Unlock,
  Power,
  Activity,
  AlertTriangle,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';

export default function TelemetryRadarPage() {
  const [telemetryPackets, setTelemetryPackets] = useState<any[]>([]);
  const [socketConnected, setSocketConnected] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any | null>(null);

  useEffect(() => {
    // Initial fetch via REST
    apiRequest('/telemetry/mock').catch(() => {});

    const socket: Socket = io('http://localhost:5000', {
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      setSocketConnected(true);
      socket.emit('request_telemetry');
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
    });

    socket.on('telemetry_update', (data: any[]) => {
      if (Array.isArray(data)) {
        setTelemetryPackets(data);
        if (!selectedVehicle && data.length > 0) {
          setSelectedVehicle(data[0]);
        }
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleToggleImmobilize = async (vehicleId: string, currentImmobilized: boolean) => {
    try {
      await apiRequest(`/fleet/${vehicleId}/immobilize`, {
        method: 'PATCH',
        body: JSON.stringify({ immobilize: !currentImmobilized }),
      });
    } catch (err: any) {
      alert(err.message);
    }
  };

  const activeTracking = selectedVehicle || telemetryPackets[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Live GPS Telemetry & Anti-Theft Radar</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time WebSocket streaming of vehicle speed, geofence breaches, battery, and engine controls.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div
            className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center space-x-2 border ${
              socketConnected
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                socketConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
              }`}
            ></span>
            <span>{socketConnected ? 'WebSocket Live Radar (3s Stream)' : 'Reconnecting WebSocket...'}</span>
          </div>
        </div>
      </div>

      {/* Main Radar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Radar Map & Active Tracker */}
        <div className="lg:col-span-8 space-y-4">
          <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Radio className="w-5 h-5 text-blue-400 animate-pulse" />
                <h3 className="font-bold text-sm text-white">Colombo Metropolitan Geofence Radar (25km Safe Zone)</h3>
              </div>
              {activeTracking?.geofenceStatus === 'BREACH' ? (
                <span className="px-2.5 py-1 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-xs flex items-center space-x-1 animate-pulse">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>GEOFENCE BREACH DETECTED</span>
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-xs flex items-center space-x-1">
                  <span>PERIMETER SECURE</span>
                </span>
              )}
            </div>

            {/* Simulated Satellite Radar Grid */}
            <div className="relative w-full h-80 rounded-xl bg-[#030712] border border-slate-800 flex items-center justify-center overflow-hidden">
              {/* Radar Rings */}
              <div className="absolute w-72 h-72 rounded-full border border-blue-500/20"></div>
              <div className="absolute w-48 h-48 rounded-full border border-blue-500/30"></div>
              <div className="absolute w-24 h-24 rounded-full border border-blue-500/40"></div>
              <div className="absolute w-full h-[1px] bg-blue-500/10"></div>
              <div className="absolute h-full w-[1px] bg-blue-500/10"></div>

              {/* Central WTC Base */}
              <div className="absolute w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_15px_#3b82f6]"></div>
              <span className="absolute text-[9px] text-blue-400 font-mono mt-7">Colombo HQ Base</span>

              {/* Dynamic Vehicle Dots */}
              {telemetryPackets.map((v, i) => {
                const offsetX = (v.longitude - 79.8428) * 1200;
                const offsetY = (6.9344 - v.latitude) * 1200;
                const isSelected = activeTracking?.vehicleId === v.vehicleId;

                return (
                  <div
                    key={v.vehicleId}
                    style={{ transform: `translate(${offsetX}px, ${offsetY}px)` }}
                    onClick={() => setSelectedVehicle(v)}
                    className="absolute cursor-pointer group"
                  >
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center transition ${
                        v.isImmobilized
                          ? 'bg-rose-500 shadow-[0_0_12px_#f43f5e]'
                          : isSelected
                          ? 'bg-amber-400 shadow-[0_0_12px_#fbbf24]'
                          : 'bg-emerald-400 shadow-[0_0_10px_#10b981]'
                      }`}
                    >
                      <span className="text-[8px] font-black text-slate-950">{i + 1}</span>
                    </div>

                    <div className="hidden group-hover:block absolute bottom-5 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-[9px] font-mono text-white whitespace-nowrap shadow-xl z-20">
                      {v.plate} ({v.speed} km/h)
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Active Vehicle Deep Telemetry Banner */}
            {activeTracking && (
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-white text-base">
                      {activeTracking.make} {activeTracking.model}
                    </span>
                    <span className="ml-2 font-mono text-xs text-blue-400">[{activeTracking.plate}]</span>
                  </div>

                  <button
                    onClick={() => handleToggleImmobilize(activeTracking.vehicleId, activeTracking.isImmobilized)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition ${
                      activeTracking.isImmobilized
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        : 'bg-rose-600 hover:bg-rose-500 text-white'
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>
                      {activeTracking.isImmobilized ? 'Mobilize Engine (Restore Ignition)' : 'Remote Engine Kill (Immobilize)'}
                    </span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Speed</span>
                    <div className="text-base font-extrabold text-white mt-0.5">{activeTracking.speed} km/h</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Fuel Level</span>
                    <div className="text-base font-extrabold text-emerald-400 mt-0.5">{activeTracking.fuelPercentage}%</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Battery</span>
                    <div className="text-base font-extrabold text-cyan-400 mt-0.5">{activeTracking.batteryVoltage} V</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Ignition State</span>
                    <div className="text-base font-extrabold text-purple-400 mt-0.5">{activeTracking.engineStatus}</div>
                  </div>
                </div>

                <div className="text-[10px] font-mono text-slate-500 flex items-center justify-between">
                  <span>GPS Lat/Lng: {activeTracking.latitude?.toFixed(4)}, {activeTracking.longitude?.toFixed(4)}</span>
                  <span>Telemetry Heartbeat: {new Date(activeTracking.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Fleet Live Stream List */}
        <div className="lg:col-span-4 space-y-3">
          <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider">
            Connected Fleet Nodes ({telemetryPackets.length})
          </h3>
          <div className="space-y-2.5 max-h-[560px] overflow-y-auto pr-1">
            {telemetryPackets.map((pkt, idx) => (
              <div
                key={pkt.vehicleId}
                onClick={() => setSelectedVehicle(pkt)}
                className={`p-3.5 rounded-xl border transition cursor-pointer ${
                  selectedVehicle?.vehicleId === pkt.vehicleId
                    ? 'bg-blue-600/10 border-blue-500 shadow-md'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-[10px] font-bold text-slate-300 flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-xs text-white truncate max-w-[120px]">
                      {pkt.make} {pkt.model}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-blue-400">{pkt.plate}</span>
                </div>

                <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400 font-mono">
                  <span>Speed: <b className="text-white">{pkt.speed} km/h</b></span>
                  <span>Fuel: <b className="text-emerald-400">{pkt.fuelPercentage}%</b></span>
                  <span>{pkt.engineStatus}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
