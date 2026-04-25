<script lang="ts">
    import { onMount, createEventDispatcher } from 'svelte'
    import type { App, WorkspaceLeaf, TFile } from 'obsidian'
    import TabCard from './svelteComponents/tabCard.svelte'

    export let app: App

    const dispatch = createEventDispatcher()

    interface TabInfo {
        leafId: string
        leaf: WorkspaceLeaf
        title: string
        icon: string
        filePath: string
        snippet: string
        isActive: boolean
    }

    let tabs: TabInfo[] = []

    onMount(() => {
        loadTabs()
    })

    export function loadTabs() {
        const activeLeaf = app.workspace.getLeaf()
        const newTabs: TabInfo[] = []

        app.workspace.iterateRootLeaves((leaf: WorkspaceLeaf) => {
            const view = leaf.view
            const file = (view as any).file as TFile | undefined

            newTabs.push({
                leafId: (leaf as any).id ?? String(Math.random()),
                leaf,
                title: view.getDisplayText() || 'Untitled',
                icon: view.getIcon() || 'file-text',
                filePath: file?.path ?? '',
                snippet: '',
                isActive: leaf === activeLeaf,
            })
        })

        tabs = newTabs
        loadSnippets()
    }

    async function loadSnippets() {
        for (let i = 0; i < tabs.length; i++) {
            const tab = tabs[i]
            if (tab.filePath && tab.filePath.endsWith('.md')) {
                try {
                    const file = app.vault.getAbstractFileByPath(tab.filePath)
                    if (file && 'extension' in file) {
                        const content = await app.vault.cachedRead(file as TFile)
                        tabs[i] = { ...tab, snippet: content.slice(0, 120).replace(/^---[\s\S]*?---\s*/, '').trim() }
                    }
                } catch { /* ignore read errors */ }
            }
        }
        tabs = tabs // trigger reactivity
    }

    function handleSelect(e: CustomEvent<{ leafId: string }>) {
        const tab = tabs.find(t => t.leafId === e.detail.leafId)
        if (tab) {
            dispatch('tabSelect', { leaf: tab.leaf, leafId: tab.leafId })
        }
    }

    function handleClose(e: CustomEvent<{ leafId: string }>) {
        const tab = tabs.find(t => t.leafId === e.detail.leafId)
        if (tab) {
            tab.leaf.detach()
            tabs = tabs.filter(t => t.leafId !== e.detail.leafId)
            if (tabs.length === 0) {
                dispatch('empty')
            }
        }
    }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class="tab-overview-backdrop" on:click={() => dispatch('close')}>
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div class="tab-overview-grid" on:click|stopPropagation>
        {#each tabs as tab (tab.leafId)}
            <TabCard
                title={tab.title}
                icon={tab.icon}
                filePath={tab.filePath}
                snippet={tab.snippet}
                isActive={tab.isActive}
                leafId={tab.leafId}
                on:select={handleSelect}
                on:close={handleClose}
            />
        {/each}
    </div>
</div>
