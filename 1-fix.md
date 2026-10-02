When I click the "Settings" tab in `sprint-tabs.tsx`, the tab content is completely empty.

The reason is in `sprint-tabs.tsx`:
`{activeTab === 'Settings' && settingsData && (`

`sprint-tabs.tsx` requires the `settingsData` prop to render `SettingsTab`, but `app/(dashboard)/workspace/kanban/page.tsx` is not passing `settingsData` into `<SprintTabs />`.

Please update `app/(dashboard)/workspace/kanban/page.tsx` to:
1. Fetch the active workspace details (`id`, `name`, `slug`, `tags`, `owner_id`).
2. Pass `settingsData` into `<SprintTabs>` when `isOwner` is true:
```tsx
settingsData={
  isOwner && workspace
    ? {
        workspace: {
          id: workspace.id,
          name: workspace.name,
          slug: workspace.slug,
          tags: workspace.tags || [],
        },
        members: avatarMembers,
        currentUserId: user.id,
      }
    : undefined
}