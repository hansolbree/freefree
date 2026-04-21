"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { SidebarNav } from "./sidebar";

export function Header({ isAdmin = false }: { isAdmin?: boolean }) {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-border/50 bg-white/70 backdrop-blur-md px-4 md:hidden">
      <Sheet>
        <SheetTrigger
          render={<Button variant="ghost" size="icon" className="rounded-xl" />}
        >
          <Menu className="h-5 w-5" />
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-4 bg-white/90 backdrop-blur-md">
          <SheetTitle className="text-xl font-bold text-gradient-mint-pink px-2 mb-6">
            FreeFree
          </SheetTitle>
          <SidebarNav isAdmin={isAdmin} />
        </SheetContent>
      </Sheet>
      <h1 className="text-lg font-bold text-gradient-mint-pink">FreeFree</h1>
    </header>
  );
}
