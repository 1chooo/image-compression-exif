"use client"

import { GallerySidebar } from "./gallery-sidebar"

interface GalleryLayoutProps {
  children: React.ReactNode
}

export function GalleryLayout({ children }: GalleryLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex flex-col lg:flex-row max-w-6xl mx-auto px-6 py-8 lg:py-14">
        {/* Sidebar */}
        <div className="lg:w-44 shrink-0 mb-6 lg:mb-0">
          <div className="lg:sticky lg:top-14">
            <div className="flex flex-row lg:flex-col items-center lg:items-end">
              <GallerySidebar />
            </div>
          </div>
        </div>

        {/* Vertical divider - only on desktop */}
        <div className="hidden lg:block w-px bg-border mr-10 shrink-0" />

        {/* Horizontal divider - only on mobile */}
        <div className="lg:hidden h-px bg-border mb-6" />

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}
