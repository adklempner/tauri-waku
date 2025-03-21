<script lang="ts">
	import '../../app.css';
	import ScanCode from '$lib/components/ScanCode.svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import CallToAction from '$lib/components/CallToAction.svelte';
</script>

<PageLayout title="Scan Code" maxWidth="md">
	<ScanCode />
	<CallToAction
		message="Want to return to your devices?"
		linkText="View Devices"
		linkHref="/devices"
	/>
</PageLayout>
