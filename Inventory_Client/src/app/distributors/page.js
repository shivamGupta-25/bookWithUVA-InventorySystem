"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Loader2, Plus, Save, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

const DistributorsPage = () => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", phoneNumber: "", address: "", gstinNumber: "" });
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [deleteOneOpen, setDeleteOneOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadDistributors = async () => {
    try {
      setLoading(true);
      const res = await api.distributors.getAll({ limit: 1000 });
      const data = await res.json();
      if (data.success) {
        setItems(data.data.distributors || []);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load distributors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDistributors();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter((d) =>
      [d.name, d.phoneNumber, d.gstinNumber, d.address].some((v) => (v || "").toLowerCase().includes(q))
    );
  }, [items, search]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", phoneNumber: "", address: "", gstinNumber: "" });
    setDialogOpen(true);
  };

  const openEdit = (d) => {
    setEditing(d);
    setForm({ name: d.name || "", phoneNumber: d.phoneNumber || "", address: d.address || "", gstinNumber: d.gstinNumber || "" });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) {
      toast.error("Name is required");
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

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Distributors</h1>
            <p className="text-gray-600">Manage your distributor records</p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" /> New Distributor
            </Button>
            <Button
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => setDeleteAllOpen(true)}
            >
              Delete All
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Distributors List</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-3">
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, phone, GSTIN, address" />
              <Button variant="outline" onClick={loadDistributors}>Refresh</Button>
            </div>

            {loading ? (
              <div className="py-10 text-center text-gray-600 flex items-center justify-center">
                <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Loading distributors...
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-10 text-center text-gray-600">No distributors found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-600 border-b">
                      <th className="py-2 pr-4">Name</th>
                      <th className="py-2 pr-4">Phone</th>
                      <th className="py-2 pr-4">GSTIN</th>
                      <th className="py-2 pr-4">Address</th>
                      <th className="py-2 pr-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((d) => (
                      <tr key={d.id} className="border-b hover:bg-gray-50/60">
                        <td className="py-2 pr-4 font-medium">{d.name}</td>
                        <td className="py-2 pr-4">{d.phoneNumber || "-"}</td>
                        <td className="py-2 pr-4">{d.gstinNumber || "-"}</td>
                        <td className="py-2 pr-4">{d.address || "-"}</td>
                        <td className="py-2 pr-4 text-right">
                          <Button size="sm" variant="ghost" onClick={() => openEdit(d)} className="mr-1">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => softDelete(d)}>
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Distributor" : "New Distributor"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-700">Name *</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Distributor name" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">Phone</label>
              <Input value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} placeholder="Phone number" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">GSTIN</label>
              <Input value={form.gstinNumber} onChange={(e) => setForm({ ...form, gstinNumber: e.target.value })} placeholder="GSTIN number" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">Address</label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Address" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={save} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
              {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : <><Save className="h-4 w-4 mr-2" /> Save</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete All Confirmation */}
      <AlertDialog open={deleteAllOpen} onOpenChange={setDeleteAllOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete all distributors?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete all distributor records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete distributor?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete
              {deleteTarget ? ` "${deleteTarget.name}"` : " this distributor"}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
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
    </div>
  );
};

export default DistributorsPage;


