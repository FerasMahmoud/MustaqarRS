'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import '../globals.css';

// Prevent prerendering for protected admin pages
export const dynamic = 'force-dynamic';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // Login page gets its own full layout with html/body
  if (pathname === '/admin/login') {
    return (
      <html lang="en" suppressHydrationWarning>
        <head>
          <link rel="icon" type="image/png" href="/favicon-32x32.png" />
        </head>
        <body className="font-sans antialiased" suppressHydrationWarning>
          {children}
        </body>
      </html>
    );
  }

  // Dashboard pages get sidebar layout (wrapped by root html/body)
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/png" href="/favicon-32x32.png" />
      </head>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <div className="flex h-screen bg-[#F5F0EB]">
          {/* Sidebar */}
          <aside className="w-64 bg-[#2D2D2D] text-white flex flex-col">
            {/* Logo */}
            <div className="p-6 border-b border-[#C9A96E]">
              <h1 className="text-xl font-bold">Admin Portal</h1>
              <p className="text-xs text-[#C9A96E]">شركة مستقر لإدارة الشقق الفندقية</p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              <NavLink href="/admin" label="Dashboard" icon="📊" />
              <NavLink href="/admin/bookings" label="Bookings" icon="📅" />
              <NavLink href="/admin/bookings?status=pending_payment" label="Pending Payments" icon="⏳" badgeColor="bg-red-500" />
              <NavLink href="/admin/calendar" label="Calendar" icon="📆" />
              <NavLink href="/admin/customers" label="Customers" icon="👥" />
              <NavLink href="/admin/analytics" label="Analytics" icon="📈" />

              {/* Divider */}
              <div className="my-4 border-t border-[#C9A96E]"></div>

              {/* Settings */}
              <NavLink href="/admin/settings" label="Settings" icon="⚙️" />
            </nav>

            {/* Logout */}
            <div className="p-4 border-t border-[#C9A96E]">
              <LogoutButton />
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Top Header */}
            <header className="bg-white border-b border-[#E8E3DB] px-8 py-4 flex items-center justify-between">
              <h1 className="text-2xl font-bold text-[#2D2D2D]">Dashboard</h1>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-[#8B7355]">Admin User</span>
                <div className="w-10 h-10 rounded-full bg-[#C9A96E] flex items-center justify-center text-white font-bold">
                  A
                </div>
              </div>
            </header>

            {/* Page Content */}
            <main className="flex-1 overflow-auto">
              <div className="p-8">
                {children}
              </div>
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}

function NavLink({
  href,
  label,
  icon,
  badgeColor,
}: {
  href: string;
  label: string;
  icon: string;
  badgeColor?: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-[#C9A96E]/20 transition-colors text-[#E8E3DB] hover:text-white"
    >
      <span className="text-xl">{icon}</span>
      <span className="flex-1">{label}</span>
      {badgeColor && (
        <span className={`${badgeColor} text-white text-xs px-2 py-1 rounded-full`}>
          New
        </span>
      )}
    </Link>
  );
}

function LogoutButton() {
  const handleLogout = async () => {
    document.cookie = 'admin_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    window.location.href = '/admin/login';
  };

  return (
    <button
      onClick={handleLogout}
      className="w-full px-4 py-2 rounded-lg bg-red-600/20 text-red-300 hover:bg-red-600/40 hover:text-red-100 transition-colors text-sm font-medium"
    >
      Logout
    </button>
  );
}
