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
    const title = formData.get('title') as string
    const priority = formData.get('priority') as string
    const projectId = formData.get('projectId') as string

    // Allow the form to specify status, otherwise default to 'todo'
    const status = (formData.get('status') as string) || 'todo'

    const { error } = await (supabase.from('tasks') as any).insert({
        title,
        priority,
        project_id: projectId,
        status: status,
    })

    if (error) throw new Error(error.message)

    revalidatePath('/workspace/kanban')
    revalidatePath('/workspace/backlog')
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

// 4. Update task details (title, description, priority, assignee)
export async function updateTask(formData: FormData) {
    const supabase = await createClient()
    const taskId = formData.get('taskId') as string
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const priority = formData.get('priority') as string
    const assigneeId = (formData.get('assigneeId') as string) || null

    const { error } = await (supabase.from('tasks') as any)
        .update({
            title,
            description: description || null,
            priority,
            assignee_id: assigneeId === 'unassigned' ? null : assigneeId,
        })
        .eq('id', taskId)

    if (error) throw new Error(error.message)

    revalidatePath('/workspace/kanban')
}

// 5. Delete task
export async function deleteTask(taskId: string) {
    const supabase = await createClient()

    const { error } = await (supabase.from('tasks') as any)
        .delete()
        .eq('id', taskId)

    if (error) throw new Error(error.message)

    revalidatePath('/workspace/kanban')
}

// 6. Fetch workspace members for assignment dropdowns
export async function getWorkspaceMembers(workspaceId: string) {
    const supabase = await createClient()

    const { data: members, error } = await (supabase
        .from('workspace_members') as any)
        .select(`
      user_id,
      role,
      profiles:user_id (
        id,
        first_name,
        last_name,
        username,
        email
      )
    `)
        .eq('workspace_id', workspaceId)

    if (error) {
        console.error('Error fetching members:', error.message)
        return []
    }

    return members.map((m: any) => ({
        userId: m.user_id,
        role: m.role,
        name: m.profiles
            ? `${m.profiles.first_name || ''} ${m.profiles.last_name || ''}`.trim() || m.profiles.username || m.profiles.email
            : m.user_id,
        email: m.profiles?.email || '',
    }))
}

// 7. Add a member to a workspace by email with selected role
export async function addWorkspaceMember(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const workspaceId = formData.get('workspaceId') as string
    const email = (formData.get('email') as string)?.trim().toLowerCase()
    const role = formData.get('role') as string

    if (!email) throw new Error('Email is required')
    if (!role) throw new Error('Role is required')

    // Find user profile by email
    const { data: targetProfile, error: profileError } = await (supabase
        .from('profiles') as any)
        .select('id, email')
        .ilike('email', email)
        .maybeSingle()

    if (profileError || !targetProfile) {
        throw new Error('User not found. They must register an account first.')
    }

    // Check if user is already a member
    const { data: existing } = await (supabase
        .from('workspace_members') as any)
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('user_id', targetProfile.id)
        .maybeSingle()

    if (existing) {
        throw new Error('User is already a member of this workspace.')
    }

    // Insert into workspace_members with the picked role
    const { error: insertError } = await (supabase
        .from('workspace_members') as any)
        .insert({
            workspace_id: workspaceId,
            user_id: targetProfile.id,
            role: role,
        })

    if (insertError) throw new Error(insertError.message)

    revalidatePath('/workspace', 'layout')
}