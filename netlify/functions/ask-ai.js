const MODEL = "claude-sonnet-4-20250514";

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return json(500, { error: "Missing ANTHROPIC_API_KEY in Netlify environment variables." });
  }

  try {
    const { messages, system, maxTokens = 1000 } = JSON.parse(event.body || "{}");
    if (!Array.isArray(messages) || !system) {
      return json(400, { error: "messages and system are required." });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: maxTokens,
        system,
        messages: messages.slice(-12),
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return json(response.status, { error: data.error?.message || "Anthropic request failed." });
    }

    const reply = data.content?.map((block) => block.text || "").join("").trim();
    return json(200, { reply: reply || "I could not think of a response right now." });
  } catch (error) {
    return json(500, { error: error.message || "AI function failed." });
  }
};

function json(statusCode, body) {
  return {
    statusCode,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  };
}
