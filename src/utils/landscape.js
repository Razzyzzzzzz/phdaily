// Phone lang: fullscreen + i-lock sa landscape. Tahimik na pumapalya kung hindi supported (hal. iPhone Safari).
const isPhone = () =>
  window.matchMedia('(pointer: coarse)').matches && window.matchMedia('(max-width: 1024px)').matches

export async function enterLandscape() {
  try {
    const el = document.documentElement
    if (!document.fullscreenElement && el.requestFullscreen) await el.requestFullscreen({ navigationUI: 'hide' })
  } catch { /* ignore */ }
  try {
    await screen.orientation?.lock?.('landscape')
  } catch { /* ignore */ }
}

export function autoLandscape() {
  if (isPhone()) enterLandscape()
}