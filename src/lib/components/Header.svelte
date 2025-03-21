<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { connectionState } from "../waku.svelte";
  import { HealthStatus } from "@waku/sdk";
  import ConnectionButton from "./ConnectionButton.svelte";
  import { health } from "../waku.svelte";
  import { page } from '$app/state';

  let healthStatus = $state(HealthStatus.Unhealthy);
  let healthCheckInterval: NodeJS.Timeout | undefined;

  function startHealthCheck() {
    healthStatus = health();
    healthCheckInterval = setInterval(() => {
      healthStatus = health();
    }, 2000);
  }

  function stopHealthCheck() {
    if (healthCheckInterval) {
      clearInterval(healthCheckInterval);
      healthCheckInterval = undefined;
    }
  }

  $effect(() => {
    if ($connectionState.status === "connected") {
      startHealthCheck();
    } else {
      stopHealthCheck();
    }
  });

  onMount(() => {
    if ($connectionState.status === "connected") {
      startHealthCheck();
    }
  });

  onDestroy(() => {
    stopHealthCheck();
  });

  function getHealthColor(status: HealthStatus) {
    if ($connectionState.status !== "connected") {
      return "gray";
    }
    switch (status) {
      case HealthStatus.SufficientlyHealthy:
        return "green";
      case HealthStatus.MinimallyHealthy:
        return "goldenrod";
      case HealthStatus.Unhealthy:
      default:
        return "red";
    }
  }

  function getHealthText(status: HealthStatus) {
    if ($connectionState.status !== "connected") {
      return "Node is not connected";
    }
    switch (status) {
      case HealthStatus.SufficientlyHealthy:
        return "Node is healthy";
      case HealthStatus.MinimallyHealthy:
        return "Node is minimally healthy";
      case HealthStatus.Unhealthy:
      default:
        return "Node is unhealthy";
    }
  }
  $effect(() => {
    console.log("heaeder: " + page.url.pathname);
  });
</script>

<div class="status-container">
  <div class="connection-status">
    <div class="status-wrapper">
      <div
        class="health-indicator"
        style="background-color: {getHealthColor(healthStatus)}"
      >
        <span class="tooltip">{getHealthText(healthStatus)}</span>
      </div>
    </div>
  </div>
</div>

<style>
  .status-container {
    position: fixed;
    top: 1rem;
    right: 1rem;
    z-index: 50;
  }

  .connection-status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .status-wrapper {
    position: relative;
    margin-right: 1rem;
  }

  .health-indicator {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    transition: background-color 0.3s ease;
    cursor: help;
    position: relative;
  }

  .tooltip {
    visibility: hidden;
    position: absolute;
    background-color: #333;
    color: white;
    text-align: center;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.75rem;
    white-space: nowrap;
    
    /* Position the tooltip below */
    top: 100%;
    right: 0;  /* Align to the right instead of center since we're near screen edge */
    transform: translateX(0);  /* Remove horizontal centering */
    margin-top: 8px;
    
    /* Ensure tooltip stays in viewport */
    max-width: calc(100vw - 2rem);  /* Leave 1rem padding on each side */
    overflow: hidden;
    text-overflow: ellipsis;
    
    /* Add a small triangle pointer */
    &::before {
      content: "";
      position: absolute;
      bottom: 100%;
      right: 2px;  /* Align arrow with the indicator */
      transform: translateX(0);
      border-width: 4px;
      border-style: solid;
      border-color: transparent transparent #333 transparent;
    }
  }

  /* Add animation for smooth appearance */
  .health-indicator:hover .tooltip {
    visibility: visible;
    animation: fadeIn 0.2s ease-in-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
</style>
