'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Car,
  Lock,
  Mail,
  User,
  ShieldCheck,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  FileText,
  Phone,
  Sparkles,
} from 'lucide-react';
import { API_BASE, setAuthSession } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register form state
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState('CUSTOMER');
  const [regPhone, setRegPhone] = useState('');
  const [regLicense, setRegLicense] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Pre-configured demo accounts
  const demoAccounts = [
    {
      role: 'SUPER_ADMIN',
      label: 'Super Admin',
      email: 'admin@vms.com',
      pass: 'Admin@12345',
      badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      desc: 'Full system control & audit logs',
    },
    {
      role: 'FLEET_MANAGER',
      label: 'Fleet Manager',
      email: 'manager@vms.com',
      pass: 'Manager@12345',
      badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      desc: 'Fleet CRUD & remote immobilizer',
    },
    {
      role: 'AGENT',
      label: 'Rental Agent',
      email: 'agent@vms.com',
      pass: 'Agent@12345',
      badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      desc: 'Handover & 360° inspection pad',
    },
    {
      role: 'MECHANIC',
      label: 'Fleet Mechanic',
      email: 'mechanic@vms.com',
      pass: 'Mechanic@12345',
      badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      desc: 'Maintenance & damage repairs',
    },
    {
      role: 'CUSTOMER',
      label: 'VIP Customer',
      email: 'customer@vms.com',
      pass: 'Customer@12345',
      badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      desc: 'Vehicle reservations & invoices',
    },
  ];

  const handleSelectDemo = (acc: typeof demoAccounts[0], autoSubmit = false) => {
    setTab('LOGIN');
    setLoginEmail(acc.email);
    setLoginPassword(acc.pass);
    setErrorMsg(null);
    setSuccessMsg(null);

    if (autoSubmit) {
      executeLogin(acc.email, acc.pass);
    }
  };

  const executeLogin = async (emailToUse?: string, passToUse?: string) => {
    const email = emailToUse || loginEmail;
    const password = passToUse || loginPassword;

    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Authentication failed. Please verify credentials.');
      }

      setAuthSession(data.accessToken, data.user);
      setSuccessMsg(`Welcome back, ${data.user?.fullName || data.user?.email}! Redirecting to Command Center...`);
      setTimeout(() => {
        router.push('/dashboard');
      }, 700);
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  const executeRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regEmail || !regPassword || !regFullName) {
      setErrorMsg('Full Name, Email, and Password are required.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const payload: any = {
        fullName: regFullName,
        email: regEmail,
        password: regPassword,
        role: regRole,
      };

      if (regPhone) payload.phoneNumber = regPhone;
      if (regLicense) payload.drivingLicenseNumber = regLicense;

      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Registration failed.');
      }

      // Auto login on successful registration
      const loginRes = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: regEmail, password: regPassword }),
      });
      const loginData = await loginRes.json();

      if (loginRes.ok && loginData.accessToken) {
        setAuthSession(loginData.accessToken, loginData.user);
        setSuccessMsg('Account created successfully! Launching session...');
        setTimeout(() => {
          router.push('/dashboard');
        }, 700);
      } else {
        setTab('LOGIN');
        setLoginEmail(regEmail);
        setLoginPassword(regPassword);
        setSuccessMsg('Account created! Please sign in with your password.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to complete registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Brand Header */}
      <div className="text-center mb-8 relative z-10">
        <Link href="/" className="inline-flex items-center space-x-3 group mb-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:scale-105 transition">
            <Car className="w-7 h-7 text-white" />
          </div>
          <div className="text-left">
            <span className="font-bold text-2xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-blue-300 bg-clip-text text-transparent">
              ApexFleet VMS
            </span>
            <span className="block text-[11px] text-blue-400 font-semibold tracking-wider uppercase">
              Enterprise Fleet Portal
            </span>
          </div>
        </Link>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          High-concurrency fleet orchestration with cryptographic AES-256-GCM identity protection.
        </p>
      </div>

      {/* Main Auth Container */}
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        {/* Left Form Card */}
        <div className="lg:col-span-7 glass-card rounded-2xl border border-slate-800/90 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {/* Tabs */}
          <div className="flex rounded-xl bg-slate-900/90 p-1 border border-slate-800 mb-6">
            <button
              type="button"
              onClick={() => {
                setTab('LOGIN');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
                tab === 'LOGIN'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In to Account
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('REGISTER');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
                tab === 'REGISTER'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Register New Profile
            </button>
          </div>

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start space-x-2 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-start space-x-2 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* LOGIN FORM */}
          {tab === 'LOGIN' ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                executeLogin();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Work Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="e.g. admin@vms.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-300">Security Password</label>
                  <span className="text-[11px] text-blue-400 hover:underline cursor-pointer">
                    Forgot Key?
                  </span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter account password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-blue-600/30 transition flex items-center justify-center space-x-2 mt-2"
              >
                {loading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Authenticate & Access Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* REGISTER FORM */
            <form onSubmit={executeRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Full Legal Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="e.g. Kasun Fernando"
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="e.g. kasun@example.com"
                      className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Assigned Role</label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  >
                    <option value="CUSTOMER">Customer / Driver</option>
                    <option value="AGENT">Rental Desk Agent</option>
                    <option value="MECHANIC">Fleet Technician</option>
                    <option value="FLEET_MANAGER">Fleet Operations Manager</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Create a strong password (min 8 characters)"
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Phone Number <span className="text-slate-500">(AES Encrypted)</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="+94 77 123 4567"
                      className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Driving License / NIC <span className="text-slate-500">(Encrypted)</span>
                  </label>
                  <div className="relative">
                    <FileText className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={regLicense}
                      onChange={(e) => setRegLicense(e.target.value)}
                      placeholder="B8934821 or NIC"
                      className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-blue-500/5 border border-blue-500/10 text-[11px] text-slate-400 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <span>Sensitive PII fields are hardware-encrypted with AES-256-GCM before storage.</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-blue-600/30 transition flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Create Profile & Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="mt-6 pt-5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <Link href="/" className="hover:text-blue-400 transition flex items-center space-x-1">
              <span>← Back to Fleet Showcase</span>
            </Link>
            <a
              href="http://localhost:5000/api/docs"
              target="_blank"
              rel="noreferrer"
              className="hover:text-blue-400 transition"
            >
              Swagger OpenAPI Docs
            </a>
          </div>
        </div>

        {/* Right Quick-Fill Role Picker Card */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-card rounded-2xl border border-slate-800/90 p-6 shadow-xl backdrop-blur-xl">
            <div className="flex items-center space-x-2 mb-2">
              <KeyRound className="w-4 h-4 text-blue-400" />
              <h2 className="text-sm font-bold text-white tracking-tight">1-Click Role Fast-Pass</h2>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Select any pre-seeded persona to automatically autofill credentials or instantly launch your session:
            </p>

            <div className="space-y-2.5">
              {demoAccounts.map((acc) => (
                <div
                  key={acc.role}
                  className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-900/90 transition flex items-center justify-between group"
                >
                  <div
                    onClick={() => handleSelectDemo(acc, false)}
                    className="flex-1 cursor-pointer"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-semibold text-white group-hover:text-blue-400 transition">
                        {acc.label}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-semibold border ${acc.badge}`}>
                        {acc.role}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">{acc.email}</div>
                    <div className="text-[10px] text-slate-500">{acc.desc}</div>
                  </div>

                  <div className="flex items-center space-x-1.5 ml-2">
                    <button
                      type="button"
                      onClick={() => handleSelectDemo(acc, false)}
                      className="px-2 py-1 rounded text-[10px] font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition"
                      title="Fill into form"
                    >
                      Autofill
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectDemo(acc, true)}
                      className="px-2.5 py-1 rounded text-[10px] font-semibold bg-blue-600/80 text-white hover:bg-blue-600 transition shadow-sm"
                      title="Instant Sign In"
                    >
                      Login →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Security Badge */}
          <div className="p-4 rounded-xl glass-card border border-slate-800/80 flex items-center space-x-3 text-xs text-slate-400">
            <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <div>
              <span className="font-semibold text-slate-200">Zero-Trust RBAC Architecture</span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Role tokens rotate via short-lived JWTs (15 min) with encrypted audit logging on every authentication attempt.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
