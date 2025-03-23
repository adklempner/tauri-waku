<script lang="ts">
  import { scan, Format, cancel } from "@tauri-apps/plugin-barcode-scanner";
  import { fade } from "svelte/transition";
  import { MonitorSmartphone, Scan } from "@lucide/svelte";
  import { createEventDispatcher } from "svelte";
  import { onMount, onDestroy } from "svelte";
  
  const dispatch = createEventDispatcher<{
    scanSuccess: string;
  }>();
  
  let scanning = $state(false);
  
  // Update body class when scanning state changes
  $effect(() => {
    if (scanning) {
      document.body.classList.add('scanning-active');
    } else {
      document.body.classList.remove('scanning-active');
    }
  });
  
  // Clean up on component destroy
  onDestroy(() => {
    document.body.classList.remove('scanning-active');
  });
  
  async function startScan() {
    scanning = true;
    try {
      setTimeout(async () => {
        await cancel();
      }, 20000);
      const scanned = await scan({ cameraDirection: "back", windowed: true, formats: [Format.QRCode] });
      scanning = false;
      dispatch('scanSuccess', scanned.content);
    } catch (error) {
      console.error("Scanning error:", error);
    } finally {
      await cancel();
      scanning = false;
    }
  }
</script>

<style>
  :global(body.scanning-active) {
    background-color: transparent !important;
  }
  
  :global(body.scanning-active *) {
    opacity: 0 !important;
    visibility: hidden !important;
    background-color: transparent !important;
  }
  
  /* Exception for any camera view elements the scanner might add */
  :global(body.scanning-active video),
  :global(body.scanning-active canvas),
  :global(body.scanning-active [data-tauri-scanner]) {
    opacity: 1 !important;
    visibility: visible !important;
  }
</style>

<div class="w-full mb-8 space-y-6 {scanning ? 'opacity-0 invisible' : ''}" in:fade={{ duration: 300 }}>
  <div class="flex justify-center">
    <div class="w-36 h-24 overflow-hidden flex items-center justify-center">
      <MonitorSmartphone stroke-width={0.75} color="rgb(31 41 55)" size={100} absoluteStrokeWidth={true} />
      <Scan stroke-width={1} color="rgb(31 41 55)" size={90} absoluteStrokeWidth={true} />
    </div>
  </div>
  
  <div class="space-y-4 mt-6">
    <button 
      onclick={startScan}
      class="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-sm transition-colors duration-200 flex items-center justify-center"
      disabled={scanning}
    >
      {scanning ? 'Scanning...' : 'Start Scanning'}
    </button>
  </div>
</div>
