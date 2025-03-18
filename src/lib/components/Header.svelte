<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { connectionState } from '../waku.svelte';
    import { HealthStatus } from '@waku/sdk';
    import ConnectionButton from './ConnectionButton.svelte';
  
    // Import the health function
    import { health } from '../waku.svelte';
  
    let healthStatus = $state(HealthStatus.Unhealthy);
    let healthCheckInterval: NodeJS.Timeout | undefined;
  
    function startHealthCheck() {
      // Check immediately
      healthStatus = health();
      
      // Set up interval to check health status every 2 seconds
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
      // Start or stop health check based on connection state
      if (connectionState.status === 'connected') {
        startHealthCheck();
      } else {
        stopHealthCheck();
      }
    });
  
    onMount(() => {
      // If already connected when component mounts, start health check
      if (connectionState.status === 'connected') {
        startHealthCheck();
      }
    });
  
    onDestroy(() => {
      // Clean up interval when component is destroyed
      stopHealthCheck();
    });
  
    function getHealthColor(status: HealthStatus) {
      switch(status) {
        case HealthStatus.SufficientlyHealthy:
          return 'green';
        case HealthStatus.MinimallyHealthy:
          return 'yellow';
        case HealthStatus.Unhealthy:
        default:
          return 'red';
      }
    }
  </script>
  
  <header>
    <div class="header-container">
      <div class="logo">
        <h1>JS Waku in Desktop lol</h1>
      </div>
      <div class="connection-status">
        <ConnectionButton />
        {#if connectionState.status === 'connected'}
          <div class="health-indicator" style="background-color: {getHealthColor(healthStatus)}" title="Node Health Status"></div>
        {/if}
      </div>
    </div>
  </header>
  
  <style>
    header {
      background-color: #f5f5f5;
      padding: 1rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
  
    .header-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      max-width: 1200px;
      margin: 0 auto;
    }
  
    .logo h1 {
      margin: 0;
      font-size: 1.5rem;
      color: #333;
    }
  
    .connection-status {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
  
    .health-indicator {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      transition: background-color 0.3s ease;
    }
  </style> 