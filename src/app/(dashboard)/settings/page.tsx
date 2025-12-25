'use client';

import { useState } from 'react';
import { useOrganization } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Settings,
  Building2,
  Bell,
  Shield,
  Palette,
  Globe,
  Database,
  Users,
  CreditCard,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
  const { organization } = useOrganization();
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    sms: false,
    lowStock: true,
    healthAlerts: true,
    milkReminders: true,
  });

  const settingsCategories = [
    {
      title: 'Farm Profile',
      description: 'Manage your farm details and branding',
      icon: Building2,
      href: '/settings/profile',
    },
    {
      title: 'Custom Fields',
      description: 'Configure custom data fields for animals',
      icon: Database,
      href: '/settings/custom-fields',
    },
    {
      title: 'Team Members',
      description: 'Manage staff access and permissions',
      icon: Users,
      href: '/settings/team',
    },
    {
      title: 'Notifications',
      description: 'Configure alerts and reminders',
      icon: Bell,
      href: '/settings/notifications',
    },
    {
      title: 'Billing & Subscription',
      description: 'Manage your plan and payments',
      icon: CreditCard,
      href: '/settings/billing',
    },
    {
      title: 'Domain Settings',
      description: 'Configure custom domain for your farm',
      icon: Globe,
      href: '/settings/domain',
    },
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Manage your farm settings and preferences
          </p>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          {/* Quick Links */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {settingsCategories.map((category) => (
              <Link key={category.href} href={category.href}>
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <category.icon className="h-5 w-5 text-muted-foreground" />
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <CardTitle className="text-lg">{category.title}</CardTitle>
                    <CardDescription>{category.description}</CardDescription>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Farm Info */}
          <Card>
            <CardHeader>
              <CardTitle>Farm Information</CardTitle>
              <CardDescription>
                Basic information about your farm
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="farmName">Farm Name</Label>
                  <Input
                    id="farmName"
                    defaultValue={organization?.name || ''}
                    placeholder="Enter farm name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="farmId">Farm ID</Label>
                  <Input
                    id="farmId"
                    value={organization?.id || ''}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" placeholder="Enter farm address" />
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" placeholder="City" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="province">Province</Label>
                  <Input id="province" placeholder="Province" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" placeholder="+92 XXX XXXXXXX" />
                </div>
              </div>
              <Button>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose how you want to receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Channels</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications via email
                      </p>
                    </div>
                    <Switch
                      checked={notifications.email}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, email: checked })
                      }
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive push notifications in browser
                      </p>
                    </div>
                    <Switch
                      checked={notifications.push}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, push: checked })
                      }
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>SMS Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive important alerts via SMS
                      </p>
                    </div>
                    <Switch
                      checked={notifications.sms}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, sms: checked })
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-sm font-medium">Alert Types</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Low Stock Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Alert when medicine or feed stock is low
                      </p>
                    </div>
                    <Switch
                      checked={notifications.lowStock}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, lowStock: checked })
                      }
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Health Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Notifications for animal health issues
                      </p>
                    </div>
                    <Switch
                      checked={notifications.healthAlerts}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, healthAlerts: checked })
                      }
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Milking Reminders</Label>
                      <p className="text-sm text-muted-foreground">
                        Daily milking schedule reminders
                      </p>
                    </div>
                    <Switch
                      checked={notifications.milkReminders}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, milkReminders: checked })
                      }
                    />
                  </div>
                </div>
              </div>

              <Button>Save Preferences</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize the look and feel of your dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Use dark theme for the dashboard
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Use the theme toggle in the header
                </p>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Language</Label>
                <p className="text-sm text-muted-foreground">
                  Currently: English (Urdu support coming soon)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
