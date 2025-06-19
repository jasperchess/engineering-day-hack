"use client";

import { useEffect } from "react";
import { useNavigationLogger } from "@/utils/logging";

export default function NavigationLogger() {
  const navigationLogger = useNavigationLogger({
    componentName: "GlobalNavigation",
    trackPageViews: true,
    trackSearchParams: true,
    trackReferrer: true,
    enablePerformanceTracking: true,
  });

  // Track browser events
  useEffect(() => {
    // Track page visibility changes
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        navigationLogger.logUserInteraction("page-focus", {
          visibilityState: document.visibilityState,
          timestamp: new Date().toISOString(),
        });
      } else {
        navigationLogger.logUserInteraction("page-blur", {
          visibilityState: document.visibilityState,
          timestamp: new Date().toISOString(),
        });
      }
    };

    // Track browser back/forward navigation
    const handlePopState = (event: PopStateEvent) => {
      navigationLogger.logUserInteraction("browser-navigation", {
        type: "popstate",
        state: event.state,
        timestamp: new Date().toISOString(),
      });
    };

    // Track page unload
    const handleBeforeUnload = () => {
      navigationLogger.logUserInteraction("page-unload", {
        type: "beforeunload",
        timestamp: new Date().toISOString(),
      });
    };

    // Track online/offline status
    const handleOnline = () => {
      navigationLogger.logUserInteraction("connectivity-change", {
        status: "online",
        timestamp: new Date().toISOString(),
      });
    };

    const handleOffline = () => {
      navigationLogger.logUserInteraction("connectivity-change", {
        status: "offline",
        timestamp: new Date().toISOString(),
      });
    };

    // Add event listeners
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("popstate", handlePopState);
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Log initial page load
    navigationLogger.logUserInteraction("page-load", {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onlineStatus: navigator.onLine,
      timestamp: new Date().toISOString(),
    });

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [navigationLogger]);

  // This component doesn't render anything visible
  return null;
}
