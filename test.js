import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function testCall() {
  try {
    const response = await client.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: "Hi" }],
      max_tokens: 1,
    });
    console.log("Success:", response);
  } catch (err) {
    if (err.response) {
      console.error("Error status:", err.status, err.message);
      console.error("Rate limit headers:", {
        limitRequests: err.response.headers["x-ratelimit-limit-requests"],
        remainRequests: err.response.headers["x-ratelimit-remaining-requests"],
        resetRequests: err.response.headers["x-ratelimit-reset-requests"],
        limitTokens: err.response.headers["x-ratelimit-limit-tokens"],
        remainTokens: err.response.headers["x-ratelimit-remaining-tokens"],
        resetTokens: err.response.headers["x-ratelimit-reset-tokens"],
      });
    } else {
      console.error("Unexpected error:", err);
    }
  }
}

testCall();

