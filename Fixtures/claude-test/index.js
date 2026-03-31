// Test bundle: Anthropic SDK initialization and basic API call structure
// This simulates what claude.bundle.js would do when loaded on iOS

const Anthropic = require("@anthropic-ai/sdk");

// Export initialization function for the host app to call
globalThis.__claudeInit = function (apiKey) {
  const client = new Anthropic({ apiKey: apiKey });
  globalThis.__claudeClient = client;
  return { status: "initialized", version: Anthropic.VERSION || "unknown" };
};

// Export a function to send a message
globalThis.__claudeMessage = async function (prompt) {
  if (!globalThis.__claudeClient) {
    throw new Error("Client not initialized. Call __claudeInit first.");
  }

  const response = await globalThis.__claudeClient.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 256,
    messages: [{ role: "user", content: prompt }],
  });

  // Emit the response as NDJSON event
  if (typeof __emitEvent === "function") {
    __emitEvent(JSON.stringify(response));
  }

  return response;
};

// Signal that the bundle has loaded successfully
globalThis.__bundleLoaded = true;
globalThis.__bundleInfo = {
  name: "claude-test-bundle",
  modules: {
    anthropic: typeof Anthropic === "function",
    fetch: typeof fetch === "function",
    process: typeof process === "object",
    Buffer: typeof Buffer === "object",
    crypto: typeof require("node:crypto") === "object",
    path: typeof require("node:path") === "object",
  },
};
