"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Package, Plus, Search, BarChart, Settings, TrendingUp, Users, ShoppingCart, CalendarDays, Clock, User as UserIcon, LogIn } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";

export default function Dashboard() {
  // Management cards configuration
  const managementCards = [
    {
      title: "Inventory Management",
      description: "View and manage your product inventory",
      icon: <Package className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />,
      iconBg: "bg-blue-100",
      buttonColor: "bg-blue-600 hover:bg-blue-700",
      details: "Browse, search, and manage all your inventory items. Track stock levels, categories, and product details.",
      link: "/inventory",
    },
    {
      title: "Order Management",
      description: "Create and track customer orders",
      icon: <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />,
      iconBg: "bg-orange-100",
      buttonColor: "bg-orange-600 hover:bg-orange-700",
      details: "Create new orders, track order status, manage customer information, and process payments.",
      link: "/orders",
    },
    {
      title: "Distributors",
      description: "Manage distributors and their details",
      icon: <Users className="h-3 w-3 sm:h-4 sm:w-4 text-teal-600" />,
      iconBg: "bg-teal-100",
      buttonColor: "bg-teal-600 hover:bg-teal-700",
      details: "Add, edit, and manage distributor records. Keep contacts and GSTIN updated.",
      link: "/distributors",
    },
    {
      title: "Add New Product",
      description: "Add new products to your inventory",
      icon: <Plus className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />,
      iconBg: "bg-green-100",
      buttonColor: "bg-green-600 hover:bg-green-700",
      details: "Create new product entries with detailed information including name, description, price, and stock quantity.",
      link: "/NewProduct",
    },
    {
      title: "Settings",
      description: "Configure system settings and preferences",
      icon: <Settings className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />,
      iconBg: "bg-gray-100",
      buttonColor: "bg-gray-600 hover:bg-gray-700",
      details: "Manage system settings, user preferences, categories, and other configuration options.",
      link: "/settings",
    },
    {
      title: "Order Analytics",
      description: "Analyze order trends and top-selling products",
      icon: <BarChart className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />,
      iconBg: "bg-purple-100",
      buttonColor: "bg-purple-600 hover:bg-purple-700",
      details: "View analytics on orders, revenue, and product performance. Identify trends and make data-driven decisions.",
      link: "/order-analytics",
    },
  ];

  return (
    <div className="min-h-screen w-full p-3 sm:p-4 md:p-6 lg:p-8 flex flex-col">
      {/* Welcome Banner */}
      <WelcomeBanner />

      {/* Main Management Cards */}
      <section className="mt-4 sm:mt-6 flex-grow">
        <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold mb-3 sm:mb-4 lg:mb-6 text-center">Inventory Management</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          {managementCards.map((card, index) => (
            <Card
              key={index}
              className="bg-white border-none shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 flex flex-col h-full"
            >
              <CardHeader className="pb-1 sm:pb-2 p-3 sm:p-4 lg:p-5">
                <div className={`p-1 sm:p-1.5 w-fit rounded-lg ${card.iconBg} mb-1 sm:mb-2`}>
                  {card.icon}
                </div>
                <CardTitle className="text-sm sm:text-base md:text-lg lg:text-xl">{card.title}</CardTitle>
                <CardDescription className="text-[10px] sm:text-xs md:text-sm">
                  {card.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="px-3 sm:px-4 lg:px-5 py-1 flex-grow">
                <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">{card.details}</p>
              </CardContent>
              <CardFooter className="px-3 sm:px-4 lg:px-5 pb-3 sm:pb-4 pt-1 sm:pt-2">
                <Link href={card.link} className="w-full">
                  <Button className={`w-full ${card.buttonColor} text-[10px] sm:text-xs md:text-sm h-7 sm:h-8 md:h-9 px-2 sm:px-3 md:px-4`}>
                    <span className="flex items-center justify-center w-full">
                      <span className="truncate">Manage {card.title.split(" ")[0]}</span>
                      <ArrowRight className="ml-1 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    </span>
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

function WelcomeBanner() {
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
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-950 border border-white/10 p-3 sm:p-4 md:p-6 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.6)] mb-4 sm:mb-6">
      <div className="pointer-events-none absolute -top-24 -right-28 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-28 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
      <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
        {/* Left: Greeting */}
        <div>
          <div className="flex items-center gap-3">
            <Avatar className="w-8 h-8 sm:w-10 sm:h-10 ring-2 ring-amber-300/70 shadow-[0_0_0_3px_rgba(255,255,255,0.06)]">
              <AvatarImage src={user?.avatar || getDefaultAvatarByRole(user?.role)} alt={displayName} />
              <AvatarFallback>
                <UserIcon className="h-4 w-4 text-white" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-amber-100 to-white bg-clip-text text-transparent">
                Welcome, {displayName}
              </h1>
              <div className="mt-1">
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-300/10 text-amber-100 border border-amber-200/20 px-2 py-0.5 text-[10px] sm:text-xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
                  <span className="capitalize">{roleLabel}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Date/Time + Quick actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 text-white/90">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-white/10 px-2 py-1 text-[10px] sm:text-xs border border-white/15 backdrop-blur-sm ring-1 ring-white/10">
              <CalendarDays className="h-3 w-3" />
              {formattedDate}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md bg-white/10 px-2 py-1 text-[10px] sm:text-xs border border-white/15 backdrop-blur-sm ring-1 ring-white/10">
              <Clock className="h-3 w-3" />
              {formattedTime}
            </span>
          </div>
        </div>
      </div>
      <div className="mt-4 text-[10px] sm:text-sm text-white/90 max-w-full sm:max-w-lg">
        <span className="inline-flex items-center gap-1.5 rounded-md bg-white/10 px-2 py-1 text-[10px] sm:text-xs border border-white/15 backdrop-blur-sm ring-1 ring-white/10">
          <LogIn className="h-3 w-3" />
          Last login: {formattedLastLogin || "—"}
        </span>
        <p className="mt-4 text-white/80">
          Efficiently manage your product inventory with our comprehensive tracking system.
        </p>
      </div>
    </div>
  );
}