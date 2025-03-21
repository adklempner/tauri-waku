<script lang="ts">
  import "../tailwind.css";
  import "../app.css";
  import Header from "$lib/components/Header.svelte";
  import { page } from '$app/state';
  import { Toaster } from 'svelte-sonner';
</script>

<div class="sm:mt-24 mt-0">
  <Header />
  <slot />
</div>

<Toaster />
