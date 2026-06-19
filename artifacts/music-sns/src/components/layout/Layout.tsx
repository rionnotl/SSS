import { ReactNode } from "react";
import { NavBar } from "./NavBar";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] bg-background">
      {/* Subtle radial gradient background effect for atmosphere */}
      <div className="pointer-events-none fixed inset-0 flex justify-center z-[-1]">
        <div className="h-[500px] w-[500px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute top-1/3 left-1/4 h-[300px] w-[300px] rounded-full bg-secondary/5 blur-[100px]" />
      </div>
      
      <NavBar />
      
      <main className="flex-1 w-full max-w-2xl mx-auto p-4 sm:p-6 flex flex-col">
        {children}
      </main>
    </div>
  );
}
