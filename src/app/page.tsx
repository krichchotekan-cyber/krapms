"use client";

import React, { useState, useEffect } from "react";
import { PMSProvider } from "@/context/PMSContext";
import { Header } from "@/components/Header";
import { NavigationTabs, TabType } from "@/components/NavigationTabs";
import { DashboardView } from "@/components/DashboardView";
import { CalendarTimelineView } from "@/components/CalendarTimelineView";
import { POSView } from "@/components/POSView";
import { BookingFormView } from "@/components/BookingFormView";
import { FolioView } from "@/components/FolioView";
import { BackofficeAdminView } from "@/components/BackofficeAdminView";
import { LoginModal } from "@/components/LoginModal";
import { PropertySelectModal } from "@/components/PropertySelectModal";
import { DatabaseInstallWizard } from "@/components/DatabaseInstallWizard";
import { DesktopSidebar } from "@/components/DesktopSidebar";
import { NotificationCenter } from "@/components/NotificationCenter";
import { AuthLoginGate } from "@/components/AuthLoginGate";
import { AccessRestrictedNotice } from "@/components/AccessRestrictedNotice";
import { isUserAdminOrGM, canUserAccessProperty } from "@/types/pms";
import { usePMS } from "@/context/PMSContext";
import { X } from "lucide-react";

