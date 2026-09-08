import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  Trophy,
  Activity,
  Wifi,
  QrCode,
  FileSpreadsheet,
  Download,
  Upload,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  ExternalLink
} from 'lucide-react';

interface INetworkInfo {
  ipAddress: string;
  port: number;
  url: string;
  qrCodeDataUrl: string;
}

interface IStudent {
  id: number;
  start_number: string;
  first_name: string;
  last_name: string;
  gender: string;
  birth_year: number;
  group_name: string;
  notes?: string;
}

interface IStation {
  id: number;
  name: string;
  unit: string;
  sort_order: string;
  min_val: number;
  max_val: number;
  is_active: number;
  completed_students_count?: number;
  total_results_count?: number;
}

interface IResultEntry {
  id: number;
  student_id: number;
  station_id: number;
  raw_value: number;
  points: number;
  feedback_tags: string;
  helper_comment: string;
  recorded_at: string;
  start_number: string;
  first_name: string;
  last_name: string;
  group_name: string;
  station_name: string;
  station_unit: string;
}

export default function App(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'stations' | 'results'>('overview');
  const [networkInfo, setNetworkInfo] = useState<INetworkInfo | null>(null);
  const [students, setStudents] = useState<IStudent[]>([]);
  const [stations, setStations] = useState<IStation[]>([]);
  const [recentResults, setRecentResults] = useState<IResultEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showQrModal, setShowQrModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Form state for adding single participant
  const [newStudent, setNewStudent] = useState({
    start_number: '',
    first_name: '',
    last_name: '',
    gender: 'M',
    birth_year: new Date().getFullYear() - 12,
    group_name: '',
    notes: ''
  });

  useEffect(() => {
    fetchInitialData();
    const interval = setInterval(fetchLiveMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  /**
   * Fetches baseline network, stations, and roster data.
   */
  async function fetchInitialData(): Promise<void> {
    setIsLoading(true);
    await Promise.all([
      fetchNetworkInfo(),
      fetchStudents(),
      fetchStations(),
      fetchResults()
    ]);
    setIsLoading(false);
  }

  /**
   * Polling updates for live results and station metrics.
   */
  async function fetchLiveMetrics(): Promise<void> {
    await Promise.all([fetchStations(), fetchResults()]);
  }

  async function fetchNetworkInfo(): Promise<void> {
    try {
      const res = await fetch('/api/system/network');
      const json = await res.json();
      if (json.success) setNetworkInfo(json.data);
    } catch {
      // Offline fallback in development
    }
  }

  async function fetchStudents(): Promise<void> {
    try {
      const res = await fetch('/api/students');
      const json = await res.json();
      if (json.success) setStudents(json.data);
    } catch {
      // Handle network error
    }
  }

  async function fetchStations(): Promise<void> {
    try {
      const res = await fetch('/api/stations');
      const json = await res.json();
      if (json.success) setStations(json.data);
    } catch {
      // Handle network error
    }
  }

  async function fetchResults(): Promise<void> {
    try {
      const res = await fetch('/api/results');
      const json = await res.json();
      if (json.success) setRecentResults(json.data);
    } catch {
      // Handle network error
    }
  }

  /**
   * Reads an Excel roster file and uploads it to the backend.
   */
  async function handleExcelUpload(event: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    const reader = new FileReader();

    reader.onload = async (e) => {
      const base64Content = (e.target?.result as string).split(',')[1];
      try {
        const res = await fetch('/api/students/import-excel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileBase64: base64Content })
        });

        const json = await res.json();

        if (json.success) {
          showNotification('success', `${json.importedCount} Teilnehmer erfolgreich aus Excel importiert!`);
          fetchStudents();
        } else {
          showNotification('error', json.message || 'Fehler beim Excel-Import');
        }
      } catch {
        showNotification('error', 'Verbindung zum Server fehlgeschlagen.');
      } finally {
        setIsLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.readAsDataURL(file);
  }

  /**
   * Adds a single student participant.
   */
  async function handleCreateStudent(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!newStudent.start_number || !newStudent.first_name || !newStudent.last_name) {
      showNotification('error', 'Bitte füllen Sie alle Pflichtfelder aus.');
      return;
    }

    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStudent)
      });

      const json = await res.json();
      if (json.success) {
        showNotification('success', `Teilnehmer ${newStudent.first_name} ${newStudent.last_name} angelegt.`);
        setShowAddStudentModal(false);
        setNewStudent({
          start_number: '',
          first_name: '',
          last_name: '',
          gender: 'M',
          birth_year: new Date().getFullYear() - 12,
          group_name: '',
          notes: ''
        });
        fetchStudents();
      } else {
        showNotification('error', json.message || 'Fehler beim Erstellen des Teilnehmers.');
      }
    } catch {
      showNotification('error', 'Server nicht erreichbar.');
    }
  }

  /**
   * Removes an individual result entry.
   */
  async function handleDeleteResult(id: number): Promise<void> {
    if (!confirm('Möchten Sie diese Wertung wirklich löschen?')) return;

    try {
      const res = await fetch(`/api/results/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        showNotification('success', 'Wertung erfolgreich entfernt.');
        fetchResults();
        fetchStations();
      }
    } catch {
      showNotification('error', 'Konnte Wertung nicht löschen.');
    }
  }

  function showNotification(type: 'success' | 'error', text: string): void {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 4000);
  }

  const filteredStudents = students.filter((s) => {
    const term = searchQuery.toLowerCase();
    return (
      s.start_number.toLowerCase().includes(term) ||
      s.first_name.toLowerCase().includes(term) ||
      s.last_name.toLowerCase().includes(term) ||
      s.group_name.toLowerCase().includes(term)
    );
  });

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2.5 rounded-lg text-white font-bold">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              GymScore Local
              <span className="text-xs px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-700 font-mono">
                v1.0.0
              </span>
            </h1>
            <p className="text-xs text-slate-400">Offline Sport-Assessment-Manager für Schulen & Vereine</p>
          </div>
        </div>

        {/* Network status pill & Actions */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700 px-3 py-1.5 rounded-lg text-xs">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-slate-300 font-mono">
              {networkInfo ? `${networkInfo.ipAddress}:${networkInfo.port}` : 'Lokales Netz aktiv'}
            </span>
          </div>

          <button
            onClick={() => setShowQrModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-1.5 rounded-lg font-medium text-sm transition-colors"
          >
            <QrCode className="w-4 h-4" />
            <span>Helfer QR-Code</span>
          </button>

          <a
            href="/api/results/export-excel"
            download
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-1.5 rounded-lg font-medium text-sm transition-colors"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Excel-Export</span>
          </a>
        </div>
      </header>

      {/* Global Notification Toast */}
      {statusMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-lg border shadow-xl text-sm font-medium ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-700 text-emerald-200'
              : 'bg-rose-950/90 border-rose-700 text-rose-200'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col p-6 max-w-7xl w-full mx-auto gap-6">
        {/* Metric Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Teilnehmer</span>
              <Users className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-white">{students.length}</div>
            <div className="text-xs text-slate-400 mt-1">Registrierte Schüler</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Aktive Stationen</span>
              <Trophy className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {stations.filter((s) => s.is_active).length}
            </div>
            <div className="text-xs text-slate-400 mt-1">Im Wertungsdurchlauf</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Erfasste Wertungen</span>
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white">{recentResults.length}</div>
            <div className="text-xs text-slate-400 mt-1">Gesamte Messwerte</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Netzwerk</span>
              <Wifi className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-sm font-mono font-bold text-white truncate">
              {networkInfo?.ipAddress || '127.0.0.1'}
            </div>
            <div className="text-xs text-emerald-400 mt-1 font-medium">100% Offline-Betrieb</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-800">
          <div className="flex space-x-2">
            {[
              { id: 'overview', label: 'Live-Übersicht', icon: Activity },
              { id: 'students', label: 'Teilnehmerliste', icon: Users },
              { id: 'stations', label: 'Stationen', icon: Trophy },
              { id: 'results', label: 'Ergebnisse & Audit', icon: FileSpreadsheet }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                    isActive
                      ? 'border-blue-500 text-blue-400 bg-slate-900/50'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={fetchInitialData}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded bg-slate-900 border border-slate-800"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Aktualisieren</span>
          </button>
        </div>

        {/* TAB 1: Live Overview */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Station Progress Bars */}
            <div className="lg:col-span-1 space-y-4">
              <h2 className="text-base font-semibold text-white">Fortschritt je Station</h2>
              <div className="space-y-3">
                {stations.map((station) => {
                  const completed = station.completed_students_count || 0;
                  const total = students.length || 1;
                  const pct = Math.min(100, Math.round((completed / total) * 100));

                  return (
                    <div
                      key={station.id}
                      className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2"
                    >
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-semibold text-white">{station.name}</span>
                        <span className="text-xs text-slate-400 font-mono">
                          {completed} / {students.length} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-600 h-full rounded-full transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="text-xs text-slate-400 flex justify-between">
                        <span>Einheit: {station.unit}</span>
                        <span>{station.total_results_count || 0} Messungen</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Live Result Stream */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-base font-semibold text-white">Letzte eingehende Wertungen</h2>
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-800/80 text-slate-300 text-xs uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="px-4 py-3">Uhrzeit</th>
                        <th className="px-4 py-3">Startnr.</th>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Klasse</th>
                        <th className="px-4 py-3">Station</th>
                        <th className="px-4 py-3 text-right">Messwert</th>
                        <th className="px-4 py-3 text-center">Aktion</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {recentResults.slice(0, 10).map((res) => (
                        <tr key={res.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="px-4 py-3 text-slate-400 font-mono text-xs">
                            {new Date(res.recorded_at).toLocaleTimeString('de-DE')}
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-blue-400">
                            #{res.start_number}
                          </td>
                          <td className="px-4 py-3 font-medium text-white">
                            {res.first_name} {res.last_name}
                          </td>
                          <td className="px-4 py-3 text-slate-400">{res.group_name || '—'}</td>
                          <td className="px-4 py-3 text-slate-300">{res.station_name}</td>
                          <td className="px-4 py-3 font-mono font-bold text-white text-right">
                            {res.raw_value} {res.station_unit}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => handleDeleteResult(res.id)}
                              title="Wertung löschen"
                              className="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}

                      {recentResults.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                            Noch keine Wertungen eingegangen. Helfer können Ergebnisse über den QR-Code eintragen.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Students Roster */}
        {activeTab === 'students' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Suchen nach Startnr, Name oder Klasse..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleExcelUpload}
                  accept=".xlsx, .xls"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <Upload className="w-4 h-4 text-blue-400" />
                  <span>Excel importieren</span>
                </button>

                <a
                  href="/api/students/template/download"
                  download
                  className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <Download className="w-4 h-4 text-slate-400" />
                  <span>Vorlage</span>
                </a>

                <button
                  onClick={() => setShowAddStudentModal(true)}
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Teilnehmer anlegen</span>
                </button>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-800/80 text-slate-300 text-xs uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="px-4 py-3">Startnummer</th>
                      <th className="px-4 py-3">Nachname</th>
                      <th className="px-4 py-3">Vorname</th>
                      <th className="px-4 py-3">Geschlecht</th>
                      <th className="px-4 py-3">Jahrgang</th>
                      <th className="px-4 py-3">Klasse / Gruppe</th>
                      <th className="px-4 py-3">Notizen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredStudents.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-blue-400">
                          #{s.start_number}
                        </td>
                        <td className="px-4 py-3 font-semibold text-white">{s.last_name}</td>
                        <td className="px-4 py-3 text-slate-200">{s.first_name}</td>
                        <td className="px-4 py-3 text-slate-400">{s.gender}</td>
                        <td className="px-4 py-3 text-slate-400 font-mono">{s.birth_year}</td>
                        <td className="px-4 py-3 text-slate-300">{s.group_name || '—'}</td>
                        <td className="px-4 py-3 text-xs text-slate-500 truncate max-w-xs">
                          {s.notes || '—'}
                        </td>
                      </tr>
                    ))}

                    {filteredStudents.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                          Keine Teilnehmer gefunden. Importieren Sie eine Excel-Liste oder legen Sie manuell Teilnehmer an.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Stations Config */}
        {activeTab === 'stations' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stations.map((st) => (
              <div
                key={st.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono uppercase bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                      Station #{st.id}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-medium ${
                        st.is_active
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {st.is_active ? 'Aktiv' : 'Inaktiv'}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white">{st.name}</h3>
                  <div className="mt-2 space-y-1 text-xs text-slate-400">
                    <div>
                      <span className="text-slate-500">Einheit: </span>
                      <span className="font-mono text-slate-300">{st.unit}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Wertung: </span>
                      <span className="text-slate-300">
                        {st.sort_order === 'lower_is_better'
                          ? 'Niedriger ist besser (z. B. Zeit)'
                          : 'Höher ist besser (z. B. Weite)'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Plausibler Bereich: </span>
                      <span className="font-mono text-slate-300">
                        {st.min_val} – {st.max_val} {st.unit}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-3 flex items-center justify-between text-xs text-slate-400">
                  <span>{st.total_results_count || 0} Einträge erfasst</span>
                  <span className="text-blue-400 font-medium">Bereit für Helfer</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 4: Results & Export */}
        {activeTab === 'results' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">Gesamte erfasste Messergebnisse</h2>
              <a
                href="/api/results/export-excel"
                download
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Excel-Auswertung herunterladen (.xlsx)</span>
              </a>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-800/80 text-slate-300 text-xs uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="px-4 py-3">Startnr.</th>
                      <th className="px-4 py-3">Schüler</th>
                      <th className="px-4 py-3">Klasse</th>
                      <th className="px-4 py-3">Station</th>
                      <th className="px-4 py-3 text-right">Messwert</th>
                      <th className="px-4 py-3">Bemerkung</th>
                      <th className="px-4 py-3">Zeitstempel</th>
                      <th className="px-4 py-3 text-center">Löschen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {recentResults.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-blue-400">
                          #{r.start_number}
                        </td>
                        <td className="px-4 py-3 font-medium text-white">
                          {r.first_name} {r.last_name}
                        </td>
                        <td className="px-4 py-3 text-slate-400">{r.group_name || '—'}</td>
                        <td className="px-4 py-3 text-slate-200">{r.station_name}</td>
                        <td className="px-4 py-3 font-mono font-bold text-white text-right">
                          {r.raw_value} {r.station_unit}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-400">
                          {r.feedback_tags || r.helper_comment || '—'}
                        </td>
                        <td className="px-4 py-3 text-xs font-mono text-slate-500">
                          {new Date(r.recorded_at).toLocaleTimeString('de-DE')}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleDeleteResult(r.id)}
                            className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}

                    {recentResults.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                          Bisher keine Wertungen vorhanden.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* QR Code Modal for Hall Display */}
      {showQrModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 text-center space-y-4">
            <h3 className="text-xl font-bold text-white">Helfer-Verbindung (WLAN)</h3>
            <p className="text-sm text-slate-300">
              Scannen Sie diesen QR-Code mit dem Smartphone oder Tablet, um die Eingabemaske zu öffnen:
            </p>

            {networkInfo?.qrCodeDataUrl ? (
              <div className="bg-white p-4 rounded-xl inline-block mx-auto border-4 border-slate-200">
                <img
                  src={networkInfo.qrCodeDataUrl}
                  alt="Helfer QR Code"
                  className="w-64 h-64 mx-auto"
                />
              </div>
            ) : (
              <div className="p-8 text-slate-400">QR-Code wird generiert...</div>
            )}

            <div className="bg-slate-800 p-3 rounded-lg text-xs font-mono text-blue-300 break-all select-all">
              {networkInfo?.url}/helper
            </div>

            <p className="text-xs text-slate-400 text-left bg-slate-800/50 p-3 rounded-lg space-y-1">
              <span className="font-semibold text-slate-200 block">Hinweis für Helfer:</span>
              1. Mit demselben Hallen-WLAN / Hotspot verbinden.<br />
              2. Kamera auf den QR-Code richten und Link antippen.<br />
              3. Eigene Station wählen und Startnummern eingeben.
            </p>

            <button
              onClick={() => setShowQrModal(false)}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors"
            >
              Schließen
            </button>
          </div>
        </div>
      )}

      {/* Manual Student Creation Modal */}
      {showAddStudentModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleCreateStudent}
            className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4"
          >
            <h3 className="text-lg font-bold text-white">Teilnehmer manuell erfassen</h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-300">Startnummer *</label>
                <input
                  type="text"
                  required
                  value={newStudent.start_number}
                  onChange={(e) => setNewStudent({ ...newStudent, start_number: e.target.value })}
                  placeholder="z.B. 101"
                  className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300">Klasse / Gruppe</label>
                <input
                  type="text"
                  value={newStudent.group_name}
                  onChange={(e) => setNewStudent({ ...newStudent, group_name: e.target.value })}
                  placeholder="z.B. 6B"
                  className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-300">Vorname *</label>
                <input
                  type="text"
                  required
                  value={newStudent.first_name}
                  onChange={(e) => setNewStudent({ ...newStudent, first_name: e.target.value })}
                  className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300">Nachname *</label>
                <input
                  type="text"
                  required
                  value={newStudent.last_name}
                  onChange={(e) => setNewStudent({ ...newStudent, last_name: e.target.value })}
                  className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-300">Geschlecht *</label>
                <select
                  value={newStudent.gender}
                  onChange={(e) => setNewStudent({ ...newStudent, gender: e.target.value })}
                  className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="M">Männlich (M)</option>
                  <option value="W">Weiblich (W)</option>
                  <option value="D">Divers (D)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300">Geburtsjahr *</label>
                <input
                  type="number"
                  required
                  value={newStudent.birth_year}
                  onChange={(e) => setNewStudent({ ...newStudent, birth_year: Number(e.target.value) })}
                  className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddStudentModal(false)}
                className="w-1/2 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                className="w-1/2 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Speichern
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
