<script lang="ts">
  import { LineChart, ScaleTypes } from "@carbon/charts-svelte";
  import "@carbon/charts-svelte/styles.css";

  let {
    ramUsageChartData,
  }: { ramUsageChartData: { group: string; date: string; value: number }[] } =
    $props();

  import { scaleLinear, scaleTime } from "d3-scale";
  import { extent } from "d3-array";
  
  let memoryUsagePoints = $derived(processMemoryPoints());
  let swapUsagePoints = $derived(processSwapPoints());
  let yTicks = $derived([0, 20, 40, 60, 80, 100]);
  
  let minY = $derived(0);
  let maxY = $derived(100);
  
  // Process timestamps and scales from the computed points
  let { xTicks, minX, maxX } = $derived(processScales(memoryUsagePoints, swapUsagePoints));
  
  function processMemoryPoints() {
    if (!ramUsageChartData || ramUsageChartData.length === 0) return [];
    
    // Group data by timestamp
    const groupedByTimestamp = ramUsageChartData.reduce((acc, item) => {
      const date = new Date(item.date).getTime();
      if (!acc[date]) {
        acc[date] = { timestamp: date, date: new Date(item.date) };
      }
      acc[date][item.group] = item.value;
      return acc;
    }, {} as Record<number, {timestamp: number, date: Date, [key: string]: any}>);
    
    // Calculate percentages and create points
    const memoryPercentPoints: {x: Date, y: number}[] = [];
    
    Object.values(groupedByTimestamp).forEach(point => {
      if (point["Used Memory"] !== undefined && point["Total Memory"] !== undefined && point["Total Memory"] > 0) {
        memoryPercentPoints.push({
          x: point.date,
          y: (point["Used Memory"] / point["Total Memory"]) * 100
        });
      }
    });
    
    // Sort points by timestamp
    return memoryPercentPoints.sort((a, b) => a.x.getTime() - b.x.getTime());
  }
  
  function processSwapPoints() {
    if (!ramUsageChartData || ramUsageChartData.length === 0) return [];
    
    // Group data by timestamp
    const groupedByTimestamp = ramUsageChartData.reduce((acc, item) => {
      const date = new Date(item.date).getTime();
      if (!acc[date]) {
        acc[date] = { timestamp: date, date: new Date(item.date) };
      }
      acc[date][item.group] = item.value;
      return acc;
    }, {} as Record<number, {timestamp: number, date: Date, [key: string]: any}>);
    
    // Calculate percentages and create points
    const swapPercentPoints: {x: Date, y: number}[] = [];
    
    Object.values(groupedByTimestamp).forEach(point => {
      if (point["Used Swap"] !== undefined && point["Total Swap"] !== undefined && point["Total Swap"] > 0) {
        swapPercentPoints.push({
          x: point.date,
          y: (point["Used Swap"] / point["Total Swap"]) * 100
        });
      }
    });
    
    // Sort points by timestamp
    return swapPercentPoints.sort((a, b) => a.x.getTime() - b.x.getTime());
  }
  
  function processScales(memPoints: {x: Date, y: number}[], swapPoints: {x: Date, y: number}[]) {
    const allPoints = [...memPoints, ...swapPoints];
    if (allPoints.length === 0) {
      return {
        xTicks: [] as Date[],
        minX: null as Date | null,
        maxX: null as Date | null
      };
    }
    
    const xExtent = extent(allPoints, d => d.x) as [Date, Date];
    
    let minX: Date | null = null;
    let maxX: Date | null = null;
    
    if (xExtent[0] && xExtent[1]) {
      minX = xExtent[0];
      maxX = xExtent[1];
    }
    
    // Generate x-axis ticks (timestamps)
    let xTicks: Date[] = [];
    if (minX && maxX) {
      const timeRange = maxX.getTime() - minX.getTime();
      // Reduce number of ticks from 5 to 3 for less clutter
      const tickCount = Math.min(3, allPoints.length);
      if (tickCount > 1) {
        xTicks = Array.from({ length: tickCount }, (_, i) => {
          const time = minX!.getTime() + (i * timeRange / (tickCount - 1));
          return new Date(time);
        });
      } else if (allPoints.length > 0) {
        xTicks = [minX];
      }
    }
    
    return { xTicks, minX, maxX };
  }

  const padding = { top: 20, right: 40, bottom: 40, left: 60 };

  let width = $state(500);
  let height = $state(300);

  function formatTime(date: Date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  function formatDate(date: Date) {
    return date.toLocaleDateString();
  }
  
  function formatPercentage(value: number) {
    return `${value.toFixed(0)}%`;
  }

  let xScale = $derived(
    minX && maxX ? 
    scaleTime()
      .domain([minX, maxX])
      .range([padding.left, width - padding.right]) :
    null
  );
  
  let yScale = $derived(
    scaleLinear()
      .domain([minY, maxY])
      .range([height - padding.bottom, padding.top])
  );
  
  let memoryUsagePath = $derived(
    xScale && memoryUsagePoints.length > 0 ? 
    `M${memoryUsagePoints.map(p => `${xScale(p.x)},${yScale(p.y)}`).join("L")}` :
    ""
  );
  
  let swapUsagePath = $derived(
    xScale && swapUsagePoints.length > 0 ? 
    `M${swapUsagePoints.map(p => `${xScale(p.x)},${yScale(p.y)}`).join("L")}` :
    ""
  );
  
  let memoryUsageArea = $derived(
    xScale && memoryUsagePoints.length > 0 && minX && maxX ? 
    `${memoryUsagePath}L${xScale(maxX)},${yScale(0)}L${xScale(minX)},${yScale(0)}Z` :
    ""
  );
  
  let swapUsageArea = $derived(
    xScale && swapUsagePoints.length > 0 && minX && maxX ? 
    `${swapUsagePath}L${xScale(maxX)},${yScale(0)}L${xScale(minX)},${yScale(0)}Z` :
    ""
  );
</script>

<h2>Memory Usage</h2>

<div class="chart" bind:clientWidth={width} bind:clientHeight={height}>
  <svg>
    <!-- y axis -->
    <g class="axis y-axis">
      {#each yTicks as tick}
        <g
          class="tick tick-{tick}"
          transform="translate(0, {yScale(tick)})"
        >
          <line x1={padding.left} x2="100%" />
          <text x={padding.left - 5} y="4" text-anchor="end">{formatPercentage(tick)}</text>
        </g>
      {/each}
    </g>

    <!-- x axis -->
    <g class="axis x-axis">
      {#each xTicks as tick}
        <g
          class="tick"
          transform="translate({xScale ? xScale(tick) : 0},{height - padding.bottom})"
        >
          <line y1="0" y2="-{height - padding.top - padding.bottom}" />
          <text y="20" text-anchor="middle">{formatTime(tick)}</text>
        </g>
      {/each}
    </g>

    <!-- data areas and lines -->
    {#if memoryUsageArea}
      <path class="path-area memory-usage-area" d={memoryUsageArea} />
    {/if}
    {#if swapUsageArea}
      <path class="path-area swap-usage-area" d={swapUsageArea} />
    {/if}
    {#if memoryUsagePath}
      <path class="path-line memory-usage" d={memoryUsagePath} />
    {/if}
    {#if swapUsagePath}
      <path class="path-line swap-usage" d={swapUsagePath} />
    {/if}

    <!-- x-axis label -->
    <text 
      x={width / 2} 
      y={height - 5} 
      text-anchor="middle" 
      class="axis-label">Time</text>
  </svg>
</div>

<div class="legend">
  <div class="legend-item">
    <span class="legend-color memory-usage-color"></span>
    <span>Memory Usage</span>
  </div>
  <div class="legend-item">
    <span class="legend-color swap-usage-color"></span>
    <span>Swap Usage</span>
  </div>
</div>

<style>
  .chart,
  h2 {
    width: 100%;
    max-width: 700px;
    margin-left: auto;
    margin-right: auto;
  }

  svg {
    position: relative;
    width: 100%;
    height: 300px;
    overflow: visible;
  }

  .tick {
    font-size: 0.825em;
    font-weight: 400;
  }

  .tick line {
    stroke: #ddd;
    stroke-dasharray: 2;
  }

  .tick text {
    fill: #666;
  }

  .tick.tick-0 line {
    stroke-dasharray: 0;
    stroke: #aaa;
  }

  .axis-label {
    font-size: 0.9em;
    fill: #666;
    font-weight: 500;
  }

  .path-line {
    fill: none;
    stroke-linejoin: round;
    stroke-linecap: round;
    stroke-width: 2;
  }

  .memory-usage {
    stroke: #0062ff;
  }

  .swap-usage {
    stroke: #ff6200;
  }

  .path-area {
    opacity: 0.2;
  }

  .memory-usage-area {
    fill: #0062ff;
  }

  .swap-usage-area {
    fill: #ff6200;
  }

  .legend {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 15px;
    margin: 10px auto;
    max-width: 700px;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 0.825em;
  }

  .legend-color {
    display: inline-block;
    width: 15px;
    height: 3px;
  }

  .memory-usage-color {
    background-color: #0062ff;
  }

  .swap-usage-color {
    background-color: #ff6200;
  }
</style>
