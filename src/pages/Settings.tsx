import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Settings as SettingsIcon, User, Shield, Database, Bell, Globe, Palette, Lock, Users, Building } from "lucide-react";
import MainLayout from "@/components/Layout/MainLayout";
import { useToast } from "@/hooks/use-toast";
import UserManagement from "@/components/UserManagement/UserManagement";
import TenantManagement from "@/components/TenantManagement/TenantManagement";
import BackupRestore from "@/components/BackupRestore/BackupRestore";
import IRDIntegration from "@/components/IRDIntegration/IRDIntegration";
import { useAuth } from "@/hooks/use-auth";

const Settings = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const userRole = user?.role || 'staff';
  
  const [settings, setSettings] = useState({
    general: {
      companyName: "Your Company Name",
      companyAddress: "Your Company Address", 
      panNumber: "123456789",
      phone: "+977-1-1234567",
      email: "info@company.com",
      currency: "NPR",
      timezone: "Asia/Kathmandu",
      language: "en",
      dateFormat: "YYYY-MM-DD"
    },
    tax: {
      defaultVatRate: 13,
      enableTax: true,
      taxNumber: "TAX123456789"
    },
    pos: {
      enableBarcodeScanner: true,
      printReceiptAutomatically: false,
      showStockInPOS: true,
      allowNegativeStock: false
    },
    notifications: {
      lowStockAlert: true,
      emailNotifications: true,
      smsNotifications: false
    },
    appearance: {
      theme: "light",
      primaryColor: "blue",
      showLogo: true
    },
    security: {
      enforceStrongPasswords: true,
      sessionTimeout: 30,
      twoFactorAuth: false
    }
  });

  const handleSettingChange = (section: string, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [field]: value
      }
    }));
  };

  const saveSettings = () => {
    // In a real app, this would save to the backend
    localStorage.setItem('appSettings', JSON.stringify(settings));
    toast({
      title: "Settings Saved",
      description: "Your settings have been saved successfully.",
    });
  };

  const canAccessTab = (tab: string) => {
    switch (tab) {
      case 'users':
        return userRole === 'superadmin' || userRole === 'admin';
      case 'tenants':
        return userRole === 'superadmin';
      case 'security':
        return userRole === 'superadmin' || userRole === 'admin';
      case 'backup':
        return userRole === 'superadmin';
      case 'ird':
        return userRole === 'superadmin' || userRole === 'admin';
      case 'general':
      case 'tax':
      case 'pos':
        return userRole === 'admin' || userRole === 'manager' || userRole === 'superadmin';
      default:
        return true;
    }
  };

  const getTabsList = () => {
    const allTabs = [
      { id: 'general', label: 'General', icon: SettingsIcon },
      { id: 'tax', label: 'Tax Settings', icon: Globe },
      { id: 'pos', label: 'POS Settings', icon: User },
      { id: 'notifications', label: 'Notifications', icon: Bell },
      { id: 'appearance', label: 'Appearance', icon: Palette },
      { id: 'security', label: 'Security', icon: Lock },
      { id: 'users', label: 'User Management', icon: Users },
      { id: 'tenants', label: 'Tenant Management', icon: Building },
      { id: 'backup', label: 'Backup & Restore', icon: Database },
      { id: 'ird', label: 'IRD Integration', icon: Shield }
    ];

    return allTabs.filter(tab => canAccessTab(tab.id));
  };

  // Don't show settings at all if user has no access
  if (userRole === 'staff') {
    return (
      <MainLayout userRole={userRole}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Shield className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">You need manager or higher privileges to access settings.</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout userRole={userRole}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage your application settings and preferences</p>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:grid-cols-10">
            {getTabsList().map(tab => (
              <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>Configure your basic company information and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      value={settings.general.companyName}
                      onChange={(e) => handleSettingChange('general', 'companyName', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="panNumber">PAN Number</Label>
                    <Input
                      id="panNumber"
                      value={settings.general.panNumber}
                      onChange={(e) => handleSettingChange('general', 'panNumber', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={settings.general.phone}
                      onChange={(e) => handleSettingChange('general', 'phone', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={settings.general.email}
                      onChange={(e) => handleSettingChange('general', 'email', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select value={settings.general.currency} onValueChange={(value) => handleSettingChange('general', 'currency', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NPR">NPR - Nepalese Rupee</SelectItem>
                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select value={settings.general.timezone} onValueChange={(value) => handleSettingChange('general', 'timezone', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Asia/Kathmandu">Asia/Kathmandu</SelectItem>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="America/New_York">America/New_York</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyAddress">Company Address</Label>
                  <Input
                    id="companyAddress"
                    value={settings.general.companyAddress}
                    onChange={(e) => handleSettingChange('general', 'companyAddress', e.target.value)}
                  />
                </div>
                <Button onClick={saveSettings}>Save General Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tax Settings */}
          <TabsContent value="tax">
            <Card>
              <CardHeader>
                <CardTitle>Tax Settings</CardTitle>
                <CardDescription>Configure VAT and other tax-related settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="defaultVatRate">Default VAT Rate (%)</Label>
                    <Input
                      id="defaultVatRate"
                      type="number"
                      min="0"
                      max="100"
                      value={settings.tax.defaultVatRate}
                      onChange={(e) => handleSettingChange('tax', 'defaultVatRate', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="taxNumber">Tax Number</Label>
                    <Input
                      id="taxNumber"
                      value={settings.tax.taxNumber}
                      onChange={(e) => handleSettingChange('tax', 'taxNumber', e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enableTax"
                    checked={settings.tax.enableTax}
                    onCheckedChange={(checked) => handleSettingChange('tax', 'enableTax', checked)}
                  />
                  <Label htmlFor="enableTax">Enable Tax Calculations</Label>
                </div>
                <Button onClick={saveSettings}>Save Tax Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* POS Settings */}
          <TabsContent value="pos">
            <Card>
              <CardHeader>
                <CardTitle>POS Settings</CardTitle>
                <CardDescription>Configure Point of Sale system preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enableBarcodeScanner"
                      checked={settings.pos.enableBarcodeScanner}
                      onCheckedChange={(checked) => handleSettingChange('pos', 'enableBarcodeScanner', checked)}
                    />
                    <Label htmlFor="enableBarcodeScanner">Enable Barcode Scanner</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="printReceiptAutomatically"
                      checked={settings.pos.printReceiptAutomatically}
                      onCheckedChange={(checked) => handleSettingChange('pos', 'printReceiptAutomatically', checked)}
                    />
                    <Label htmlFor="printReceiptAutomatically">Print Receipt Automatically</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="showStockInPOS"
                      checked={settings.pos.showStockInPOS}
                      onCheckedChange={(checked) => handleSettingChange('pos', 'showStockInPOS', checked)}
                    />
                    <Label htmlFor="showStockInPOS">Show Stock Quantity in POS</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="allowNegativeStock"
                      checked={settings.pos.allowNegativeStock}
                      onCheckedChange={(checked) => handleSettingChange('pos', 'allowNegativeStock', checked)}
                    />
                    <Label htmlFor="allowNegativeStock">Allow Negative Stock</Label>
                  </div>
                </div>
                <Button onClick={saveSettings}>Save POS Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>Configure how you receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="lowStockAlert"
                      checked={settings.notifications.lowStockAlert}
                      onCheckedChange={(checked) => handleSettingChange('notifications', 'lowStockAlert', checked)}
                    />
                    <Label htmlFor="lowStockAlert">Low Stock Alerts</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="emailNotifications"
                      checked={settings.notifications.emailNotifications}
                      onCheckedChange={(checked) => handleSettingChange('notifications', 'emailNotifications', checked)}
                    />
                    <Label htmlFor="emailNotifications">Email Notifications</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="smsNotifications"
                      checked={settings.notifications.smsNotifications}
                      onCheckedChange={(checked) => handleSettingChange('notifications', 'smsNotifications', checked)}
                    />
                    <Label htmlFor="smsNotifications">SMS Notifications</Label>
                  </div>
                </div>
                <Button onClick={saveSettings}>Save Notification Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance */}
          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>Appearance Settings</CardTitle>
                <CardDescription>Customize the look and feel of your application</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="theme">Theme</Label>
                    <Select value={settings.appearance.theme} onValueChange={(value) => handleSettingChange('appearance', 'theme', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="auto">Auto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="primaryColor">Primary Color</Label>
                    <Select value={settings.appearance.primaryColor} onValueChange={(value) => handleSettingChange('appearance', 'primaryColor', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="blue">Blue</SelectItem>
                        <SelectItem value="green">Green</SelectItem>
                        <SelectItem value="purple">Purple</SelectItem>
                        <SelectItem value="red">Red</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="showLogo"
                    checked={settings.appearance.showLogo}
                    onCheckedChange={(checked) => handleSettingChange('appearance', 'showLogo', checked)}
                  />
                  <Label htmlFor="showLogo">Show Company Logo</Label>
                </div>
                <Button onClick={saveSettings}>Save Appearance Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          {canAccessTab('security') && (
            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>Configure security and authentication settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="enforceStrongPasswords"
                        checked={settings.security.enforceStrongPasswords}
                        onCheckedChange={(checked) => handleSettingChange('security', 'enforceStrongPasswords', checked)}
                      />
                      <Label htmlFor="enforceStrongPasswords">Enforce Strong Passwords</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="twoFactorAuth"
                        checked={settings.security.twoFactorAuth}
                        onCheckedChange={(checked) => handleSettingChange('security', 'twoFactorAuth', checked)}
                      />
                      <Label htmlFor="twoFactorAuth">Two-Factor Authentication</Label>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                      <Input
                        id="sessionTimeout"
                        type="number"
                        min="5"
                        max="480"
                        value={settings.security.sessionTimeout}
                        onChange={(e) => handleSettingChange('security', 'sessionTimeout', parseInt(e.target.value) || 30)}
                      />
                    </div>
                  </div>
                  {userRole === 'superadmin' && (
                    <div className="pt-4 border-t">
                      <h3 className="font-semibold mb-2">Advanced Security</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Advanced security settings are only available to Super Administrators.
                      </p>
                      <Button variant="outline">Configure Advanced Security</Button>
                    </div>
                  )}
                  <Button onClick={saveSettings}>Save Security Settings</Button>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* User Management */}
          {canAccessTab('users') && (
            <TabsContent value="users">
              <UserManagement />
            </TabsContent>
          )}

          {/* Tenant Management */}
          {canAccessTab('tenants') && (
            <TabsContent value="tenants">
              <TenantManagement />
            </TabsContent>
          )}

          {/* Backup & Restore */}
          {canAccessTab('backup') && (
            <TabsContent value="backup">
              <BackupRestore />
            </TabsContent>
          )}

          {/* IRD Integration */}
          {canAccessTab('ird') && (
            <TabsContent value="ird">
              <IRDIntegration />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Settings;
