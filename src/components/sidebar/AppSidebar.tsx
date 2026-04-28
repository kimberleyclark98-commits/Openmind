"use client";

import { 
  Sidebar, 
  SidebarContent, 
  SidebarHeader, 
  SidebarFooter, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton, 
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent
} from "@/components/ui/sidebar";
import {
  MessageSquare,
  Library,
  Settings,
  Search,
  Cloud,
  LayoutGrid,
  Zap,
  Info,
  LogOut,
  ChevronRight,
  BrainCircuit,
  BarChart3
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface AppSidebarProps {
  view: 'chat' | 'library' | 'dashboard';
  setView: (view: 'chat' | 'library' | 'dashboard') => void;
}

export function AppSidebar({ view, setView }: AppSidebarProps) {
  return (
    <Sidebar className="border-r border-border/50">
      <SidebarHeader className="p-4 border-b border-border/50 bg-background/50 backdrop-blur-sm">
        <div className="flex items-center gap-3 px-2">
          <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <BrainCircuit className="h-6 w-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg tracking-tight leading-none">OpenMind</span>
            <span className="text-[10px] uppercase font-bold text-primary tracking-widest mt-1">Intelligence</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-2">
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={view === 'chat'}
                  onClick={() => setView('chat')}
                  className={cn("h-11 rounded-xl transition-all", view === 'chat' && "bg-primary/10 text-primary shadow-sm")}
                >
                  <MessageSquare className="h-5 w-5" />
                  <span className="font-medium">Active Chat</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={view === 'library'}
                  onClick={() => setView('library')}
                  className={cn("h-11 rounded-xl transition-all", view === 'library' && "bg-primary/10 text-primary shadow-sm")}
                >
                  <Library className="h-5 w-5" />
                  <span className="font-medium">Model Library</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={view === 'dashboard'}
                  onClick={() => setView('dashboard')}
                  className={cn("h-11 rounded-xl transition-all", view === 'dashboard' && "bg-primary/10 text-primary shadow-sm")}
                >
                  <BarChart3 className="h-5 w-5" />
                  <span className="font-medium">Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="px-4 text-[10px] uppercase font-bold tracking-widest text-muted-foreground">History</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {["Python Debugging", "Creative Writing", "Project Mindmap", "General Help"].map((item) => (
                <SidebarMenuItem key={item}>
                  <SidebarMenuButton className="h-9 px-4 text-xs text-muted-foreground hover:text-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-border mr-2" />
                    <span className="truncate">{item}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border/50 bg-background/50">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="h-10 rounded-xl">
              <Settings className="h-5 w-5" />
              <span className="font-medium">Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        
        <div className="mt-4 p-3 bg-muted/40 rounded-xl flex items-center gap-3 border border-border/50 group hover:bg-muted transition-colors cursor-pointer">
          <Avatar className="h-9 w-9 border border-background shadow-sm">
            <AvatarImage src="https://picsum.photos/seed/user/100/100" />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          <div className="flex flex-col flex-1 overflow-hidden">
            <span className="text-sm font-semibold truncate leading-none">Local User</span>
            <span className="text-[10px] text-muted-foreground truncate mt-1">v1.2.0-beta</span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
