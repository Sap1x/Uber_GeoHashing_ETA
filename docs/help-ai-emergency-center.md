# Help AI Emergency Center (prototype)

This rider safety feature is available from the **Help AI · SOS** button on the ride dashboard, including before a ride is assigned.

## Incident types covered

- **Unexpected long stop:** stationary for an unusual period, detected only from a rider's manual report in this version.
- **Unexpected route / refusal to stop:** deviation, unexpected destination, or driver refusing to stop.
- **Threat / harassment:** threats, harassment, assault, feeling unsafe.
- **Collision / crash:** road collision, impact or vehicle fire.
- **Medical emergency:** severe symptoms or an injured passenger.
- **Vehicle breakdown:** tyre, engine or other mechanical failures.

These are **practical safety scenarios**, not a ranking of incidence frequency. Uber's RideCheck documentation discusses unexpected stops, route deviations and possible crashes; public reporting does not establish one universal “most common” incident across all rideshare regions.

## How this is implemented

- Runs **entirely in the browser** with a small multinomial Naive Bayes text classifier trained at runtime from *illustrative phrases*, plus deterministic keyword overrides for serious threats, medical symptoms and collisions.
- Every scenario also has an explicit selection button; users can override a text suggestion at any time.
- Immediate call links for **US 911** and **India 112** are always visible, regardless of classifier result. The rider must choose the correct country and tap a link to open their device dialer.
- Browser geolocation is requested **only** when the rider presses “Add my GPS.” It is retained in this component's memory only while the panel is open.
- The rider must press “Share / copy details” to open the native share sheet or copy a message. The app does not automatically share personal information, contact emergency services, or notify trusted contacts.
- When precise location permission is denied, the message explicitly labels the existing app pickup coordinates as **NOT live GPS**.
- No backend calls, third-party AI API keys, external language model, or persistence are required for this prototype.

### Privacy, safety, and limitations

**This prototype is not a monitored emergency service.** The example-trained classifier is **not validated on real incidents**, its confidence is not calibrated, and it cannot reliably recognize every description or language. Advice is intentionally short and directs people to qualified emergency responders when appropriate. Its output must never determine whether the user can access emergency assistance.

No GPS-only crash detection, trip-trajectory monitoring, real-time driver stop detection, emergency responder integration, automatic alert delivery, trusted-contact directory, or incident-report backend is implemented.

The existing dashboard uses a demonstration pickup location and mock trip details. Neither should be represented as the rider's live location or verified booking information. App emergency numbers cover only the US and India; elsewhere riders should use their local emergency number.

Production follow-ups: integrate with an authenticated and durable trip state machine; store user-approved emergency contacts securely; provide explicit consent/auditing; implement accessible focus trapping; rate-limit incident APIs; add geofenced route checks based on validated road routes; evaluate classification quality with representative, consented and anonymized data.

## Testing

From the repository root, with Node.js 18 or newer:

```bash
node --test tests/emergency-triage.test.mjs
```

The tests cover six incident options, high-priority keyword routing, manual overrides, uncertain-input fallback, and GPS consent boundaries in share-message construction.

**This test suite does not establish production safety, classification accuracy, or end-to-end app reliability.** The pre-existing Java backend also has separate compilation and integration blockers documented in the architecture audit.

## References

- Uber RideCheck India: https://www.uber.com/in/en/newsroom/ridecheck-india/
- Uber safety: https://www.uber.com/us/en/ride/safety/
- US emergency dialing: https://www.911.gov/calling-911/
- India 112 ERSS: https://www.mha.gov.in/emergency-response-support-system-erss
