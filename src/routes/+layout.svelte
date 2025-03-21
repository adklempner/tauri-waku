<script lang="ts">
  import "../tailwind.css";
  import "../app.css";
  import Header from "$lib/components/Header.svelte";
</script>

<div class="mt-24">
  <Header />
  <slot />
</div>
