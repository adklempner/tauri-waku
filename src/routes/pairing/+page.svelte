<script lang="ts">
  import AddDevice from "$lib/components/AddDevice.svelte";
  import PageLayout from "$lib/components/PageLayout.svelte";
  import { browser } from "$app/environment";
  
  let publicKeyBase64: string | undefined = undefined;
  
  if (browser) {
    publicKeyBase64 = new URL(window.location.href).searchParams.get('key') || undefined;
  }
</script>

<PageLayout title="Add Device" maxWidth="md">
  <AddDevice publicKeyBase64={publicKeyBase64} />
</PageLayout>
