'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function login(formData: FormData) {
    const supabase = await createClient()

    const emailOrUsername = formData.get('email') as string
    const password = formData.get('password') as string

    let email = emailOrUsername

    // If the user typed a username instead of an email, look up the email from public.profiles
    if (!emailOrUsername.includes('@')) {
        const { data: profile } = await (supabase
            .from('profiles') as any)
            .select('email')
            .eq('username', emailOrUsername)
            .maybeSingle()

        if (profile?.email) {
            email = profile.email
        }
    }

    const { error } = await supabase.auth.signInWithPassword({
        email,
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