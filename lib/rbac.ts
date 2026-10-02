export type WorkspaceRole = 'owner' | 'developer' | 'member' | 'viewer'

export const ROLE_HIERARCHY: Record<WorkspaceRole, number> = {
    owner: 4,
    developer: 3,
    member: 2,
    viewer: 1,
}

// Strictly Owner
export function canManageSettings(role?: WorkspaceRole | null): boolean {
    return role === 'owner'
}

// Strictly Owner
export function canManageTags(role?: WorkspaceRole | null): boolean {
    return role === 'owner'
}

// Owner & Developer
export function canDeleteTasks(role?: WorkspaceRole | null): boolean {
    return role === 'owner' || role === 'developer'
}

// Owner, Developer, Member (All active contributors)
export function canEditTasks(role?: WorkspaceRole | null): boolean {
    return role ? ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.member : false
}

// Viewer is read-only
export function isReadOnly(role?: WorkspaceRole | null): boolean {
    return role === 'viewer'
}