'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function login(formData: FormData): Promise<{ error?: string }> {
    const supabase = await createClient()

    // 1. Extract values safely
    const rawInput = (formData.get('emailOrUsername') || formData.get('email')) as string | null
    const emailOrUsername = rawInput?.trim() || ''
    const password = (formData.get('password') as string) || ''

    if (!emailOrUsername || !password) {
        return { error: 'Please enter both your email/username and password.' }
    }

    let loginEmail = emailOrUsername

    // 2. If username, lookup corresponding email
    if (!emailOrUsername.includes('@')) {
        const { data: profile, error: profileErr } = await (supabase
            .from('profiles') as any)
            .select('email')
            .ilike('username', emailOrUsername)
            .maybeSingle()

        if (profileErr || !profile?.email) {
            return { error: 'No account found with that username.' }
        }

        loginEmail = profile.email
    }

    // 3. Supabase Auth sign-in
    const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
    })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/', 'layout')
    redirect('/workspace')
}

export async function signup(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const firstName = formData.get('firstName') as string
    const middleName = formData.get('middleName') as string
    const lastName = formData.get('lastName') as string
    const username = formData.get('username') as string

    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                first_name: firstName,
                middle_name: middleName || null,
                last_name: lastName,
                username: username,
            },
        },
    })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/', 'layout')
    redirect('/workspace')
}

export async function signOut() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
}