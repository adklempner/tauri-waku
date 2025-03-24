<script lang="ts">
  import {
    Html5QrcodeScanner,
    type Html5QrcodeResult,
    Html5QrcodeScannerState,
  } from "html5-qrcode";
  import { onMount, createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher<{
    scanSuccess: string;
  }>();

  let html5QrcodeScanner: Html5QrcodeScanner | null = $state(null);

  function onScanSuccess(
    decodedText: string,
    decodedResult: Html5QrcodeResult
  ) {
    console.log(`Code matched = ${decodedText}`, decodedResult);
    if (
      html5QrcodeScanner &&
      html5QrcodeScanner.getState() === Html5QrcodeScannerState.SCANNING
    ) {
      html5QrcodeScanner.pause();
    }
    dispatch("scanSuccess", decodedText);
  }

  function onScanFailure(error: string) {
    // handle scan failure, usually better to ignore and keep scanning.
    // for example:
    // console.warn(`Code scan error = ${error}`);
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
  <div id="reader"></div>
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
</style>
