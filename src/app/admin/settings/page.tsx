'use client';

import { useState, useEffect } from 'react';
import { Settings, Bell, Globe, DollarSign, Calendar, Save, Check, AlertCircle, Loader2, Building, Phone, Mail, MapPin, Shield, RefreshCw, Zap, MessageSquare, Clock, LogIn, LogOut, FileText, Send, CheckCircle, XCircle, Home, Edit2, X, Wifi, Key, Users, Maximize, Database, Trash2, Eye, Download, BarChart2, ExternalLink } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface BusinessSettings {
  business_name: string;
  business_name_ar: string;
  contact_email: string;
  contact_phone: string;
  whatsapp_number: string;
  address: string;
  address_ar: string;
}

interface BookingSettings {
  min_booking_months: number;
  max_booking_months: number;
  advance_booking_days: number;
  cancellation_policy_days: number;
  require_id_verification: boolean;
  auto_confirm_payment: boolean;
}

interface NotificationSettings {
  email_notifications: boolean;
  whatsapp_notifications: boolean;
  admin_email: string;
  reminder_days_before: number;
}

interface AutomationSettings {
  whatsapp_enabled: boolean;
  automation_contract_whatsapp: boolean;
  automation_contract_email: boolean;
  automation_checkin_7d: boolean;
  automation_checkin_3d: boolean;
  automation_checkin_same: boolean;
  automation_pre_arrival: boolean;
  automation_checkout_7d: boolean;
  automation_checkout_3d: boolean;
  automation_checkout_same: boolean;
  // Admin notifications
  admin_whatsapp_number: string;
  admin_notify_booking_created: boolean;
  admin_notify_payment_confirmed: boolean;
  admin_notify_bank_transfer: boolean;
}

interface AutomationStatus {
  whatsapp_configured: boolean;
  demo_mode: boolean;
}

interface Room {
  id: string;
  name: string;
  name_ar: string;
  description: string;
  description_ar: string;
  monthly_rate: number;
  yearly_rate: number;
  amenities: string[];
  images: string[];
  size_sqm: number;
  capacity: number;
  featured: boolean;
  slug: string;
  door_code?: string;
  wifi_network?: string;
  wifi_password?: string;
  studio_guide_url?: string;
  checkin_time?: string;
  checkout_time?: string;
}

// Database Viewer Types
interface Guest {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  id_type: string;
  id_number: string | null;
  nationality: string;
  created_at: string;
  updated_at: string;
}

interface Booking {
  id: string;
  room_id: string;
  guest_id: string;
  start_date: string;
  end_date: string;
  rental_type: string;
  rate_at_booking: number;
  total_amount: number;
  status: 'pending' | 'pending_payment' | 'confirmed' | 'cancelled';
  payment_status: string;
  created_at: string;
  notes: string | null;
  reminders_enabled: boolean;
}

interface AvailabilityBlock {
  id: string;
  room_id: string;
  start_date: string;
  end_date: string;
  reason: string;
  created_at: string;
}

interface ProcessedWebhookEvent {
  id: string;
  event_type: string;
  processed_at: string;
}

interface DatabaseData {
  rooms: Room[];
  guests: Guest[];
  bookings: Booking[];
  availabilityBlocks: AvailabilityBlock[];
  processedWebhookEvents: ProcessedWebhookEvent[];
  adminSettings: AutomationSettings;
  metadata: {
    counts: {
      rooms: number;
      guests: number;
      bookings: number;
      availabilityBlocks: number;
      processedWebhookEvents: number;
    };
    lastUpdated: string;
  };
}

