"use client";

import React from "react";
import { PMSProvider } from "@/context/PMSContext";
import { DatabaseInstallWizard } from "@/components/DatabaseInstallWizard";

export default function InstallPage() {
  return (
    <PMSProvider>
      <DatabaseInstallWizard isOpen={true} isStandalonePage={true} />
    </PMSProvider>
  );
}
