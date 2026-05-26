const MODEL = "claude-sonnet-4-20250514";

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  try {
    const { messages, system, maxTokens = 1000 } = JSON.parse(event.body || "{}");
    if (!Array.isArray(messages) || !system) {
      return json(400, { error: "messages and system are required." });
    }

    if (!apiKey) {
      return json(200, { reply: createPlaceholderReply(messages, system) });
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

function createPlaceholderReply(messages, system) {
  const lastUserMessage = [...messages].reverse().find((message) => message.role === "user")?.content || "";
  const lowerSystem = String(system).toLowerCase();
  const lowerMessage = String(lastUserMessage).toLowerCase();

  if (lowerSystem.includes("financial") || lowerSystem.includes("budget")) {
    if (lowerMessage.includes("debt")) {
      return "Test budget coach: For debt, start by listing the balance, minimum payment, and interest for each one. A good next step is choosing one target debt and adding the exact amount you can pay this week.";
    }
    if (lowerMessage.includes("save") || lowerMessage.includes("saving")) {
      return "Test budget coach: Your savings goal should be treated like a bill you pay yourself first. Try adding a small weekly amount under Savings Goal so the chart shows where that money needs to go.";
    }
    return "Test budget coach: I can read your budget context and respond here once a real API key is connected. For now, check whether your Needed amounts match what must be covered this month.";
  }

  if (lowerSystem.includes("call center") || lowerSystem.includes("sales coach")) {
    if (lowerMessage.includes("think")) {
      return "Test work coach: Try saying, 'Totally fair. What part do you want to think through most: price, timing, or the project itself?'";
    }
    return "Test work coach: Keep the call simple: validate, ask one clear question, then guide them toward the appointment. What objection do you want a line for?";
  }

  if (lowerSystem.includes("wellness")) {
    return "Test wellness coach: Take a quick reset: drink water, roll your shoulders back ten times, and stretch your wrists for 20 seconds. What part of your body feels tight right now?";
  }

  if (lowerSystem.includes("note")) {
    return "Test notes assistant: I can help organize this into a short list, a plan, or a summary. Paste the messy thought and I’ll turn it into something cleaner.";
  }

  if (lowerSystem.includes("main ai assistant")) {
    if (lowerMessage.includes("water")) {
      return 'Test main assistant: I would log a water glass when the real AI action parser is connected.\n\n```action\n{"type":"add_water","data":{"amount":1}}\n```';
    }
    if (lowerMessage.includes("appointment")) {
      return 'Test main assistant: I would add one appointment and update your streak.\n\n```action\n{"type":"add_appointment","data":{}}\n```';
    }
    return "Test main assistant: I can chat and show how this will feel, but smart custom actions work best with a real AI key. Try asking me to add water or log an appointment.";
  }

  return "Test AI reply: The chat is connected. Add a real AI API key later to replace this placeholder with smarter answers.";
}
