import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KRA Hotel PMS - Bu-Gaan & Thanawong",
  description: "ระบบบริหารจัดการโรงแรม Multi-Property (Bu-Gaan Sukhothai Village & Thanawong Pool Villa)",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="th"
      suppressHydrationWarning
      className="h-full antialiased"
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== "undefined" && "serviceWorker" in navigator) {
                navigator.serviceWorker.getRegistrations().then(function(registrations) {
                  for (var i = 0; i < registrations.length; i++) {
                    registrations[i].unregister();
                  }
                });
              }
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
