const { OpenAI } = require("openai");

const platformAssistant = async (req, res) => {
  const { question } = req.body;

  if (!question || question.trim() === "") {
    return res.status(400).json({ message: "No question provided." });
  }

  try {
    const context = `
FleetEase is a modern fleet management platform. It allows logistics companies and vehicle operators to manage, track, and optimize their fleets.

Key Features:
- Real-time GPS vehicle tracking
- Driver management and profiles
- Automated vehicle maintenance scheduling
- Route and trip optimization
- Analytics and performance reports
- Secure web-based dashboard for admins
- Mobile-friendly design

Terminology:
- "Trips" = vehicle journeys
- "Drivers" = assigned operators of vehicles
- "Vehicles" = fleet assets
- "Reports" = visual analytics and data summaries
- "Dashboard" = the admin interface for managing all features

Support AI Instructions:
- Only answer questions related to FleetEase and how to use it.
- Be clear and friendly.
- If you don’t know or the question is off-topic, say: "I'm not sure how to help with that. Please call our support team at (123) 456-7890 for further assistance."

User’s Question:
${question}

Answer:
`;

    const client = new OpenAI({
      baseURL: "https://router.huggingface.co/novita/v3/openai",
      apiKey: process.env.HUGGINGFACE_API_KEY,
    });

    const chatCompletion = await client.chat.completions.create({
      model: "thudm/glm-4-32b-0414",
      messages: [{ role: "user", content: context }],
      max_tokens: 512,
    });

    const rawAnswer = chatCompletion.choices[0]?.message?.content?.trim();
    const fallback =
      "I'm not sure how to help with that. Please call our support team at (123) 456-7890 for further assistance.";

    const answer =
      rawAnswer && !rawAnswer.toLowerCase().includes("i don't know")
        ? rawAnswer
        : fallback;

    res.status(200).json({ answer });
  } catch (error) {
    console.error("Error generating AI platform response:", error);
    res.status(500).json({
      message: "Failed to generate a response. Please try again later.",
    });
  }
};

module.exports = { platformAssistant };
