<script lang="ts">
    import { setIcon } from 'obsidian'
    import { createEventDispatcher } from 'svelte'

    export let title: string = 'Untitled'
    export let icon: string = 'file-text'
    export let filePath: string = ''
    export let snippet: string = ''
    export let isActive: boolean = false
    export let leafId: string = ''

    const dispatch = createEventDispatcher()

    function handleSelect() {
        dispatch('select', { leafId })
    }

    function handleClose(e: MouseEvent) {
        e.stopPropagation()
        dispatch('close', { leafId })
    }

    function setIconAction(node: HTMLElement, iconId: string) {
        setIcon(node, iconId)
        return {
            update(newIcon: string) {
                node.empty()
                setIcon(node, newIcon)
            }
        }
    }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
    class="tab-card"
    class:tab-card--active={isActive}
    data-leaf-id={leafId}
    on:click={handleSelect}
>
    <div class="tab-card-header">
        <span class="tab-card-icon" use:setIconAction={icon}></span>
        <span class="tab-card-title">{title}</span>
        <button class="tab-card-close" on:click={handleClose} aria-label="Close tab">
            <span class="tab-card-close-icon" use:setIconAction={'x'}></span>
        </button>
    </div>
    <div class="tab-card-body">
        {#if snippet}
            <p class="tab-card-snippet">{snippet}</p>
        {:else}
            <div class="tab-card-empty-icon" use:setIconAction={icon}></div>
        {/if}
    </div>
    {#if filePath}
        <div class="tab-card-footer">
            <span class="tab-card-path">{filePath}</span>
        </div>
    {/if}
</div>
