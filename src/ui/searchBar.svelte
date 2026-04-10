<script lang="ts">
    import { Platform } from "obsidian";
    import type HomeTabSearchBar from "src/homeTabSearchbar";

    export let HomeTabSearchBar: HomeTabSearchBar
    export let embedded: boolean = false
    // @ts-ignore
    const isPhone = Platform.isPhone

    function handleClick(): void {
        HomeTabSearchBar.openQuickSwitcher();
    }

    function handleFocus(): void {
        HomeTabSearchBar.openQuickSwitcher();
    }
</script>

<div class="home-tab-searchbar-container">
    <div class="home-tab-searchbar"
        class:embedded={embedded}
        style:width={embedded || isPhone ? "90%" : "50%"}>
        <input type="search" spellcheck="false" placeholder="Type to start search..." readonly
        on:click={handleClick}
        on:focus={handleFocus}>
    </div>
</div>

<style>
    .home-tab-searchbar-container{
        display: flex;
        align-items: center;
        flex-direction: column;
        padding-bottom: 30px;
    }

    @media(max-width: 700px){
        .home-tab-searchbar-container{
            padding-bottom: 50px;
        }
    }

    .home-tab-searchbar{
        display: flex;
        min-width: 250px;
        max-width: 700px;
        margin: 0 auto;

        height: calc(var(--input-height)*1.25);

        background-color: var(--background-modifier-form-field);
        border: var(--input-border-width) solid var(--background-modifier-border);
        padding: var(--size-2-3);
        border-radius: var(--input-radius);
        outline: none;
        cursor: pointer;
    }

    .home-tab-searchbar input{
        width: 100%;
        height: 100%;
        box-shadow: none;
        font-size: var(--font-ui-medium);
        background: none;
        border: none;
        padding-left: 12px;
        cursor: pointer;
    }
    .home-tab-searchbar input:hover{
        background: none;
        border: none;
    }
</style>
