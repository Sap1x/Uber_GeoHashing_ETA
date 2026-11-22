/**
 * Help AI: local, example-trained text triage with deterministic high-risk overrides.
 * Never uses a network request or makes a diagnosis/emergency dispatch decision.
 * Training examples are illustrative, not clinical or real-world incident data.
 */
export const EMERGENCY_SCENARIOS = Object.freeze([
  { id: "stopped", label: "Unexpected stop", hint: "The ride stopped or isn't moving" },
  { id: "route", label: "Unexpected route", hint: "Wrong direction or refusal to stop" },
  { id: "threat", label: "Threat or harassment", hint: "I feel threatened or unsafe" },
  { id: "collision", label: "Crash or collision", hint: "Road accident or impact" },
  { id: "medical", label: "Medical emergency", hint: "Someone needs urgent medical help" },
  { id: "breakdown", label: "Vehicle breakdown", hint: "Flat tyre or vehicle failure" },
]);

const GUIDANCE = Object.freeze({
  stopped: {
    title: "Unexpected stop",
    urgency: "caution",
    actions: [
      "Check whether the stop is due to traffic or another ordinary reason, if it is safe to do so.",
      "If you feel threatened or cannot leave safely, call local emergency services.",
      "Share your current location with a trusted person if doing so is safe."
    ]
  },
  route: {
    title: "Unexpected route or refusal to stop",
    urgency: "high",
    actions: [
      "If the route change makes you feel in danger, contact emergency services immediately.",
      "Avoid confrontation. Ask to stop in a public, well-lit place only if safe.",
      "Use the location-sharing control to inform someone you trust."
    ]
  },
  threat: {
    title: "Threat, harassment or assault",
    urgency: "high",
    actions: [
      "If you are in immediate danger, contact emergency services now.",
      "Avoid confronting the person; move toward a safe public location if possible.",
      "Share your location with someone you trust only when it is safe to do so."
    ]
  },
  collision: {
    title: "Crash or collision",
    urgency: "high",
    actions: [
      "Call emergency services if anyone is injured, trapped, or in immediate danger.",
      "Move out of traffic only when it is safe; do not put yourself at risk.",
      "Tell responders your exact location and follow their instructions."
    ]
  },
  medical: {
    title: "Medical emergency",
    urgency: "high",
    actions: [
      "For serious symptoms, trouble breathing, loss of consciousness, or chest pain, call emergency services immediately.",
      "Give the dispatcher your exact location and describe the symptoms.",
      "Follow the dispatcher's instructions; do not rely on this assistant for medical treatment."
    ]
  },
  breakdown: {
    title: "Vehicle breakdown",
    urgency: "caution",
    actions: [
      "If possible, remain clear of moving traffic; leave the vehicle only when safe.",
      "Contact roadside help or arrange another ride from a safe location.",
      "Call emergency services if the vehicle is in a dangerous position or anyone is hurt."
    ]
  },
  other: {
    title: "Safety assistance",
    urgency: "unknown",
    actions: [
      "If anyone is in immediate danger, call local emergency services without waiting for this assistant.",
      "Move to a safer location if possible and avoid confrontation.",
      "Share your location and trip details with a trusted person if safe."
    ]
  }
});

