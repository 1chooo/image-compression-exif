"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const navItems = [
  { href: "/", label: "lin hugo" },
  { href: "/episodes", label: "episodes" },
  { href: "/about", label: "about" },
  { href: "/tool", label: "tool" },
]

export function GallerySidebar() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-row lg:flex-col items-center lg:items-end gap-1 lg:gap-0.5 pr-0 lg:pr-6 text-sm">
      {navItems.map((item) => {
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href)

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`transition-colors duration-200 px-2 lg:px-0 py-1 ${
              isActive
                ? "text-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
