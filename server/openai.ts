import OpenAI from "openai";
import type { InsertTicket } from "@shared/schema";

// Initialize the OpenAI client with the API key from environment variables
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface ChatbotResponse {
  message: string;
  createTicket: boolean;
  ticketData?: Partial<InsertTicket>;
}

export async function processChatWithOpenAI(
  message: string,
  sessionId: string
): Promise<ChatbotResponse> {
  try {
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

    // Add the user's query
    const response = await openai.chat.completions.create({
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
  } catch (error: any) {
    console.error("OpenAI API error:", error);
    
    // Check for quota exceeded error
    if (error?.status === 429 && error?.error?.code === 'insufficient_quota') {
      // Specific message for quota exceeded
      return {
        message: "I'm currently experiencing high demand. The system is using the basic keyword matching for now. For full AI capabilities, please update your OpenAI API key quota.",
        createTicket: false,
      };
    }
    
    // Generic error message for other errors
    return {
      message: "I'm having some trouble connecting to my knowledge base right now. Falling back to basic matching.",
      createTicket: false,
    };
  }
}