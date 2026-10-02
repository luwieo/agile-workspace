'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { canEditTasks, canDeleteTasks, canManageSettings } from '@/lib/rbac'

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
    const priority = formData.get('priority') as string
    const projectId = formData.get('projectId') as string
    const status = (formData.get('status') as string) || 'todo'
    const assigneeId = (formData.get('assigneeId') as string) || null
    const tagsRaw = (formData.get('tags') as string) || ''
    const description = (formData.get('description') as string) || null
    const dueDate = (formData.get('dueDate') as string) || null

    const tags = tagsRaw
        ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean)
        : []

    // Resolve workspaceId from projectId to check role
    const { data: project } = await (supabase.from('projects') as any)
        .select('workspace_id')
        .eq('id', projectId)
        .maybeSingle()

    const { data: membership } = project?.workspace_id
        ? await (supabase.from('workspace_members') as any)
            .select('role')
            .eq('workspace_id', project.workspace_id)
            .eq('user_id', user.id)
            .maybeSingle()
        : { data: null }

    if (!canEditTasks(membership?.role)) {
        throw new Error('Forbidden: Viewers cannot create tasks.')
    }

    const { error } = await (supabase.from('tasks') as any).insert({
        title,
        priority,
        project_id: projectId,
        status,
        assignee_id: assigneeId || null,
        tags: tags.length > 0 ? tags : null,
        description: description || null,
        due_date: dueDate || null,
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

// 4. Update task details
export async function updateTask(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const taskId = formData.get('taskId') as string
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const priority = formData.get('priority') as string
    const assigneeId = (formData.get('assigneeId') as string) || null
    const tagsRaw = (formData.get('tags') as string) || ''
    const tags = tagsRaw ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean) : []
    const dueDate = (formData.get('dueDate') as string) || null

    // Resolve workspace role from task's project
    const { data: task } = await (supabase.from('tasks') as any)
        .select('project_id')
        .eq('id', taskId)
        .maybeSingle()

    const { data: project } = task?.project_id
        ? await (supabase.from('projects') as any)
            .select('workspace_id')
            .eq('id', task.project_id)
            .maybeSingle()
        : { data: null }

    const { data: membership } = project?.workspace_id
        ? await (supabase.from('workspace_members') as any)
            .select('role')
            .eq('workspace_id', project.workspace_id)
            .eq('user_id', user.id)
            .maybeSingle()
        : { data: null }

    if (!canEditTasks(membership?.role)) {
        throw new Error('Forbidden: Viewers cannot edit tasks.')
    }

    const { error } = await (supabase.from('tasks') as any)
        .update({
            title,
            description: description || null,
            priority,
            assignee_id: assigneeId === 'unassigned' || !assigneeId ? null : assigneeId,
            tags,
            due_date: dueDate || null,
        })
        .eq('id', taskId)

    if (error) throw new Error(error.message)

    revalidatePath('/workspace/kanban')
    revalidatePath('/workspace/backlog')
}

// 5. Delete task (owner + developer only)
export async function deleteTask(taskId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Resolve workspace role from task's project
    const { data: task } = await (supabase.from('tasks') as any)
        .select('project_id')
        .eq('id', taskId)
        .maybeSingle()

    const { data: project } = task?.project_id
        ? await (supabase.from('projects') as any)
            .select('workspace_id')
            .eq('id', task.project_id)
            .maybeSingle()
        : { data: null }

    const { data: membership } = project?.workspace_id
        ? await (supabase.from('workspace_members') as any)
            .select('role')
            .eq('workspace_id', project.workspace_id)
            .eq('user_id', user.id)
            .maybeSingle()
        : { data: null }

    if (!canDeleteTasks(membership?.role)) {
        throw new Error('Forbidden: Only owners and developers can delete tasks.')
    }

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
        email,
        avatar_url
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
        username: m.profiles?.username || null,
        avatarUrl: m.profiles?.avatar_url || null,
    }))
}

