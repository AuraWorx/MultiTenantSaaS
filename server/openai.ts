import OpenAI from "openai";
import type { ChatCompletionSystemMessageParam, ChatCompletionUserMessageParam } from "openai/resources/chat/completions";

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateChatResponse(prompt: string, fileContent?: string | null): Promise<string> {
  try {
    // Create the messages array with proper typing
    const messages: Array<ChatCompletionSystemMessageParam | ChatCompletionUserMessageParam> = [];
    
    // Add system message
    messages.push({
      role: "system",
      content: "You are a helpful assistant in the AuraAI governance platform. You provide accurate and concise responses to user queries about AI governance, compliance, and risk management."
    } as ChatCompletionSystemMessageParam);
    
    // If file content is provided, include it in the context
    if (fileContent) {
      messages.push({
        role: "system",
        content: `The user has shared the following file content for context:\n\n${fileContent}\n\nPlease use this information when responding to their query.`
      } as ChatCompletionSystemMessageParam);
    }
    
    // Add the user's message
    messages.push({
      role: "user",
      content: prompt
    } as ChatCompletionUserMessageParam);
    
    // Call the OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000,
    });
    
    // Return the response
    return completion.choices[0].message.content || "I'm sorry, I couldn't generate a response.";
  } catch (error: unknown) {
    console.error("OpenAI API error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred while generating response";
    return `Error: ${errorMessage}`;
  }
}