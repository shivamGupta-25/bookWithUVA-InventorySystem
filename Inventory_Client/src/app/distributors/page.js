"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Plus, Save, Pencil, Eye, Trash2 } from "lucide-react";
import { toast } from "sonner";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";

const DistributorsPage = () => {
  const { canPerformAction, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", phoneNumber: "", address: "", gstinNumber: "", email: "" });
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [deleteOneOpen, setDeleteOneOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(20);
  const canDeleteDistributors = canPerformAction("delete", "distributors");
  const canCreateDistributors = canPerformAction("create", "distributors");
  const canUpdateDistributors = canPerformAction("update", "distributors");
  const isViewer = user?.role === 'viewer';

  const loadDistributors = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.distributors.getAll({ 
        page: String(currentPage), 
        limit: String(pageSize),
        ...(search && { search }),
      });
      const data = await res.json();
      if (data.success) {
        setItems(data.data.distributors || []);
        const total = data.data.pagination?.total || (data.data.distributors?.length || 0);
        const pages = data.data.pagination?.limit ? Math.ceil(total / data.data.pagination.limit) : (data.data.pagination?.pages || 1);
        setTotalPages(pages);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load distributors");
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  useEffect(() => {
    loadDistributors();
  }, [loadDistributors]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items
      .filter((d) =>
        [d.name, d.phoneNumber, d.gstinNumber, d.address, d.email].some((v) => (v || "").toLowerCase().includes(q))
      )
      .filter((d) =>
        statusFilter === "all" ? true : statusFilter === "active" ? d.isActive : !d.isActive
      );
  }, [items, search, statusFilter]);

  const openCreate = () => {
    if (isViewer) return;
    setEditing(null);
    setForm({ name: "", phoneNumber: "", address: "", gstinNumber: "", email: "" });
    setDialogOpen(true);
  };

  const openEdit = (d) => {
    setEditing(d);
    setForm({ name: d.name || "", phoneNumber: d.phoneNumber || "", address: d.address || "", gstinNumber: d.gstinNumber || "", email: d.email || "" });
    setDialogOpen(true);
  };

  const validatePhoneNumber = (phone) => {
    if (!phone) return true; // Allow empty phone numbers
    const digits = phone.replace(/\D/g, '');
    return digits.length === 10 && !digits.startsWith('0');
  };

  const validateEmail = (email) => {
    if (!email) return true; // Allow empty emails
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email);
  };

  const save = async () => {
    if (isViewer) return;
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    
    // Validate phone number
    if (form.phoneNumber && !validatePhoneNumber(form.phoneNumber)) {
      toast.error("Phone number must be exactly 10 digits and cannot start with 0");
      return;
    }
    
    // Validate email
    if (form.email && !validateEmail(form.email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    setSaving(true);
    try {
      if (editing) {
        const res = await api.distributors.update(editing.id, form);
        const data = await res.json();
        if (data.success) {
          toast.success("Distributor updated");
          setDialogOpen(false);
          await loadDistributors();
        } else {
          toast.error(data.error || "Update failed");
        }
      } else {
        const res = await api.distributors.create(form);
        const data = await res.json();
        if (data.success) {
          toast.success("Distributor created");
          setDialogOpen(false);
          await loadDistributors();
        } else {
          toast.error(data.error || "Create failed");
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  };

  const softDelete = async (d) => {
    setDeleteTarget(d);
    setDeleteOneOpen(true);
  };

  const toggleActive = async (d, nextIsActive) => {
    if (!canUpdateDistributors) return;
    try {
      const res = await api.distributors.update(d.id, { isActive: nextIsActive });
      const data = await res.json();
      if (data.success) {
        setItems((prev) => prev.map((it) => (it.id === d.id ? { ...it, isActive: nextIsActive } : it)));
        toast.success(`Distributor ${nextIsActive ? "activated" : "deactivated"}`);
      } else {
        toast.error(data.error || "Failed to update status");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to update status");
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
              <span className="truncate">Distributors</span>
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-1">
              Manage your distributor records
            </p>
          </div>
          <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
            {canCreateDistributors && (
              <Button 
                onClick={openCreate}
                size="lg"
                className="relative group bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 border-0 rounded-lg px-4 py-3 min-w-[140px] cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative flex items-center justify-center gap-2">
                  <Plus className="h-5 w-5 transition-transform duration-300 group-hover:rotate-90" />
                  <span className="text-base font-medium">Add Distributor</span>
                </div>
              </Button>
            )}
            {canDeleteDistributors && (
              <Button
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => setDeleteAllOpen(true)}
              >
                Delete All
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-full overflow-x-hidden">
        {/* Mobile Delete All Button */}
        <div className="flex lg:hidden items-center gap-2 mb-4">
          {canDeleteDistributors && (
            <Button
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50 w-full"
              onClick={() => setDeleteAllOpen(true)}
            >
              Delete All
            </Button>
          )}
        </div>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Distributors List</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-3">
              <Input 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                placeholder="Search by name, phone, GSTIN, address, email"
                className="w-full"
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={loadDistributors} className="w-full sm:w-auto">
                Refresh
              </Button>
            </div>

            {loading ? (
              <div className="py-10 text-center text-muted-foreground flex items-center justify-center">
                <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Loading distributors...
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground">No distributors found.</div>
            ) : (
              <>
              <div className="rounded-md border overflow-x-auto sm:p-2 md:p-4 lg:p-2">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[100px]">Name</TableHead>
                      <TableHead className="hidden sm:table-cell min-w-[100px]">Phone</TableHead>
                      <TableHead className="hidden md:table-cell min-w-[150px]">Email</TableHead>
                      <TableHead className="hidden lg:table-cell min-w-[100px]">GSTIN</TableHead>
                      <TableHead className="hidden xl:table-cell min-w-[150px]">Address</TableHead>
                      <TableHead className="text-right min-w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                <TableBody>
                    {filtered.map((d) => (
                      <TableRow key={d.id} className={d.isActive ? "" : "opacity-60 bg-muted/50"}>
                        <TableCell className="font-medium">
                          <div>
                            <div className="font-semibold">{d.name}</div>
                            <div className="text-xs text-muted-foreground sm:hidden">
                              {d.phoneNumber && `Phone: ${d.phoneNumber}`}
                            </div>
                            <div className="text-xs text-muted-foreground md:hidden">
                              {d.email && `Email: ${d.email}`}
                            </div>
                            <div className="text-xs text-muted-foreground lg:hidden">
                              {d.gstinNumber && `GSTIN: ${d.gstinNumber}`}
                            </div>
                            <div className="text-xs text-muted-foreground xl:hidden truncate max-w-[150px]">
                              {d.address && `Address: ${d.address}`}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">{d.phoneNumber || "-"}</TableCell>
                        <TableCell className="hidden md:table-cell max-w-[150px] truncate">{d.email || "-"}</TableCell>
                        <TableCell className="hidden lg:table-cell">{d.gstinNumber || "-"}</TableCell>
                        <TableCell className="hidden xl:table-cell max-w-[150px] truncate">{d.address || "-"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1.5 items-center">
                            <Switch
                              checked={!!d.isActive}
                              onCheckedChange={(v) => toggleActive(d, v)}
                              disabled={!canUpdateDistributors}
                              className="scale-75"
                              aria-label="Toggle active"
                            />
                            <Button size="sm" variant="ghost" onClick={() => openEdit(d)}>
                              {isViewer ? <Eye className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                            </Button>
                            {canDeleteDistributors && (
                              <Button size="sm" variant="ghost" onClick={() => softDelete(d)}>
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {totalPages > 1 && (
                <Pagination className="mt-4 p-3 sm:p-4">
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
                      <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap px-2">
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
                  </PaginationContent>
                </Pagination>
              )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="w-[95vw] max-w-md sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">{isViewer ? "View Distributor" : (editing ? "Edit Distributor" : "New Distributor")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Name *</label>
              <Input 
                value={form.name} 
                onChange={(e) => setForm({ ...form, name: e.target.value })} 
                placeholder="Distributor name"
                className="w-full"
                readOnly={isViewer}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Phone</label>
              <Input 
                value={form.phoneNumber} 
                onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} 
                placeholder="Phone number"
                className="w-full"
                readOnly={isViewer}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email</label>
              <Input 
                value={form.email} 
                onChange={(e) => setForm({ ...form, email: e.target.value })} 
                placeholder="Email address"
                type="email"
                className="w-full"
                readOnly={isViewer}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">GSTIN</label>
              <Input 
                value={form.gstinNumber} 
                onChange={(e) => setForm({ ...form, gstinNumber: e.target.value })} 
                placeholder="GSTIN number"
                className="w-full"
                readOnly={isViewer}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Address</label>
              <Input 
                value={form.address} 
                onChange={(e) => setForm({ ...form, address: e.target.value })} 
                placeholder="Address"
                className="w-full"
                readOnly={isViewer}
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            {!isViewer && (
              <Button 
                onClick={save} 
                disabled={saving} 
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 w-full sm:w-auto"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> 
                    <span className="hidden sm:inline">Saving...</span>
                    <span className="sm:hidden">Save</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" /> 
                    <span className="hidden sm:inline">Save</span>
                    <span className="sm:hidden">Save</span>
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete All Confirmation */}
      <AlertDialog open={deleteAllOpen} onOpenChange={setDeleteAllOpen}>
        <AlertDialogContent className="w-[95vw] max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg">Delete all distributors?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              This action cannot be undone. This will permanently delete all distributor records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 w-full sm:w-auto"
              onClick={async () => {
                setDeleting(true);
                try {
                  const res = await api.distributors.deleteAll();
                  const data = await res.json();
                  if (data.success) {
                    toast.success(`Deleted ${data.deletedCount || 0} distributors`);
                    await loadDistributors();
                  } else {
                    toast.error(data.error || "Failed to delete all distributors");
                  }
                } catch (e) {
                  console.error(e);
                  toast.error("Failed to delete all distributors");
                } finally {
                  setDeleting(false);
                  setDeleteAllOpen(false);
                }
              }}
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete One Confirmation */}
      <AlertDialog open={deleteOneOpen} onOpenChange={setDeleteOneOpen}>
        <AlertDialogContent className="w-[95vw] max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg">Delete distributor?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              This action cannot be undone. This will permanently delete
              {deleteTarget ? ` "${deleteTarget.name}"` : " this distributor"}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 w-full sm:w-auto"
              onClick={async () => {
                if (!deleteTarget) return;
                setDeleting(true);
                try {
                  const res = await api.distributors.delete(deleteTarget.id);
                  const data = await res.json();
                  if (data.success) {
                    toast.success("Distributor deleted");
                    await loadDistributors();
                  } else {
                    toast.error(data.error || "Delete failed");
                  }
                } catch (e) {
                  console.error(e);
                  toast.error("Delete failed");
                } finally {
                  setDeleting(false);
                  setDeleteOneOpen(false);
                  setDeleteTarget(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Floating Action Button for Mobile */}
      {canCreateDistributors && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 lg:hidden">
          <Button
            onClick={openCreate}
            size="lg"
            className="relative group bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-110 active:scale-95 border-0 rounded-full w-14 h-14 p-0"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative flex items-center justify-center">
              <Plus className="h-6 w-6 transition-transform duration-300 group-hover:rotate-90" />
            </div>
          </Button>
        </div>
      )}
      </div>
    </ProtectedRoute>
  );
};

export default DistributorsPage;


