"use client";

import { Bell } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

export function DashboardNotifications() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Notifications"
          title="Notifications"
        >
          <Bell className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-80 max-w-[calc(100vw-2rem)] p-0"
      >
        <DropdownMenuLabel className="px-4 py-3">
          <span className="block">Notifications</span>
          <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
            Order and inventory updates for this shop.
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="m-0" />
        <div className="px-4 py-8 text-center" role="status">
          <span className="mx-auto mb-3 grid size-10 place-items-center rounded-full bg-secondary">
            <Bell className="size-4 text-muted-foreground" />
          </span>
          <p className="text-sm font-medium">No notifications yet</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            New merchant activity will appear here.
          </p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
