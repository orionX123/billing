
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Plus, Edit, Trash2, Users, Shield, UserCheck, UserX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ConfirmDialog from "@/components/ConfirmDialog/ConfirmDialog";

interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: 'SuperAdmin' | 'Admin' | 'Manager' | 'Cashier' | 'Viewer';
  isActive: boolean;
  lastLogin?: string;
  createdDate: string;
  updatedDate: string;
  permissions: string[];
}

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    fullName: "",
    role: "Viewer" as User['role'],
    isActive: true,
    permissions: [] as string[]
  });
  const { toast } = useToast();

  const roles = ["all", "SuperAdmin", "Admin", "Manager", "Cashier", "Viewer"];
  const permissions = [
    "invoices.create", "invoices.read", "invoices.update", "invoices.delete",
    "customers.create", "customers.read", "customers.update", "customers.delete",
    "products.create", "products.read", "products.update", "products.delete",
    "reports.view", "settings.manage", "users.manage", "backup.create"
  ];

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    const stored = localStorage.getItem('ird_users');
    if (stored) {
      setUsers(JSON.parse(stored));
    } else {
      const defaultUsers: User[] = [
        {
          id: "USR-001",
          username: "superadmin",
          email: "superadmin@company.com",
          fullName: "Super Administrator",
          role: "SuperAdmin",
          isActive: true,
          lastLogin: "2024-07-10 09:30:00",
          createdDate: "2024-07-01",
          updatedDate: "2024-07-01",
          permissions: permissions
        },
        {
          id: "USR-002",
          username: "admin",
          email: "admin@company.com",
          fullName: "System Administrator",
          role: "Admin",
          isActive: true,
          lastLogin: "2024-07-10 08:15:00",
          createdDate: "2024-07-01",
          updatedDate: "2024-07-01",
          permissions: permissions.filter(p => !p.includes('users.manage') && !p.includes('backup.create'))
        }
      ];
      localStorage.setItem('ird_users', JSON.stringify(defaultUsers));
      setUsers(defaultUsers);
    }
  };

  const saveUsers = (updatedUsers: User[]) => {
    localStorage.setItem('ird_users', JSON.stringify(updatedUsers));
    setUsers(updatedUsers);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleAddUser = () => {
    setSelectedUser(null);
    setFormData({
      username: "",
      email: "",
      fullName: "",
      role: "Viewer",
      isActive: true,
      permissions: []
    });
    setIsFormOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      isActive: user.isActive,
      permissions: user.permissions
    });
    setIsFormOpen(true);
  };

  const handleDeleteUser = (user: User) => {
    if (user.role === 'SuperAdmin') {
      toast({
        title: "Cannot Delete",
        description: "SuperAdmin users cannot be deleted.",
        variant: "destructive",
      });
      return;
    }
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username.trim() || !formData.email.trim() || !formData.fullName.trim()) {
      toast({
        title: "Validation Error",
        description: "All fields are required.",
        variant: "destructive",
      });
      return;
    }

    // Check for duplicate username/email
    const existingUser = users.find(u => 
      u.id !== selectedUser?.id && 
      (u.username === formData.username || u.email === formData.email)
    );
    
    if (existingUser) {
      toast({
        title: "Validation Error",
        description: "Username or email already exists.",
        variant: "destructive",
      });
      return;
    }

    const updatedUsers = [...users];
    
    if (selectedUser) {
      const index = updatedUsers.findIndex(u => u.id === selectedUser.id);
      updatedUsers[index] = {
        ...updatedUsers[index],
        ...formData,
        updatedDate: new Date().toISOString().split('T')[0]
      };
      toast({
        title: "Success",
        description: "User updated successfully.",
      });
    } else {
      const newUser: User = {
        id: `USR-${String(users.length + 1).padStart(3, '0')}`,
        ...formData,
        createdDate: new Date().toISOString().split('T')[0],
        updatedDate: new Date().toISOString().split('T')[0]
      };
      updatedUsers.push(newUser);
      toast({
        title: "Success",
        description: "User created successfully.",
      });
    }

    saveUsers(updatedUsers);
    setIsFormOpen(false);
  };

  const confirmDeleteUser = () => {
    if (userToDelete) {
      const updatedUsers = users.filter(u => u.id !== userToDelete.id);
      saveUsers(updatedUsers);
      toast({
        title: "User Deleted",
        description: `${userToDelete.fullName} has been deleted successfully.`,
      });
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  const toggleUserStatus = (userId: string) => {
    const updatedUsers = users.map(user => 
      user.id === userId 
        ? { ...user, isActive: !user.isActive, updatedDate: new Date().toISOString().split('T')[0] }
        : user
    );
    saveUsers(updatedUsers);
    toast({
      title: "Status Updated",
      description: "User status has been updated successfully.",
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SuperAdmin': return 'bg-purple-100 text-purple-800';
      case 'Admin': return 'bg-red-100 text-red-800';
      case 'Manager': return 'bg-blue-100 text-blue-800';
      case 'Cashier': return 'bg-green-100 text-green-800';
      case 'Viewer': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDefaultPermissions = (role: User['role']) => {
    switch (role) {
      case 'SuperAdmin':
        return permissions;
      case 'Admin':
        return permissions.filter(p => !p.includes('users.manage') && !p.includes('backup.create'));
      case 'Manager':
        return permissions.filter(p => !p.includes('users.manage') && !p.includes('backup.create') && !p.includes('settings.manage'));
      case 'Cashier':
        return ['invoices.create', 'invoices.read', 'customers.read', 'products.read'];
      case 'Viewer':
        return ['invoices.read', 'customers.read', 'products.read', 'reports.view'];
      default:
        return [];
    }
  };

  const handleRoleChange = (role: User['role']) => {
    setFormData(prev => ({
      ...prev,
      role,
      permissions: getDefaultPermissions(role)
    }));
  };

  const getUserStats = () => {
    const activeUsers = filteredUsers.filter(u => u.isActive).length;
    const inactiveUsers = filteredUsers.filter(u => !u.isActive).length;
    const adminUsers = filteredUsers.filter(u => u.role === 'Admin' || u.role === 'SuperAdmin').length;
    
    return { activeUsers, inactiveUsers, adminUsers, totalUsers: filteredUsers.length };
  };

  const stats = getUserStats();

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Total Users</div>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
              </div>
              <Users className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-success">Active Users</div>
                <div className="text-2xl font-bold text-success">{stats.activeUsers}</div>
              </div>
              <UserCheck className="w-8 h-8 text-success" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Inactive Users</div>
                <div className="text-2xl font-bold">{stats.inactiveUsers}</div>
              </div>
              <UserX className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-blue-600">Admin Users</div>
                <div className="text-2xl font-bold text-blue-600">{stats.adminUsers}</div>
              </div>
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Management */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage system users and their permissions</CardDescription>
            </div>
            <Button onClick={handleAddUser} className="gap-2">
              <Plus className="w-4 h-4" />
              Add User
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search users by username, email, or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map(role => (
                  <SelectItem key={role} value={role}>
                    {role === "all" ? "All Roles" : role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.fullName}</div>
                        <div className="text-sm text-muted-foreground">{user.username}</div>
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRoleColor(user.role)}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? "default" : "secondary"}>
                        {user.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {user.lastLogin || "Never"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs">
                        {user.permissions.length} permissions
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleUserStatus(user.id)}
                          disabled={user.role === 'SuperAdmin'}
                        >
                          {user.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditUser(user)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteUser(user)}
                          disabled={user.role === 'SuperAdmin'}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* User Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedUser ? "Edit User" : "Add New User"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="Enter username"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select value={formData.role} onValueChange={handleRoleChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.filter(r => r !== 'all').map(role => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="grid grid-cols-2 gap-2 p-4 border rounded-lg max-h-40 overflow-y-auto">
                {permissions.map(permission => (
                  <label key={permission} className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={formData.permissions.includes(permission)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData(prev => ({
                            ...prev,
                            permissions: [...prev.permissions, permission]
                          }));
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            permissions: prev.permissions.filter(p => p !== permission)
                          }));
                        }
                      }}
                      className="rounded"
                    />
                    <span>{permission}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {selectedUser ? "Update User" : "Create User"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setUserToDelete(null);
        }}
        onConfirm={confirmDeleteUser}
        title="Delete User"
        description={`Are you sure you want to delete "${userToDelete?.fullName}"? This action cannot be undone.`}
        confirmText="Delete User"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
};

export default UserManagement;
