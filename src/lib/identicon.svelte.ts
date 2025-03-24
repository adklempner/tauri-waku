let Identicon: any = $state(null);

export async function loadIdenticon() {
  console.log("Loading identicon");
  const identiconModule = await import("identicon.js");
  Identicon = identiconModule.default;
  console.log("Identicon loaded", Identicon);
}

export async function getIdenticon() {
  if (!Identicon) {
    await loadIdenticon();
  }
  return Identicon;
}
