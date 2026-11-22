"use client"

import * as React from "react"
import { AlertTriangle, Check, ClipboardCopy, LocateFixed, MapPinned, Phone, Share2, ShieldAlert, Sparkles, X } from "lucide-react"
import { EMERGENCY_SCENARIOS, buildEmergencyShareMessage, triageEmergency } from "@/lib/emergency-triage.mjs"
import type { EmergencySelection, EmergencyLocation } from "@/lib/emergency-triage.mjs"

type Props = {
  city: string
  bookingId?: number | null
  driverName?: string | null
  pickupLocation?: { lat: number; lng: number } | null
}

/**
 * Client-only assistance panel. It never dials, tracks, uploads, or notifies on its own.
 * The offline text classifier gives suggestions, not a dispatch or medical diagnosis.
 */
export function EmergencyAssistant({ city, bookingId, driverName, pickupLocation }: Props) {
  const [open, setOpen] = React.useState(false)
  const [description, setDescription] = React.useState("")
  const [selected, setSelected] = React.useState<EmergencySelection>("auto")
  const [location, setLocation] = React.useState<EmergencyLocation | null>(null)
  const [locating, setLocating] = React.useState(false)
  const [locationStatus, setLocationStatus] = React.useState("")
  const [shareStatus, setShareStatus] = React.useState("")
  const [manualCopy, setManualCopy] = React.useState("")
  const closeButton = React.useRef<HTMLButtonElement>(null)
  const launchButton = React.useRef<HTMLButtonElement>(null)
  const locationRequestId = React.useRef(0)

  const advice = React.useMemo(() => triageEmergency(description, selected), [description, selected])

  const close = React.useCallback(() => {
    setOpen(false)
    setDescription("")
    setSelected("auto")
    locationRequestId.current += 1
    setLocation(null)
    setLocating(false)
    setLocationStatus("")
    setShareStatus("")
    setManualCopy("")
    // Clear precise location from component state when the panel closes.
    launchButton.current?.focus()
  }, [])

  React.useEffect(() => {
    if (!open) return
    closeButton.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [open, close])

  function requestLocation() {
    if (!navigator.geolocation) {
      setLocationStatus("Location is unavailable on this device. You can still share trip details.")
      return
    }
    const requestId = ++locationRequestId.current
    setLocating(true)
    setLocationStatus("Requesting your permission for a one-time location fix…")
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (requestId !== locationRequestId.current) return
        setLocation({ latitude: coords.latitude, longitude: coords.longitude })
        setLocating(false)
        setLocationStatus("Current GPS added to your share preview. It has not been sent to anyone.")
      },
      () => {
        if (requestId !== locationRequestId.current) return
        setLocating(false)
        setLocationStatus("Location was denied or unavailable. No GPS will be included.")
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 },
    )
  }

  async function shareRideDetails() {
    const message = buildEmergencyShareMessage({
      city, bookingId, driverName, position: location, pickupLocation,
    })
    setManualCopy("")
    setShareStatus("")
    // Both the native share sheet and clipboard require a direct user action.
    if (navigator.share) {
      try {
        await navigator.share({ title: "Ride safety check-in", text: message })
        setShareStatus("Share action completed. Recipients are chosen by you.")
        return
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          setShareStatus("Sharing cancelled. No automatic alert was sent.")
          return
        }
      }
    }
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(message)
        setShareStatus("Ride details copied. Paste them to a trusted contact.")
        return
      } catch { /* Provide the copyable text below when clipboard access fails. */ }
    }
    setManualCopy(message)
    setShareStatus("Copy the text below and send it yourself. Nothing was automatically sent.")
  }

  return (
    <>
      <button
        ref={launchButton}
        type="button"
        onClick={() => setOpen(true)}
        className="absolute right-4 top-4 z-30 inline-flex items-center gap-2 rounded-xl bg-rose-600 px-3 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-rose-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500"
        aria-label="Open Help AI emergency assistance"
      >
        <ShieldAlert className="h-4 w-4" aria-hidden="true" />
        Help AI · SOS
      </button>

      {open && (
        <section
          className="absolute inset-0 z-50 flex flex-col bg-slate-50 text-slate-900"
          role="dialog"
          aria-modal="true"
          aria-labelledby="emergency-heading"
        >
          <header className="shrink-0 border-b border-rose-100 bg-white px-5 pb-4 pt-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-rose-700">
                  <ShieldAlert className="h-4 w-4" aria-hidden="true" /> Rider safety
                </p>
                <h2 id="emergency-heading" className="mt-1 text-xl font-bold">Help AI Emergency Center</h2>
                <p className="mt-1 text-xs text-slate-600">Immediate assistance comes first. AI suggestions never block calling for help.</p>
              </div>
              <button
                ref={closeButton}
                type="button"
                onClick={close}
                className="rounded-lg border border-slate-200 p-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500"
                aria-label="Close emergency assistance"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </header>

          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5">
            <section className="rounded-2xl border border-rose-200 bg-rose-50 p-4" aria-labelledby="call-heading">
              <h3 id="call-heading" className="flex items-center gap-2 font-bold text-rose-950">
                <AlertTriangle className="h-5 w-5" aria-hidden="true" />
                In immediate danger? Call now.
              </h3>
              <p className="mt-1 text-xs text-rose-900">Choose the country you are physically in. Calling requires your tap and your device's dialer.</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <a href="tel:911" className="flex items-center justify-center gap-2 rounded-xl bg-rose-700 px-3 py-3 font-bold text-white shadow-sm hover:bg-rose-800">
                  <Phone className="h-4 w-4" aria-hidden="true" /> USA · 911
                </a>
                <a href="tel:112" className="flex items-center justify-center gap-2 rounded-xl bg-rose-700 px-3 py-3 font-bold text-white shadow-sm hover:bg-rose-800">
                  <Phone className="h-4 w-4" aria-hidden="true" /> India · 112
                </a>
              </div>
              <p className="mt-2 text-xs text-rose-950">Elsewhere: dial your local emergency number. This app does not contact dispatchers automatically.</p>
            </section>

            <section aria-labelledby="triage-heading">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-700" aria-hidden="true" />
                <h3 id="triage-heading" className="font-bold">Describe what happened</h3>
              </div>
              <p className="mt-1 text-xs text-slate-600">Optional on-device text triage, trained on a small set of example phrases; not a verified emergency classifier.</p>
              <label htmlFor="emergency-description" className="sr-only">Describe your emergency</label>
              <textarea
                id="emergency-description"
                rows={3}
                maxLength={700}
                value={description}
                onChange={event => setDescription(event.target.value)}
                placeholder="e.g. The driver has stopped for several minutes and I feel unsafe"
                className="mt-3 w-full resize-none rounded-xl border border-slate-300 bg-white p-3 text-sm outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200"
              />
              <p className="mt-2 text-xs font-semibold text-slate-700">Or choose a situation (overrides text suggestions):</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {EMERGENCY_SCENARIOS.map(scenario => (
                  <button
                    key={scenario.id}
                    type="button"
                    aria-pressed={selected === scenario.id}
                    onClick={() => setSelected(selected === scenario.id ? "auto" : scenario.id)}
                    className={`rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${selected === scenario.id ? "border-indigo-600 bg-indigo-50 text-indigo-900" : "border-slate-200 bg-white hover:border-indigo-300"}`}
                  >
                    {scenario.label}
                  </button>
                ))}
              </div>
              {selected !== "auto" && (
                <button type="button" className="mt-2 text-xs font-semibold text-indigo-700 underline" onClick={() => setSelected("auto")}>
                  Use text recognition instead
                </button>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4" aria-labelledby="guidance-heading" aria-live="polite">
              <div className="flex items-center justify-between gap-2">
                <h3 id="guidance-heading" className="text-base font-bold">{advice.title}</h3>
                {advice.source === "selected" && <span className="rounded-full bg-indigo-100 px-2 py-1 text-xs text-indigo-800">Selected by you</span>}
                {advice.source === "unknown" && <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">General guidance</span>}
                {(advice.source === "keyword" || advice.source === "example-nlp") && <span className="rounded-full bg-indigo-100 px-2 py-1 text-xs text-indigo-800">Text suggestion</span>}
              </div>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-slate-700">
                {advice.actions.map(action => <li key={action}>{action}</li>)}
              </ol>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4" aria-labelledby="location-heading">
              <h3 id="location-heading" className="flex items-center gap-2 font-bold">
                <MapPinned className="h-4 w-4 text-indigo-700" aria-hidden="true" /> Share safety check-in
              </h3>
              <p className="mt-1 text-xs text-slate-600">Location is requested only with your permission. Trip and GPS details stay on this device until you choose to share.</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button type="button" disabled={locating} onClick={requestLocation}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-2 py-3 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50">
                  <LocateFixed className="h-4 w-4" aria-hidden="true" /> {locating ? "Locating…" : "Add my GPS"}
                </button>
                <button type="button" onClick={shareRideDetails}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-2 py-3 text-xs font-semibold text-white hover:bg-slate-800">
                  <Share2 className="h-4 w-4" aria-hidden="true" /> Share / copy details
                </button>
              </div>
              {location && <p className="mt-2 flex items-center gap-1 text-xs text-emerald-800"><Check className="h-3.5 w-3.5" aria-hidden="true" /> GPS included for this share: {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}</p>}
              {locationStatus && <p className="mt-2 text-xs text-slate-700" role="status">{locationStatus}</p>}
              {shareStatus && <p className="mt-2 text-xs text-slate-700" role="status">{shareStatus}</p>}
              {manualCopy && (
                <div className="mt-3">
                  <label htmlFor="emergency-copy" className="flex items-center gap-1 text-xs font-semibold"><ClipboardCopy className="h-4 w-4" aria-hidden="true" /> Manually copy this text</label>
                  <textarea id="emergency-copy" readOnly value={manualCopy} rows={6} className="mt-2 w-full rounded-lg border border-slate-300 bg-slate-50 p-2 text-xs" />
                </div>
              )}
            </section>

            <p className="text-xs leading-relaxed text-slate-600">
              Prototype safety aid — not connected to any emergency response provider. No incident reports, automatic crash detection, live route deviation monitoring, or automatic alerts are implemented.
            </p>
          </div>
        </section>
      )}
    </>
  )
}
