"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Search, Edit, Trash2, UserCheck, UserX, Eye, User, AlertTriangle, MoreHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { API_BASE_URL } from "@/lib/api";

const getDefaultAvatarByRole = (role) => {
  switch (role) {
    case "admin":
      return "/avatars/admin.svg";
    case "manager":
      return "/avatars/manager.svg";
    case "viewer":
    default:
      return "/avatars/viewer.svg";
  }
};

export default function UsersPage() {
  const { token, hasPermission } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "viewer",
    avatar: "",
  });
  const [updatingUser, setUpdatingUser] = useState(false);
  const [deletingUser, setDeletingUser] = useState(null);
  const [togglingStatus, setTogglingStatus] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [toggleStatusDialogOpen, setToggleStatusDialogOpen] = useState(false);
  const [userToToggle, setUserToToggle] = useState(null);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
      });

      if (searchTerm) params.append("search", searchTerm);
      if (roleFilter && roleFilter !== "all") params.append("role", roleFilter);
      if (statusFilter && statusFilter !== "all") params.append("isActive", statusFilter);

      const response = await fetch(`${API_BASE_URL}/users?${params}`, {
      // const response = await fetch(`http://192.168.1.7:4000/api/users?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.data.users);
        setTotalPages(data.data.pagination.totalPages);
      } else {
        toast.error("Failed to fetch users");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  }, [token, currentPage, searchTerm, roleFilter, statusFilter]);

  useEffect(() => {
    if (hasPermission("admin")) {
      fetchUsers();
    }
  }, [hasPermission, fetchUsers]);

  // Create user
  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("User created successfully");
        setShowCreateDialog(false);
        setFormData({ name: "", email: "", password: "", role: "viewer", avatar: "" });
        fetchUsers();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to create user");
      }
    } catch (error) {
      console.error("Error creating user:", error);
      toast.error("Failed to create user");
    }
  };

  // Update user
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      setUpdatingUser(true);
      const response = await fetch(`${API_BASE_URL}/users/${selectedUser._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        // Update the user in the local state instead of refetching all users
        setUsers(users.map(user =>
          user._id === selectedUser._id
            ? { ...user, ...data.data.user }
            : user
        ));
        toast.success("User updated successfully");
        setShowEditDialog(false);
        setSelectedUser(null);
        setFormData({ name: "", email: "", password: "", role: "viewer", avatar: "" });
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to update user");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Failed to update user");
    } finally {
      setUpdatingUser(false);
    }
  };

  // Handle delete user click
  const handleDeleteUserClick = (user) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  // Delete user
  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      setDeletingUser(userToDelete._id);
      const response = await fetch(`${API_BASE_URL}/users/${userToDelete._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Remove the user from local state instead of refetching all users
        setUsers(users.filter(user => user._id !== userToDelete._id));
        toast.success("User deleted successfully");
        setDeleteDialogOpen(false);
        setUserToDelete(null);
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user");
    } finally {
      setDeletingUser(null);
    }
  };

  // Handle toggle status click
  const handleToggleStatusClick = (user) => {
    setUserToToggle(user);
    setToggleStatusDialogOpen(true);
  };

  // Toggle user status
  const handleToggleStatus = async () => {
    if (!userToToggle) return;

    try {
      setTogglingStatus(userToToggle._id);
      const response = await fetch(`${API_BASE_URL}/users/${userToToggle._id}/toggle-status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !userToToggle.isActive }),
      });

      if (response.ok) {
        const data = await response.json();
        // Update the user status in local state instead of refetching all users
        setUsers(users.map(user =>
          user._id === userToToggle._id
            ? { ...user, isActive: !userToToggle.isActive }
            : user
        ));
        toast.success(`User ${!userToToggle.isActive ? "activated" : "deactivated"} successfully`);
        setToggleStatusDialogOpen(false);
        setUserToToggle(null);
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to update user status");
      }
    } catch (error) {
      console.error("Error toggling user status:", error);
      toast.error("Failed to update user status");
    } finally {
      setTogglingStatus(null);
    }
  };

  // Open edit dialog
  const openEditDialog = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      avatar: user.avatar || "",
    });
    setShowEditDialog(true);
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300";
      case "manager":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300";
      case "viewer":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
    }
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="space-y-4 sm:space-y-6">
        {/* Header Section - Responsive */}
        <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold">User Management</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Manage system users and their permissions
            </p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Add User</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-lg">Create New User</DialogTitle>
                <DialogDescription className="text-sm">
                  Add a new user to the system with appropriate role and permissions.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                  <div className="space-y-2 sm:col-span-2 lg:col-span-2">
                    <Label htmlFor="name" className="text-sm">Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-1 lg:col-span-1">
                    <Label htmlFor="email" className="text-sm">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-1 lg:col-span-1">
                    <Label htmlFor="role" className="text-sm">Role</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) => setFormData({ ...formData, role: value })}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="viewer">Viewer</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 sm:col-span-2 lg:col-span-2">
                    <Label htmlFor="password" className="text-sm">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2 lg:col-span-2">
                    <Label htmlFor="avatar" className="text-sm">Avatar URL</Label>
                    <Input
                      id="avatar"
                      value={formData.avatar}
                      onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                      placeholder="Optional"
                      className="h-9"
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowCreateDialog(false)}
                    className="w-full sm:w-auto h-9"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="w-full sm:w-auto h-9">
                    Create User
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters - Responsive */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                <Label className="text-sm">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Role</Label>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end sm:col-span-2 lg:col-span-1">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setRoleFilter("all");
                    setStatusFilter("all");
                    setCurrentPage(1);
                  }}
                  className="w-full h-9"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table - Responsive */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Users</CardTitle>
            <CardDescription className="text-sm">
              Manage system users and their access levels
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden lg:block p-2">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Login</TableHead>
                        <TableHead className="w-[120px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user._id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center space-x-3">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={user.avatar || getDefaultAvatarByRole(user.role)} alt={user.name} />
                              <AvatarFallback>
                                <User className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                              <span className="truncate">{user.name}</span>
                          </div>
                        </TableCell>
                          <TableCell className="truncate max-w-[200px]">{user.email}</TableCell>
                        <TableCell>
                          <Badge className={getRoleBadgeColor(user.role)}>
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.isActive ? "default" : "secondary"}>
                            {user.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.lastLogin
                            ? new Date(user.lastLogin).toLocaleDateString()
                            : "Never"}
                        </TableCell>
                        <TableCell>
                            <div className="flex space-x-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(user)}
                              disabled={updatingUser}
                                className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleStatusClick(user)}
                              disabled={togglingStatus === user._id}
                                className="h-8 w-8 p-0"
                            >
                              {togglingStatus === user._id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : user.isActive ? (
                                <UserX className="h-4 w-4" />
                              ) : (
                                <UserCheck className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteUserClick(user)}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive/80"
                              disabled={deletingUser === user._id}
                            >
                              {deletingUser === user._id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>

                {/* Mobile Card View */}
                <div className="lg:hidden">
                  <div className="space-y-3 p-4">
                    {users.map((user) => (
                      <Card key={user._id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <Avatar className="w-10 h-10 flex-shrink-0">
                              <AvatarImage src={user.avatar || getDefaultAvatarByRole(user.role)} alt={user.name} />
                              <AvatarFallback>
                                <User className="h-5 w-5" />
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-sm truncate">{user.name}</h3>
                              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge className={`${getRoleBadgeColor(user.role)} text-xs`}>
                                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                </Badge>
                                <Badge variant={user.isActive ? "default" : "secondary"} className="text-xs">
                                  {user.isActive ? "Active" : "Inactive"}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                Last login: {user.lastLogin
                                  ? new Date(user.lastLogin).toLocaleDateString()
                                  : "Never"}
                              </p>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditDialog(user)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleToggleStatusClick(user)}
                                disabled={togglingStatus === user._id}
                              >
                                {togglingStatus === user._id ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : user.isActive ? (
                                  <UserX className="mr-2 h-4 w-4" />
                                ) : (
                                  <UserCheck className="mr-2 h-4 w-4" />
                                )}
                                {user.isActive ? "Deactivate" : "Activate"}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteUserClick(user)}
                                className="text-destructive focus:text-destructive"
                                disabled={deletingUser === user._id}
                              >
                                {deletingUser === user._id ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="mr-2 h-4 w-4" />
                                )}
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Pagination - Responsive */}
                {totalPages > 1 && (
                  <Pagination className="p-4 border-t">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage((p) => Math.max(1, p - 1));
                          }}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                      <PaginationItem>
                        <span className="text-sm text-muted-foreground px-2">
                          Page {currentPage} of {totalPages}
                        </span>
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage((p) => Math.min(totalPages, p + 1));
                          }}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(1);
                          }}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                        >
                          First
                        </PaginationLink>
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(totalPages);
                          }}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                        >
                          Last
                        </PaginationLink>
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Edit User Dialog - Responsive */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="w-[95vw] max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg">Edit User</DialogTitle>
              <DialogDescription className="text-sm">
                Update user information and permissions.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                <div className="space-y-2 sm:col-span-2 lg:col-span-2">
                  <Label htmlFor="edit-name" className="text-sm">Name</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="h-9"
                  />
                </div>
                <div className="space-y-2 sm:col-span-1 lg:col-span-1">
                  <Label htmlFor="edit-email" className="text-sm">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="h-9"
                  />
                </div>
                <div className="space-y-2 sm:col-span-1 lg:col-span-1">
                  <Label htmlFor="edit-role" className="text-sm">Role</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => setFormData({ ...formData, role: value })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">Viewer</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:col-span-2 lg:col-span-2">
                  <Label htmlFor="edit-avatar" className="text-sm">Avatar URL</Label>
                  <Input
                    id="edit-avatar"
                    value={formData.avatar}
                    onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                    placeholder="Optional"
                    className="h-9"
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEditDialog(false)}
                  disabled={updatingUser}
                  className="w-full sm:w-auto h-9"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updatingUser} className="w-full sm:w-auto h-9">
                  {updatingUser ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update User"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete User Alert Dialog - Responsive */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="w-[95vw] max-w-md sm:max-w-lg md:max-w-xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-lg">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Delete User
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm">
                Are you sure you want to delete <strong>{userToDelete?.name}</strong> ({userToDelete?.email})?
                This action cannot be undone and will permanently remove the user from the system.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <AlertDialogCancel disabled={deletingUser} className="w-full sm:w-auto h-9">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteUser}
                disabled={deletingUser}
                className="w-full sm:w-auto h-9 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                {deletingUser ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete User
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Toggle User Status Alert Dialog - Responsive */}
        <AlertDialog open={toggleStatusDialogOpen} onOpenChange={setToggleStatusDialogOpen}>
          <AlertDialogContent className="w-[95vw] max-w-md sm:max-w-lg md:max-w-xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-lg">
                {userToToggle?.isActive ? (
                  <UserX className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                ) : (
                  <UserCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                )}
                {userToToggle?.isActive ? "Deactivate User" : "Activate User"}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm">
                Are you sure you want to {userToToggle?.isActive ? "deactivate" : "activate"} <strong>{userToToggle?.name}</strong> ({userToToggle?.email})?
                {userToToggle?.isActive ? " The user will not be able to access the system." : " The user will regain access to the system."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <AlertDialogCancel disabled={togglingStatus} className="w-full sm:w-auto h-9">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleToggleStatus}
                disabled={togglingStatus}
                className={`w-full sm:w-auto h-9 ${userToToggle?.isActive ? "bg-amber-600 hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-700" : "bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700"} text-white`}
              >
                {togglingStatus ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {userToToggle?.isActive ? "Deactivating..." : "Activating..."}
                  </>
                ) : (
                  <>
                    {userToToggle?.isActive ? (
                      <>
                        <UserX className="h-4 w-4 mr-2" />
                        Deactivate User
                      </>
                    ) : (
                      <>
                        <UserCheck className="h-4 w-4 mr-2" />
                        Activate User
                      </>
                    )}
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ProtectedRoute>
  );
}
