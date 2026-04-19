"use client";

import { useState } from "react";
import { AppSidebar } from "@/components/sidebar/AppSidebar";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { ModelLibrary } from "@/components/models/ModelLibrary";
import { SidebarInset } from "@/components/ui/sidebar";

export default function Home() {
  const [currentView, setCurrentView] = useState<'chat' | 'library'>('chat');

  return (
    <>
      <AppSidebar view={currentView} setView={setCurrentView} />
      <SidebarInset className="flex flex-col h-screen overflow-hidden">
        <main className="flex-1 overflow-hidden">
          {currentView === 'chat' ? (
            <ChatContainer />
          ) : (
            <ModelLibrary />
          )}
        </main>
      </SidebarInset>
    </>
  );
}
