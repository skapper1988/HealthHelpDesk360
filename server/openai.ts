import OpenAI from "openai";
import type { InsertTicket } from "@shared/schema";

// Set up primary and secondary API clients
const primaryClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const secondaryClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY_SECONDARY });

interface ChatbotResponse {
  message: string;
  createTicket: boolean;
  ticketData?: Partial<InsertTicket>;
}

/**
 * Process a chat message using OpenAI's API with fallback to a secondary API key
 */
export async function processChatWithOpenAI(
  message: string,
  sessionId: string
): Promise<ChatbotResponse> {
  // First try with primary API key
  try {
    return await makeOpenAIRequest(primaryClient, message);
  } catch (primaryError: any) {
    console.error("Primary OpenAI API error:", primaryError);
    
    // If the primary key has quota issues, try the secondary key
    if (primaryError?.status === 429 && primaryError?.error?.code === 'insufficient_quota') {
      console.log("Primary API key quota exceeded, trying secondary API key...");
      
      try {
        // Attempt with secondary API key
        const response = await makeOpenAIRequest(secondaryClient, message);
        // Add a note that we're using the backup system
        response.message = `[Using backup API] ${response.message}`;
        return response;
      } catch (secondaryError: any) {
        console.error("Secondary OpenAI API error:", secondaryError);
        
        // If secondary also has quota issues, return a specific message
        if (secondaryError?.status === 429 && secondaryError?.error?.code === 'insufficient_quota') {
          return {
            message: "Both API keys have exceeded their quota limits. The system is using basic keyword matching for now. For full AI capabilities, please update your OpenAI API keys.",
            createTicket: false,
          };
        }
        
        // For other secondary API errors, fall back to a generic error message
        return {
          message: "I'm having some trouble connecting to my knowledge base right now. Falling back to basic matching.",
          createTicket: false,
        };
      }
    }
    
    // For non-quota primary API errors, return a generic error message
    return {
      message: "I'm having some trouble processing your request. Falling back to basic matching.",
      createTicket: false,
    };
  }
}

/**
 * Helper function to make the actual OpenAI API request
 * This extracts the common API call logic for both primary and secondary keys
 */
async function makeOpenAIRequest(
  client: OpenAI,
  message: string
): Promise<ChatbotResponse> {
  // Construct the system prompt for the healthcare chatbot
  const systemPrompt = `You are HealthBot, an intelligent healthcare support assistant for HealthHelpDesk360. 
Your role is to help users with healthcare-related questions and support issues.

When responding, follow these guidelines:
1. Be polite, professional, and empathetic
2. For simple queries about documentation, providers, or general healthcare information, provide direct helpful answers
3. For technical issues, login problems, or claim disputes, suggest creating a support ticket
4. If you determine a ticket should be created, include appropriate ticket data in your response

Your goal is to resolve simple issues directly and escalate complex issues to human agents via the ticketing system.`;

  // Define ticket priority type
  type TicketPriority = "low" | "medium" | "high";
  
  // Create context-specific prompts to categorize user queries
  const ticketCategories = [
    {
      name: "authentication",
      keywords: ["login", "password", "account access", "sign in", "can't log in", "reset password"],
      subject: "Login Access Issues",
      priority: "high" as TicketPriority,
    },
    {
      name: "claims",
      keywords: ["claim", "denied", "rejected", "not covered", "bill", "reimbursement"],
      subject: "Claim Processing Issue",
      priority: "medium" as TicketPriority,
    },
    {
      name: "technical",
      keywords: ["error", "problem", "not working", "issue", "bug", "glitch"],
      subject: "Technical Issue Report",
      priority: "medium" as TicketPriority,
    },
    {
      name: "providers",
      keywords: ["doctor", "provider", "specialist", "hospital", "clinic", "in-network"],
      subject: null, // No ticket needed
      priority: undefined,
    },
    {
      name: "documentation",
      keywords: ["upload", "document", "file", "attachment", "form", "paperwork"],
      subject: null, // No ticket needed
      priority: undefined,
    },
  ];

  // Add the user's query using the provided client instance
  const response = await client.chat.completions.create({
    model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `User message: ${message}\n\nAnalyze this message and respond appropriately. If a support ticket should be created, indicate that in your response.`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.7,
    max_tokens: 500,
  });

  // Get the response content
  const responseContent = response.choices[0].message.content || "{}";
  let parsedResponse: any;

  try {
    parsedResponse = JSON.parse(responseContent);
  } catch (error) {
    console.error("Failed to parse OpenAI response:", error);
    // Fallback to a simple response if parsing fails
    return {
      message: "I'm having trouble processing your request. Could you please try again?",
      createTicket: false,
    };
  }

  // Determine if a ticket should be created based on keywords
  let createTicket = parsedResponse.create_ticket || false;
  let ticketData: Partial<InsertTicket> | undefined = undefined;

  // If OpenAI didn't explicitly set create_ticket, check using keywords
  if (!createTicket && !("create_ticket" in parsedResponse)) {
    const lowerMessage = message.toLowerCase();
    
    // Check each category for keyword matches
    for (const category of ticketCategories) {
      if (category.subject && category.keywords.some(kw => lowerMessage.includes(kw))) {
        createTicket = true;
        // Make sure the priority is one of the accepted values
        const priority = category.priority || "medium";
        ticketData = {
          subject: category.subject,
          category: category.name,
          priority: priority === "low" || priority === "medium" || priority === "high" ? priority : "medium",
          description: `User reported: "${message}"`,
        };
        break;
      }
    }
  } else if (createTicket && parsedResponse.ticket_data) {
    // Use ticket data provided by OpenAI
    const priority = parsedResponse.ticket_data.priority || "medium";
    ticketData = {
      subject: parsedResponse.ticket_data.subject || "Support Request",
      category: parsedResponse.ticket_data.category || "general",
      priority: priority === "low" || priority === "medium" || priority === "high" ? priority : "medium",
      description: parsedResponse.ticket_data.description || `User reported: "${message}"`,
    };
  } else if (createTicket) {
    // Fallback ticket data if OpenAI indicates a ticket but doesn't provide details
    ticketData = {
      subject: "Support Request",
      category: "general",
      priority: "medium",
      description: `User reported: "${message}"`,
    };
  }

  // Return the chatbot response
  return {
    message: parsedResponse.message || "I'm here to help with your healthcare questions. How can I assist you today?",
    createTicket,
    ticketData,
  };
}