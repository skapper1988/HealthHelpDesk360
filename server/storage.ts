import { 
  users, type User, type InsertUser,
  tickets, type Ticket, type InsertTicket,
  chatMessages, type ChatMessage, type InsertChatMessage 
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc } from "drizzle-orm";
import { nanoid } from "nanoid";

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Ticket methods
  createTicket(ticket: InsertTicket): Promise<Ticket>;
  getTickets(limit?: number): Promise<Ticket[]>;
  getTicket(id: number): Promise<Ticket | undefined>;
  getTicketByNumber(ticketNumber: string): Promise<Ticket | undefined>;
  updateTicket(id: number, ticket: Partial<Ticket>): Promise<Ticket | undefined>;
  
  // Chat methods
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatMessagesBySession(sessionId: string): Promise<ChatMessage[]>;
}

// PostgreSQL database implementation
export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Ticket methods
  async createTicket(insertTicket: InsertTicket): Promise<Ticket> {
    // Generate a unique ticket number
    const ticketNumber = `HD-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
    
    const [ticket] = await db.insert(tickets).values({
      ...insertTicket,
      ticketNumber,
      status: "open",
    }).returning();
    
    return ticket;
  }

  async getTickets(limit?: number): Promise<Ticket[]> {
    const query = db.select().from(tickets).orderBy(desc(tickets.createdAt));
    
    if (limit) {
      return await query.limit(limit);
    }
    
    return await query;
  }

  async getTicket(id: number): Promise<Ticket | undefined> {
    const [ticket] = await db.select().from(tickets).where(eq(tickets.id, id));
    return ticket;
  }

  async getTicketByNumber(ticketNumber: string): Promise<Ticket | undefined> {
    const [ticket] = await db.select().from(tickets).where(eq(tickets.ticketNumber, ticketNumber));
    return ticket;
  }

  async updateTicket(id: number, updates: Partial<Ticket>): Promise<Ticket | undefined> {
    const [ticket] = await db.update(tickets)
      .set({
        ...updates,
        updatedAt: new Date(), // Always set the current date
      })
      .where(eq(tickets.id, id))
      .returning();
    
    return ticket;
  }

  // Chat methods
  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const [message] = await db.insert(chatMessages).values(insertMessage).returning();
    return message;
  }

  async getChatMessagesBySession(sessionId: string): Promise<ChatMessage[]> {
    return await db.select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(asc(chatMessages.createdAt));
  }
}

// Fallback in-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private tickets: Map<number, Ticket>;
  private chatMessages: Map<number, ChatMessage>;
  private userIdCounter: number;
  private ticketIdCounter: number;
  private chatMessageIdCounter: number;

  constructor() {
    this.users = new Map();
    this.tickets = new Map();
    this.chatMessages = new Map();
    this.userIdCounter = 1;
    this.ticketIdCounter = 1;
    this.chatMessageIdCounter = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Ticket methods
  async createTicket(insertTicket: InsertTicket): Promise<Ticket> {
    const id = this.ticketIdCounter++;
    const now = new Date();
    const ticketNumber = `HD-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
    
    const ticket: Ticket = {
      ...insertTicket,
      id,
      ticketNumber,
      status: "open",
      createdAt: now,
      updatedAt: now,
    };
    
    this.tickets.set(id, ticket);
    return ticket;
  }

  async getTickets(limit?: number): Promise<Ticket[]> {
    const ticketsArray = Array.from(this.tickets.values());
    // Sort by created date, newest first
    ticketsArray.sort((a, b) => {
      // Handle potential null values (though they shouldn't exist)
      const dateA = a.createdAt ? (a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt)) : new Date();
      const dateB = b.createdAt ? (b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt)) : new Date();
      return dateB.getTime() - dateA.getTime();
    });
    
    return limit ? ticketsArray.slice(0, limit) : ticketsArray;
  }

  async getTicket(id: number): Promise<Ticket | undefined> {
    return this.tickets.get(id);
  }

  async getTicketByNumber(ticketNumber: string): Promise<Ticket | undefined> {
    return Array.from(this.tickets.values()).find(
      (ticket) => ticket.ticketNumber === ticketNumber,
    );
  }

  async updateTicket(id: number, updates: Partial<Ticket>): Promise<Ticket | undefined> {
    const ticket = await this.getTicket(id);
    if (!ticket) return undefined;
    
    const updatedTicket: Ticket = {
      ...ticket,
      ...updates,
      updatedAt: new Date(),
    };
    
    this.tickets.set(id, updatedTicket);
    return updatedTicket;
  }

  // Chat methods
  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = this.chatMessageIdCounter++;
    const now = new Date();
    
    const message: ChatMessage = {
      ...insertMessage,
      id,
      createdAt: now,
    };
    
    this.chatMessages.set(id, message);
    return message;
  }

  async getChatMessagesBySession(sessionId: string): Promise<ChatMessage[]> {
    const messages = Array.from(this.chatMessages.values())
      .filter(message => message.sessionId === sessionId)
      .sort((a, b) => {
        // Handle potential null values
        const dateA = a.createdAt ? (a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt)) : new Date();
        const dateB = b.createdAt ? (b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt)) : new Date();
        return dateA.getTime() - dateB.getTime();
      });
    
    return messages;
  }
}

// Use Database Storage for the application
export const storage = new DatabaseStorage();
