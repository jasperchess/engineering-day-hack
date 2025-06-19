"use client";

import NavigationLogger from "@/components/NavigationLogger";

interface ClientWrapperProps {
  children: React.ReactNode;
}

export default function ClientWrapper({ children }: ClientWrapperProps) {
  return (
    <>
      <NavigationLogger />
      {children}
    </>
  );
}
