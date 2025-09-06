"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Package, Plus, Search, BarChart, Settings, TrendingUp, Users } from "lucide-react";

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
      title: "Add New Product",
      description: "Add new products to your inventory",
      icon: <Plus className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />,
      iconBg: "bg-green-100",
      buttonColor: "bg-green-600 hover:bg-green-700",
      details: "Create new product entries with detailed information including name, description, price, and stock quantity.",
      link: "/NewProduct",
    },
    {
      title: "Search Products",
      description: "Find specific products quickly",
      icon: <Search className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />,
      iconBg: "bg-purple-100",
      buttonColor: "bg-purple-600 hover:bg-purple-700",
      details: "Search through your inventory using various filters like name, category, price range, and availability.",
      link: "/search",
    },
    {
      title: "Analytics & Reports",
      description: "View inventory insights and statistics",
      icon: <BarChart className="h-3 w-3 sm:h-4 sm:w-4 text-indigo-600" />,
      iconBg: "bg-indigo-100",
      buttonColor: "bg-indigo-600 hover:bg-indigo-700",
      details: "Access detailed analytics about your inventory performance, stock levels, and sales trends.",
      link: "/analytics",
    },
    {
      title: "Settings",
      description: "Configure system settings and preferences",
      icon: <Settings className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />,
      iconBg: "bg-gray-100",
      buttonColor: "bg-gray-600 hover:bg-gray-700",
      details: "Manage system settings, user preferences, categories, and other configuration options.",
      link: "/settings",
    }
  ];

  return (
    <div className="min-h-screen w-full p-3 sm:p-4 md:p-6 lg:p-8 flex flex-col">
      {/* Welcome Banner */}
      <div className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-700 p-3 sm:p-4 md:p-6 shadow-lg mb-4 sm:mb-6">
        <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold tracking-tight text-white">Welcome to Inventory Manager</h1>
        <p className="mt-1 text-[10px] sm:text-sm text-white/90 max-w-full sm:max-w-lg">
          Efficiently manage your product inventory with our comprehensive tracking system
        </p>
      </div>

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