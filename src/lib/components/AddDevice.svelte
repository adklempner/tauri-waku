<script lang="ts">
  import QRious from "qrious";
  import { tokenStore } from "$lib/credential/TokenStore";
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";
  import { MonitorSmartphone, Unplug } from "@lucide/svelte";
  import { wakuConnection } from "$lib/connectionUtils";
  import WakuAwareButton from "./WakuAwareButton.svelte";
  import CallToAction from "./CallToAction.svelte";
  
  const { publicKeyBase64: propPublicKey = undefined } = $props<{ publicKeyBase64?: string }>();
  
  let storeReady = $state(false);
  let challengeReady = $state(false);
  let deviceName = $state("my-device");
  let localPublicKey = $state(propPublicKey);
  
  onMount(async () => {
    tokenStore.ready.subscribe(async (ready) => {
      if (!ready) {
        console.log("Database not ready");
        return;
      }
      storeReady = true;
    });

    // If publicKeyBase64 is provided as a prop, show QR code immediately
    if (localPublicKey) {
      challengeReady = true;
      setTimeout(generateQRCode, 0);
    }
  });

  function generateQRCode() {
    const qr = new QRious({
      element: document.getElementById("qrcode") as HTMLCanvasElement,
      size: 256,
      background: "#ffffff",
      foreground: "#000000",
      value: localPublicKey as string,
    });
    
    // Add public key as data attribute for pairing verification
    const qrElement = document.getElementById("qrcode");
    if (qrElement) {
      qrElement.setAttribute('data-public-key', localPublicKey as string);
    }
    
    console.log(qr);
  }

  async function handleAddDevice() {
    // Only get a new key if one wasn't provided as a prop
    if (!localPublicKey) {
      localPublicKey = await tokenStore.startPairing();
    }
    
    // First set challengeReady to true so the canvas element gets rendered
    challengeReady = true;
    
    // Wait for the next tick to ensure DOM is updated
    setTimeout(generateQRCode, 0);
  }
</script>

<div>
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
          <WakuAwareButton
            onClick={handleAddDevice}
            label="Add Device"
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
          />
          {#if !$wakuConnection.isConnected}
            <p class="text-amber-600 text-sm text-center">
              {$wakuConnection.isConnecting ? 'Connecting to Waku network...' : 'Waku node is not connected'}
            </p>
          {/if}
        </div>
      </div>
    {:else}
      <div class="text-center mb-4" in:fade={{ duration: 300 }}>
        <p class="text-gray-700 mb-4 text-center">Scan this QR code with your other device</p>
        <canvas id="qrcode" class="mb-6 rounded-md shadow-md mx-auto"></canvas>
        <p class="text-gray-600 text-sm mb-2">Device name: <span class="font-medium">{deviceName}</span></p>
      </div>
    {/if}
    
    <CallToAction 
      message="Trying to scan a QR code?" 
      linkText="Scan Code" 
      linkHref="/scan" 
    />
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
