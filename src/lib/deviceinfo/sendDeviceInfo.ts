import {
    allSysInfo,
    memoryInfo,
    staticInfo,
    cpuInfo,
    AllSystemInfo,
    StaticInfo,
    MemoryInfo,
    CpuInfo,
    batteries,
    Batteries,
  } from "tauri-plugin-system-info-api";
  import { tokenStore } from "$lib/credential/TokenStore";
import type { DeviceInfoMessage, RamUsage } from "$lib/waku/topics";
import { ramUsageProto, deviceInfoMessageProto, Topic } from "$lib/waku/topics";
import { encrypt } from "$lib/credential/Keys";
import { encodeBase64 } from "@oslojs/encoding";
import { wakuNode } from "$lib/waku.svelte";
  export async function getDeviceInfo() {
    console.log(await allSysInfo());
    console.log(await memoryInfo());
    console.log(await staticInfo());
    console.log(await cpuInfo());
    console.log(await batteries());
  }

  export async function sendRamUsage() {
    let _ramUsage: MemoryInfo | undefined;
    try {
      _ramUsage = await memoryInfo();
    } catch (error) {
      // This should fail on web and mobile as the tauri-system-info-plugin is only
      // compiled for desktop
      console.error("Error getting ram usage", error);
      return;
    }
    if (!_ramUsage) {
      console.error("No ram usage data");
      return;
    }
    const ramUsage: RamUsage = {
      total_memory: _ramUsage.total_memory,
      total_swap: _ramUsage.total_swap,
      used_memory: _ramUsage.used_memory,
      used_swap: _ramUsage.used_swap,
      timestamp: Date.now(),
    }
    const ramUsageEncoded = ramUsageProto.encode(ramUsage).finish();
    const devices = await tokenStore.getPairedDevices();
    for (const device of devices) {
      if (!device.sharedSecret) {
        console.log("No shared secret for device", device.publicKey);
        continue;
      }
      const {nonce, ciphertext} = encrypt(ramUsageEncoded, device.sharedSecret);
      const deviceInfoMessage: DeviceInfoMessage = {
        senderPublicKeyBase64: encodeBase64(device.publicKey),
        nonceBase64: encodeBase64(nonce),
        ciphertextBase64: encodeBase64(ciphertext),
      }

      const result = await wakuNode.send(Topic.DeviceInfo, deviceInfoMessage);
      console.log("Sent device info message to", device.publicKey);
      console.log(result);
    }
  }

let ramUsageInterval: number | null = null;
const RAM_USAGE_INTERVAL_MS = 20000; // Send RAM usage every 20 seconds

export function startPeriodicRamUsageMonitoring() {
  // Clear any existing interval first
  stopPeriodicRamUsageMonitoring();
  
  // Start a new monitoring interval
  ramUsageInterval = window.setInterval(() => {
    sendRamUsage();
  }, RAM_USAGE_INTERVAL_MS);
  
  // Do an initial send immediately
  sendRamUsage();
  
  console.log("Started periodic RAM usage monitoring");
}

export function stopPeriodicRamUsageMonitoring() {
  if (ramUsageInterval !== null) {
    window.clearInterval(ramUsageInterval);
    ramUsageInterval = null;
    console.log("Stopped periodic RAM usage monitoring");
  }
}