// High-risk triggers take precedence; the seed-trained model is only a fallback.
const KEYWORD_RULES = Object.freeze([
  ["threat", /\b(assault|attack(?:ed|ing)?|harass(?:ed|ment|ing)?|threat(?:en|ened|ening)?|kidnap(?:ped|ping)?|abduct(?:ed|ion)?|weapon|gun|knife|touch(?:ed|ing) me|feel unsafe|not safe|scared of (?:the )?driver)\b/i],
  ["medical", /\b(chest pain|heart attack|unconscious|faint(?:ed|ing)?|not breathing|can't breathe|cannot breathe|difficulty breathing|seizure|bleeding heavily|medical emergency|ambulance|stroke)\b/i],
  ["collision", /\b(crash(?:ed)?|collision|accident|hit another (?:car|vehicle)|ran into|rolled over|car is on fire|vehicle fire|smoke from car)\b/i],
  ["route", /\b(wrong (?:way|route|direction)|off[- ]route|route deviation|unplanned detour|won't stop|wont stop|refus(?:es|ed|ing) to stop|driving somewhere else|not following (?:the )?(?:route|destination))\b/i],
  ["stopped", /\b(unexpected stop|long stop|stopped for|not moving|not mov(?:ed|ing)|stuck in one place|standing still|driver stopped|ride is stopped)\b/i],
  ["breakdown", /\b(breakdown|broke down|broken down|flat (?:tyre|tire)|puncture|engine (?:failed|stopped|failure)|battery dead|vehicle failure|car won't start)\b/i]
]);

// Tiny offline multinomial Naive Bayes model trained from illustrative phrases.
// It never overrides explicit high-risk keyword matches or a rider's manual choice.
const EXAMPLES = {
  stopped: ["driver stopped for a long time", "car not moving for minutes", "unexpected stop on journey", "ride stationary near road", "waiting in the same spot"],
  route: ["driver going wrong direction", "not following destination", "going off route", "driver refuses to stop", "unusual detour from my trip"],
  threat: ["driver threatens me", "someone is harassing me", "I feel unsafe inside vehicle", "someone attacked me", "passenger acting aggressive"],
  collision: ["car crashed into truck", "road collision", "vehicle hit barrier", "traffic accident happened", "car on fire after crash"],
  medical: ["need ambulance urgently", "passenger having chest pain", "person fainted in vehicle", "someone cannot breathe", "person having seizure"],
  breakdown: ["vehicle broke down", "engine stopped working", "flat tyre on road", "car battery failed", "tire puncture during trip"]
};
const STOPWORDS = new Set(["a","an","the","my","me","i","we","is","in","on","for","to","and","at","with","of","it","our","someone","has","have","there","this","that"]);
const tokenize = text => (text.toLowerCase().match(/[a-z]+/g) ?? []).filter(word => !STOPWORDS.has(word));
const MODEL = (() => {
  const vocabulary = new Set(), counts = {}, totals = {}, docs = {};
  for (const [category, samples] of Object.entries(EXAMPLES)) {
    counts[category] = new Map();
    totals[category] = 0;
    docs[category] = samples.length;
    for (const sample of samples) {
      for (const word of tokenize(sample)) {
        vocabulary.add(word);
        counts[category].set(word, (counts[category].get(word) ?? 0) + 1);
        totals[category]++;
      }
    }
  }
  return { vocabulary, counts, totals, docs };
})();

function classifyExampleNlp(text) {
  const tokens = tokenize(text).filter(word => MODEL.vocabulary.has(word));
  if (tokens.length < 2) return null;
  let winner = null, best = -Infinity, second = -Infinity;
  const vocabularySize = MODEL.vocabulary.size;
  for (const category of Object.keys(EXAMPLES)) {
    const prior = Math.log(MODEL.docs[category] / 30);
    const score = tokens.reduce((sum, word) =>
      sum + Math.log(((MODEL.counts[category].get(word) ?? 0) + 1) /
        (MODEL.totals[category] + vocabularySize)), prior);
    if (score > best) { second = best; best = score; winner = category; }
    else if (score > second) second = score;
  }
  // This margin is a cautionary heuristic, not a calibrated confidence estimate.
  return winner && best - second >= 1.0 ? winner : null;
}

/**
 * @param {string} description
 * @param {string} [selectedCategory]
 */
export function triageEmergency(description, selectedCategory = "auto") {
  const safeDescription = String(description ?? "").slice(0, 700);
  let category = "other";
  let source = "unknown";

  if (selectedCategory !== "auto" && Object.hasOwn(GUIDANCE, selectedCategory)) {
    category = selectedCategory;
    source = "selected";
  } else if (safeDescription.trim()) {
    const keywordHit = KEYWORD_RULES.find(([, pattern]) => pattern.test(safeDescription));
    if (keywordHit) {
      category = keywordHit[0];
      source = "keyword";
    } else {
      const predicted = classifyExampleNlp(safeDescription);
      if (predicted) { category = predicted; source = "example-nlp"; }
    }
  }

  return { category, source, ...GUIDANCE[category] };
}

/** Compose a user-controlled message; do not misrepresent a demo pickup as current GPS. */
export function buildEmergencyShareMessage({ city, bookingId, driverName, position, pickupLocation } = {}) {
  const lines = ["Ride safety check-in — I may need assistance."];
  if (bookingId != null) lines.push(`Trip reference: ${String(bookingId)}`);
  if (driverName) lines.push(`Driver: ${String(driverName)}`);
  if (city) lines.push(`Trip city: ${String(city)}`);
  if (position && Number.isFinite(position.latitude) && Number.isFinite(position.longitude)) {
    const lat = position.latitude.toFixed(6), lon = position.longitude.toFixed(6);
    lines.push(`Current GPS (shared with my permission): ${lat}, ${lon}`);
    lines.push(`Map: https://www.google.com/maps?q=${lat},${lon}`);
  } else {
    lines.push("Current GPS location not provided.");
    if (pickupLocation && Number.isFinite(pickupLocation.lat) && Number.isFinite(pickupLocation.lng)) {
      lines.push(`App pickup location (NOT live GPS): ${pickupLocation.lat.toFixed(6)}, ${pickupLocation.lng.toFixed(6)}`);
    }
  }
  return lines.join("\n");
}
