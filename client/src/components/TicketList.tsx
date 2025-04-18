import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Ticket } from "@/lib/types";

interface TicketListProps {
  onNewTicket: () => void;
}

interface TicketItemProps {
  ticket: Ticket;
}

const TicketItem = ({ ticket }: TicketItemProps) => {
  // Generate initials from name
  const initials = ticket.name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase();
  
  // Map priority to color
  const priorityColor = {
    high: "bg-destructive",
    medium: "bg-warning",
    low: "bg-success"
  };
  
  // Map category to display name
  const categoryDisplay = {
    authentication: "Authentication",
    claims: "Claims",
    coverage: "Coverage",
    providers: "Providers",
    documentation: "Documentation",
    technical: "Technical"
  };
  
  // Format date function
  const formatDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHrs < 1) {
      return 'Just now';
    } else if (diffHrs < 24) {
      return `${diffHrs}h ago`;
    } else {
      const days = Math.floor(diffHrs / 24);
      return `${days}d ago`;
    }
  };
  
  // Determine avatar background color 
  // This is a simple hash function to generate consistent colors
  const getAvatarColor = (name: string) => {
    const colors = ["bg-primary", "bg-secondary", "bg-accent", "bg-destructive"];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };
  
  return (
    <div className="border-b border-neutral-200 hover:bg-neutral-50 transition-colors cursor-pointer p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start">
          <div className="mr-4">
            <Avatar className={`h-9 w-9 ${getAvatarColor(ticket.name)}`}>
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </div>
          <div>
            <div className="flex items-center mb-1">
              <span className={`w-2 h-2 rounded-full mr-2 ${priorityColor[ticket.priority as keyof typeof priorityColor]}`}></span>
              <h3 className="font-medium">{ticket.subject}</h3>
              <Badge variant="outline" className="ml-2 text-xs bg-neutral-200 text-neutral-700">
                {categoryDisplay[ticket.category as keyof typeof categoryDisplay]}
              </Badge>
            </div>
            <p className="text-sm text-neutral-500 mb-2">{ticket.description}</p>
            <div className="flex items-center text-xs text-neutral-500">
              <span className="mr-3">#{ticket.ticketNumber}</span>
              <span className="mr-3">{ticket.name}</span>
              <span>Opened: {formatDate(new Date(ticket.createdAt))}</span>
            </div>
          </div>
        </div>
        <div>
          <div className="flex items-center mb-2">
            <Badge className={ticket.priority === 'high' 
              ? 'bg-destructive' 
              : ticket.priority === 'medium' 
                ? 'bg-warning' 
                : 'bg-success'
            }>
              {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
            </Badge>
          </div>
          <div className="text-right text-xs text-neutral-500">
            Updated: {formatDate(new Date(ticket.updatedAt))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function TicketList({ onNewTicket }: TicketListProps) {
  const [filter, setFilter] = useState("all");
  
  // Fetch tickets
  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['/api/tickets'],
  });
  
  // Filter tickets based on selected filter
  const filteredTickets = tickets.filter((ticket: Ticket) => {
    if (filter === 'all') return true;
    if (filter === 'open') return ticket.status === 'open';
    if (filter === 'closed') return ticket.status === 'closed';
    if (filter === 'high') return ticket.priority === 'high';
    return true;
  });
  
  return (
    <Card>
      <CardHeader className="p-4 border-b flex flex-row items-center justify-between">
        <CardTitle>Recent Tickets</CardTitle>
        <div className="flex space-x-2">
          <Select 
            defaultValue={filter} 
            onValueChange={(value) => setFilter(value)}
          >
            <SelectTrigger className="w-[150px] h-8 text-sm">
              <SelectValue placeholder="All tickets" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tickets</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
              <SelectItem value="high">High priority</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="link" className="text-primary">
            View All
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {isLoading ? (
          // Loading skeleton
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border-b border-neutral-200 p-4">
              <div className="flex items-start">
                <Skeleton className="h-9 w-9 rounded-full mr-4" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-6 w-16 ml-4" />
              </div>
            </div>
          ))
        ) : filteredTickets.length > 0 ? (
          // Ticket list
          filteredTickets.map((ticket: Ticket) => (
            <TicketItem key={ticket.id} ticket={ticket} />
          ))
        ) : (
          // Empty state
          <div className="py-8 text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-neutral-100 flex items-center justify-center mb-3">
              <User className="h-6 w-6 text-neutral-400" />
            </div>
            <h3 className="text-lg font-medium text-neutral-700 mb-1">No tickets found</h3>
            <p className="text-neutral-500 text-sm mb-4">There are no tickets matching your criteria.</p>
            <Button onClick={onNewTicket} className="bg-primary hover:bg-primary/90">
              Create New Ticket
            </Button>
          </div>
        )}
      </CardContent>
      
      {filteredTickets.length > 0 && (
        <CardFooter className="p-4 text-center border-t">
          <Button 
            onClick={onNewTicket} 
            className="mx-auto bg-primary hover:bg-primary/90"
          >
            Create New Ticket
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
