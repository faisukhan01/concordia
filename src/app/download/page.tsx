'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { BrandLogo } from '@/components/brand-logo';

const APK_DOWNLOAD_URL = 'https://github.com/faisukhan01/esm/releases/latest/download/app-release.apk';
const QR_CODE_URL = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(APK_DOWNLOAD_URL)}`;

const features = [
  { icon: '📊', title: 'Real-time Dashboards', desc: 'Revenue, attendance, and performance analytics at a glance' },
  { icon: '👥', title: 'Manage Users', desc: 'Add teachers, students, and staff directly from your phone' },
  { icon: '💰', title: 'Fee Management', desc: 'Generate invoices, track payments, and download PDF challans' },
  { icon: '📢', title: 'Announcements', desc: 'Send targeted messages to branches, teachers, or students' },
  { icon: '📅', title: 'Calendar & Events', desc: 'View exam schedules, holidays, and school events' },
  { icon: '📈', title: 'Reports & Analytics', desc: 'Financial reports, royalty tracking, and branch performance' },
];

const portals = [
  { name: 'Institute Admin', color: '#F26522', desc: 'Manage branches, royalty, and institute-wide reports' },
  { name: 'Branch Manager', color: '#FF8C42', desc: 'Manage teachers, students, fees, and attendance' },
  { name: 'Teacher', color: '#16A34A', desc: 'Mark attendance, post results, and manage classes' },
  { name: 'Student', color: '#D4A437', desc: 'View attendance, results, invoices, and courses' },
];

export default function DownloadPage() {
  const [isAndroid, setIsAndroid] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    const android = ua.includes('android');
    // Use a microtask to avoid synchronous setState in effect
    Promise.resolve().then(() => {
      setMounted(true);
      setIsAndroid(android);
    });
  }, []);

  const handleDownload = () => {
    window.location.href = APK_DOWNLOAD_URL;
  };

  return (
    <div className="min-h-screen bg-[#F7F8FB]">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandLogo size="sm" />
          </div>
          <a href="/" className="text-sm font-medium text-[#1a1a1a] hover:underline">← Back to Concordia College</a>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-12 pb-8 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 border border-green-200 mb-6">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-semibold text-green-700">Latest Version — Now Available</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-[#1a1a1a] tracking-tight mb-4">
          Concordia College in your pocket
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
          Manage your school, institute, or branch from anywhere. The complete school management platform — now on Android.
        </p>

        {/* App icon + download */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-8 mb-8">
          <div className="relative w-32 h-32 rounded-3xl overflow-hidden shadow-xl">
            <Image src="/app-icon.png" alt="Concordia College App Icon" fill className="object-cover" priority />
          </div>

          <div className="flex flex-col items-center sm:items-start gap-3">
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#F26522] text-white rounded-xl font-semibold hover:bg-[#D4541E] transition-colors shadow-lg cursor-pointer"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.523 15.341c-.613 1.484-.383 3.19-.41 4.823-.027 1.674-1.386 2.585-2.81 2.475-1.396-.108-2.32-1.097-2.31-2.453.012-1.613-.183-3.287.403-4.82.496-1.299 1.679-2.103 2.566-2.106.883-.003 2.073.8 2.561 2.081m-4.323-6.61c1.326 1.25 1.472 3.639.025 4.827-1.3-1.078-1.374-3.625-.025-4.827m6.532 5.483c1.613 1.424 1.737 3.997.46 5.523-.682-1.58-.266-3.354-.46-5.523M8.25 21.639c-1.424.11-2.783-.801-2.81-2.475-.027-1.633.203-3.339-.41-4.823-.488-1.281-1.678-2.084-2.561-2.081-.887.003-2.07.807-2.566 2.106-.586 1.533-.391 3.207-.403 4.82-.01 1.356-.914 2.345-2.31 2.453m5.86-13.908c1.349 1.202 1.275 3.749-.025 4.827-1.447-1.188-1.301-3.577.025-4.827M4.27 14.214c-.194 2.169.222 3.943-.46 5.523-1.277-1.526-1.153-4.099.46-5.523M12 2L1 8l3 1.5L12 5l8 4.5L23 8 12 2z"/></svg>
              {mounted && isAndroid ? 'Update App' : 'Download for Android'}
            </button>
            <p className="text-xs text-gray-500">
              {mounted && isAndroid ? 'Tap to update — installs over current version' : '~27 MB · Android 5.0+ · Free'}
            </p>
            {mounted && isAndroid && (
              <p className="text-[11px] text-green-600 font-medium max-w-xs">
                ✓ Your login will be preserved after update
              </p>
            )}
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center gap-2">
            <div className="p-3 bg-white rounded-2xl border border-gray-200 shadow-sm">
              <img src={QR_CODE_URL} alt="QR Code" width={120} height={120} />
            </div>
            <p className="text-xs text-gray-500 font-medium">Scan to {mounted && isAndroid ? 'update' : 'download'}</p>
          </div>
        </div>

        {/* Android instructions banner */}
        {mounted && isAndroid && (
          <div className="max-w-2xl mx-auto mt-4 p-4 bg-orange-50 rounded-xl border border-orange-200">
            <p className="text-sm text-[#F26522]">
              <strong>Updating from the app?</strong> You came from the Concordia College app. Tap{' '}
              <strong>{'Update App'}</strong> above — your browser will download the new APK.
              When it finishes, tap "Open" or find it in your Downloads folder and tap to install.
            </p>
          </div>
        )}
      </section>

      {/* Features */}
      <section className="max-w-4xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold text-[#1a1a1a] text-center mb-8">Everything you need, on the go</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <div key={i} className="p-5 bg-white rounded-2xl border border-gray-200 shadow-sm">
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-[#1a1a1a] mb-1">{f.title}</h3>
              <p className="text-sm text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Portals */}
      <section className="max-w-4xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-bold text-[#1a1a1a] text-center mb-8">Four role-based portals</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {portals.map((p, i) => (
            <div key={i} className="p-5 bg-white rounded-2xl border border-gray-200 shadow-sm flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl shrink-0" style={{ backgroundColor: p.color }} />
              <div>
                <h3 className="font-semibold text-[#1a1a1a]">{p.name}</h3>
                <p className="text-sm text-gray-500">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Install instructions */}
      <section className="max-w-4xl mx-auto px-6 py-12">
        <div className="p-8 bg-[#1a1a1a] rounded-3xl text-white">
          <h2 className="text-2xl font-bold mb-6 text-center">
            {mounted && isAndroid ? 'How to update' : 'How to install'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-white/15 grid place-items-center mx-auto mb-3 font-bold">1</div>
              <h3 className="font-semibold mb-1">{mounted && isAndroid ? 'Tap Update' : 'Download the APK'}</h3>
              <p className="text-sm text-white/70">{mounted && isAndroid ? 'Tap the Update App button above' : 'Tap the download button or scan the QR code'}</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-white/15 grid place-items-center mx-auto mb-3 font-bold">2</div>
              <h3 className="font-semibold mb-1">{mounted && isAndroid ? 'Open the file' : 'Allow install'}</h3>
              <p className="text-sm text-white/70">{mounted && isAndroid ? 'Find it in Downloads and tap to install' : 'Android may ask to allow installs from unknown sources'}</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-white/15 grid place-items-center mx-auto mb-3 font-bold">3</div>
              <h3 className="font-semibold mb-1">Sign in</h3>
              <p className="text-sm text-white/70">Open Concordia College — your login is preserved</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-8">
        <div className="max-w-4xl mx-auto px-6 py-8 text-center">
          <p className="text-sm text-gray-500">
            Concordia College · College Management Portal · by Cyber Advance Solutions (Pvt.) Ltd.
          </p>
          <p className="text-xs text-gray-400 mt-2">
            For iOS support, contact your administrator. Android is a trademark of Google LLC.
          </p>
        </div>
      </footer>
    </div>
  );
}
