<script lang="ts">
  import { connectionState } from "$lib/waku.svelte";
  import DeviceList from "$lib/components/DeviceList.svelte";
  import { fade } from "svelte/transition";
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

<div class="relative min-h-screen">
  <div 
    class="max-w-2xl mx-auto sm:p-6 px-4 sm:my-12 my-8 bg-white rounded-lg sm:shadow-md absolute top-0 left-0 right-0" 
    in:fade={{ duration: 300 }}
    out:fade={{ duration: 300 }}
  >
    <h1
      class="text-2xl font-bold text-gray-800 mb-8 tracking-tight text-center"
    >
      Your Devices
    </h1>
    <DeviceList />

    <div class="mt-6 pt-6 border-t border-gray-200 text-center w-full">
      <p class="text-gray-600 mb-2">Want to add a new device?</p>
      <a href="/pairing" class="text-blue-600 hover:text-blue-800 font-medium"
        >Add Device →</a
      >
    </div>
  </div>
</div>
