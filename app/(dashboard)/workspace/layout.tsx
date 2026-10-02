import { signOut } from '@/app/(auth)/actions'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    // Double-check auth status at the layout level
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    return (
        <div className="flex min-h-screen flex-col bg-slate-50">
            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-white/10 bg-navy px-6 shadow-sm">
                <div className="flex items-center gap-4">
                    <span className="text-lg font-bold text-white">AgileSpace</span>
                </div>

                <div className="flex items-center gap-4">
                    <span className="text-sm text-slate-200">{user.email}</span>
                    <form action={signOut}>
                        <button
                            type="submit"
                            className="rounded-xl bg-white/15 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-white/25"
                        >
                            Sign Out
                        </button>
                    </form>
                </div>
            </header>

            {/* Main Content Area (renders your page.tsx) */}
            <main className="flex-1">
                {children}
            </main>
        </div>
    )
}