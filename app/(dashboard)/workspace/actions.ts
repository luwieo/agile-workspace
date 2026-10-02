'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// 1. Create a Workspace with an initial Project and assign Owner
export async function createWorkspace(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const name = formData.get('name') as string

    // Generate a URL-safe slug with a short random suffix to prevent collisions
    const baseSlug = name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '')
    const slug = `${baseSlug || 'workspace'}-${Math.random().toString(36).substring(2, 7)}`

    // Insert workspace with slug
    const { data: workspace, error: wsError } = await (supabase
        .from('workspaces') as any)
        .insert({
            name,
            slug,
            owner_id: user.id,
        })
        .select()
        .single()

    if (wsError) throw new Error(wsError.message)

    // Add user to workspace_members as owner
    const { error: memberError } = await (supabase
        .from('workspace_members') as any)
        .insert({
            workspace_id: workspace.id,
            user_id: user.id,
            role: 'owner',
        })

    if (memberError) throw new Error(memberError.message)

    // Create a default Sprint project
    const { error: projectError } = await (supabase
        .from('projects') as any)
        .insert({
            name: 'Sprint 1',
            description: 'Initial sprint board',
            workspace_id: workspace.id,
        })

    if (projectError) throw new Error(projectError.message)

    revalidatePath('/workspace', 'layout')
}

// 2. Create a Task inside a Project
export async function createTask(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const title = formData.get('title') as string
    const projectId = formData.get('projectId') as string
    const priority = (formData.get('priority') as string) || 'medium'

    const { error } = await (supabase
        .from('tasks') as any)
        .insert({
            title,
            project_id: projectId,
            status: 'todo',
            priority,
            assignee_id: user.id,
            tags: [],
        })

    if (error) throw new Error(error.message)

    revalidatePath('/workspace/kanban')
}

// 3. Update Task Status
export async function updateTaskStatus(taskId: string, status: 'backlog' | 'todo' | 'in_progress' | 'done') {
    const supabase = await createClient()

    const { error } = await (supabase
        .from('tasks') as any)
        .update({ status })
        .eq('id', taskId)

    if (error) throw new Error(error.message)

    revalidatePath('/workspace/kanban')
}