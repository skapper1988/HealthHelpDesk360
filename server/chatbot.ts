import type { InsertTicket } from "@shared/schema";
import { processChatWithOpenAI } from "./openai";

// Interface for chatbot response
export interface ChatbotResponse {
  message: string;
  createTicket: boolean;
  ticketData?: Partial<InsertTicket>;
}

// Process messages using OpenAI GPT with fallback to keyword matching
export async function processMessage(message: string, sessionId: string): Promise<ChatbotResponse> {
  try {
    // First attempt to use OpenAI for processing with multi-key fallback
    const response = await processChatWithOpenAI(message, sessionId);
    
    // If the response indicates we need to use keyword matching (when both API keys fail)
    if (response.message.includes("using basic keyword matching") || 
        response.message.includes("exceeded their quota limits")) {
      console.log("All OpenAI API keys failed, using keyword matching as final fallback");
      return keywordBasedProcessing(message);
    }
    
    return response;
  } catch (error) {
    console.error("Unexpected error in OpenAI processing, falling back to keyword matching:", error);
    return keywordBasedProcessing(message);
  }
}

// Fallback processing using keyword matching
function keywordBasedProcessing(message: string): ChatbotResponse {
  const lowerMessage = message.toLowerCase();
  
  // Set default response
  let response: ChatbotResponse = {
    message: "I'm here to help with your healthcare questions. How can I assist you today?",
    createTicket: false
  };
  
  // Check if the message contains login issues
  if (lowerMessage.includes("login") || 
      lowerMessage.includes("password") || 
      lowerMessage.includes("can't log in") || 
      lowerMessage.includes("cannot sign in")) {
    
    response = {
      message: "I understand you're having login issues. I can help create a ticket for our technical team to assist you. Could you please provide your email address so we can follow up?",
      createTicket: true,
      ticketData: {
        subject: "Login Access Issues",
        category: "authentication",
        priority: "high",
        description: `User reported: "${message}"`,
      }
    };
  } 
  // Check if the message contains claim issues
  else if (lowerMessage.includes("claim") || 
           lowerMessage.includes("denied") || 
           lowerMessage.includes("rejected") || 
           lowerMessage.includes("not covered")) {
    
    response = {
      message: "I'm sorry to hear about your claim issue. Let me create a ticket for our claims department to look into this. Could you please provide your name and email address so we can follow up with you?",
      createTicket: true,
      ticketData: {
        subject: "Claim Processing Issue",
        category: "claims",
        priority: "medium",
        description: `User reported: "${message}"`,
      }
    };
  }
  // Check if the message contains document upload questions
  else if (lowerMessage.includes("upload") || 
           lowerMessage.includes("document") || 
           lowerMessage.includes("file") || 
           lowerMessage.includes("attachment")) {
    
    response = {
      message: "To upload documents, go to 'My Account' > 'Documents' > 'Upload New'. You can upload files up to 10MB in PDF, JPG, or PNG format. Would you like me to create a ticket for additional assistance with document uploads?",
      createTicket: false
    };
  }
  // Check if the message contains provider questions
  else if (lowerMessage.includes("doctor") || 
           lowerMessage.includes("provider") || 
           lowerMessage.includes("specialist") || 
           lowerMessage.includes("hospital")) {
    
    response = {
      message: "To find in-network providers, you can use our provider directory by clicking on 'Find a Provider' in the main menu. Would you like me to create a ticket if you need more specific help with finding providers?",
      createTicket: false
    };
  }
  // Generic technical issue
  else if (lowerMessage.includes("error") || 
           lowerMessage.includes("problem") || 
           lowerMessage.includes("not working") || 
           lowerMessage.includes("issue") ||
           lowerMessage.includes("bug")) {
    
    response = {
      message: "I'm sorry you're experiencing technical difficulties. I'll create a support ticket for our technical team to investigate this issue. Could you please provide your email address for follow-up?",
      createTicket: true,
      ticketData: {
        subject: "Technical Issue Report",
        category: "technical",
        priority: "medium",
        description: `User reported: "${message}"`,
      }
    };
  }
  
  return response;
}
