import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/features/dashboard/dashboard-sidebar";
import { getAllPlaygroundForUser } from "@/features/playground/actions";
import type React from "react";

type DashboardPlaygroundItem = {
  id: string;
  name: string;
  icon: string;
  starred: boolean;
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const playgroundData = await getAllPlaygroundForUser();

  const formattedPlaygroundData: DashboardPlaygroundItem[] =
    (playgroundData || []).map((item) => ({
      id: item.id,
      name: item.title,
      icon: "Code2",
      starred: item.Starmark?.[0]?.isMarked || false,
    }));

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full overflow-x-hidden">
        <DashboardSidebar
          initialPlaygroundData={formattedPlaygroundData}
        />
        <main className="flex-1">{children}</main>
      </div>
    </SidebarProvider>
  );
}