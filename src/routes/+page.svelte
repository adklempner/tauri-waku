<script lang="ts">
  import ConnectionButton from "$lib/components/ConnectionButton.svelte";
  import { connectionState } from "$lib/waku.svelte";
  import DeviceList from "$lib/components/DeviceList.svelte";
  import { fade } from "svelte/transition";
</script>

<div class="relative min-h-screen">
  {#if $connectionState.status !== "connected"}
    <div 
      class="max-w-md mx-auto p-8 my-12 bg-white rounded-lg shadow-md absolute top-0 left-0 right-0" 
      in:fade={{ duration: 300 }}
      out:fade={{ duration: 300 }}
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
            class="w-full h-full transform scale-125 animate-spin-y" 
          />
        </div>
      </div>
      <div class="pt-6 border-t border-gray-200 text-center w-full">
        <p class="text-gray-600 mb-4">
          Connect to the Waku network to get started
        </p>
        <div class="w-full flex justify-center">
          <ConnectionButton size="large" />
        </div>
      </div>
    </div>
  {:else}
    <div 
      class="max-w-2xl mx-auto p-6 my-12 bg-white rounded-lg shadow-md absolute top-0 left-0 right-0" 
      in:fade={{ duration: 300, delay: 300 }}
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
  {/if}
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
