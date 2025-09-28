"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import {
  CalendarDays,
  Clock,
  LogIn,
  User as UserIcon,
} from "lucide-react";

export default function WelcomeBanner() {
  const { user } = useAuth();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = useMemo(() => now.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" }), [now]);
  const formattedTime = useMemo(() => now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }), [now]);
  const formattedLastLogin = useMemo(() => {
    if (!user?.lastLogin) return null;
    try {
      const d = new Date(user.lastLogin);
      if (isNaN(d.getTime())) return null;
      return d.toLocaleString();
    } catch {
      return null;
    }
  }, [user?.lastLogin]);

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

  const displayName = user?.name || "there";
  const roleLabel = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "Guest";

  return (
    <div className="overflow-hidden rounded-xl bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-950 dark:from-slate-900 dark:via-indigo-900 dark:to-violet-900 border border-white/10 dark:border-white/20 p-3 sm:p-4 md:p-5 lg:p-6 mb-3 sm:mb-4 lg:mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
        {/* Left: Greeting */}
        <div className="flex items-center gap-3">
          <Avatar className="w-12 h-12 sm:w-18 sm:h-18 ring-2 ring-white/10 dark:ring-white/20 shadow-lg shadow-white/10 dark:shadow-white/20">
            <AvatarImage src={user?.avatar || getDefaultAvatarByRole(user?.role)} alt={displayName} />
            <AvatarFallback>
              <UserIcon className="h-4 w-4 text-white" />
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-amber-100 to-white dark:from-white dark:via-amber-200 dark:to-white bg-clip-text text-transparent truncate">
              Welcome, {displayName}
            </h1>
            <p className="inline-flex items-center gap-1 rounded-full bg-amber-300/10 dark:bg-amber-400/20 text-amber-100 dark:text-amber-200 border border-amber-200/20 dark:border-amber-300/30 px-2 py-0.5 text-[10px] sm:text-xs mt-1">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-300 dark:bg-amber-400" />
              <span className="capitalize font-medium text-sm">{roleLabel}</span>
            </p>
          </div>
        </div>

        {/* Right: Date/Time + Quick actions */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <div className="flex items-center gap-1 sm:gap-2 text-white/90 dark:text-white/80">
            <span className="inline-flex items-center gap-1 rounded-md bg-white/10 dark:bg-white/20 px-1.5 sm:px-2 py-1 text-[9px] sm:text-xs border border-white/15 dark:border-white/25 backdrop-blur-sm ring-1 ring-white/10 dark:ring-white/20 whitespace-nowrap">
              <CalendarDays className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              <span className="hidden sm:inline">{formattedDate}</span>
              <span className="sm:hidden">{formattedDate.split(',')[0]}</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-white/10 dark:bg-white/20 px-1.5 sm:px-2 py-1 text-[9px] sm:text-xs border border-white/15 dark:border-white/25 backdrop-blur-sm ring-1 ring-white/10 dark:ring-white/20 whitespace-nowrap">
              <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              {formattedTime}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 text-[10px] sm:text-sm text-white/90 dark:text-white/80 max-w-full sm:max-w-lg">
        <span className="inline-flex items-center gap-1.5 rounded-md bg-white/10 dark:bg-white/20 px-2 py-1 text-[10px] sm:text-xs border border-white/15 dark:border-white/25 backdrop-blur-sm ring-1 ring-white/10 dark:ring-white/20">
          <LogIn className="h-3 w-3" />
          Last login: {formattedLastLogin || "—"}
        </span>
        <p className="mt-4 sm:text-lg text-white/80 dark:text-white/70">
        Efficient product inventory management with advanced tracking.
        </p>
      </div>
    </div>
  );
}
