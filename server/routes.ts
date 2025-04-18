import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTicketSchema, insertChatMessageSchema } from "@shared/schema";
import { ZodError } from "zod";
import { processMessage } from "./chatbot";

export async function registerRoutes(app: Express): Promise<Server> {
  // API Routes
  const apiRouter = express.Router();
  
  // Tickets API
  apiRouter.post("/tickets", async (req: Request, res: Response) => {
    try {
      const ticketData = insertTicketSchema.parse(req.body);
      const newTicket = await storage.createTicket(ticketData);
      return res.status(201).json(newTicket);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      return res.status(500).json({ message: "Failed to create ticket" });
    }
  });

  apiRouter.get("/tickets", async (_req: Request, res: Response) => {
    try {
      const tickets = await storage.getTickets();
      return res.json(tickets);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch tickets" });
    }
  });

  apiRouter.get("/tickets/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ticket ID" });
      }
      
      const ticket = await storage.getTicket(id);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      return res.json(ticket);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch ticket" });
    }
  });

  apiRouter.get("/tickets/number/:ticketNumber", async (req: Request, res: Response) => {
    try {
      const ticketNumber = req.params.ticketNumber;
      const ticket = await storage.getTicketByNumber(ticketNumber);
      
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      return res.json(ticket);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch ticket" });
    }
  });

  apiRouter.put("/tickets/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ticket ID" });
      }
      
      // Only validate the fields that are present
      const ticketData = req.body;
      
      const updatedTicket = await storage.updateTicket(id, ticketData);
      if (!updatedTicket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      return res.json(updatedTicket);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      return res.status(500).json({ message: "Failed to update ticket" });
    }
  });

  // Chat API
  apiRouter.post("/chat", async (req: Request, res: Response) => {
    try {
      const { sessionId, message } = req.body;
      
      if (!sessionId || !message) {
        return res.status(400).json({ message: "Session ID and message are required" });
      }
      
      // Save user message
      const userMessage = await storage.createChatMessage({
        sessionId,
        sender: "user",
        message,
      });
      
      // Process message with chatbot
      const botResponse = await processMessage(message, sessionId);
      
      // Save bot response
      const botMessage = await storage.createChatMessage({
        sessionId,
        sender: "agent",
        message: botResponse.message,
      });
      
      // Return both messages and any actions
      return res.json({
        userMessage,
        botMessage,
        createTicket: botResponse.createTicket,
        ticketData: botResponse.ticketData,
      });
    } catch (error) {
      console.error('Chat error:', error);
      return res.status(500).json({ message: "Failed to process chat message" });
    }
  });

  apiRouter.get("/chat/:sessionId", async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      
      if (!sessionId) {
        return res.status(400).json({ message: "Session ID is required" });
      }
      
      const messages = await storage.getChatMessagesBySession(sessionId);
      return res.json(messages);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch chat messages" });
    }
  });

  // Mount API router
  app.use("/api", apiRouter);

  const httpServer = createServer(app);
  return httpServer;
}
