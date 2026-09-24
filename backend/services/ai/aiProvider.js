/**
 * AI Provider Adapter
 * Decoupled service supporting Google Gemini (default) and OpenAI-compatible providers.
 * Communicates via native fetch without heavy external SDK dependencies.
 */

class AIProvider {
  constructor() {
    this.apiKey = process.env.AI_API_KEY || process.env.GEMINI_API_KEY || "";
    this.model = process.env.AI_MODEL || "gemini-1.5-flash";
    this.provider = process.env.AI_PROVIDER || (this.apiKey.startsWith("sk-") ? "openai" : "gemini");
    this.baseUrl = process.env.AI_BASE_URL || "";
  }

  /**
   * Check if AI provider has a configured API key
   */
  isConfigured() {
    const key = process.env.AI_API_KEY || process.env.GEMINI_API_KEY || "";
    return Boolean(key && key.trim().length > 0 && !key.includes("your_"));
  }

  /**
   * Get active provider name and model
   */
  getProviderInfo() {
    return {
      provider: this.provider,
      model: this.model,
      configured: this.isConfigured(),
    };
  }

  /**
   * Main completion method that calls the configured provider
   * @param {string} systemPrompt System instruction
   * @param {string} userPrompt User request
   * @returns {Promise<string>} Raw text response (expected JSON)
   */
  async generateCompletion(systemPrompt, userPrompt) {
    const key = process.env.AI_API_KEY || process.env.GEMINI_API_KEY;

    if (!key || !key.trim() || key.includes("your_")) {
      const err = new Error(
        "AI_API_KEY is not configured in backend/.env. Please provide a valid Gemini or OpenAI API key."
      );
      err.code = "AI_KEY_MISSING";
      throw err;
    }

    const provider = process.env.AI_PROVIDER || (key.startsWith("sk-") ? "openai" : "gemini");
    const model = process.env.AI_MODEL || (provider === "gemini" ? "gemini-1.5-flash" : "gpt-4o-mini");

    if (provider === "openai") {
      return this._callOpenAI(key, model, systemPrompt, userPrompt);
    } else {
      return this._callGemini(key, model, systemPrompt, userPrompt);
    }
  }

  /**
   * Call Google Gemini API
   */
  async _callGemini(apiKey, model, systemPrompt, userPrompt) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const payload = {
      systemInstruction: systemPrompt
        ? {
            parts: [{ text: systemPrompt }],
          }
        : undefined,
      contents: [
        {
          role: "user",
          parts: [{ text: userPrompt }],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.7,
        topP: 0.95,
      },
    };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMsg = `Gemini API error (Status ${response.status})`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMsg = errorJson.error?.message || errorMsg;
      } catch (_) {
        errorMsg += `: ${errorText}`;
      }
      const err = new Error(errorMsg);
      err.status = response.status;
      throw err;
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];

    if (!candidate || !candidate.content?.parts?.[0]?.text) {
      throw new Error("Gemini returned an empty response");
    }

    return candidate.content.parts[0].text;
  }

  /**
   * Call OpenAI-compatible Chat Completions API
   */
  async _callOpenAI(apiKey, model, systemPrompt, userPrompt) {
    const baseUrl = this.baseUrl || "https://api.openai.com/v1";
    const endpoint = `${baseUrl.replace(/\/$/, "")}/chat/completions`;

    const messages = [];
    if (systemPrompt) {
      messages.push({ role: "system", content: systemPrompt });
    }
    messages.push({ role: "user", content: userPrompt });

    const payload = {
      model,
      messages,
      response_format: { type: "json_object" },
      temperature: 0.7,
    };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMsg = `OpenAI API error (Status ${response.status})`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMsg = errorJson.error?.message || errorMsg;
      } catch (_) {
        errorMsg += `: ${errorText}`;
      }
      const err = new Error(errorMsg);
      err.status = response.status;
      throw err;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("OpenAI returned an empty response");
    }

    return content;
  }
}

module.exports = new AIProvider();
