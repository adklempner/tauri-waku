<script lang="ts">
  import AddDevice from "$lib/components/AddDevice.svelte";
  import { browser } from "$app/environment";
  
  let publicKeyBase64: string | undefined = undefined;
  
  if (browser) {
    publicKeyBase64 = new URL(window.location.href).searchParams.get('key') || undefined;
  }
</script>
<div class="relative min-h-screen">
  <AddDevice publicKeyBase64={publicKeyBase64} />
</div>
