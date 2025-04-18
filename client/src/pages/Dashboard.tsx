import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import TicketForm from "@/components/TicketForm";
import TicketList from "@/components/TicketList";
import ChatbotWidget from "@/components/ChatbotWidget";
import KnowledgeBase from "@/components/KnowledgeBase";
import StatCard from "@/components/StatCard";
import { useState } from "react";

export default function Dashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleTicketForm = () => {
    setShowNewTicketForm(!showNewTicketForm);
  };

  return (
    <div className="flex flex-col h-screen">
      <Header toggleSidebar={toggleSidebar} />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)}
          onNewTicket={toggleTicketForm}
        />
        
        <main className="flex-1 overflow-y-auto bg-neutral-100 p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-neutral-800">Dashboard</h1>
            <p className="text-neutral-500">Welcome back. Here's an overview of your support desk.</p>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Open Tickets"
              value="24"
              change="-12%"
              icon="ticket-alt"
              iconColor="primary"
              changeType="decrease" 
              description="Compared to last week"
            />
            <StatCard
              title="Resolved Today"
              value="16"
              change="+8%"
              icon="check-circle"
              iconColor="success"
              changeType="increase"
              description="Compared to yesterday"
            />
            <StatCard
              title="Avg. Response"
              value="3.2h"
              change="+5%"
              icon="clock"
              iconColor="warning"
              changeType="increase-negative"
              description="Compared to target (3h)"
            />
            <StatCard
              title="Chatbot Resolutions"
              value="42%"
              change="+7%"
              icon="robot"
              iconColor="secondary"
              changeType="increase"
              description="Issues resolved without agent"
            />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              {showNewTicketForm ? (
                <TicketForm onCancel={toggleTicketForm} />
              ) : (
                <TicketList onNewTicket={toggleTicketForm} />
              )}
            </div>
            
            <div>
              <ChatbotWidget />
              <div className="mt-6">
                <KnowledgeBase />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