type CollectionName = 'rooms' | 'guests' | 'bookings' | 'availabilityBlocks' | 'processedWebhookEvents' | 'adminSettings';

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<'business' | 'booking' | 'notifications' | 'automations' | 'rooms' | 'database' | 'analytics'>('automations');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [testingWhatsApp, setTestingWhatsApp] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Test all messages state
  const [testAllLoading, setTestAllLoading] = useState(false);
  const [testAllResults, setTestAllResults] = useState<{
    summary: { total: number; sent: number; failed: number };
    results: Array<{ type: string; name: string; success: boolean; error?: string }>;
  } | null>(null);
  const [selectedTestMessages, setSelectedTestMessages] = useState<string[]>([]);
  const [testLocale, setTestLocale] = useState<'en' | 'ar'>('en');
  const [testingAdminNotification, setTestingAdminNotification] = useState(false);

  // Settings state
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>({
    business_name: 'شرمة مستقر',
    business_name_ar: 'شرمة مستقر',
    contact_email: 'info@mustaqar.com',
    contact_phone: '+966 50 123 4567',
    whatsapp_number: '+966 50 123 4567',
    address: 'Riyadh, Saudi Arabia',
    address_ar: 'الرياض، المملكة العربية السعودية',
  });

  const [bookingSettings, setBookingSettings] = useState<BookingSettings>({
    min_booking_months: 1,
    max_booking_months: 36,
    advance_booking_days: 365,
    cancellation_policy_days: 7,
    require_id_verification: true,
    auto_confirm_payment: false,
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    email_notifications: true,
    whatsapp_notifications: true,
    admin_email: 'admin@mustaqar.com',
    reminder_days_before: 3,
  });

  const [automationSettings, setAutomationSettings] = useState<AutomationSettings>({
    whatsapp_enabled: true,
    automation_contract_whatsapp: true,
    automation_contract_email: true,
    automation_checkin_7d: true,
    automation_checkin_3d: true,
    automation_checkin_same: true,
    automation_pre_arrival: true,
    automation_checkout_7d: true,
    automation_checkout_3d: true,
    automation_checkout_same: true,
    // Admin notifications
    admin_whatsapp_number: '',
    admin_notify_booking_created: false,
    admin_notify_payment_confirmed: false,
    admin_notify_bank_transfer: false,
  });

  const [automationStatus, setAutomationStatus] = useState<AutomationStatus>({
    whatsapp_configured: false,
    demo_mode: false,
  });

  // Room management state
  const [rooms, setRooms] = useState<Room[]>([]);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [roomSaving, setRoomSaving] = useState(false);

  // Database viewer state
  const [databaseData, setDatabaseData] = useState<DatabaseData | null>(null);
  const [activeCollection, setActiveCollection] = useState<CollectionName>('rooms');
  const [dbLoading, setDbLoading] = useState(false);
  const [editingDbRecord, setEditingDbRecord] = useState<{ collection: CollectionName; record: Record<string, unknown> } | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [dbSaving, setDbSaving] = useState(false);
  const [confirmCheckbox, setConfirmCheckbox] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState<{ collection: CollectionName; id: string; name: string } | null>(null);

  useEffect(() => {
    // Fetch automation settings from API
    const fetchAutomationSettings = async () => {
      try {
        const response = await fetch('/api/admin/settings');
        if (response.ok) {
          const data = await response.json();
          if (data.settings) {
            setAutomationSettings({
              whatsapp_enabled: data.settings.whatsapp_enabled ?? true,
              automation_contract_whatsapp: data.settings.automation_contract_whatsapp ?? true,
              automation_contract_email: data.settings.automation_contract_email ?? true,
              automation_checkin_7d: data.settings.automation_checkin_7d ?? true,
              automation_checkin_3d: data.settings.automation_checkin_3d ?? true,
              automation_checkin_same: data.settings.automation_checkin_same ?? true,
              automation_pre_arrival: data.settings.automation_pre_arrival ?? true,
              automation_checkout_7d: data.settings.automation_checkout_7d ?? true,
              automation_checkout_3d: data.settings.automation_checkout_3d ?? true,
              automation_checkout_same: data.settings.automation_checkout_same ?? true,
              // Admin notifications
              admin_whatsapp_number: data.settings.admin_whatsapp_number ?? '',
              admin_notify_booking_created: data.settings.admin_notify_booking_created ?? false,
              admin_notify_payment_confirmed: data.settings.admin_notify_payment_confirmed ?? false,
              admin_notify_bank_transfer: data.settings.admin_notify_bank_transfer ?? false,
            });
          }
          if (data.status) {
            setAutomationStatus(data.status);
          }
        }
      } catch (err) {
        console.error('Failed to fetch automation settings:', err);
      }
    };

    // Fetch rooms from API
    const fetchRooms = async () => {
      try {
        const response = await fetch('/api/admin/rooms');
        if (response.ok) {
          const data = await response.json();
          if (data.rooms) {
            setRooms(data.rooms);
          }
        }
      } catch (err) {
        console.error('Failed to fetch rooms:', err);
      }
    };

    Promise.all([fetchAutomationSettings(), fetchRooms()]).finally(() => {
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');

      // Save automation settings to API
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(automationSettings),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleAutomationToggle = async (key: keyof AutomationSettings, value: boolean) => {
    // Optimistic update
    const previousSettings = { ...automationSettings };
    setAutomationSettings(prev => ({ ...prev, [key]: value }));

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      });

      if (!response.ok) {
        // Rollback on failure
        setAutomationSettings(previousSettings);
        setError('Failed to update setting');
        setTimeout(() => setError(''), 3000);
      }
    } catch (err) {
      // Rollback on error
      setAutomationSettings(previousSettings);
      setError('Failed to update setting');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleTestWhatsApp = async () => {
    setTestingWhatsApp(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/admin/test-whatsapp', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        setTestResult({ success: true, message: 'Test message sent successfully!' });
      } else {
        setTestResult({ success: false, message: data.error || 'Failed to send test message' });
      }
    } catch (err) {
      setTestResult({ success: false, message: 'Network error. Please try again.' });
    } finally {
      setTestingWhatsApp(false);
      setTimeout(() => setTestResult(null), 5000);
    }
  };

  const handleTestAllMessages = async (sendAll: boolean = false) => {
    setTestAllLoading(true);
    setTestAllResults(null);

    try {
      const response = await fetch('/api/admin/test-all-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageTypes: sendAll ? undefined : selectedTestMessages,
          sendAll,
          locale: testLocale,
          delayMs: 2000, // 2 second delay between messages
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setTestAllResults({
          summary: data.summary,
          results: data.results,
        });
      } else {
        setError(data.error || 'Failed to send test messages');
        setTimeout(() => setError(''), 5000);
      }
    } catch (err) {
      setError('Network error. Please try again.');
      setTimeout(() => setError(''), 5000);
    } finally {
      setTestAllLoading(false);
    }
  };

  const MESSAGE_TYPES_INFO = [
    { id: 'contract_confirmation', name: 'Contract Confirmation', icon: '📝', description: 'Booking confirmation' },
    { id: 'checkin_7d', name: '7-Day Check-in', icon: '📅', description: '7 days before' },
    { id: 'checkin_3d', name: '3-Day Check-in', icon: '📆', description: '3 days before' },
    { id: 'pre_arrival', name: 'Pre-Arrival Info', icon: '🔑', description: 'Door code & WiFi' },
    { id: 'checkin_same', name: 'Check-in Day', icon: '🏠', description: 'Same day' },
    { id: 'checkout_7d', name: '7-Day Check-out', icon: '📋', description: '7 days before' },
    { id: 'checkout_3d', name: '3-Day Check-out', icon: '⏰', description: '3 days before' },
    { id: 'checkout_same', name: 'Check-out Day', icon: '👋', description: 'Same day' },
  ];

  const toggleMessageType = (id: string) => {
    setSelectedTestMessages(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const handleRoomUpdate = async (roomId: string, updates: Partial<Room>) => {
    setRoomSaving(true);
    try {
      const response = await fetch('/api/admin/rooms', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: roomId, ...updates }),
      });

      if (!response.ok) {
        throw new Error('Failed to update room');
      }

      const data = await response.json();
      if (data.room) {
        setRooms(prev => prev.map(r => r.id === roomId ? data.room : r));
        setEditingRoom(null);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      setError('Failed to update room');
      setTimeout(() => setError(''), 3000);
    } finally {
      setRoomSaving(false);
    }
  };

  // Database viewer functions
  const fetchDatabaseData = async () => {
    setDbLoading(true);
    try {
      const response = await fetch('/api/admin/database');
      if (response.ok) {
        const data = await response.json();
        setDatabaseData(data);
      }
    } catch (err) {
      console.error('Failed to fetch database:', err);
      setError('Failed to load database');
      setTimeout(() => setError(''), 3000);
    } finally {
      setDbLoading(false);
    }
  };

  const handleDbRecordUpdate = async () => {
    if (!editingDbRecord || !confirmCheckbox) return;

    setDbSaving(true);
    try {
      const response = await fetch('/api/admin/database', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collection: editingDbRecord.collection,
          id: editingDbRecord.record.id,
          updates: editingDbRecord.record,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update record');
      }

      await fetchDatabaseData();
      setShowEditModal(false);
      setEditingDbRecord(null);
      setConfirmCheckbox(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update record');
      setTimeout(() => setError(''), 3000);
    } finally {
      setDbSaving(false);
    }
  };

  const handleDbRecordDelete = async () => {
    if (!deletingRecord || deleteConfirmText !== 'DELETE') return;

    setDbSaving(true);
    try {
      const response = await fetch('/api/admin/database', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collection: deletingRecord.collection,
          id: deletingRecord.id,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete record');
      }

      await fetchDatabaseData();
      setShowDeleteModal(false);
      setDeletingRecord(null);
      setDeleteConfirmText('');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete record');
      setTimeout(() => setError(''), 3000);
    } finally {
      setDbSaving(false);
    }
  };

  const exportDatabaseJson = () => {
    if (!databaseData) return;
    const blob = new Blob([JSON.stringify(databaseData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `database-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Helper to get display name for a record
  const getRecordDisplayName = (collection: CollectionName, record: Record<string, unknown>): string => {
    switch (collection) {
      case 'rooms':
        return (record as unknown as Room).name || 'Unknown Room';
      case 'guests':
        return (record as unknown as Guest).full_name || 'Unknown Guest';
      case 'bookings':
        return `Booking ${((record as unknown as Booking).id || '').slice(-8)}`;
      case 'availabilityBlocks':
        return `Block ${((record as unknown as AvailabilityBlock).id || '').slice(-8)}`;
      case 'processedWebhookEvents':
        return (record as unknown as ProcessedWebhookEvent).event_type || 'Unknown Event';
      default:
        return 'Record';
    }
  };

  // Helper to resolve room name from id
  const getRoomName = (roomId: string): string => {
    const room = databaseData?.rooms.find(r => r.id === roomId);
    return room?.name || roomId.slice(-8);
  };

  // Helper to resolve guest name from id
  const getGuestName = (guestId: string): string => {
    const guest = databaseData?.guests.find(g => g.id === guestId);
    return guest?.full_name || guestId.slice(-8);
  };

  const tabs = [
    { id: 'automations' as const, label: 'Automations', icon: Zap },
    { id: 'analytics' as const, label: 'Analytics', icon: BarChart2 },
    { id: 'database' as const, label: 'Database', icon: Database },
    { id: 'business' as const, label: 'Business Info', icon: Building },
    { id: 'booking' as const, label: 'Booking Rules', icon: Calendar },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'rooms' as const, label: 'Room Management', icon: Settings },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-[#C9A96E] animate-spin mx-auto mb-4" />
          <p className="text-[#2D2D2D]">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#2D2D2D]">Settings</h1>
          <p className="text-[#8B7355] mt-1">Configure your rental platform settings</p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className={`px-6 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all ${
            saved
              ? 'bg-emerald-500 text-white'
              : 'bg-gradient-to-r from-[#C9A96E] to-[#B89355] text-white hover:from-[#D4B57A] hover:to-[#C9A96E] shadow-md hover:shadow-lg'
          }`}
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : saved ? (
            <>
              <Check className="h-4 w-4" />
              Saved!
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Changes
            </>
          )}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-lg border border-[#E8E3DB] overflow-hidden">
        <div className="flex border-b border-[#E8E3DB] overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'text-[#C9A96E] border-b-2 border-[#C9A96E] bg-[#FAF7F2]'
                  : 'text-[#8B7355] hover:text-[#2D2D2D] hover:bg-[#FAF7F2]/50'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Automations Tab */}
          {activeTab === 'automations' && (
            <div className="space-y-8">
              {/* WhatsApp Connection Status */}
              <div className="bg-gradient-to-r from-[#25D366]/10 to-[#128C7E]/10 rounded-2xl p-6 border border-[#25D366]/20">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#25D366] flex items-center justify-center">
                      <MessageSquare className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#2D2D2D] text-lg">WhatsApp Notifications</h3>
                      <p className="text-sm text-[#8B7355]">
                        {automationStatus.whatsapp_configured
                          ? 'Connected via TextMeBot API'
                          : 'Not configured - Set TEXTMEBOT_API_KEY in environment'}
                        {automationStatus.demo_mode && ' (Demo Mode)'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {automationStatus.whatsapp_configured ? (
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#25D366]/20 text-[#128C7E] rounded-full text-sm font-medium">
                        <CheckCircle className="h-4 w-4" />
                        Connected
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-600 rounded-full text-sm font-medium">
                        <XCircle className="h-4 w-4" />
                        Not Configured
                      </span>
                    )}
                    <button
                      onClick={handleTestWhatsApp}
                      disabled={testingWhatsApp || !automationStatus.whatsapp_configured}
                      className="px-4 py-2 bg-[#25D366] text-white rounded-lg font-medium hover:bg-[#128C7E] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {testingWhatsApp ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Testing...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Test Connection
                        </>
                      )}
                    </button>
                  </div>
                </div>
                {testResult && (
                  <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 ${
                    testResult.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {testResult.success ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                    {testResult.message}
                  </div>
                )}

                {/* Master WhatsApp Toggle */}
                <div className="mt-4 pt-4 border-t border-[#25D366]/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-[#2D2D2D]">Enable All WhatsApp Notifications</p>
                      <p className="text-xs text-[#8B7355]">Master switch for all WhatsApp automations</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={automationSettings.whatsapp_enabled}
                        onChange={e => handleAutomationToggle('whatsapp_enabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#25D366]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#25D366]"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Contract Delivery Section */}
              <div className="bg-white rounded-xl border border-[#E8E3DB] overflow-hidden">
                <div className="px-6 py-4 bg-[#FAF7F2] border-b border-[#E8E3DB]">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-[#C9A96E]" />
                    <h3 className="font-bold text-[#2D2D2D]">Contract Delivery</h3>
                  </div>
                  <p className="text-sm text-[#8B7355] mt-1">Send booking confirmation and contract to guests</p>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between p-4 bg-[#FAF7F2] rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#25D366]/20 flex items-center justify-center">
                        <MessageSquare className="h-4 w-4 text-[#25D366]" />
                      </div>
                      <div>
                        <p className="font-medium text-[#2D2D2D]">Send via WhatsApp</p>
                        <p className="text-xs text-[#8B7355]">Send contract via WhatsApp message</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={automationSettings.automation_contract_whatsapp}
                        onChange={e => handleAutomationToggle('automation_contract_whatsapp', e.target.checked)}
                        disabled={!automationSettings.whatsapp_enabled}
                        className="sr-only peer"
                      />
                      <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#25D366]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#25D366] ${!automationSettings.whatsapp_enabled ? 'opacity-50' : ''}`}></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-[#FAF7F2] rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#C9A96E]/20 flex items-center justify-center">
                        <Mail className="h-4 w-4 text-[#C9A96E]" />
                      </div>
                      <div>
                        <p className="font-medium text-[#2D2D2D]">Send via Email</p>
                        <p className="text-xs text-[#8B7355]">Send contract via email (Resend)</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={automationSettings.automation_contract_email}
                        onChange={e => handleAutomationToggle('automation_contract_email', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#C9A96E]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#C9A96E]"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Check-in Reminders Section */}
              <div className="bg-white rounded-xl border border-[#E8E3DB] overflow-hidden">
                <div className="px-6 py-4 bg-[#FAF7F2] border-b border-[#E8E3DB]">
                  <div className="flex items-center gap-3">
                    <LogIn className="h-5 w-5 text-[#5B8A6B]" />
                    <h3 className="font-bold text-[#2D2D2D]">Check-in Reminders</h3>
                  </div>
                  <p className="text-sm text-[#8B7355] mt-1">Remind guests about upcoming check-in dates</p>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between p-4 bg-[#FAF7F2] rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#5B8A6B]/20 flex items-center justify-center">
                        <Clock className="h-4 w-4 text-[#5B8A6B]" />
                      </div>
                      <div>
                        <p className="font-medium text-[#2D2D2D]">7 Days Before</p>
                        <p className="text-xs text-[#8B7355]">Send reminder 7 days before check-in</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={automationSettings.automation_checkin_7d}
                        onChange={e => handleAutomationToggle('automation_checkin_7d', e.target.checked)}
                        disabled={!automationSettings.whatsapp_enabled}
                        className="sr-only peer"
                      />
                      <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#5B8A6B]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5B8A6B] ${!automationSettings.whatsapp_enabled ? 'opacity-50' : ''}`}></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-[#FAF7F2] rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#5B8A6B]/20 flex items-center justify-center">
                        <Clock className="h-4 w-4 text-[#5B8A6B]" />
                      </div>
                      <div>
                        <p className="font-medium text-[#2D2D2D]">3 Days Before</p>
                        <p className="text-xs text-[#8B7355]">Send reminder 3 days before check-in</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={automationSettings.automation_checkin_3d}
                        onChange={e => handleAutomationToggle('automation_checkin_3d', e.target.checked)}
                        disabled={!automationSettings.whatsapp_enabled}
                        className="sr-only peer"
                      />
                      <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#5B8A6B]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5B8A6B] ${!automationSettings.whatsapp_enabled ? 'opacity-50' : ''}`}></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-[#FAF7F2] rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#5B8A6B]/20 flex items-center justify-center">
                        <Clock className="h-4 w-4 text-[#5B8A6B]" />
                      </div>
                      <div>
                        <p className="font-medium text-[#2D2D2D]">Same Day</p>
                        <p className="text-xs text-[#8B7355]">Send reminder on check-in day</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={automationSettings.automation_checkin_same}
                        onChange={e => handleAutomationToggle('automation_checkin_same', e.target.checked)}
                        disabled={!automationSettings.whatsapp_enabled}
                        className="sr-only peer"
                      />
                      <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#5B8A6B]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5B8A6B] ${!automationSettings.whatsapp_enabled ? 'opacity-50' : ''}`}></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Pre-Arrival Info Section */}
              <div className="bg-white rounded-xl border border-[#E8E3DB] overflow-hidden">
                <div className="px-6 py-4 bg-[#FAF7F2] border-b border-[#E8E3DB]">
                  <div className="flex items-center gap-3">
                    <Building className="h-5 w-5 text-[#8B5CF6]" />
                    <h3 className="font-bold text-[#2D2D2D]">Pre-Arrival Information</h3>
                  </div>
                  <p className="text-sm text-[#8B7355] mt-1">Send door code, WiFi details, and studio guide (2 days before check-in)</p>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between p-4 bg-[#FAF7F2] rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#8B5CF6]/20 flex items-center justify-center">
                        <Building className="h-4 w-4 text-[#8B5CF6]" />
                      </div>
                      <div>
                        <p className="font-medium text-[#2D2D2D]">Send Pre-Arrival Details</p>
                        <p className="text-xs text-[#8B7355]">Door code, WiFi password, studio guide link</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={automationSettings.automation_pre_arrival}
                        onChange={e => handleAutomationToggle('automation_pre_arrival', e.target.checked)}
                        disabled={!automationSettings.whatsapp_enabled}
                        className="sr-only peer"
                      />
                      <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#8B5CF6]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8B5CF6] ${!automationSettings.whatsapp_enabled ? 'opacity-50' : ''}`}></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Check-out Reminders Section */}
              <div className="bg-white rounded-xl border border-[#E8E3DB] overflow-hidden">
                <div className="px-6 py-4 bg-[#FAF7F2] border-b border-[#E8E3DB]">
                  <div className="flex items-center gap-3">
                    <LogOut className="h-5 w-5 text-[#C97355]" />
                    <h3 className="font-bold text-[#2D2D2D]">Check-out Reminders</h3>
                  </div>
                  <p className="text-sm text-[#8B7355] mt-1">Remind guests about upcoming check-out dates</p>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between p-4 bg-[#FAF7F2] rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#C97355]/20 flex items-center justify-center">
                        <Clock className="h-4 w-4 text-[#C97355]" />
                      </div>
                      <div>
                        <p className="font-medium text-[#2D2D2D]">7 Days Before</p>
                        <p className="text-xs text-[#8B7355]">Send reminder 7 days before check-out</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={automationSettings.automation_checkout_7d}
                        onChange={e => handleAutomationToggle('automation_checkout_7d', e.target.checked)}
                        disabled={!automationSettings.whatsapp_enabled}
                        className="sr-only peer"
                      />
                      <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#C97355]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#C97355] ${!automationSettings.whatsapp_enabled ? 'opacity-50' : ''}`}></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-[#FAF7F2] rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#C97355]/20 flex items-center justify-center">
                        <Clock className="h-4 w-4 text-[#C97355]" />
                      </div>
                      <div>
                        <p className="font-medium text-[#2D2D2D]">3 Days Before</p>
                        <p className="text-xs text-[#8B7355]">Send reminder 3 days before check-out</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={automationSettings.automation_checkout_3d}
                        onChange={e => handleAutomationToggle('automation_checkout_3d', e.target.checked)}
                        disabled={!automationSettings.whatsapp_enabled}
                        className="sr-only peer"
                      />
                      <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#C97355]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#C97355] ${!automationSettings.whatsapp_enabled ? 'opacity-50' : ''}`}></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-[#FAF7F2] rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#C97355]/20 flex items-center justify-center">
                        <Clock className="h-4 w-4 text-[#C97355]" />
                      </div>
                      <div>
                        <p className="font-medium text-[#2D2D2D]">Same Day</p>
                        <p className="text-xs text-[#8B7355]">Send reminder on check-out day</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={automationSettings.automation_checkout_same}
                        onChange={e => handleAutomationToggle('automation_checkout_same', e.target.checked)}
                        disabled={!automationSettings.whatsapp_enabled}
                        className="sr-only peer"
                      />
                      <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#C97355]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#C97355] ${!automationSettings.whatsapp_enabled ? 'opacity-50' : ''}`}></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Admin WhatsApp Notifications Section */}
              <div className="bg-white rounded-xl border border-[#E8E3DB] overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-[#8B5CF6]/10 to-[#A78BFA]/10 border-b border-[#E8E3DB]">
                  <div className="flex items-center gap-3">
                    <Bell className="h-5 w-5 text-[#8B5CF6]" />
                    <h3 className="font-bold text-[#2D2D2D]">Admin WhatsApp Notifications</h3>
                  </div>
                  <p className="text-sm text-[#8B7355] mt-1">Get instant WhatsApp alerts when bookings are created or payments confirmed</p>
                </div>
                <div className="p-6 space-y-4">
                  {/* Admin Phone Number Input */}
                  <div className="flex items-center gap-4 p-4 bg-[#FAF7F2] rounded-xl">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Admin Phone Number</label>
                      <div className="flex gap-2">
                        <input
                          type="tel"
                          value={automationSettings.admin_whatsapp_number || ''}
                          onChange={e => {
                            const cleaned = e.target.value.replace(/[^\d+]/g, '');
                            setAutomationSettings(prev => ({ ...prev, admin_whatsapp_number: cleaned }));
                          }}
                          onBlur={() => handleAutomationToggle('admin_whatsapp_number' as keyof AutomationSettings, automationSettings.admin_whatsapp_number as unknown as boolean)}
                          placeholder="+966 5XX XXX XXXX"
                          className="flex-1 px-4 py-2 border border-[#E8E3DB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/20 focus:border-[#8B5CF6]"
                        />
                        <button
                          onClick={async () => {
                            if (!automationSettings.admin_whatsapp_number) {
                              alert('Please enter a phone number first');
                              return;
                            }
                            setTestingAdminNotification(true);
                            try {
                              const response = await fetch('/api/admin/test-admin-notification', { method: 'POST' });
                              const data = await response.json();
                              if (data.success) {
                                alert('Test notification sent successfully!');
                              } else {
                                alert('Failed to send: ' + (data.error || 'Unknown error'));
                              }
                            } catch {
                              alert('Failed to send test notification');
                            }
                            setTestingAdminNotification(false);
                          }}
                          disabled={!automationSettings.admin_whatsapp_number || testingAdminNotification}
                          className="px-4 py-2 bg-[#8B5CF6] text-white rounded-lg hover:bg-[#7C3AED] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {testingAdminNotification ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                          Test
                        </button>
                      </div>
                      <p className="text-xs text-[#8B7355] mt-2">Enter your WhatsApp number to receive booking alerts</p>
                    </div>
                  </div>

                  {/* Notification Toggles */}
                  <div className="flex items-center justify-between p-4 bg-[#FAF7F2] rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#8B5CF6]/20 flex items-center justify-center">
                        <Calendar className="h-4 w-4 text-[#8B5CF6]" />
                      </div>
                      <div>
                        <p className="font-medium text-[#2D2D2D]">New Booking Created</p>
                        <p className="text-xs text-[#8B7355]">Get notified when someone starts a booking</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={automationSettings.admin_notify_booking_created}
                        onChange={e => handleAutomationToggle('admin_notify_booking_created', e.target.checked)}
                        disabled={!automationSettings.admin_whatsapp_number}
                        className="sr-only peer"
                      />
                      <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#8B5CF6]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8B5CF6] ${!automationSettings.admin_whatsapp_number ? 'opacity-50' : ''}`}></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-[#FAF7F2] rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#10B981]/20 flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-[#10B981]" />
                      </div>
                      <div>
                        <p className="font-medium text-[#2D2D2D]">Payment Confirmed (Stripe)</p>
                        <p className="text-xs text-[#8B7355]">Get notified when a payment is successful</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={automationSettings.admin_notify_payment_confirmed}
                        onChange={e => handleAutomationToggle('admin_notify_payment_confirmed', e.target.checked)}
                        disabled={!automationSettings.admin_whatsapp_number}
                        className="sr-only peer"
                      />
                      <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#10B981]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#10B981] ${!automationSettings.admin_whatsapp_number ? 'opacity-50' : ''}`}></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-[#FAF7F2] rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#F59E0B]/20 flex items-center justify-center">
                        <Building className="h-4 w-4 text-[#F59E0B]" />
                      </div>
                      <div>
                        <p className="font-medium text-[#2D2D2D]">Bank Transfer Booking</p>
                        <p className="text-xs text-[#8B7355]">Get notified when a bank transfer booking is created</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={automationSettings.admin_notify_bank_transfer}
                        onChange={e => handleAutomationToggle('admin_notify_bank_transfer', e.target.checked)}
                        disabled={!automationSettings.admin_whatsapp_number}
                        className="sr-only peer"
                      />
                      <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#F59E0B]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#F59E0B] ${!automationSettings.admin_whatsapp_number ? 'opacity-50' : ''}`}></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Test All Messages Section */}
              <div className="bg-white rounded-xl border border-[#E8E3DB] overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-[#FAF7F2] to-[#F5F0E8] border-b border-[#E8E3DB]">
                  <div className="flex items-center gap-3">
                    <Send className="h-5 w-5 text-[#C9A96E]" />
                    <h3 className="font-bold text-[#2D2D2D]">Test All WhatsApp Messages</h3>
                  </div>
                  <p className="text-sm text-[#8B7355] mt-1">Send test messages to your admin phone to verify all automations</p>
                </div>
                <div className="p-6 space-y-6">
                  {/* Language Selection */}
                  <div>
                    <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Message Language</label>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setTestLocale('en')}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                          testLocale === 'en'
                            ? 'bg-[#C9A96E] text-white'
                            : 'bg-[#FAF7F2] text-[#2D2D2D] hover:bg-[#E8E3DB]'
                        }`}
                      >
                        🇬🇧 English
                      </button>
                      <button
                        onClick={() => setTestLocale('ar')}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                          testLocale === 'ar'
                            ? 'bg-[#C9A96E] text-white'
                            : 'bg-[#FAF7F2] text-[#2D2D2D] hover:bg-[#E8E3DB]'
                        }`}
                      >
                        🇸🇦 العربية
                      </button>
                    </div>
                  </div>

                  {/* Message Type Selection */}
                  <div>
                    <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Select Messages to Test</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {MESSAGE_TYPES_INFO.map((msg) => (
                        <button
                          key={msg.id}
                          onClick={() => toggleMessageType(msg.id)}
                          className={`p-3 rounded-xl border-2 text-left transition-all ${
                            selectedTestMessages.includes(msg.id)
                              ? 'border-[#C9A96E] bg-[#C9A96E]/10'
                              : 'border-[#E8E3DB] hover:border-[#C9A96E]/50'
                          }`}
                        >
                          <div className="text-xl mb-1">{msg.icon}</div>
                          <p className="font-medium text-[#2D2D2D] text-sm">{msg.name}</p>
                          <p className="text-xs text-[#8B7355]">{msg.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => handleTestAllMessages(false)}
                      disabled={testAllLoading || selectedTestMessages.length === 0}
                      className="px-6 py-3 bg-[#C9A96E] text-white rounded-xl font-semibold hover:bg-[#B89A5F] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {testAllLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      Send Selected ({selectedTestMessages.length})
                    </button>
                    <button
                      onClick={() => handleTestAllMessages(true)}
                      disabled={testAllLoading}
                      className="px-6 py-3 bg-gradient-to-r from-[#5B8A6B] to-[#4A7A5B] text-white rounded-xl font-semibold hover:from-[#6B9A7B] hover:to-[#5B8A6B] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {testAllLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Zap className="h-4 w-4" />
                      )}
                      Send All Messages
                    </button>
                    <button
                      onClick={() => setSelectedTestMessages(MESSAGE_TYPES_INFO.map(m => m.id))}
                      className="px-4 py-3 text-[#C9A96E] hover:bg-[#FAF7F2] rounded-xl font-medium transition-all"
                    >
                      Select All
                    </button>
                    <button
                      onClick={() => setSelectedTestMessages([])}
                      className="px-4 py-3 text-[#8B7355] hover:bg-[#FAF7F2] rounded-xl font-medium transition-all"
                    >
                      Clear
                    </button>
                  </div>

                  {/* Test Results */}
                  {testAllResults && (
                    <div className="mt-4 p-4 bg-[#FAF7F2] rounded-xl">
                      <div className="flex items-center gap-3 mb-4">
                        {testAllResults.summary.failed === 0 ? (
                          <CheckCircle className="h-6 w-6 text-[#5B8A6B]" />
                        ) : (
                          <AlertCircle className="h-6 w-6 text-[#C97355]" />
                        )}
                        <div>
                          <p className="font-bold text-[#2D2D2D]">
                            {testAllResults.summary.sent}/{testAllResults.summary.total} Messages Sent
                          </p>
                          <p className="text-sm text-[#8B7355]">
                            {testAllResults.summary.failed > 0
                              ? `${testAllResults.summary.failed} failed`
                              : 'All messages delivered successfully'}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {testAllResults.results.map((result, idx) => (
                          <div
                            key={idx}
                            className={`flex items-center justify-between p-2 rounded-lg ${
                              result.success ? 'bg-[#5B8A6B]/10' : 'bg-[#C97355]/10'
                            }`}
                          >
                            <span className="text-sm font-medium text-[#2D2D2D]">{result.name}</span>
                            <span className={`text-sm ${result.success ? 'text-[#5B8A6B]' : 'text-[#C97355]'}`}>
                              {result.success ? '✓ Sent' : `✗ ${result.error || 'Failed'}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Warning */}
                  <div className="flex items-start gap-2 text-sm text-[#8B7355] bg-amber-50 p-3 rounded-lg border border-amber-200">
                    <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                    <span>Messages will be sent to your admin phone ({process.env.NEXT_PUBLIC_ADMIN_PHONE || 'configured in .env'}). Each message has a 2-second delay to avoid rate limiting.</span>
                  </div>
                </div>
              </div>

              {/* Info Note */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-800">How Automations Work</p>
                    <p className="text-sm text-blue-700 mt-1">
                      Reminders are sent daily via a cron job. Toggle settings take effect immediately.
                      Disabling the master WhatsApp switch will prevent all WhatsApp messages from being sent.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-8">
              {/* Quick Link to Full Analytics */}
              <div className="bg-gradient-to-r from-[#C9A96E]/10 to-[#B89355]/10 rounded-2xl p-6 border border-[#C9A96E]/20">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#C9A96E] flex items-center justify-center">
                      <BarChart2 className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#2D2D2D] text-lg">Analytics Dashboard</h3>
                      <p className="text-sm text-[#8B7355]">View detailed analytics, charts, and export data</p>
                    </div>
                  </div>
                  <a
                    href="/admin/analytics"
                    className="px-6 py-2.5 bg-gradient-to-r from-[#C9A96E] to-[#B89355] text-white rounded-xl font-semibold hover:from-[#D4B57A] hover:to-[#C9A96E] transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                  >
                    <BarChart2 className="h-4 w-4" />
                    Open Analytics
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>

              {/* Google Analytics Settings */}
              <div className="bg-white rounded-xl border border-[#E8E3DB] overflow-hidden">
                <div className="px-6 py-4 bg-[#FAF7F2] border-b border-[#E8E3DB]">
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-[#C9A96E]" />
                    <h3 className="font-bold text-[#2D2D2D]">Google Analytics 4</h3>
                  </div>
                  <p className="text-sm text-[#8B7355] mt-1">Track visitor behavior and engagement</p>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#2D2D2D] mb-2">GA4 Measurement ID</label>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 px-4 py-3 bg-[#FAF7F2] border-2 border-[#E8E3DB] rounded-xl text-[#8B7355] font-mono text-sm">
                        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'Not configured'}
                      </div>
                    </div>
                    <p className="text-xs text-[#8B7355] mt-2">
                      Set the <code className="bg-[#FAF7F2] px-1 py-0.5 rounded">NEXT_PUBLIC_GA_MEASUREMENT_ID</code> environment variable to enable Google Analytics tracking.
                    </p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-blue-800">Setup Instructions</p>
                        <ol className="text-sm text-blue-700 mt-2 space-y-1 list-decimal list-inside">
                          <li>Go to <a href="https://analytics.google.com/" target="_blank" rel="noopener noreferrer" className="underline">Google Analytics</a> and create a GA4 property</li>
                          <li>Copy your Measurement ID (starts with &quot;G-&quot;)</li>
                          <li>Add it to your environment variables as <code className="bg-blue-100 px-1 py-0.5 rounded">NEXT_PUBLIC_GA_MEASUREMENT_ID</code></li>
                          <li>Redeploy your application</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vercel Analytics Status */}
              <div className="bg-white rounded-xl border border-[#E8E3DB] overflow-hidden">
                <div className="px-6 py-4 bg-[#FAF7F2] border-b border-[#E8E3DB]">
                  <div className="flex items-center gap-3">
                    <svg className="h-5 w-5" viewBox="0 0 76 65" fill="#2D2D2D">
                      <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
                    </svg>
                    <h3 className="font-bold text-[#2D2D2D]">Vercel Analytics</h3>
                  </div>
                  <p className="text-sm text-[#8B7355] mt-1">Real-time performance and visitor insights</p>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-4 p-4 bg-[#F0F9F4] rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-[#5B8A6B] flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-[#2D2D2D]">Vercel Analytics Enabled</p>
                      <p className="text-sm text-[#8B7355]">
                        Analytics and Speed Insights are automatically collected when deployed on Vercel.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <a
                      href="https://vercel.com/analytics"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 bg-[#FAF7F2] rounded-xl hover:bg-[#E8E3DB] transition-colors"
                    >
                      <BarChart2 className="h-5 w-5 text-[#C9A96E]" />
                      <div>
                        <p className="font-medium text-[#2D2D2D]">Web Analytics</p>
                        <p className="text-xs text-[#8B7355]">Traffic & engagement</p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-[#8B7355] ml-auto" />
                    </a>
                    <a
                      href="https://vercel.com/speed-insights"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 bg-[#FAF7F2] rounded-xl hover:bg-[#E8E3DB] transition-colors"
                    >
                      <Zap className="h-5 w-5 text-[#C9A96E]" />
                      <div>
                        <p className="font-medium text-[#2D2D2D]">Speed Insights</p>
                        <p className="text-xs text-[#8B7355]">Performance metrics</p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-[#8B7355] ml-auto" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Business Analytics Summary */}
              <div className="bg-white rounded-xl border border-[#E8E3DB] overflow-hidden">
                <div className="px-6 py-4 bg-[#FAF7F2] border-b border-[#E8E3DB]">
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-5 w-5 text-[#5B8A6B]" />
                    <h3 className="font-bold text-[#2D2D2D]">Business Metrics</h3>
                  </div>
                  <p className="text-sm text-[#8B7355] mt-1">Internal booking and revenue analytics</p>
                </div>
                <div className="p-6">
                  <p className="text-[#8B7355] mb-4">
                    Business metrics are calculated from your booking data and displayed on the Analytics dashboard.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-[#FAF7F2] rounded-xl text-center">
                      <Calendar className="h-6 w-6 text-[#C9A96E] mx-auto mb-2" />
                      <p className="text-xs text-[#8B7355]">Bookings</p>
                    </div>
                    <div className="p-4 bg-[#FAF7F2] rounded-xl text-center">
                      <DollarSign className="h-6 w-6 text-[#5B8A6B] mx-auto mb-2" />
                      <p className="text-xs text-[#8B7355]">Revenue</p>
                    </div>
                    <div className="p-4 bg-[#FAF7F2] rounded-xl text-center">
                      <Users className="h-6 w-6 text-[#6B7BC9] mx-auto mb-2" />
                      <p className="text-xs text-[#8B7355]">Guests</p>
                    </div>
                    <div className="p-4 bg-[#FAF7F2] rounded-xl text-center">
                      <Home className="h-6 w-6 text-[#C97355] mx-auto mb-2" />
                      <p className="text-xs text-[#8B7355]">Rooms</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Business Info Tab */}
          {activeTab === 'business' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Business Name (English)</label>
                  <input
                    type="text"
                    value={businessSettings.business_name}
                    onChange={e => setBusinessSettings({ ...businessSettings, business_name: e.target.value })}
                    className="w-full px-4 py-3 bg-[#FAF7F2] border-2 border-[#E8E3DB] rounded-xl text-[#2D2D2D] focus:outline-none focus:border-[#C9A96E] focus:ring-2 focus:ring-[#C9A96E]/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Business Name (Arabic)</label>
                  <input
                    type="text"
                    value={businessSettings.business_name_ar}
                    onChange={e => setBusinessSettings({ ...businessSettings, business_name_ar: e.target.value })}
                    className="w-full px-4 py-3 bg-[#FAF7F2] border-2 border-[#E8E3DB] rounded-xl text-[#2D2D2D] focus:outline-none focus:border-[#C9A96E] focus:ring-2 focus:ring-[#C9A96E]/20 transition-all text-right"
                    dir="rtl"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                    <Mail className="h-4 w-4 inline mr-2" />
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={businessSettings.contact_email}
                    onChange={e => setBusinessSettings({ ...businessSettings, contact_email: e.target.value })}
                    className="w-full px-4 py-3 bg-[#FAF7F2] border-2 border-[#E8E3DB] rounded-xl text-[#2D2D2D] focus:outline-none focus:border-[#C9A96E] focus:ring-2 focus:ring-[#C9A96E]/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                    <Phone className="h-4 w-4 inline mr-2" />
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={businessSettings.contact_phone}
                    onChange={e => setBusinessSettings({ ...businessSettings, contact_phone: e.target.value })}
                    className="w-full px-4 py-3 bg-[#FAF7F2] border-2 border-[#E8E3DB] rounded-xl text-[#2D2D2D] focus:outline-none focus:border-[#C9A96E] focus:ring-2 focus:ring-[#C9A96E]/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                    <span className="mr-2">📱</span>
                    WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    value={businessSettings.whatsapp_number}
                    onChange={e => setBusinessSettings({ ...businessSettings, whatsapp_number: e.target.value })}
                    className="w-full px-4 py-3 bg-[#FAF7F2] border-2 border-[#E8E3DB] rounded-xl text-[#2D2D2D] focus:outline-none focus:border-[#C9A96E] focus:ring-2 focus:ring-[#C9A96E]/20 transition-all"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                    <MapPin className="h-4 w-4 inline mr-2" />
                    Address (English)
                  </label>
                  <input
                    type="text"
                    value={businessSettings.address}
                    onChange={e => setBusinessSettings({ ...businessSettings, address: e.target.value })}
                    className="w-full px-4 py-3 bg-[#FAF7F2] border-2 border-[#E8E3DB] rounded-xl text-[#2D2D2D] focus:outline-none focus:border-[#C9A96E] focus:ring-2 focus:ring-[#C9A96E]/20 transition-all"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                    <MapPin className="h-4 w-4 inline mr-2" />
                    Address (Arabic)
                  </label>
                  <input
                    type="text"
                    value={businessSettings.address_ar}
                    onChange={e => setBusinessSettings({ ...businessSettings, address_ar: e.target.value })}
                    className="w-full px-4 py-3 bg-[#FAF7F2] border-2 border-[#E8E3DB] rounded-xl text-[#2D2D2D] focus:outline-none focus:border-[#C9A96E] focus:ring-2 focus:ring-[#C9A96E]/20 transition-all text-right"
                    dir="rtl"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Booking Rules Tab */}
          {activeTab === 'booking' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Minimum Booking Duration (months)</label>
                  <input
                    type="number"
                    min="1"
                    value={bookingSettings.min_booking_months}
                    onChange={e => setBookingSettings({ ...bookingSettings, min_booking_months: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-3 bg-[#FAF7F2] border-2 border-[#E8E3DB] rounded-xl text-[#2D2D2D] focus:outline-none focus:border-[#C9A96E] focus:ring-2 focus:ring-[#C9A96E]/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Maximum Booking Duration (months)</label>
                  <input
                    type="number"
                    min="1"
                    value={bookingSettings.max_booking_months}
                    onChange={e => setBookingSettings({ ...bookingSettings, max_booking_months: parseInt(e.target.value) || 36 })}
                    className="w-full px-4 py-3 bg-[#FAF7F2] border-2 border-[#E8E3DB] rounded-xl text-[#2D2D2D] focus:outline-none focus:border-[#C9A96E] focus:ring-2 focus:ring-[#C9A96E]/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Advance Booking (days)</label>
                  <input
                    type="number"
                    min="1"
                    value={bookingSettings.advance_booking_days}
                    onChange={e => setBookingSettings({ ...bookingSettings, advance_booking_days: parseInt(e.target.value) || 365 })}
                    className="w-full px-4 py-3 bg-[#FAF7F2] border-2 border-[#E8E3DB] rounded-xl text-[#2D2D2D] focus:outline-none focus:border-[#C9A96E] focus:ring-2 focus:ring-[#C9A96E]/20 transition-all"
                  />
                  <p className="text-xs text-[#8B7355] mt-1">How far in advance can guests book</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Cancellation Policy (days)</label>
                  <input
                    type="number"
                    min="0"
                    value={bookingSettings.cancellation_policy_days}
                    onChange={e => setBookingSettings({ ...bookingSettings, cancellation_policy_days: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-[#FAF7F2] border-2 border-[#E8E3DB] rounded-xl text-[#2D2D2D] focus:outline-none focus:border-[#C9A96E] focus:ring-2 focus:ring-[#C9A96E]/20 transition-all"
                  />
                  <p className="text-xs text-[#8B7355] mt-1">Days before check-in for free cancellation</p>
                </div>

                <div className="md:col-span-2 space-y-4">
                  <div className="flex items-center justify-between p-4 bg-[#FAF7F2] rounded-xl">
                    <div className="flex items-center gap-3">
                      <Shield className="h-5 w-5 text-[#C9A96E]" />
                      <div>
                        <p className="font-medium text-[#2D2D2D]">Require ID Verification</p>
                        <p className="text-xs text-[#8B7355]">Guests must provide valid ID before booking</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={bookingSettings.require_id_verification}
                        onChange={e => setBookingSettings({ ...bookingSettings, require_id_verification: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#C9A96E]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#C9A96E]"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-[#FAF7F2] rounded-xl">
                    <div className="flex items-center gap-3">
                      <RefreshCw className="h-5 w-5 text-[#C9A96E]" />
                      <div>
                        <p className="font-medium text-[#2D2D2D]">Auto-Confirm Payments</p>
                        <p className="text-xs text-[#8B7355]">Automatically confirm bookings after payment</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={bookingSettings.auto_confirm_payment}
                        onChange={e => setBookingSettings({ ...bookingSettings, auto_confirm_payment: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#C9A96E]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#C9A96E]"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-[#FAF7F2] rounded-xl">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-[#C9A96E]" />
                    <div>
                      <p className="font-medium text-[#2D2D2D]">Email Notifications</p>
                      <p className="text-xs text-[#8B7355]">Send booking confirmations via email</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.email_notifications}
                      onChange={e => setNotificationSettings({ ...notificationSettings, email_notifications: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#C9A96E]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#C9A96E]"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-[#FAF7F2] rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">📱</span>
                    <div>
                      <p className="font-medium text-[#2D2D2D]">WhatsApp Notifications</p>
                      <p className="text-xs text-[#8B7355]">Send booking updates via WhatsApp</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.whatsapp_notifications}
                      onChange={e => setNotificationSettings({ ...notificationSettings, whatsapp_notifications: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#C9A96E]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#C9A96E]"></div>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Admin Email for Notifications</label>
                  <input
                    type="email"
                    value={notificationSettings.admin_email}
                    onChange={e => setNotificationSettings({ ...notificationSettings, admin_email: e.target.value })}
                    className="w-full px-4 py-3 bg-[#FAF7F2] border-2 border-[#E8E3DB] rounded-xl text-[#2D2D2D] focus:outline-none focus:border-[#C9A96E] focus:ring-2 focus:ring-[#C9A96E]/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Reminder Days Before Check-in</label>
                  <input
                    type="number"
                    min="0"
                    value={notificationSettings.reminder_days_before}
                    onChange={e => setNotificationSettings({ ...notificationSettings, reminder_days_before: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-[#FAF7F2] border-2 border-[#E8E3DB] rounded-xl text-[#2D2D2D] focus:outline-none focus:border-[#C9A96E] focus:ring-2 focus:ring-[#C9A96E]/20 transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Room Management Tab */}
          {activeTab === 'rooms' && (
            <div className="space-y-6">
              {/* Room Cards */}
              {rooms.length === 0 ? (
                <div className="text-center py-12">
                  <Home className="h-16 w-16 text-[#E8E3DB] mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-[#2D2D2D] mb-2">No Rooms Found</h3>
                  <p className="text-[#8B7355]">Add rooms to your database to manage them here.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {rooms.map(room => (
                    <div key={room.id} className="bg-white rounded-xl border border-[#E8E3DB] overflow-hidden">
                      {/* Room Header */}
                      <div className="px-6 py-4 bg-gradient-to-r from-[#C9A96E]/10 to-[#B89355]/10 border-b border-[#E8E3DB] flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-[#C9A96E]/20 flex items-center justify-center">
                            <Home className="h-6 w-6 text-[#C9A96E]" />
                          </div>
                          <div>
                            <h3 className="font-bold text-[#2D2D2D] text-lg">{room.name}</h3>
                            <p className="text-sm text-[#8B7355]">{room.name_ar}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setEditingRoom(editingRoom?.id === room.id ? null : room)}
                          className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${
                            editingRoom?.id === room.id
                              ? 'bg-[#C9A96E] text-white'
                              : 'bg-[#FAF7F2] text-[#2D2D2D] hover:bg-[#E8E3DB]'
                          }`}
                        >
                          {editingRoom?.id === room.id ? (
                            <>
                              <X className="h-4 w-4" />
                              Close
                            </>
                          ) : (
                            <>
                              <Edit2 className="h-4 w-4" />
                              Edit
                            </>
                          )}
                        </button>
                      </div>

                      {/* Room Info (collapsed view) */}
                      {editingRoom?.id !== room.id && (
                        <div className="p-6">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-3 bg-[#FAF7F2] rounded-lg">
                              <p className="text-xs text-[#8B7355] mb-1">Monthly Rate</p>
                              <p className="font-bold text-[#2D2D2D]">SAR {room.monthly_rate.toLocaleString()}</p>
                            </div>
                            <div className="p-3 bg-[#FAF7F2] rounded-lg">
                              <p className="text-xs text-[#8B7355] mb-1">Yearly Rate</p>
                              <p className="font-bold text-[#2D2D2D]">SAR {room.yearly_rate.toLocaleString()}</p>
                            </div>
                            <div className="p-3 bg-[#FAF7F2] rounded-lg flex items-center gap-2">
                              <Maximize className="h-4 w-4 text-[#8B7355]" />
                              <div>
                                <p className="text-xs text-[#8B7355]">Size</p>
                                <p className="font-bold text-[#2D2D2D]">{room.size_sqm} m²</p>
                              </div>
                            </div>
                            <div className="p-3 bg-[#FAF7F2] rounded-lg flex items-center gap-2">
                              <Users className="h-4 w-4 text-[#8B7355]" />
                              <div>
                                <p className="text-xs text-[#8B7355]">Capacity</p>
                                <p className="font-bold text-[#2D2D2D]">{room.capacity} guests</p>
                              </div>
                            </div>
                          </div>
                          <div className="mt-4 flex flex-wrap gap-2">
                            {room.amenities.slice(0, 5).map((amenity, i) => (
                              <span key={i} className="px-2 py-1 bg-[#E8E3DB] text-[#8B7355] text-xs rounded-full">
                                {amenity}
                              </span>
                            ))}
                            {room.amenities.length > 5 && (
                              <span className="px-2 py-1 bg-[#E8E3DB] text-[#8B7355] text-xs rounded-full">
                                +{room.amenities.length - 5} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Room Edit Form (expanded view) */}
                      {editingRoom?.id === room.id && (
                        <div className="p-6 space-y-6">
                          {/* Pricing Section */}
                          <div>
                            <h4 className="font-bold text-[#2D2D2D] mb-4 flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-[#C9A96E]" />
                              Pricing
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Monthly Rate (SAR)</label>
                                <input
                                  type="number"
                                  value={editingRoom.monthly_rate}
                                  onChange={e => setEditingRoom({ ...editingRoom, monthly_rate: parseInt(e.target.value) || 0 })}
                                  className="w-full px-4 py-3 bg-[#FAF7F2] border-2 border-[#E8E3DB] rounded-xl text-[#2D2D2D] focus:outline-none focus:border-[#C9A96E]"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Yearly Rate (SAR)</label>
                                <input
                                  type="number"
                                  value={editingRoom.yearly_rate}
                                  onChange={e => setEditingRoom({ ...editingRoom, yearly_rate: parseInt(e.target.value) || 0 })}
                                  className="w-full px-4 py-3 bg-[#FAF7F2] border-2 border-[#E8E3DB] rounded-xl text-[#2D2D2D] focus:outline-none focus:border-[#C9A96E]"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Room Details Section */}
                          <div>
                            <h4 className="font-bold text-[#2D2D2D] mb-4 flex items-center gap-2">
                              <Home className="h-4 w-4 text-[#C9A96E]" />
                              Room Details
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Size (m²)</label>
                                <input
                                  type="number"
                                  value={editingRoom.size_sqm}
                                  onChange={e => setEditingRoom({ ...editingRoom, size_sqm: parseInt(e.target.value) || 0 })}
                                  className="w-full px-4 py-3 bg-[#FAF7F2] border-2 border-[#E8E3DB] rounded-xl text-[#2D2D2D] focus:outline-none focus:border-[#C9A96E]"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Capacity (guests)</label>
                                <input
                                  type="number"
                                  value={editingRoom.capacity}
                                  onChange={e => setEditingRoom({ ...editingRoom, capacity: parseInt(e.target.value) || 1 })}
                                  className="w-full px-4 py-3 bg-[#FAF7F2] border-2 border-[#E8E3DB] rounded-xl text-[#2D2D2D] focus:outline-none focus:border-[#C9A96E]"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Check-in Time</label>
                                <input
                                  type="text"
                                  value={editingRoom.checkin_time || ''}
                                  onChange={e => setEditingRoom({ ...editingRoom, checkin_time: e.target.value })}
                                  placeholder="e.g., 3:00 PM"
                                  className="w-full px-4 py-3 bg-[#FAF7F2] border-2 border-[#E8E3DB] rounded-xl text-[#2D2D2D] focus:outline-none focus:border-[#C9A96E]"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Check-out Time</label>
                                <input
                                  type="text"
                                  value={editingRoom.checkout_time || ''}
                                  onChange={e => setEditingRoom({ ...editingRoom, checkout_time: e.target.value })}
                                  placeholder="e.g., 12:00 PM"
                                  className="w-full px-4 py-3 bg-[#FAF7F2] border-2 border-[#E8E3DB] rounded-xl text-[#2D2D2D] focus:outline-none focus:border-[#C9A96E]"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Access Info Section */}
                          <div>
                            <h4 className="font-bold text-[#2D2D2D] mb-4 flex items-center gap-2">
                              <Key className="h-4 w-4 text-[#C9A96E]" />
                              Access Information
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Door Code</label>
                                <input
                                  type="text"
                                  value={editingRoom.door_code || ''}
                                  onChange={e => setEditingRoom({ ...editingRoom, door_code: e.target.value })}
                                  placeholder="e.g., 1234#"
                                  className="w-full px-4 py-3 bg-[#FAF7F2] border-2 border-[#E8E3DB] rounded-xl text-[#2D2D2D] focus:outline-none focus:border-[#C9A96E]"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-[#2D2D2D] mb-2">WiFi Network</label>
                                <input
                                  type="text"
                                  value={editingRoom.wifi_network || ''}
                                  onChange={e => setEditingRoom({ ...editingRoom, wifi_network: e.target.value })}
                                  placeholder="Network name"
                                  className="w-full px-4 py-3 bg-[#FAF7F2] border-2 border-[#E8E3DB] rounded-xl text-[#2D2D2D] focus:outline-none focus:border-[#C9A96E]"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-[#2D2D2D] mb-2">WiFi Password</label>
                                <input
                                  type="text"
                                  value={editingRoom.wifi_password || ''}
                                  onChange={e => setEditingRoom({ ...editingRoom, wifi_password: e.target.value })}
                                  placeholder="Password"
                                  className="w-full px-4 py-3 bg-[#FAF7F2] border-2 border-[#E8E3DB] rounded-xl text-[#2D2D2D] focus:outline-none focus:border-[#C9A96E]"
                                />
                              </div>
                            </div>
                            <div className="mt-4">
                              <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Studio Guide URL</label>
                              <input
                                type="url"
                                value={editingRoom.studio_guide_url || ''}
                                onChange={e => setEditingRoom({ ...editingRoom, studio_guide_url: e.target.value })}
                                placeholder="https://..."
                                className="w-full px-4 py-3 bg-[#FAF7F2] border-2 border-[#E8E3DB] rounded-xl text-[#2D2D2D] focus:outline-none focus:border-[#C9A96E]"
                              />
                            </div>
                          </div>

                          {/* Featured Toggle */}
                          <div className="flex items-center justify-between p-4 bg-[#FAF7F2] rounded-xl">
                            <div>
                              <p className="font-medium text-[#2D2D2D]">Featured Room</p>
                              <p className="text-xs text-[#8B7355]">Show this room prominently on the homepage</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editingRoom.featured}
                                onChange={e => setEditingRoom({ ...editingRoom, featured: e.target.checked })}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#C9A96E]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#C9A96E]"></div>
                            </label>
                          </div>

                          {/* Save Button */}
                          <div className="flex justify-end gap-3">
                            <button
                              onClick={() => setEditingRoom(null)}
                              className="px-6 py-2.5 rounded-xl font-semibold bg-[#FAF7F2] text-[#2D2D2D] hover:bg-[#E8E3DB] transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleRoomUpdate(editingRoom.id, {
                                monthly_rate: editingRoom.monthly_rate,
                                yearly_rate: editingRoom.yearly_rate,
                                size_sqm: editingRoom.size_sqm,
                                capacity: editingRoom.capacity,
                                checkin_time: editingRoom.checkin_time,
                                checkout_time: editingRoom.checkout_time,
                                door_code: editingRoom.door_code,
                                wifi_network: editingRoom.wifi_network,
                                wifi_password: editingRoom.wifi_password,
                                studio_guide_url: editingRoom.studio_guide_url,
                                featured: editingRoom.featured,
                              })}
                              disabled={roomSaving}
                              className="px-6 py-2.5 rounded-xl font-semibold bg-gradient-to-r from-[#C9A96E] to-[#B89355] text-white hover:from-[#D4B57A] hover:to-[#C9A96E] transition-all flex items-center gap-2 disabled:opacity-50"
                            >
                              {roomSaving ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <Save className="h-4 w-4" />
                                  Save Changes
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Info Note */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-800">Room Data Storage</p>
                    <p className="text-sm text-blue-700 mt-1">
                      Room information is stored in the JSON database. Changes are saved instantly and take effect immediately.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Database Viewer Tab */}
          {activeTab === 'database' && (
            <div className="space-y-6">
              {/* Load Data Button */}
              {!databaseData && (
                <div className="text-center py-12">
                  <Database className="h-16 w-16 text-[#E8E3DB] mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-[#2D2D2D] mb-2">Database Viewer</h3>
                  <p className="text-[#8B7355] mb-6">Load the database to view and edit all collections</p>
                  <button
                    onClick={fetchDatabaseData}
                    disabled={dbLoading}
                    className="px-6 py-3 rounded-xl font-semibold bg-gradient-to-r from-[#C9A96E] to-[#B89355] text-white hover:from-[#D4B57A] hover:to-[#C9A96E] transition-all flex items-center gap-2 mx-auto"
                  >
                    {dbLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <Database className="h-5 w-5" />
                        Load Database
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Database Content */}
              {databaseData && (
                <>
                  {/* Header with Actions */}
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-[#2D2D2D]">Database Collections</h3>
                      <p className="text-sm text-[#8B7355]">
                        Last updated: {new Date(databaseData.metadata.lastUpdated).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={fetchDatabaseData}
                        disabled={dbLoading}
                        className="px-4 py-2 rounded-lg font-medium bg-[#FAF7F2] text-[#2D2D2D] hover:bg-[#E8E3DB] transition-colors flex items-center gap-2"
                      >
                        <RefreshCw className={`h-4 w-4 ${dbLoading ? 'animate-spin' : ''}`} />
                        Refresh
                      </button>
                      <button
                        onClick={exportDatabaseJson}
                        className="px-4 py-2 rounded-lg font-medium bg-[#FAF7F2] text-[#2D2D2D] hover:bg-[#E8E3DB] transition-colors flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Export JSON
                      </button>
                    </div>
                  </div>

                  {/* Collection Sub-tabs */}
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'rooms' as const, label: 'Rooms', count: databaseData.metadata.counts.rooms },
                      { id: 'guests' as const, label: 'Guests', count: databaseData.metadata.counts.guests },
                      { id: 'bookings' as const, label: 'Bookings', count: databaseData.metadata.counts.bookings },
                      { id: 'availabilityBlocks' as const, label: 'Blocks', count: databaseData.metadata.counts.availabilityBlocks },
                      { id: 'processedWebhookEvents' as const, label: 'Webhooks', count: databaseData.metadata.counts.processedWebhookEvents },
                      { id: 'adminSettings' as const, label: 'Settings', count: 1 },
                    ].map(col => (
                      <button
                        key={col.id}
                        onClick={() => setActiveCollection(col.id)}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                          activeCollection === col.id
                            ? 'bg-[#C9A96E] text-white'
                            : 'bg-[#FAF7F2] text-[#2D2D2D] hover:bg-[#E8E3DB]'
                        }`}
                      >
                        {col.label} ({col.count})
                      </button>
                    ))}
                  </div>

                  {/* Data Table */}
                  <div className="bg-white rounded-xl border border-[#E8E3DB] overflow-hidden">
                    <div className="overflow-x-auto">
                      {/* Rooms Table */}
                      {activeCollection === 'rooms' && (
                        <table className="w-full text-sm">
                          <thead className="bg-[#FAF7F2] border-b border-[#E8E3DB]">
                            <tr>
                              <th className="px-4 py-3 text-left font-semibold text-[#2D2D2D]">Name</th>
                              <th className="px-4 py-3 text-left font-semibold text-[#2D2D2D]">Monthly</th>
                              <th className="px-4 py-3 text-left font-semibold text-[#2D2D2D]">Yearly</th>
                              <th className="px-4 py-3 text-left font-semibold text-[#2D2D2D]">Size</th>
                              <th className="px-4 py-3 text-left font-semibold text-[#2D2D2D]">Capacity</th>
                              <th className="px-4 py-3 text-left font-semibold text-[#2D2D2D]">Featured</th>
                              <th className="px-4 py-3 text-right font-semibold text-[#2D2D2D]">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#E8E3DB]">
                            {databaseData.rooms.map(room => (
                              <tr key={room.id} className="hover:bg-[#FAF7F2]/50">
                                <td className="px-4 py-3 font-medium text-[#2D2D2D]">{room.name}</td>
                                <td className="px-4 py-3 text-[#8B7355]">SAR {room.monthly_rate.toLocaleString()}</td>
                                <td className="px-4 py-3 text-[#8B7355]">SAR {room.yearly_rate.toLocaleString()}</td>
                                <td className="px-4 py-3 text-[#8B7355]">{room.size_sqm} m²</td>
                                <td className="px-4 py-3 text-[#8B7355]">{room.capacity}</td>
                                <td className="px-4 py-3">
                                  {room.featured ? (
                                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs">Yes</span>
                                  ) : (
                                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">No</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <button
                                    onClick={() => {
                                      setEditingDbRecord({ collection: 'rooms', record: { ...room } });
                                      setShowEditModal(true);
                                      setConfirmCheckbox(false);
                                    }}
                                    className="p-2 text-[#8B7355] hover:text-[#C9A96E] hover:bg-[#FAF7F2] rounded-lg transition-colors"
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}

                      {/* Guests Table */}
                      {activeCollection === 'guests' && (
                        <table className="w-full text-sm">
                          <thead className="bg-[#FAF7F2] border-b border-[#E8E3DB]">
                            <tr>
                              <th className="px-4 py-3 text-left font-semibold text-[#2D2D2D]">Name</th>
                              <th className="px-4 py-3 text-left font-semibold text-[#2D2D2D]">Email</th>
                              <th className="px-4 py-3 text-left font-semibold text-[#2D2D2D]">Phone</th>
                              <th className="px-4 py-3 text-left font-semibold text-[#2D2D2D]">Nationality</th>
                              <th className="px-4 py-3 text-left font-semibold text-[#2D2D2D]">Created</th>
                              <th className="px-4 py-3 text-right font-semibold text-[#2D2D2D]">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#E8E3DB]">
                            {databaseData.guests.map(guest => (
                              <tr key={guest.id} className="hover:bg-[#FAF7F2]/50">
                                <td className="px-4 py-3 font-medium text-[#2D2D2D]">{guest.full_name}</td>
                                <td className="px-4 py-3 text-[#8B7355]">{guest.email}</td>
                                <td className="px-4 py-3 text-[#8B7355]">{guest.phone}</td>
                                <td className="px-4 py-3 text-[#8B7355]">{guest.nationality}</td>
                                <td className="px-4 py-3 text-[#8B7355]">{new Date(guest.created_at).toLocaleDateString()}</td>
                                <td className="px-4 py-3 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <button
                                      onClick={() => {
                                        setEditingDbRecord({ collection: 'guests', record: { ...guest } });
                                        setShowEditModal(true);
                                        setConfirmCheckbox(false);
                                      }}
                                      className="p-2 text-[#8B7355] hover:text-[#C9A96E] hover:bg-[#FAF7F2] rounded-lg transition-colors"
                                    >
                                      <Edit2 className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        setDeletingRecord({ collection: 'guests', id: guest.id, name: guest.full_name });
                                        setShowDeleteModal(true);
                                        setDeleteConfirmText('');
                                      }}
                                      className="p-2 text-[#8B7355] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}

                      {/* Bookings Table */}
                      {activeCollection === 'bookings' && (
                        <table className="w-full text-sm">
                          <thead className="bg-[#FAF7F2] border-b border-[#E8E3DB]">
                            <tr>
                              <th className="px-4 py-3 text-left font-semibold text-[#2D2D2D]">Room</th>
                              <th className="px-4 py-3 text-left font-semibold text-[#2D2D2D]">Guest</th>
                              <th className="px-4 py-3 text-left font-semibold text-[#2D2D2D]">Dates</th>
                              <th className="px-4 py-3 text-left font-semibold text-[#2D2D2D]">Status</th>
                              <th className="px-4 py-3 text-left font-semibold text-[#2D2D2D]">Amount</th>
                              <th className="px-4 py-3 text-right font-semibold text-[#2D2D2D]">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#E8E3DB]">
                            {databaseData.bookings.map(booking => (
                              <tr key={booking.id} className="hover:bg-[#FAF7F2]/50">
                                <td className="px-4 py-3 font-medium text-[#2D2D2D]">{getRoomName(booking.room_id)}</td>
                                <td className="px-4 py-3 text-[#8B7355]">{getGuestName(booking.guest_id)}</td>
                                <td className="px-4 py-3 text-[#8B7355]">{booking.start_date} → {booking.end_date}</td>
                                <td className="px-4 py-3">
                                  <span className={`px-2 py-1 rounded text-xs ${
                                    booking.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' :
                                    booking.status === 'pending_payment' ? 'bg-amber-100 text-amber-700' :
                                    booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                    'bg-gray-100 text-gray-700'
                                  }`}>
                                    {booking.status}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-[#8B7355]">SAR {booking.total_amount.toLocaleString()}</td>
                                <td className="px-4 py-3 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <button
                                      onClick={() => {
                                        setEditingDbRecord({ collection: 'bookings', record: { ...booking } });
                                        setShowEditModal(true);
                                        setConfirmCheckbox(false);
                                      }}
                                      className="p-2 text-[#8B7355] hover:text-[#C9A96E] hover:bg-[#FAF7F2] rounded-lg transition-colors"
                                    >
                                      <Edit2 className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        setDeletingRecord({ collection: 'bookings', id: booking.id, name: `Booking ${booking.id.slice(-8)}` });
                                        setShowDeleteModal(true);
                                        setDeleteConfirmText('');
                                      }}
                                      className="p-2 text-[#8B7355] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}

                      {/* Availability Blocks Table */}
                      {activeCollection === 'availabilityBlocks' && (
                        <table className="w-full text-sm">
                          <thead className="bg-[#FAF7F2] border-b border-[#E8E3DB]">
                            <tr>
                              <th className="px-4 py-3 text-left font-semibold text-[#2D2D2D]">Room</th>
                              <th className="px-4 py-3 text-left font-semibold text-[#2D2D2D]">Start Date</th>
                              <th className="px-4 py-3 text-left font-semibold text-[#2D2D2D]">End Date</th>
                              <th className="px-4 py-3 text-left font-semibold text-[#2D2D2D]">Reason</th>
                              <th className="px-4 py-3 text-right font-semibold text-[#2D2D2D]">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#E8E3DB]">
                            {databaseData.availabilityBlocks.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-[#8B7355]">
                                  No availability blocks found
                                </td>
                              </tr>
                            ) : (
                              databaseData.availabilityBlocks.map(block => (
                                <tr key={block.id} className="hover:bg-[#FAF7F2]/50">
                                  <td className="px-4 py-3 font-medium text-[#2D2D2D]">{getRoomName(block.room_id)}</td>
                                  <td className="px-4 py-3 text-[#8B7355]">{block.start_date}</td>
                                  <td className="px-4 py-3 text-[#8B7355]">{block.end_date}</td>
                                  <td className="px-4 py-3 text-[#8B7355]">{block.reason}</td>
                                  <td className="px-4 py-3 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                      <button
                                        onClick={() => {
                                          setEditingDbRecord({ collection: 'availabilityBlocks', record: { ...block } });
                                          setShowEditModal(true);
                                          setConfirmCheckbox(false);
                                        }}
                                        className="p-2 text-[#8B7355] hover:text-[#C9A96E] hover:bg-[#FAF7F2] rounded-lg transition-colors"
                                      >
                                        <Edit2 className="h-4 w-4" />
                                      </button>
                                      <button
                                        onClick={() => {
                                          setDeletingRecord({ collection: 'availabilityBlocks', id: block.id, name: `Block ${block.id.slice(-8)}` });
                                          setShowDeleteModal(true);
                                          setDeleteConfirmText('');
                                        }}
                                        className="p-2 text-[#8B7355] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      )}

                      {/* Webhook Events Table (Read-only) */}
                      {activeCollection === 'processedWebhookEvents' && (
                        <table className="w-full text-sm">
                          <thead className="bg-[#FAF7F2] border-b border-[#E8E3DB]">
                            <tr>
                              <th className="px-4 py-3 text-left font-semibold text-[#2D2D2D]">Event ID</th>
                              <th className="px-4 py-3 text-left font-semibold text-[#2D2D2D]">Event Type</th>
                              <th className="px-4 py-3 text-left font-semibold text-[#2D2D2D]">Processed At</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#E8E3DB]">
                            {databaseData.processedWebhookEvents.length === 0 ? (
                              <tr>
                                <td colSpan={3} className="px-4 py-8 text-center text-[#8B7355]">
                                  No webhook events processed yet
                                </td>
                              </tr>
                            ) : (
                              databaseData.processedWebhookEvents.map(event => (
                                <tr key={event.id} className="hover:bg-[#FAF7F2]/50">
                                  <td className="px-4 py-3 font-mono text-xs text-[#8B7355]">{event.id}</td>
                                  <td className="px-4 py-3 text-[#2D2D2D]">{event.event_type}</td>
                                  <td className="px-4 py-3 text-[#8B7355]">{new Date(event.processed_at).toLocaleString()}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      )}

                      {/* Admin Settings View */}
                      {activeCollection === 'adminSettings' && (
                        <div className="p-6 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.entries(databaseData.adminSettings).map(([key, value]) => (
                              <div key={key} className="flex items-center justify-between p-3 bg-[#FAF7F2] rounded-lg">
                                <span className="font-medium text-[#2D2D2D]">{key.replace(/_/g, ' ')}</span>
                                <span className={`px-2 py-1 rounded text-xs ${
                                  value === true ? 'bg-emerald-100 text-emerald-700' :
                                  value === false ? 'bg-gray-100 text-gray-600' :
                                  'bg-blue-100 text-blue-700'
                                }`}>
                                  {typeof value === 'boolean' ? (value ? 'Enabled' : 'Disabled') : String(value)}
                                </span>
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-[#8B7355] mt-4">
                            Note: Admin settings are managed via the Automations tab
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Warning Banner */}
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-amber-800">Direct Database Editing</p>
                        <p className="text-sm text-amber-700 mt-1">
                          Changes made here affect the live database immediately. Use caution when editing records.
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Record Modal */}
      {showEditModal && editingDbRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-[#E8E3DB] flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#2D2D2D]">
                Edit {editingDbRecord.collection.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingDbRecord(null);
                  setConfirmCheckbox(false);
                }}
                className="p-2 text-[#8B7355] hover:text-[#2D2D2D] hover:bg-[#FAF7F2] rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Record ID (read-only) */}
              <div>
                <label className="block text-sm font-medium text-[#8B7355] mb-1">ID (read-only)</label>
                <input
                  type="text"
                  value={String(editingDbRecord.record.id || '')}
                  readOnly
                  className="w-full px-4 py-2 bg-[#E8E3DB] border border-[#E8E3DB] rounded-lg text-[#8B7355] font-mono text-sm"
                />
              </div>

              {/* Dynamic fields based on collection */}
              {Object.entries(editingDbRecord.record)
                .filter(([key]) => !['id', 'created_at', 'updated_at', 'stripe_session_id', 'signature'].includes(key))
                .map(([key, value]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-[#2D2D2D] mb-1">
                      {key.replace(/_/g, ' ').replace(/^./, str => str.toUpperCase())}
                    </label>
                    {typeof value === 'boolean' ? (
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={e => setEditingDbRecord({
                            ...editingDbRecord,
                            record: { ...editingDbRecord.record, [key]: e.target.checked }
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#C9A96E]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#C9A96E]"></div>
                      </label>
                    ) : typeof value === 'number' ? (
                      <input
                        type="number"
                        value={value}
                        onChange={e => setEditingDbRecord({
                          ...editingDbRecord,
                          record: { ...editingDbRecord.record, [key]: parseFloat(e.target.value) || 0 }
                        })}
                        className="w-full px-4 py-2 bg-[#FAF7F2] border-2 border-[#E8E3DB] rounded-lg text-[#2D2D2D] focus:outline-none focus:border-[#C9A96E]"
                      />
                    ) : Array.isArray(value) ? (
                      <textarea
                        value={JSON.stringify(value, null, 2)}
                        onChange={e => {
                          try {
                            const parsed = JSON.parse(e.target.value);
                            setEditingDbRecord({
                              ...editingDbRecord,
                              record: { ...editingDbRecord.record, [key]: parsed }
                            });
                          } catch {
                            // Invalid JSON, keep current value
                          }
                        }}
                        rows={3}
                        className="w-full px-4 py-2 bg-[#FAF7F2] border-2 border-[#E8E3DB] rounded-lg text-[#2D2D2D] font-mono text-sm focus:outline-none focus:border-[#C9A96E]"
                      />
                    ) : (
                      <input
                        type="text"
                        value={String(value || '')}
                        onChange={e => setEditingDbRecord({
                          ...editingDbRecord,
                          record: { ...editingDbRecord.record, [key]: e.target.value }
                        })}
                        className="w-full px-4 py-2 bg-[#FAF7F2] border-2 border-[#E8E3DB] rounded-lg text-[#2D2D2D] focus:outline-none focus:border-[#C9A96E]"
                      />
                    )}
                  </div>
                ))}

              {/* Confirmation Checkbox */}
              <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={confirmCheckbox}
                    onChange={e => setConfirmCheckbox(e.target.checked)}
                    className="mt-1 w-5 h-5 rounded border-amber-300 text-[#C9A96E] focus:ring-[#C9A96E]"
                  />
                  <span className="text-sm text-amber-800">
                    I understand I am editing live database data and this change will take effect immediately.
                  </span>
                </label>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-[#E8E3DB] flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingDbRecord(null);
                  setConfirmCheckbox(false);
                }}
                className="px-6 py-2.5 rounded-xl font-semibold bg-[#FAF7F2] text-[#2D2D2D] hover:bg-[#E8E3DB] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDbRecordUpdate}
                disabled={dbSaving || !confirmCheckbox}
                className="px-6 py-2.5 rounded-xl font-semibold bg-gradient-to-r from-[#C9A96E] to-[#B89355] text-white hover:from-[#D4B57A] hover:to-[#C9A96E] transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {dbSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-[#E8E3DB]">
              <h3 className="text-lg font-bold text-red-600">Delete Record</h3>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-[#2D2D2D]">
                Are you sure you want to delete <strong>{deletingRecord.name}</strong> from {deletingRecord.collection}?
              </p>
              <p className="text-sm text-[#8B7355]">
                This action cannot be undone.
              </p>
              <div>
                <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                  Type <span className="font-mono bg-red-100 px-2 py-0.5 rounded text-red-700">DELETE</span> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={e => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full px-4 py-2 bg-[#FAF7F2] border-2 border-[#E8E3DB] rounded-lg text-[#2D2D2D] focus:outline-none focus:border-red-400"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-[#E8E3DB] flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingRecord(null);
                  setDeleteConfirmText('');
                }}
                className="px-6 py-2.5 rounded-xl font-semibold bg-[#FAF7F2] text-[#2D2D2D] hover:bg-[#E8E3DB] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDbRecordDelete}
                disabled={dbSaving || deleteConfirmText !== 'DELETE'}
                className="px-6 py-2.5 rounded-xl font-semibold bg-red-600 text-white hover:bg-red-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {dbSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* System Info */}
      <div className="bg-white rounded-2xl shadow-lg border border-[#E8E3DB] p-6">
        <h3 className="text-lg font-bold text-[#2D2D2D] mb-4">System Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-[#FAF7F2] rounded-xl">
            <p className="text-xs text-[#8B7355] mb-1">Platform Version</p>
            <p className="font-mono text-[#2D2D2D]">1.0.0</p>
          </div>
          <div className="p-4 bg-[#FAF7F2] rounded-xl">
            <p className="text-xs text-[#8B7355] mb-1">Framework</p>
            <p className="font-mono text-[#2D2D2D]">Next.js 15</p>
          </div>
          <div className="p-4 bg-[#FAF7F2] rounded-xl">
            <p className="text-xs text-[#8B7355] mb-1">Database</p>
            <p className="font-mono text-[#2D2D2D]">JSON File Storage</p>
          </div>
        </div>
      </div>
    </div>
  );
}
