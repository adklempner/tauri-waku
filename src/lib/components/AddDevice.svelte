<script lang="ts">
  import QRious from "qrious";
  import { tokenStore } from "$lib/credential/TokenStore";
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";
  import { MonitorSmartphone, Unplug } from "@lucide/svelte";
  
  let storeReady = $state(false);
  let challengeReady = $state(false);
  let deviceName = $state("my-device");
  
  onMount(async () => {
    tokenStore.ready.subscribe(async (ready) => {
      if (!ready) {
        console.log("Database not ready");
        return;
      }
      storeReady = true;
    });
  });

  async function handleAddDevice() {
    const publicKeyBase64 = await tokenStore.startPairing();
    
    // First set challengeReady to true so the canvas element gets rendered
    challengeReady = true;
    
    // Wait for the next tick to ensure DOM is updated
    setTimeout(() => {
      const qr = new QRious({
        element: document.getElementById("qrcode") as HTMLCanvasElement,
        size: 256,
        background: "#ffffff",
        foreground: "#000000",
        value: publicKeyBase64,
      });
      
      console.log(qr);
    }, 0);
  }
</script>

<div class="max-w-md mx-auto p-8 my-12 bg-white rounded-lg shadow-md absolute top-0 left-0 right-0">
  <h1 class="text-3xl font-bold text-gray-800 mb-8 tracking-tight text-center">Add Device</h1>
  
  {#if !storeReady}
    <div class="flex justify-center items-center h-40" in:fade={{ duration: 200 }}>
      <p class="text-gray-600 animate-pulse text-lg">Loading...</p>
    </div>
  {:else}
    {#if !challengeReady}
      <div class="w-full mb-8 space-y-6" in:fade={{ duration: 300 }}>
        <div class="flex justify-center">
          <div class="w-36 h-24 overflow-hidden flex items-center justify-center perspective-500">
            <MonitorSmartphone stroke-width={0.75} color="rgb(31 41 55)" size={100} absoluteStrokeWidth={true} />
            <Unplug stroke-width={0.75} color="rgb(31 41 55)" size={100} absoluteStrokeWidth={true} />
          </div>
        </div>
        
        <div class="space-y-4 mt-6">
          <label for="device-name" class="block text-sm font-medium text-gray-700">Device Name</label>
          <input 
            id="device-name"
            type="text" 
            bind:value={deviceName} 
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button 
            onclick={handleAddDevice} 
            class="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors duration-200"
          >
            Add Device
          </button>
        </div>
      </div>
    {:else}
      <div class="flex flex-col items-center" in:fade={{ duration: 300 }}>
        <p class="text-gray-700 mb-4 text-center">Scan this QR code with your other device</p>
        <canvas id="qrcode" class="mb-6 rounded-md shadow-md mx-auto"></canvas>
        <p class="text-gray-600 text-sm mb-2">Device name: <span class="font-medium">{deviceName}</span></p>
      </div>
    {/if}
    
    <div class="mt-6 pt-6 border-t border-gray-200 text-center w-full">
      <p class="text-gray-600 mb-2">Trying to scan a QR code?</p>
      <a href="/scan" class="text-blue-600 hover:text-blue-800 font-medium">Scan Code →</a>
    </div>
  {/if}
</div>

<style>
  #qrcode {
    width: 256px;
    height: 256px;
  }
  
  .perspective-500 {
    perspective: 500px;
  }
</style>
