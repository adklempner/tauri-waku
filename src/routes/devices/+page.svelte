<script lang="ts">
  import { connectionState } from "$lib/waku.svelte";
  import DeviceList from "$lib/components/DeviceList.svelte";
  import PageLayout from "$lib/components/PageLayout.svelte";
  import CallToAction from "$lib/components/CallToAction.svelte";
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";

  // Redirect to home page if not connected
  onMount(() => {
    if ($connectionState.status !== "connected") {
      goto('/');
    }
  });

  // Also watch for disconnection
  $effect(() => {
    if ($connectionState.status !== "connected") {
      goto('/');
    }
  });
</script>

<PageLayout title="Your Devices" maxWidth="2xl" padding="sm:p-6 px-4" margin="sm:my-12 my-8">
  <DeviceList />

  <CallToAction 
    message="Want to add a new device?" 
    linkText="Add Device" 
    linkHref="/pairing" 
  />
</PageLayout>
