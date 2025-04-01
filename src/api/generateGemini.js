// src/api/generateGemini.js
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Gemini client with the API key from environment variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  // Ensure this function only handles POST requests, or adjust as needed
  if (req.method !== `POST`) {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { prompt } = req.body; // Get the prompt from the request body

    if (!prompt) {
      return res.status(400).json({ message: "Prompt is required" });
    }

    // Choose the appropriate Gemini model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Or another model

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Send the generated text back to the frontend
    res.status(200).json({ generatedText: text });
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
