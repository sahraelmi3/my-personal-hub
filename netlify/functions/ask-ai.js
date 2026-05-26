const ANTHROPIC_MODEL = "claude-sonnet-4-20250514";
const GEMINI_MODEL = "gemini-2.0-flash";
const GROQ_MODEL = "llama-3.3-70b-versatile";

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  const geminiApiKey = process.env.GEMINI_API_KEY;
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
  const groqApiKey = process.env.GROQ_API_KEY;

  try {
    const { messages, system, maxTokens = 1000 } = JSON.parse(event.body || "{}");
    if (!Array.isArray(messages) || !system) {
      return json(400, { error: "messages and system are required." });
    }

    if (groqApiKey) {
      return await askGroq({ apiKey: groqApiKey, messages, system, maxTokens });
    }

    if (geminiApiKey) {
      return await askGemini({ apiKey: geminiApiKey, messages, system, maxTokens });
    }

    if (anthropicApiKey) {
      return await askAnthropic({ apiKey: anthropicApiKey, messages, system, maxTokens });
    }

    return json(200, { reply: createPlaceholderReply(messages, system) });
  } catch (error) {
    return json(500, { error: error.message || "AI function failed." });
  }
};

async function askGroq({ apiKey, messages, system, maxTokens }) {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      max_tokens: maxTokens,
      temperature: 0.7,
      messages: [
        { role: "system", content: system },
        ...messages.slice(-12).map((message) => ({
          role: message.role === "assistant" ? "assistant" : "user",
          content: String(message.content || ""),
        })),
      ],
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    console.warn("Groq request failed, trying fallback:", data.error?.message || response.status);
    return json(200, {
      reply: createPlaceholderReply(messages, system),
      provider: "placeholder",
      providerError: data.error?.message || "Groq request failed.",
    });
  }

  const reply = data.choices?.[0]?.message?.content?.trim();
  return json(200, { reply: reply || createPlaceholderReply(messages, system), provider: "groq" });
}

async function askGemini({ apiKey, messages, system, maxTokens }) {
  const contents = messages.slice(-12).map((message) => ({
    role: message.role === "assistant" ? "model" : "user",
    parts: [{ text: String(message.content || "") }],
  }));

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents,
        generationConfig: {
          maxOutputTokens: maxTokens,
          temperature: 0.7,
        },
      }),
    }
  );

  const data = await response.json();
  if (!response.ok) {
    console.warn("Gemini request failed, using placeholder fallback:", data.error?.message || response.status);
    return json(200, {
      reply: createPlaceholderReply(messages, system),
      provider: "placeholder",
      providerError: data.error?.message || "Gemini request failed.",
    });
  }

  const reply = data.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("").trim();
  return json(200, { reply: reply || createPlaceholderReply(messages, system), provider: "gemini" });
}

async function askAnthropic({ apiKey, messages, system, maxTokens }) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: maxTokens,
      system,
      messages: messages.slice(-12),
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    console.warn("Anthropic request failed, using placeholder fallback:", data.error?.message || response.status);
    return json(200, {
      reply: createPlaceholderReply(messages, system),
      provider: "placeholder",
      providerError: data.error?.message || "Anthropic request failed.",
    });
  }

  const reply = data.content?.map((block) => block.text || "").join("").trim();
  return json(200, { reply: reply || createPlaceholderReply(messages, system), provider: "anthropic" });
}

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
    if (lowerMessage.includes("paycheck") || lowerMessage.includes("biweekly")) {
      return "Test budget coach: Add each paycheck under Biweekly Paycheck Income with the pay date, expected amount, and actual received. Then assign that money into bills, debt, expenses, and savings so the overview shows what is planned and what actually happened.";
    }
    if (lowerMessage.includes("trip") || lowerMessage.includes("car") || lowerMessage.includes("goal")) {
      return "Test budget coach: Add each savings goal as its own row under Savings Goals, like Trip or New Car. Put the full target under Target, then use Add saved whenever you move money into that goal.";
    }
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
    if (lowerMessage.includes("calendar") || lowerMessage.includes("appointment") || lowerMessage.includes("therapy")) {
      return 'Done — I added it to your calendar and timeline.\n\n```action\n{"type":"add_calendar","data":{"date":"29","title":"Therapy Session","type":"appointment"}}\n```\n```action\n{"type":"add_schedule","data":{"time":"1:00 PM","event":"Therapy Session","type":"routine"}}\n```';
    }
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
