<script lang="ts">
  import ConnectionButton from "$lib/components/ConnectionButton.svelte";
  import { connectionState } from "$lib/waku.svelte";
  import DeviceList from "$lib/components/DeviceList.svelte";
  import { fade } from "svelte/transition";
  import { goto } from "$app/navigation";
  
  // Redirect to devices page when connected
  $effect(() => {
    if ($connectionState.status === "connected") {
      goto('/devices');
    }
  });
</script>

<div class="relative min-h-screen">
  <div 
    class="max-w-md mx-auto p-8 bg-white rounded-lg sm:shadow-md absolute top-0 left-0 right-0 sm:my-12 my-4" 
    in:fade={{ duration: 300 }}
  >
    <h1
      class="text-3xl font-bold text-gray-800 tracking-tight text-center"
    >
      Waku Device Pairing
    </h1>
    <div class="flex justify-center">
      <div class="w-64 h-64 overflow-hidden flex items-center justify-center perspective-500">
        <img 
          src="/waku-mark-primary-black.svg" 
          alt="Waku Logo" 
          class="w-full h-full transform scale-125 {$connectionState.status === 'connecting' || $connectionState.status === 'waiting_for_peers' || $connectionState.status === 'connected' ? 'animate-spin-y' : ''}" 
        />
      </div>
    </div>
    <div class="pt-6 border-t border-gray-200 text-center w-full sm:mt-0 mt-10">
      <p class="text-gray-600 mb-4">
        Connect to the Waku network to get started
      </p>
      <div class="w-full flex justify-center">
        <ConnectionButton size="large" />
      </div>
    </div>
  </div>
</div>

<style>
  .perspective-500 {
    perspective: 500px;
  }
  
  @keyframes spin-y {
    0% {
      transform: scale(1.25) rotateY(0deg);
    }
    50% {
      transform: scale(1.25) rotateY(180deg);
    }
    100% {
      transform: scale(1.25) rotateY(360deg);
    }
  }
  
  .animate-spin-y {
    animation: spin-y 10s infinite linear;
    transform-style: preserve-3d;
  }
</style>
