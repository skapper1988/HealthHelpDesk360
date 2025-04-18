import { 
  Home, 
  TicketIcon, 
  Users, 
  BarChart3, 
  FileText, 
  Headphones, 
  Plus, 
  X 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNewTicket: () => void;
}

interface SidebarLinkProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  active?: boolean;
}

const SidebarLink = ({ href, icon, children, active }: SidebarLinkProps) => {
  const [location, navigate] = useLocation();
  
  return (
    <a
      href={href}
      onClick={(e) => {
        e.preventDefault();
        navigate(href);
      }}
      className={cn(
        "flex items-center text-neutral-600 hover:text-primary px-4 py-2 transition-colors",
        active && "bg-primary/10 border-l-2 border-primary text-primary"
      )}
    >
      <div className="w-5 mr-3">{icon}</div>
      <span>{children}</span>
    </a>
  );
};

interface RecentTicketProps {
  title: string;
  ticketNumber: string;
  updatedTime: string;
  priority: "high" | "medium" | "low";
}

const RecentTicket = ({ title, ticketNumber, updatedTime, priority }: RecentTicketProps) => {
  const priorityColor = {
    high: "bg-destructive",
    medium: "bg-warning",
    low: "bg-success"
  };
  
  return (
    <a href="#" className="block p-2 rounded-md hover:bg-neutral-100 transition-colors">
      <div className="flex items-center">
        <span className={`w-2 h-2 rounded-full mr-2 ${priorityColor[priority]}`}></span>
        <span className="text-sm font-medium">{title}</span>
      </div>
      <p className="text-xs text-neutral-500 mt-1">#{ticketNumber} · {updatedTime}</p>
    </a>
  );
};

export default function Sidebar({ isOpen, onClose, onNewTicket }: SidebarProps) {
  const [location] = useLocation();
  
  return (
    <aside 
      className={cn(
        "bg-white w-64 border-r border-neutral-200 flex flex-col h-full",
        "fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="flex justify-end p-2 md:hidden">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>
      
      <nav className="py-4 flex-1 overflow-y-auto">
        <div className="px-4 mb-6">
          <Button 
            className="w-full bg-accent hover:bg-accent/90 text-white" 
            onClick={onNewTicket}
          >
            <Plus className="h-4 w-4 mr-2" />
            <span>New Ticket</span>
          </Button>
        </div>
        
        <div className="space-y-1">
          <SidebarLink 
            href="/" 
            icon={<Home className="h-5 w-5" />} 
            active={location === "/"}
          >
            Dashboard
          </SidebarLink>
          
          <SidebarLink 
            href="/tickets" 
            icon={<TicketIcon className="h-5 w-5" />} 
            active={location === "/tickets"}
          >
            Tickets
          </SidebarLink>
          
          <SidebarLink 
            href="/team" 
            icon={<Users className="h-5 w-5" />} 
            active={location === "/team"}
          >
            My Team
          </SidebarLink>
          
          <SidebarLink 
            href="/analytics" 
            icon={<BarChart3 className="h-5 w-5" />} 
            active={location === "/analytics"}
          >
            Analytics
          </SidebarLink>
          
          <SidebarLink 
            href="/knowledge-base" 
            icon={<FileText className="h-5 w-5" />} 
            active={location === "/knowledge-base"}
          >
            Knowledge Base
          </SidebarLink>
        </div>
        
        <div className="mt-8 px-4">
          <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
            Recent Tickets
          </h3>
          
          <div className="space-y-2">
            <RecentTicket 
              title="Login issues" 
              ticketNumber="HD-2305" 
              updatedTime="Updated 1h ago" 
              priority="high" 
            />
            
            <RecentTicket 
              title="Claim denied" 
              ticketNumber="HD-2304" 
              updatedTime="Updated 3h ago" 
              priority="medium" 
            />
            
            <RecentTicket 
              title="Document upload" 
              ticketNumber="HD-2303" 
              updatedTime="Updated 1d ago" 
              priority="low" 
            />
          </div>
        </div>
      </nav>
      
      <div className="border-t border-neutral-200 p-4">
        <div className="flex items-center">
          <Headphones className="h-5 w-5 text-neutral-500 mr-3" />
          <div>
            <h4 className="text-sm font-medium">Support Center</h4>
            <p className="text-xs text-neutral-500">Need help?</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
