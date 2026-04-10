"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const routes = [
  { href: "/wagmi",  label: "Wagmi" },
  { href: "/viem",   label: "Viem" },
  { href: "/script", label: "CLI Script" },
];

export function DemoNav() {
  const pathname = usePathname();

  return (
    <div className="chrome">
      <div className="chrome-inner">
        <span className="chrome-label">Builder Code Verification</span>
        <nav className="route-nav" aria-label="Demo switcher">
          {routes.map((route) => {
            const isActive = pathname === route.href;

            return (
              <Link
                className={isActive ? "route-link route-link-active" : "route-link"}
                href={route.href}
                key={route.href}
              >
                {route.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
