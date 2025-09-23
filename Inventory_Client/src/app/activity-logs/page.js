"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, Search, Filter, Calendar, User, Activity, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api, API_BASE_URL } from "@/lib/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function ActivityLogsPage() {
  const { token, hasPermission } = useAuth();
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activityTypeFilter, setActivityTypeFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("");
  const [resourceFilter, setResourceFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);


  // Fetch activity logs
  const fetchActivityLogs = useCallback(async () => {
    try {
      setLoading(true);

      const response = await api.activityLogs.getAll({
        page: currentPage.toString(),
        limit: "20",
        ...(searchTerm && { search: searchTerm }),
        ...(activityTypeFilter && activityTypeFilter !== "all" && { activityType: activityTypeFilter }),
        ...(userFilter && { userId: userFilter }),
        ...(resourceFilter && { resource: resourceFilter }),
      });

      if (response.ok) {
        const data = await response.json();
        setActivityLogs(data.data.activityLogs);
        setTotalPages(data.data.pagination.totalPages);
      } else {
        toast.error("Failed to fetch activity logs");
      }
    } catch (error) {
      console.error("Error fetching activity logs:", error);
      toast.error("Failed to fetch activity logs");
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, activityTypeFilter, userFilter, resourceFilter]);

  // Fetch activity stats
  const fetchActivityStats = useCallback(async () => {
    try {
      const response = await api.activityLogs.getStats();

      if (response.ok) {
        const data = await response.json();
        setStats(data.data.stats);
      }
    } catch (error) {
      console.error("Error fetching activity stats:", error);
    }
  }, []);

  useEffect(() => {
    if (hasPermission("admin")) {
      fetchActivityLogs();
      fetchActivityStats();
    }
  }, [hasPermission, fetchActivityLogs, fetchActivityStats]);

  const getActivityTypeColor = (type) => {
    switch (type) {
      case "login":
        return "bg-green-100 text-green-800";
      case "logout":
        return "bg-gray-100 text-gray-800";
      case "create":
        return "bg-blue-100 text-blue-800";
      case "update":
        return "bg-yellow-100 text-yellow-800";
      case "delete":
        return "bg-red-100 text-red-800";
      case "view":
        return "bg-purple-100 text-purple-800";
      case "password_change":
        return "bg-orange-100 text-orange-800";
      case "profile_update":
        return "bg-indigo-100 text-indigo-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const clearFilters = () => {
    setSearchTerm("");
    setActivityTypeFilter("all");
    setUserFilter("");
    setResourceFilter("");
    setCurrentPage(1);
  };

  // Handle delete all activity logs
  const handleDeleteAllLogs = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/activity-logs/cleanup`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ days: 0 }), // 0 days means delete all logs
      });

      if (response.ok) {
        const data = await response.json();
        const deletedCount = data.data.deletedCount;
        if (deletedCount > 0) {
          toast.success(`Successfully deleted ${deletedCount} activity logs`);
        } else {
          toast.info(`No activity logs found to delete`);
        }
        // Refresh the activity logs
        fetchActivityLogs();
        fetchActivityStats();
        // Close the dialog
        setDeleteDialogOpen(false);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to delete activity logs");
      }
    } catch (error) {
      console.error("Error deleting activity logs:", error);
      toast.error("Failed to delete activity logs");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="space-y-4 sm:space-y-6">
        {/* Header Section - Responsive */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold">Activity Logs</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Monitor user activities and system changes
            </p>
          </div>
          <AlertDialog 
            open={deleteDialogOpen} 
            onOpenChange={setDeleteDialogOpen}
          >
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                className="flex items-center gap-2 w-full sm:w-auto"
                title="Delete all activity logs"
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden xs:inline">Delete All Logs</span>
                <span className="xs:hidden">Delete All</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <Trash2 className="h-5 w-5 text-destructive" />
                  Delete All Activity Logs
                </AlertDialogTitle>
                <AlertDialogDescription className="space-y-3">
                  <span className="block">
                    This action will permanently delete ALL activity logs from the system.
                  </span>
                  <span className="block font-semibold text-destructive">
                    ⚠️ This action cannot be undone!
                  </span>
                  <span className="block text-sm text-muted-foreground">
                    All user activities, system changes, and audit trails will be permanently removed.
                  </span>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAllLogs}
                  disabled={isDeleting}
                  className="bg-destructive text-white hover:bg-destructive/90 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Deleting...
                    </>
                  ) : (
                    "Delete All Logs"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Stats Cards - Responsive Grid */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
                <CardTitle className="text-xs sm:text-sm font-medium">Total Activities</CardTitle>
                <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0">
                <div className="text-xl sm:text-2xl font-bold">{stats.totalActivities}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
                <CardTitle className="text-xs sm:text-sm font-medium">Active Users</CardTitle>
                <User className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0">
                <div className="text-xl sm:text-2xl font-bold">{stats.uniqueUsers}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
                <CardTitle className="text-xs sm:text-sm font-medium">Last 24 Hours</CardTitle>
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0">
                <div className="text-xl sm:text-2xl font-bold">{stats.recentActivities}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
                <CardTitle className="text-xs sm:text-sm font-medium">Most Active</CardTitle>
                <User className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0">
                <div className="text-xs sm:text-sm font-medium truncate">
                  {stats.mostActiveUsers[0]?.userName || "N/A"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {stats.mostActiveUsers[0]?.count || 0} activities
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters - Responsive */}
        <Card>
          <CardHeader className="p-3 sm:p-4">
            <CardTitle className="flex items-center text-sm sm:text-base">
              <Filter className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm">Search Activities</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by user, description, or resource..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 sm:pl-10 text-xs sm:text-sm h-8 sm:h-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm">Activity Type</Label>
                <Select value={activityTypeFilter} onValueChange={setActivityTypeFilter}>
                  <SelectTrigger className="h-8 sm:h-10 text-xs sm:text-sm">
                    <SelectValue placeholder="All activity types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Activity Types</SelectItem>
                    <SelectItem value="login">Login</SelectItem>
                    <SelectItem value="logout">Logout</SelectItem>
                    <SelectItem value="create">Create</SelectItem>
                    <SelectItem value="update">Update</SelectItem>
                    <SelectItem value="delete">Delete</SelectItem>
                    <SelectItem value="password_change">Password Change</SelectItem>
                    <SelectItem value="profile_update">Profile Update</SelectItem>
                    <SelectItem value="user_create">User Create</SelectItem>
                    <SelectItem value="user_update">User Update</SelectItem>
                    <SelectItem value="user_delete">User Delete</SelectItem>
                    <SelectItem value="user_activate">User Activate</SelectItem>
                    <SelectItem value="user_deactivate">User Deactivate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm">Resource Type</Label>
                <Input
                  placeholder="e.g., Product, Order, User..."
                  value={resourceFilter}
                  onChange={(e) => setResourceFilter(e.target.value)}
                  className="text-xs sm:text-sm h-8 sm:h-10"
                />
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="w-full h-8 sm:h-10 text-xs sm:text-sm"
                >
                  Clear All Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity Logs Table - Responsive */}
        <Card>
          <CardHeader className="p-3 sm:p-4">
            <CardTitle className="text-sm sm:text-base">Activity Logs</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Detailed log of all user activities and system changes
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 sm:p-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin" />
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden lg:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs sm:text-sm">User</TableHead>
                        <TableHead className="text-xs sm:text-sm">Activity</TableHead>
                        <TableHead className="text-xs sm:text-sm">Description</TableHead>
                        <TableHead className="text-xs sm:text-sm">Resource</TableHead>
                        <TableHead className="text-xs sm:text-sm">Timestamp</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activityLogs.map((log) => (
                        <TableRow key={log._id}>
                          <TableCell>
                            <div>
                              <div className="font-medium text-xs sm:text-sm">{log.userName}</div>
                              <div className="text-xs text-muted-foreground">{log.userEmail}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={`text-xs ${getActivityTypeColor(log.activityType)}`}>
                              {log.activityType.replace("_", " ").toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate text-xs sm:text-sm">
                            {log.description}
                          </TableCell>
                          <TableCell>
                            {log.resource && (
                              <Badge variant="outline" className="text-xs">{log.resource}</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm">
                            {formatDate(log.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards */}
                <div className="lg:hidden space-y-3 p-3 sm:p-4">
                  {activityLogs.map((log) => (
                    <Card key={log._id} className="p-3 sm:p-4">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{log.userName}</div>
                            <div className="text-xs text-muted-foreground truncate">{log.userEmail}</div>
                          </div>
                          <Badge className={`text-xs ${getActivityTypeColor(log.activityType)} ml-2 flex-shrink-0`}>
                            {log.activityType.replace("_", " ").toUpperCase()}
                          </Badge>
                        </div>
                        <div className="text-sm">{log.description}</div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {log.resource && (
                              <Badge variant="outline" className="text-xs">{log.resource}</Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDate(log.createdAt)}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Pagination - Responsive */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-4 mt-4 p-3 sm:p-4">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="w-full sm:w-auto text-xs sm:text-sm h-8 sm:h-10"
                    >
                      Previous
                    </Button>
                    <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="w-full sm:w-auto text-xs sm:text-sm h-8 sm:h-10"
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
