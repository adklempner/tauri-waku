<script lang="ts">
  import "../tailwind.css";
  import "../app.css";
  import Header from "$lib/components/Header.svelte";
  import { Toaster } from 'svelte-sonner';
</script>

<div id="layout-container" class="fixed inset-0 overflow-hidden flex flex-col">
  <Header />
  <div class="flex-1 overflow-auto">
    <slot />
  </div>
</div>

<Toaster />
