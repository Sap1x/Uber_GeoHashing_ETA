import test from "node:test";
import assert from "node:assert/strict";
import { triageEmergency, buildEmergencyShareMessage, EMERGENCY_SCENARIOS } from "../lib/emergency-triage.mjs";

test("all six rider emergency scenarios have a selectable quick action", () => {
  assert.deepEqual(EMERGENCY_SCENARIOS.map(s => s.id), [
    "stopped", "route", "threat", "collision", "medical", "breakdown"
  ]);
});

test("unexpected long stop is identified", () => {
  assert.equal(triageEmergency("The driver stopped for 10 minutes").category, "stopped");
});

test("unexpected route and refusal to stop are recognized", () => {
  assert.equal(triageEmergency("Driver won't stop, going the wrong way").category, "route");
});

test("threat overrides a lower-priority stop phrase", () => {
  assert.equal(triageEmergency("Driver stopped and is threatening me").category, "threat");
  assert.equal(triageEmergency("I feel unsafe inside the vehicle").category, "threat");
});

test("crash, urgent medical condition and breakdown each map to specific help", () => {
  assert.equal(triageEmergency("We crashed into another vehicle").category, "collision");
  assert.equal(triageEmergency("Passenger having chest pain").category, "medical");
  assert.equal(triageEmergency("Flat tire on the highway").category, "breakdown");
});

test("manual category overrides text and suggests the selected scenario", () => {
  const result = triageEmergency("vehicle broke down", "medical");
  assert.equal(result.category, "medical");
  assert.equal(result.source, "selected");
});

test("unknown/empty descriptions fall back to general safety guidance", () => {
  assert.equal(triageEmergency("").category, "other");
  assert.equal(triageEmergency("hello").source, "unknown");
  assert.match(triageEmergency("").actions[0], /emergency services/);
});

test("share message never labels the demo pickup as live GPS", () => {
  const text = buildEmergencyShareMessage({
    city: "San Francisco",
    bookingId: 43,
    pickupLocation: { lat: 37.7749, lng: -122.4194 },
  });
  assert.match(text, /Current GPS location not provided/);
  assert.match(text, /NOT live GPS/);
  assert.doesNotMatch(text, /Current GPS \(shared with my permission\):/);
});

test("precise GPS only appears when separately supplied by a caller", () => {
  const text = buildEmergencyShareMessage({
    position: { latitude: 22.572645, longitude: 88.363892 },
  });
  assert.match(text, /Current GPS \(shared with my permission\): 22\.572645, 88\.363892/);
  assert.match(text, /https:\/\/www\.google\.com\/maps\?q=22\.572645,88\.363892/);
  assert.doesNotMatch(text, /NOT live GPS/);
});
