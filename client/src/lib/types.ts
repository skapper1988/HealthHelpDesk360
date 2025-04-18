export interface Ticket {
  id: number;
  name: string;
  email: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  ticketNumber: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: number;
  sessionId: string;
  sender: 'user' | 'agent';
  message: string;
  createdAt: string;
}

export interface TicketFormData {
  name: string;
  email: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
}
