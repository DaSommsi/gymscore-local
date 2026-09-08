import React, { useState, useEffect } from 'react';
import {
  Trophy,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Send,
  UserCheck,
  Wifi,
  WifiOff,
  ChevronDown
} from 'lucide-react';

interface IStation {
  id: number;
  name: string;
  unit: string;
  sort_order: string;
  min_val: number;
  max_val: number;
}

interface IStudentInfo {
  id: number;
  start_number: string;
  first_name: string;
  last_name: string;
  gender: string;
  birth_year: number;
  group_name: string;
}

interface IRecentSubmission {
  id: number;
  start_number: string;
  student_name: string;
  raw_value: number;
  unit: string;
  time: string;
}

export default function App(): React.JSX.Element {
  const [stations, setStations] = useState<IStation[]>([]);
  const [selectedStation, setSelectedStation] = useState<IStation | null>(null);
  const [startNumber, setStartNumber] = useState('');
  const [studentInfo, setStudentInfo] = useState<IStudentInfo | null>(null);
  const [studentError, setStudentError] = useState<string | null>(null);
  const [rawValue, setRawValue] = useState('');
  const [activeTag, setActiveTag] = useState<string>('Gültig');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [recentLocalSubmissions, setRecentLocalSubmissions] = useState<IRecentSubmission[]>([]);

  useEffect(() => {
    fetchStations();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // When startNumber changes, look up student
  useEffect(() => {
    const trimmed = startNumber.trim();
    if (!trimmed) {
      setStudentInfo(null);
      setStudentError(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/students/by-start-number/${trimmed}`);
        const json = await res.json();

        if (json.success && json.data) {
          setStudentInfo(json.data);
          setStudentError(null);
        } else {
          setStudentInfo(null);
          setStudentError('Startnummer nicht vergeben.');
        }
      } catch {
        setStudentError('Netzwerkfehler');
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [startNumber]);

  async function fetchStations(): Promise<void> {
    try {
      const res = await fetch('/api/stations');
      const json = await res.json();
      if (json.success && json.data.length > 0) {
        setStations(json.data);
        if (!selectedStation) {
          setSelectedStation(json.data[0]);
        }
      }
    } catch {
      showToast('error', 'Konnte Stationen nicht laden.');
    }
  }

  function handleKeypadPress(val: string): void {
    if (val === 'DEL') {
      setRawValue((prev) => prev.slice(0, -1));
      return;
    }

    if (val === 'CLR') {
      setRawValue('');
      return;
    }

    if (val === '.' && rawValue.includes('.')) {
      return;
    }

    setRawValue((prev) => prev + val);
  }

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();

    if (!selectedStation) {
      showToast('error', 'Bitte wählen Sie zuerst eine Station aus.');
      return;
    }

    if (!studentInfo) {
      showToast('error', 'Bitte geben Sie eine gültige Startnummer ein.');
      return;
    }

    const numVal = parseFloat(rawValue.replace(',', '.'));
    if (isNaN(numVal)) {
      showToast('error', 'Bitte geben Sie einen gültigen Messwert ein.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_number: studentInfo.start_number,
          station_id: selectedStation.id,
          raw_value: numVal,
          feedback_tags: activeTag,
          helper_comment: comment
        })
      });

      const json = await res.json();

      if (json.success) {
        showToast('success', `Gespeichert: ${studentInfo.first_name} ${studentInfo.last_name} (${numVal} ${selectedStation.unit})`);

        // Record locally for quick inspection
        setRecentLocalSubmissions((prev) => [
          {
            id: json.data.id,
            start_number: studentInfo.start_number,
            student_name: `${studentInfo.first_name} ${studentInfo.last_name}`,
            raw_value: numVal,
            unit: selectedStation.unit,
            time: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
          },
          ...prev.slice(0, 9)
        ]);

        // Reset inputs for next student
        setStartNumber('');
        setRawValue('');
        setComment('');
        setActiveTag('Gültig');
        setStudentInfo(null);
      } else {
        showToast('error', json.message || 'Fehler beim Speichern');
      }
    } catch {
      showToast('error', 'Keine Verbindung zum Koordinator-Laptop.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function showToast(type: 'success' | 'error', message: string): void {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 max-w-lg mx-auto border-x border-slate-800">
      {/* Top Mobile Bar */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-1.5 rounded-lg text-white font-bold">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold leading-tight">Helfer-Station</h1>
            <p className="text-[11px] text-slate-400">GymScore Local</p>
          </div>
        </div>

        {/* Network status indicator */}
        <div className="flex items-center gap-1.5 text-xs">
          {isOnline ? (
            <span className="flex items-center gap-1 text-emerald-400 font-medium bg-emerald-950/80 border border-emerald-800 px-2 py-1 rounded-full">
              <Wifi className="w-3.5 h-3.5" />
              <span>Online</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-rose-400 font-medium bg-rose-950/80 border border-rose-800 px-2 py-1 rounded-full">
              <WifiOff className="w-3.5 h-3.5" />
              <span>Offline</span>
            </span>
          )}
        </div>
      </header>

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-14 left-4 right-4 z-50 p-3 rounded-xl border flex items-center gap-2 shadow-2xl text-sm font-medium ${
            toast.type === 'success'
              ? 'bg-emerald-900/95 border-emerald-600 text-emerald-100'
              : 'bg-rose-900/95 border-rose-600 text-rose-100'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-300" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-300" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      <main className="flex-1 p-4 space-y-4">
        {/* Station Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Aktive Station
          </label>
          <div className="relative">
            <select
              value={selectedStation?.id || ''}
              onChange={(e) => {
                const s = stations.find((item) => item.id === Number(e.target.value));
                if (s) setSelectedStation(s);
              }}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3.5 text-base font-semibold appearance-none focus:outline-none focus:border-blue-500 pr-10"
            >
              {stations.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.unit})
                </option>
              ))}
            </select>
            <ChevronDown className="w-5 h-5 text-slate-400 absolute right-3 top-4 pointer-events-none" />
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Start Number Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Startnummer
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={startNumber}
              onChange={(e) => setStartNumber(e.target.value)}
              placeholder="z.B. 101"
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 text-xl font-bold font-mono focus:outline-none focus:border-blue-500 placeholder-slate-600"
            />

            {/* Student verification card */}
            {studentInfo && (
              <div className="bg-slate-900 border border-emerald-600/80 rounded-xl p-3 flex items-center justify-between mt-2">
                <div className="flex items-center gap-2.5">
                  <UserCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <div className="font-bold text-white text-base">
                      {studentInfo.first_name} {studentInfo.last_name}
                    </div>
                    <div className="text-xs text-slate-400">
                      Klasse: <span className="text-slate-200">{studentInfo.group_name || '—'}</span> • Jg. {studentInfo.birth_year}
                    </div>
                  </div>
                </div>
                <span className="text-xs bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded font-mono">
                  #{studentInfo.start_number}
                </span>
              </div>
            )}

            {studentError && !studentInfo && startNumber.trim() && (
              <div className="text-xs text-rose-400 mt-1 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{studentError}</span>
              </div>
            )}
          </div>

          {/* Result Value Input */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Messwert ({selectedStation?.unit || 'Wert'})
              </label>
              {selectedStation && (
                <span className="text-[11px] text-slate-500 font-mono">
                  Bereich: {selectedStation.min_val} - {selectedStation.max_val}
                </span>
              )}
            </div>

            <div className="relative">
              <input
                type="text"
                readOnly
                value={rawValue}
                placeholder="0.00"
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 text-3xl font-extrabold font-mono text-center tracking-wider focus:outline-none placeholder-slate-700"
              />
              <span className="absolute right-4 top-4 text-sm font-semibold text-slate-400">
                {selectedStation?.unit}
              </span>
            </div>
          </div>

          {/* Touch Number Keypad */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'DEL'].map((btn) => (
              <button
                key={btn}
                type="button"
                onClick={() => handleKeypadPress(btn)}
                className={`h-14 rounded-xl text-xl font-bold transition-colors active:scale-95 flex items-center justify-center ${
                  btn === 'DEL'
                    ? 'bg-rose-950/80 text-rose-300 border border-rose-800 hover:bg-rose-900'
                    : 'bg-slate-800 text-white border border-slate-700 hover:bg-slate-700'
                }`}
              >
                {btn === 'DEL' ? '⌫' : btn}
              </button>
            ))}
          </div>

          {/* Quick Feedback Tags */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Status / Vermerk
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['Gültig', 'Fehlversuch', '2. Versuch'].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setActiveTag(tag)}
                  className={`py-2.5 px-2 rounded-xl text-xs font-semibold border transition-colors ${
                    activeTag === tag
                      ? 'bg-blue-600 text-white border-blue-500'
                      : 'bg-slate-900 text-slate-300 border-slate-700'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !studentInfo || !rawValue}
            className={`w-full py-4 rounded-xl text-base font-bold flex items-center justify-center gap-2 transition-all ${
              !studentInfo || !rawValue
                ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white shadow-lg shadow-emerald-950'
            }`}
          >
            <Send className="w-5 h-5" />
            <span>{isSubmitting ? 'Wird gespeichert...' : 'Ergebnis speichern'}</span>
          </button>
        </form>

        {/* Recent Entries on This Device */}
        {recentLocalSubmissions.length > 0 && (
          <div className="pt-4 border-t border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold uppercase tracking-wider">Zuletzt erfasst (dieses Gerät)</span>
              <RotateCcw
                className="w-3.5 h-3.5 cursor-pointer hover:text-white"
                onClick={() => setRecentLocalSubmissions([])}
                title="Liste leeren"
              />
            </div>

            <div className="space-y-1.5">
              {recentLocalSubmissions.slice(0, 5).map((sub) => (
                <div
                  key={sub.id}
                  className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-mono font-bold text-blue-400 mr-2">#{sub.start_number}</span>
                    <span className="font-medium text-slate-200">{sub.student_name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-white">
                      {sub.raw_value} {sub.unit}
                    </span>
                    <span className="text-slate-500 ml-2 font-mono">{sub.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
