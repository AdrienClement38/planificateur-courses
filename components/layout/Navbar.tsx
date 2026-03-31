"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Database, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Planificateur", icon: <Search className="w-4 h-4" /> },
    { href: "/admin/products", label: "Base Produits", icon: <Database className="w-4 h-4" /> },
    { href: "/admin", label: "Tableau de bord", icon: <LayoutDashboard className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
          <div className="flex items-baseline text-xl sm:text-2xl font-black tracking-tighter uppercase italic">
            <span className="text-white">Drive</span>
            <span className="text-primary">Planner</span>
          </div>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link 
                key={link.href} 
                href={link.href}
                className={cn(
                  "flex items-center gap-2 text-sm font-bold tracking-wide transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-white"
                )}
              >
                {link.icon}
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Mobile Navigation */}
        <div className="flex items-center gap-2 md:hidden">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link 
                key={link.href} 
                href={link.href}
                title={link.label}
                className={cn(
                  "p-2.5 rounded-xl transition-all",
                  isActive 
                    ? "bg-primary/20 text-primary border border-primary/20" 
                    : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white border border-transparent"
                )}
              >
                {link.icon}
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