function PMSMainApp() {
  const { isDatabaseInstalled, currentUser, setActivePropertyId } = usePMS();
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    if (typeof window !== "undefined") {
      try {
        const params = new URLSearchParams(window.location.search);
        const tabParam = params.get("tab") as TabType;
        if (tabParam && ["dashboard", "calendar", "pos", "booking", "folio", "admin"].includes(tabParam)) {
          return tabParam;
        }
      } catch (e) {
        console.error(e);
      }
    }
    return "dashboard";
  });
  const [preselectedRoomId, setPreselectedRoomId] = useState<string | undefined>(undefined);
  const [selectedFolioBookingId, setSelectedFolioBookingId] = useState<string | undefined>(undefined);
  const [isLoginOpen, setIsLoginOpen] = useState<boolean>(false);
  const [isPropertySelectOpen, setIsPropertySelectOpen] = useState<boolean>(false);
  const [isInstallOpen, setIsInstallOpen] = useState<boolean>(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState<boolean>(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState<boolean>(false);
  const [isPageMounted, setIsPageMounted] = useState<boolean>(false);

  // Initialize from URL search parameters upon mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      let tabParam = params.get("tab") as TabType;
      // If user is logged in and not Admin or GM, hide and block admin tab completely!
      if (currentUser && tabParam === "admin" && !isUserAdminOrGM(currentUser)) {
        tabParam = "dashboard";
        params.set("tab", "dashboard");
        params.delete("subtab");
        window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
        setActiveTab("dashboard");
      }

      // If user has branch restrictions, guard ?property= param
      const propParam = params.get("property");
      if (currentUser && propParam && !canUserAccessProperty(currentUser, propParam as any)) {
        const fallback = currentUser.propertyAccess === "all" ? "bugaan" : currentUser.propertyAccess;
        params.set("property", fallback);
        window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
        setActivePropertyId(fallback as any);
      } else if (propParam === "bugaan" || propParam === "thanawong" || propParam === "all") {
        setActivePropertyId(propParam as any);
      }
      if (tabParam && ["dashboard", "calendar", "pos", "booking", "folio", "admin"].includes(tabParam)) {
        setActiveTab(tabParam);
      }
      const roomParam = params.get("roomId");
      if (roomParam) setPreselectedRoomId(roomParam);
      const bookingParam = params.get("bookingId");
      if (bookingParam) setSelectedFolioBookingId(bookingParam);
    }
    setIsPageMounted(true);
  }, [currentUser]);

  // Handle browser back/forward buttons for tab navigation
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab") as TabType;
      if (tabParam && ["dashboard", "calendar", "pos", "booking", "folio", "admin"].includes(tabParam)) {
        setActiveTab(tabParam);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Guard: if current user is logged in and not Admin or GM, only allow admin tab if subtab is rooms
  useEffect(() => {
    if (currentUser && activeTab === "admin" && !isUserAdminOrGM(currentUser)) {
      const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
      if (params?.get("subtab") !== "rooms") {
        setActiveTab("dashboard");
      }
    }
  }, [activeTab, currentUser]);

  // Synchronize Tab and Sub-parameters (roomId, bookingId) to URL when mounted (only if changed)
  useEffect(() => {
    if (typeof window === "undefined" || !isPageMounted) return;
    try {
      const url = new URL(window.location.href);
      let changed = false;

      const isAllowedAdmin = isUserAdminOrGM(currentUser) || url.searchParams.get("subtab") === "rooms";
      const targetTab = activeTab === "admin" && !isAllowedAdmin ? "dashboard" : activeTab;
      if (url.searchParams.get("tab") !== targetTab) {
        url.searchParams.set("tab", targetTab);
        if (targetTab !== "admin" && url.searchParams.has("subtab")) {
          url.searchParams.delete("subtab");
        }
        changed = true;
      }

      if (preselectedRoomId && activeTab === "booking") {
        if (url.searchParams.get("roomId") !== preselectedRoomId) {
          url.searchParams.set("roomId", preselectedRoomId);
          changed = true;
        }
      } else if (url.searchParams.has("roomId")) {
        url.searchParams.delete("roomId");
        changed = true;
      }

      if (selectedFolioBookingId && activeTab === "folio") {
        if (url.searchParams.get("bookingId") !== selectedFolioBookingId) {
          url.searchParams.set("bookingId", selectedFolioBookingId);
          changed = true;
        }
      } else if (url.searchParams.has("bookingId")) {
        url.searchParams.delete("bookingId");
        changed = true;
      }

      if (activeTab !== "admin" && url.searchParams.has("subtab")) {
        url.searchParams.delete("subtab");
        changed = true;
      }

      if (changed) {
        window.history.replaceState({}, "", url.toString());
      }
    } catch (e) {
      console.error(e);
    }
  }, [activeTab, preselectedRoomId, selectedFolioBookingId, isPageMounted]);

  const handleGoToBooking = (roomId?: string) => {
    setPreselectedRoomId(roomId);
    setActiveTab("booking");
  };

  const handleGoToFolio = (bookingId?: string) => {
    setSelectedFolioBookingId(bookingId);
    setActiveTab("folio");
  };

  const handleGoToAdminRooms = () => {
    setActiveTab("admin");
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", "admin");
      url.searchParams.set("subtab", "rooms");
      window.history.replaceState({}, "", url.toString());
    }
  };

  const handleBookingSuccess = () => {
    setActiveTab("dashboard");
    setPreselectedRoomId(undefined);
  };

  // 1. Initial hydration check
  if (!isPageMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf8f5] dark:bg-[#070c1e]">
        <div className="w-10 h-10 border-3 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  // 2. Unauthenticated Gate: block all views if not logged in
  if (!currentUser) {
    return <AuthLoginGate />;
  }

  return (
    <div className="min-h-screen flex bg-[#faf8f5] dark:bg-[#070c1e] text-stone-900 dark:text-stone-100 transition-colors selection:bg-amber-500/20 selection:text-amber-800 dark:selection:text-amber-200">
      
      {/* Ambient background glow for resort luxury aesthetic */}
      <div className="no-print fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-300/10 dark:bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-amber-400/10 dark:bg-blue-600/5 rounded-full blur-3xl" />
      </div>

      {/* Desktop Sidebar featuring the 2 Hotel Logos and Navigation */}
      <DesktopSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenLogin={() => setIsLoginOpen(true)}
        onOpenPropertySelect={() => setIsPropertySelectOpen(true)}
        onOpenInstall={() => setIsInstallOpen(true)}
        onOpenNotifications={() => setIsNotificationOpen(true)}
      />

      {/* Main Content Area on Right */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen relative z-10">
        {/* Top Header */}
        <Header 
          activeTab={activeTab}
          onOpenLogin={() => setIsLoginOpen(true)} 
          onOpenPropertySelect={() => setIsPropertySelectOpen(true)}
          onOpenInstall={() => setIsInstallOpen(true)}
          onOpenNotifications={() => setIsNotificationOpen(true)}
        />

        {/* Database Setup Banner if not installed (Dismissible & sleek) */}
        {!isDatabaseInstalled && isPageMounted && !isBannerDismissed && (
          <div className="no-print bg-gradient-to-r from-amber-500/15 via-amber-400/10 to-amber-500/15 border-b border-amber-300/40 dark:border-amber-700/40 text-stone-800 dark:text-amber-100 px-3 sm:px-6 py-1.5 text-xs flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
              <span className="truncate text-[11px] sm:text-xs">
                <strong>โหมด Local Storage:</strong> ยังไม่ได้ติดตั้ง Cloud Database (ข้อมูลอยู่เฉพาะเครื่องนี้)
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button 
                type="button"
                onClick={() => setIsInstallOpen(true)}
                className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] shadow-xs transition-colors cursor-pointer"
              >
                ติดตั้ง Cloud DB
              </button>
              <button
                type="button"
                onClick={() => setIsBannerDismissed(true)}
                className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded cursor-pointer text-xs"
                title="ปิดการแจ้งเตือน"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Mobile/Tablet Tabs Bar (Hidden on desktop since DesktopSidebar is active) */}
        <div className="no-print lg:hidden">
          <NavigationTabs activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>

        {/* Main Content Area with responsive container & safe padding */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-28 sm:pb-16 overflow-x-hidden">
          {activeTab === "dashboard" && (
            <DashboardView 
              onGoToBooking={handleGoToBooking} 
              onGoToFolio={handleGoToFolio}
              onGoToAdminRooms={handleGoToAdminRooms}
            />
          )}

          {activeTab === "calendar" && (
            <CalendarTimelineView 
              onGoToBooking={handleGoToBooking} 
              onGoToFolio={handleGoToFolio}
            />
          )}

          {activeTab === "pos" && (
            <POSView />
          )}

          {activeTab === "booking" && (
            <BookingFormView 
              preselectedRoomId={preselectedRoomId} 
              onSuccess={handleBookingSuccess} 
            />
          )}

          {activeTab === "folio" && (
            <FolioView initialBookingId={selectedFolioBookingId} />
          )}

          {activeTab === "admin" && (
            (isUserAdminOrGM(currentUser) || (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("subtab") === "rooms")) ? (
              <BackofficeAdminView 
                onOpenInstall={() => setIsInstallOpen(true)} 
                onGoToFolio={handleGoToFolio}
              />
            ) : (
              <DashboardView 
                onGoToBooking={handleGoToBooking} 
                onGoToFolio={handleGoToFolio}
              />
            )
          )}
        </main>
      </div>

      {/* Staff Login / Profile Modal */}
      <LoginModal 
        isOpen={isLoginOpen} 
        onClose={() => setIsLoginOpen(false)} 
        onLoginSuccess={() => {
          setIsLoginOpen(false);
          setIsPropertySelectOpen(true);
        }}
        onOpenPropertySelect={() => {
          setIsLoginOpen(false);
          setIsPropertySelectOpen(true);
        }}
      />

      {/* Property Selection Modal */}
      <PropertySelectModal 
        isOpen={isPropertySelectOpen}
        onClose={() => setIsPropertySelectOpen(false)}
      />

      {/* Database Install Wizard Modal */}
      <DatabaseInstallWizard 
        isOpen={isInstallOpen}
        onClose={() => setIsInstallOpen(false)}
      />

      {/* Real-time Notification Center Drawer */}
      <NotificationCenter
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        onOpenChannelManager={() => {
          setIsNotificationOpen(false);
          setActiveTab("admin");
          if (typeof window !== "undefined") {
            const url = new URL(window.location.href);
            url.searchParams.set("subtab", "channel_manager");
            window.history.replaceState({}, "", url.toString());
          }
        }}
      />

    </div>
  );
}

export default function Home() {
  return (
    <PMSProvider>
      <PMSMainApp />
    </PMSProvider>
  );
}
