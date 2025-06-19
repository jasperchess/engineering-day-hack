"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { fileActivityLogger } from "./fileActivityLogger";

interface NavigationLoggerOptions {
  componentName: string;
  trackPageViews?: boolean;
  trackSearchParams?: boolean;
  trackReferrer?: boolean;
  enablePerformanceTracking?: boolean;
}

export function useNavigationLogger(options: NavigationLoggerOptions) {
  const {
    componentName,
    trackPageViews = true,
    trackSearchParams = true,
    trackReferrer = true,
    enablePerformanceTracking = true,
  } = options;

  const pathname = usePathname();
  const searchParams = useSearchParams();
  const previousPathRef = useRef<string>("");
  const pageLoadTimeRef = useRef<number>(Date.now());
  const navigationStartTimeRef = useRef<number>(Date.now());

  // Track page views and navigation
  useEffect(() => {
    const currentPath = pathname;
    const previousPath = previousPathRef.current;
    const navigationEndTime = Date.now();
    const navigationDuration = navigationEndTime - navigationStartTimeRef.current;

    // Log page view
    if (trackPageViews) {
      fileActivityLogger.logPageView(componentName, currentPath, {
        details: {
          pathname: currentPath,
          search: trackSearchParams ? searchParams.toString() : undefined,
          referrer: trackReferrer && typeof document !== "undefined" ? document.referrer : undefined,
          userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
          viewport: typeof window !== "undefined" ? `${window.innerWidth}x${window.innerHeight}` : undefined,
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Log navigation event (if not initial page load)
    if (previousPath && previousPath !== currentPath) {
      fileActivityLogger.logNavigation(componentName, previousPath, currentPath, {
        details: {
          fromPath: previousPath,
          toPath: currentPath,
          searchParams: trackSearchParams ? searchParams.toString() : undefined,
          navigationDuration,
          navigationType: getNavigationType(),
          timestamp: new Date().toISOString(),
        },
      });

      // Log performance metrics
      if (enablePerformanceTracking) {
        fileActivityLogger.logPerformanceMetric(
          componentName,
          "navigation-duration",
          navigationDuration,
          "milliseconds"
        );

        // Track time spent on previous page
        const timeOnPage = navigationEndTime - pageLoadTimeRef.current;
        fileActivityLogger.logPerformanceMetric(
          componentName,
          "time-on-page",
          timeOnPage,
          "milliseconds"
        );
      }
    }

    // Update refs for next navigation
    previousPathRef.current = currentPath;
    pageLoadTimeRef.current = navigationEndTime;
    navigationStartTimeRef.current = Date.now();

    // Log component mount for the current page
    fileActivityLogger.logComponentMount(componentName, {
      details: {
        pathname: currentPath,
        timestamp: new Date().toISOString(),
      },
    });

    // Cleanup function to log component unmount
    return () => {
      const unmountTime = Date.now();
      const timeOnCurrentPage = unmountTime - pageLoadTimeRef.current;

      fileActivityLogger.logComponentUnmount(componentName, {
        details: {
          pathname: currentPath,
          timeOnPage: timeOnCurrentPage,
          timestamp: new Date().toISOString(),
        },
      });

      if (enablePerformanceTracking) {
        fileActivityLogger.logPerformanceMetric(
          componentName,
          "page-session-duration",
          timeOnCurrentPage,
          "milliseconds"
        );
      }
    };
  }, [
    pathname,
    searchParams,
    componentName,
    trackPageViews,
    trackSearchParams,
    trackReferrer,
    enablePerformanceTracking,
  ]);

  // Track search parameter changes
  useEffect(() => {
    if (trackSearchParams && searchParams.toString()) {
      fileActivityLogger.logUserInteraction(componentName, "search-params-change", {
        details: {
          pathname,
          searchParams: searchParams.toString(),
          paramsCount: Array.from(searchParams.keys()).length,
          timestamp: new Date().toISOString(),
        },
      });
    }
  }, [searchParams, componentName, trackSearchParams, pathname]);

  // Performance observer for page load metrics
  useEffect(() => {
    if (!enablePerformanceTracking || typeof window === "undefined") return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();

      entries.forEach((entry) => {
        if (entry.entryType === "navigation") {
          const navEntry = entry as PerformanceNavigationTiming;

          // Log various performance metrics
          fileActivityLogger.logPerformanceMetric(
            componentName,
            "dns-lookup-time",
            navEntry.domainLookupEnd - navEntry.domainLookupStart,
            "milliseconds"
          );

          fileActivityLogger.logPerformanceMetric(
            componentName,
            "tcp-connect-time",
            navEntry.connectEnd - navEntry.connectStart,
            "milliseconds"
          );

          fileActivityLogger.logPerformanceMetric(
            componentName,
            "server-response-time",
            navEntry.responseEnd - navEntry.requestStart,
            "milliseconds"
          );

          fileActivityLogger.logPerformanceMetric(
            componentName,
            "dom-content-loaded",
            navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
            "milliseconds"
          );

          fileActivityLogger.logPerformanceMetric(
            componentName,
            "page-load-complete",
            navEntry.loadEventEnd - navEntry.loadEventStart,
            "milliseconds"
          );
        }

        if (entry.entryType === "paint") {
          fileActivityLogger.logPerformanceMetric(
            componentName,
            entry.name.replace("-", "-"),
            entry.startTime,
            "milliseconds"
          );
        }
      });
    });

    try {
      observer.observe({ entryTypes: ["navigation", "paint"] });
    } catch (error) {
      console.warn("Performance observer not supported:", error);
    }

    return () => {
      observer.disconnect();
    };
  }, [componentName, enablePerformanceTracking]);

  return {
    // Manual logging methods
    logPageView: (customPath?: string, details?: Record<string, any>) => {
      fileActivityLogger.logPageView(componentName, customPath || pathname, {
        details: {
          pathname: customPath || pathname,
          ...details,
          timestamp: new Date().toISOString(),
        },
      });
    },

    logNavigation: (from: string, to: string, reason?: string) => {
      fileActivityLogger.logNavigation(componentName, from, to, {
        details: {
          fromPath: from,
          toPath: to,
          reason,
          timestamp: new Date().toISOString(),
        },
      });
    },

    logUserInteraction: (interactionType: string, details?: Record<string, any>) => {
      fileActivityLogger.logUserInteraction(componentName, interactionType, {
        details: {
          pathname,
          interactionType,
          ...details,
          timestamp: new Date().toISOString(),
        },
      });
    },

    logSearchQuery: (query: string, resultCount: number) => {
      fileActivityLogger.logSearchQuery(componentName, query, resultCount, {
        details: {
          pathname,
          timestamp: new Date().toISOString(),
        },
      });
    },

    // Performance timing utilities
    startTimer: (operation: string) => {
      const startTime = Date.now();
      return () => {
        const duration = Date.now() - startTime;
        fileActivityLogger.logPerformanceMetric(
          componentName,
          operation,
          duration,
          "milliseconds"
        );
        return duration;
      };
    },

    // Get current navigation state
    getCurrentPath: () => pathname,
    getCurrentSearch: () => searchParams.toString(),
    getPreviousPath: () => previousPathRef.current,
  };
}

// Helper function to determine navigation type
function getNavigationType(): string {
  if (typeof window === "undefined") return "unknown";

  // Check if browser supports Navigation API
  if ("navigation" in window) {
    return "navigation-api";
  }

  // Fallback to performance API
  if (typeof performance !== "undefined" && performance.navigation) {
    switch (performance.navigation.type) {
      case performance.navigation.TYPE_NAVIGATE:
        return "navigate";
      case performance.navigation.TYPE_RELOAD:
        return "reload";
      case performance.navigation.TYPE_BACK_FORWARD:
        return "back-forward";
      default:
        return "unknown";
    }
  }

  return "unknown";
}

// HOC for automatic navigation logging
export function withNavigationLogger<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: NavigationLoggerOptions
) {
  return function NavigationLoggerWrapper(props: P) {
    useNavigationLogger(options);
    return <WrappedComponent {...props} />;
  };
}

// Hook for tracking specific page sections or components
export function usePageSectionLogger(
  sectionName: string,
  componentName: string,
  options: { trackVisibility?: boolean; trackScrollDepth?: boolean } = {}
) {
  const { trackVisibility = true, trackScrollDepth = false } = options;
  const sectionRef = useRef<HTMLElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (!trackVisibility || !sectionRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            fileActivityLogger.logUserInteraction(componentName, "section-view", {
              details: {
                sectionName,
                pathname,
                visibilityRatio: entry.intersectionRatio,
                timestamp: new Date().toISOString(),
              },
            });
          }
        });
      },
      { threshold: [0.1, 0.5, 0.9] }
    );

    observer.observe(sectionRef.current);

    return () => {
      observer.disconnect();
    };
  }, [sectionName, componentName, pathname, trackVisibility]);

  useEffect(() => {
    if (!trackScrollDepth) return;

    let maxScrollDepth = 0;

    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollDepth = Math.round((scrollTop / scrollHeight) * 100);

      if (scrollDepth > maxScrollDepth) {
        maxScrollDepth = scrollDepth;

        // Log at 25%, 50%, 75%, and 100% scroll depths
        if ([25, 50, 75, 100].includes(scrollDepth)) {
          fileActivityLogger.logUserInteraction(componentName, "scroll-depth", {
            details: {
              sectionName,
              pathname,
              scrollDepth,
              maxScrollDepth,
              timestamp: new Date().toISOString(),
            },
          });
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);

      // Log final scroll depth on unmount
      if (maxScrollDepth > 0) {
        fileActivityLogger.logUserInteraction(componentName, "final-scroll-depth", {
          details: {
            sectionName,
            pathname,
            maxScrollDepth,
            timestamp: new Date().toISOString(),
          },
        });
      }
    };
  }, [sectionName, componentName, pathname, trackScrollDepth]);

  return {
    sectionRef,
    logSectionInteraction: (interactionType: string, details?: Record<string, any>) => {
      fileActivityLogger.logUserInteraction(componentName, interactionType, {
        details: {
          sectionName,
          pathname,
          ...details,
          timestamp: new Date().toISOString(),
        },
      });
    },
  };
}
