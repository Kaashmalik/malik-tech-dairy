// Super Admin - Settings Page
'use client';

import { useState } from 'react';
import { Settings, Save, Globe, Mail, Bell, CreditCard, Database, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    siteName: 'MTK Dairy',
    supportEmail: 'support@mtkdairy.com',
    currency: 'PKR',
    timezone: 'Asia/Karachi',
    language: 'en',
    emailNotifications: true,
    autoApproveFreeTier: true,
    maintenanceMode: false,
  });

  const handleSave = async () => {
    setSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success('Settings saved successfully');
    setSaving(false);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold dark:text-white">Settings</h1>
          <p className="text-sm text-gray-500">Configure platform settings</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* General Settings */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
        <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex items-center gap-2">
          <Globe className="w-5 h-5 text-gray-400" />
          <h3 className="font-semibold dark:text-white">General</h3>
        </div>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 dark:text-white">Site Name</label>
              <Input value={settings.siteName} onChange={(e) => setSettings(s => ({ ...s, siteName: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 dark:text-white">Support Email</label>
              <Input type="email" value={settings.supportEmail} onChange={(e) => setSettings(s => ({ ...s, supportEmail: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 dark:text-white">Currency</label>
              <Select value={settings.currency} onValueChange={(v) => setSettings(s => ({ ...s, currency: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PKR">PKR - Pakistani Rupee</SelectItem>
                  <SelectItem value="USD">USD - US Dollar</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 dark:text-white">Timezone</label>
              <Select value={settings.timezone} onValueChange={(v) => setSettings(s => ({ ...s, timezone: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asia/Karachi">Asia/Karachi (PKT)</SelectItem>
                  <SelectItem value="Asia/Dubai">Asia/Dubai (GST)</SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
        <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex items-center gap-2">
          <Bell className="w-5 h-5 text-gray-400" />
          <h3 className="font-semibold dark:text-white">Notifications</h3>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium dark:text-white">Email Notifications</p>
              <p className="text-sm text-gray-500">Receive email alerts for important events</p>
            </div>
            <Switch checked={settings.emailNotifications} onCheckedChange={(v) => setSettings(s => ({ ...s, emailNotifications: v }))} />
          </div>
        </div>
      </div>

      {/* Application Settings */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
        <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex items-center gap-2">
          <Database className="w-5 h-5 text-gray-400" />
          <h3 className="font-semibold dark:text-white">Application</h3>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium dark:text-white">Auto-approve Free Tier</p>
              <p className="text-sm text-gray-500">Automatically approve free plan applications</p>
            </div>
            <Switch checked={settings.autoApproveFreeTier} onCheckedChange={(v) => setSettings(s => ({ ...s, autoApproveFreeTier: v }))} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium dark:text-white">Maintenance Mode</p>
              <p className="text-sm text-gray-500">Temporarily disable access for users</p>
            </div>
            <Switch checked={settings.maintenanceMode} onCheckedChange={(v) => setSettings(s => ({ ...s, maintenanceMode: v }))} />
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-red-200 dark:border-red-900">
        <div className="p-4 border-b border-red-200 dark:border-red-900">
          <h3 className="font-semibold text-red-600">Danger Zone</h3>
        </div>
        <div className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="font-medium dark:text-white">Reset Platform</p>
              <p className="text-sm text-gray-500">This will delete all data. This action cannot be undone.</p>
            </div>
            <Button variant="destructive" size="sm">Reset Platform</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