// 7. Add a member to a workspace by email with selected role (owner only)
export async function addWorkspaceMember(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const workspaceId = formData.get('workspaceId') as string
    const email = (formData.get('email') as string)?.trim().toLowerCase()
    const role = formData.get('role') as string

    if (!email) throw new Error('Email is required')
    if (!role) throw new Error('Role is required')

    // Guard: only owner may invite members
    const { data: callerMembership } = await (supabase.from('workspace_members') as any)
        .select('role')
        .eq('workspace_id', workspaceId)
        .eq('user_id', user.id)
        .maybeSingle()

    if (!canManageSettings(callerMembership?.role)) {
        throw new Error('Forbidden: Only the workspace owner can invite members.')
    }

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

// 8. Update the authenticated user's profile
export async function updateProfile(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const firstName = (formData.get('firstName') as string)?.trim()
    const middleName = (formData.get('middleName') as string)?.trim() || null
    const lastName = (formData.get('lastName') as string)?.trim()
    const username = (formData.get('username') as string)?.trim()
    const avatarUrl = (formData.get('avatarUrl') as string)?.trim() || null

    if (!firstName) throw new Error('First name is required.')
    if (!lastName) throw new Error('Last name is required.')
    if (!username) throw new Error('Username is required.')

    const { error } = await (supabase
        .from('profiles') as any)
        .update({
            first_name: firstName,
            middle_name: middleName,
            last_name: lastName,
            username,
            avatar_url: avatarUrl,
        })
        .eq('id', user.id)

    if (error) throw new Error(error.message)

    revalidatePath('/workspace', 'layout')
}

// ─── Workspace Settings ────────────────────────────────────────────────────

// 9. Replace workspace tags array (owner only)
export async function updateWorkspaceTags(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const workspaceId = formData.get('workspaceId') as string
    const tagsRaw = formData.get('tags') as string
    const tags = JSON.parse(tagsRaw || '[]')

    // Verify caller's role directly from workspace_members
    const { data: member } = await (supabase
        .from('workspace_members') as any)
        .select('role')
        .eq('workspace_id', workspaceId)
        .eq('user_id', user.id)
        .maybeSingle()

    if (member?.role !== 'owner') {
        throw new Error('Forbidden: Only the workspace owner can configure custom tags.')
    }

    const { error } = await (supabase
        .from('workspaces') as any)
        .update({ tags })
        .eq('id', workspaceId)

    if (error) throw new Error(error.message)

    revalidatePath(`/workspace/kanban?workspaceId=${workspaceId}`)
}

// 10. Remove a member from a workspace (owner only, cannot remove self)
export async function removeWorkspaceMember(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const workspaceId = formData.get('workspaceId') as string
    const targetUserId = formData.get('targetUserId') as string

    if (targetUserId === user.id) throw new Error('You cannot remove yourself from a workspace.')

    // Guard: only owner may remove members
    const { data: membership } = await (supabase
        .from('workspace_members') as any)
        .select('role')
        .eq('workspace_id', workspaceId)
        .eq('user_id', user.id)
        .maybeSingle()

    if (membership?.role !== 'owner') throw new Error('Only the workspace owner can remove members.')

    const { error } = await (supabase
        .from('workspace_members') as any)
        .delete()
        .eq('workspace_id', workspaceId)
        .eq('user_id', targetUserId)

    if (error) throw new Error(error.message)

    revalidatePath('/workspace', 'layout')
    revalidatePath('/workspace/settings')
}

// 11. Update a member's role (owner only, cannot change own role)
export async function updateMemberRole(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const workspaceId = formData.get('workspaceId') as string
    const targetUserId = formData.get('targetUserId') as string
    const role = formData.get('role') as string

    if (targetUserId === user.id) throw new Error('You cannot change your own role.')

    const validRoles = ['owner', 'developer', 'member', 'viewer']
    if (!validRoles.includes(role)) throw new Error('Invalid role.')

    // Guard: only owner may change roles
    const { data: membership } = await (supabase
        .from('workspace_members') as any)
        .select('role')
        .eq('workspace_id', workspaceId)
        .eq('user_id', user.id)
        .maybeSingle()

    if (membership?.role !== 'owner') throw new Error('Only the workspace owner can change member roles.')

    const { error } = await (supabase
        .from('workspace_members') as any)
        .update({ role })
        .eq('workspace_id', workspaceId)
        .eq('user_id', targetUserId)

    if (error) throw new Error(error.message)

    revalidatePath('/workspace', 'layout')
    revalidatePath('/workspace/settings')
}