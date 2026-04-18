"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Building2, Users, Settings, LogOut } from "lucide-react";
import { logout } from "@/app/(auth)/logout/actions";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", icon: Calendar, label: "캘린더" },
  { href: "/centers", icon: Building2, label: "센터" },
  { href: "/clients", icon: Users, label: "내담자" },
  { href: "/settings", icon: Settings, label: "설정" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-white/70 backdrop-blur-md border-r border-border/50">
      <div className="flex flex-col flex-1 px-4 py-6">
        {/* Logo */}
        <Link href="/dashboard" className="mb-8 px-3">
          <h1 className="text-2xl font-bold text-gradient-mint-pink">
            FreeFree
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            심리상담사 대시보드
          </p>
        </Link>

        {/* Navigation */}
        <nav className="flex-1 space-y-1.5">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-base font-medium transition-all",
                  isActive
                    ? "bg-gradient-mint-pink-vivid text-white shadow-md"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <form action={logout}>
          <Button
            type="submit"
            variant="ghost"
            className="w-full justify-start gap-3 rounded-2xl px-4 py-3 text-base text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-5 w-5" />
            로그아웃
          </Button>
        </form>
      </div>
    </aside>
  );
}

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col space-y-1.5 px-2">
      {navItems.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all",
              isActive
                ? "bg-gradient-mint-pink-vivid text-white shadow-md"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        );
      })}
      <form action={logout} className="pt-4">
        <Button
          type="submit"
          variant="ghost"
          className="w-full justify-start gap-3 rounded-2xl px-4 py-3 text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-5 w-5" />
          로그아웃
        </Button>
      </form>
    </nav>
  );
}
