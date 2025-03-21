<script lang="ts">
  import { Html5QrcodeScanner, type Html5QrcodeResult } from "html5-qrcode";
  import { onMount } from "svelte";
  import { tokenStore } from "$lib/credential/TokenStore";
  import { outbox } from "$lib/credential/Outbox";
  import { Topic, type DevicePairingMessage } from "$lib/waku/topics";
  import { wakuNode } from "$lib/waku.svelte";
  import { encodeBase64 } from "@oslojs/encoding";
  import { goto } from "$app/navigation";
  let devicePubKeyBase64: string | null = $state(null);
  let html5QrcodeScanner: Html5QrcodeScanner | null = $state(null);
  let isPairing: boolean = $state(false);

  function onScanSuccess(
    decodedText: string,
    decodedResult: Html5QrcodeResult
  ) {
    console.log(`Code matched = ${decodedText}`, decodedResult);
    devicePubKeyBase64 = decodedText;
    html5QrcodeScanner?.pause();
    pairNewDevice();
  }

  function onScanFailure(error: string) {
    // handle scan failure, usually better to ignore and keep scanning.
    // for example:
    // console.warn(`Code scan error = ${error}`);
  }

  async function pairNewDevice() {
    if (!devicePubKeyBase64) {
      return;
    }
    isPairing = true;
    const success = await tokenStore.pairNewDevice(devicePubKeyBase64);
    if (!success) {
      goto("/");
      return;
    }
    const {
      myKey,
      encryptedMessage: { nonce, ciphertext },
    } = await tokenStore.encryptMessageForDevice(
      devicePubKeyBase64,
      devicePubKeyBase64
    );
    // above needs to be added to outbox and sent over waku
    const ackId = await outbox.add(Topic.DevicePairing, {
      senderPublicKey: myKey,
      nonce,
      ciphertext,
    });
    const message: DevicePairingMessage = {
      senderPublicKeyBase64: encodeBase64(myKey),
      nonceBase64: encodeBase64(nonce),
      ciphertextBase64: encodeBase64(ciphertext),
      ackId,
      scannedPublicKeyBase64: devicePubKeyBase64,
    };
    await wakuNode.send(Topic.DevicePairing, message);
  }
  onMount(() => {
    html5QrcodeScanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );
    html5QrcodeScanner.render(onScanSuccess, onScanFailure);
  });
</script>

<div class="flex flex-col items-center">
  {#if !devicePubKeyBase64}
    <div id="reader"></div>
  {:else}
    <div class="flex flex-col items-center justify-center mt-4">
      <div class="w-32 h-32 overflow-hidden flex items-center justify-center perspective-500">
        <img 
          src="/waku-mark-primary-black.svg" 
          alt="Waku Logo" 
          class="w-full h-full transform scale-125 animate-spin-y" 
        />
      </div>
      <p class="text-gray-600 mt-4 text-lg font-medium">
        <span class="animate-dots">Pairing . . .</span>
      </p>
    </div>
  {/if}
</div>

<style>
  /* QR Scanner styling */
  :global(#reader) {
    border: none !important;
    border-radius: 0.5rem !important;
    padding: 0 !important;
    overflow: hidden !important;
    width: 100% !important;
    max-width: 400px !important;
  }

  :global(#reader__dashboard_section_csr) {
    padding: 1rem !important;
  }

  :global(#reader__dashboard_section) {
    padding: 0.75rem 0 !important;
  }

  :global(#html5-qrcode-select-camera) {
    margin: 0.5rem 0 !important;
    padding: 0.375rem 0.75rem !important;
    border: 1px solid #e5e7eb !important;
    border-radius: 0.375rem !important;
    background-color: white !important;
    font-size: 0.875rem !important;
  }

  :global(#html5-qrcode-button-camera-stop) {
    background-color: #ef4444 !important;
    color: white !important;
    border: none !important;
    padding: 0.5rem 1rem !important;
    border-radius: 0.375rem !important;
    font-weight: 500 !important;
    cursor: pointer !important;
    transition: background-color 0.2s !important;
  }

  :global(#html5-qrcode-button-camera-stop:hover) {
    background-color: #dc2626 !important;
  }

  :global(#html5-qrcode-button-camera-start) {
    background-color: #3b82f6 !important;
    color: white !important;
    border: none !important;
    padding: 0.5rem 1rem !important;
    border-radius: 0.375rem !important;
    font-weight: 500 !important;
    cursor: pointer !important;
    transition: background-color 0.2s !important;
  }

  :global(#html5-qrcode-button-camera-start:hover) {
    background-color: #2563eb !important;
  }

  :global(#html5-qrcode-anchor-scan-type-change) {
    text-decoration: none !important;
    color: #2563eb !important;
    font-weight: 500 !important;
    transition: color 0.2s !important;
  }

  :global(#html5-qrcode-anchor-scan-type-change:hover) {
    color: #1d4ed8 !important;
  }

  /* Image File Selection Styling */
  :global(#html5-qrcode-button-file-selection) {
    background-color: #3b82f6 !important;
    color: white !important;
    border: none !important;
    padding: 0.5rem 1rem !important;
    border-radius: 0.375rem !important;
    font-weight: 500 !important;
    cursor: pointer !important;
    transition: background-color 0.2s !important;
    margin-bottom: 0.75rem !important;
  }

  :global(#html5-qrcode-button-file-selection:hover) {
    background-color: #2563eb !important;
  }

  :global(#reader__file_selection) {
    border: 2px dashed #e5e7eb !important;
    border-radius: 0.5rem !important;
    padding: 1.5rem !important;
    margin-top: 1rem !important;
    width: 100% !important;
    max-width: 400px !important;
  }

  :global(#reader__file_selection div) {
    color: #6b7280 !important;
    font-size: 0.875rem !important;
    margin-top: 0.5rem !important;
  }

  :global(#qr-shaded-region) {
    border-color: rgba(0, 0, 0, 0.4) !important;
  }

  :global(#reader__scan_region) {
    min-height: 300px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
  }

  :global(#reader__scan_region video) {
    max-width: 100% !important;
    border-radius: 0.25rem !important;
  }
  
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
  
  @keyframes dotAnimation {
    0% { opacity: 0.3; }
    50% { opacity: 1; }
    100% { opacity: 0.3; }
  }
  
  .animate-dots {
    animation: dotAnimation 1.5s infinite ease-in-out;
    display: inline-block;
  }
  
  .animate-spin-y {
    animation: spin-y 10s infinite linear;
    transform-style: preserve-3d;
  }
</style>
