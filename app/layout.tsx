import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Drive Planner — Planification repas & courses",
  description:
    "Générez votre planning repas et liste de courses optimisée pour votre drive avec l'IA.",
};

import { ThemeProvider } from "next-themes";
import { Navbar } from "@/components/layout/Navbar";
import { cookies } from "next/headers";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const isAuthenticated = cookieStore.has("drive-planner-auth");
  return (
    <html lang="fr" suppressHydrationWarning className="dark">
      <body className="font-sans antialiased bg-background text-foreground flex flex-col min-h-screen">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          {isAuthenticated && <Navbar />}
          <div className="flex-1 flex flex-col">
            {children}
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
