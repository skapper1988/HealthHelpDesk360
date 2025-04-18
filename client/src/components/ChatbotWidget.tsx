import { useState, useEffect, useRef } from "react";
import { Send, Paperclip, Mic, MoreVertical } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ChatMessage } from "@/lib/types";
import { queryClient } from "@/lib/queryClient";
import { insertTicketSchema } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export default function ChatbotWidget() {
  const [message, setMessage] = useState("");
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [ticketData, setTicketData] = useState<any>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Get the session ID from localStorage
  const sessionId = localStorage.getItem('chatSessionId') || 'default-session';
  
  // Fetch previous messages
  const { data: messages = [] } = useQuery<ChatMessage[]>({
    queryKey: [`/api/chat/${sessionId}`],
    refetchInterval: false,
  });
  
  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", "/api/chat", {
        sessionId,
        message: content,
      });
      return response.json();
    },
    onSuccess: (data) => {
      // If the chatbot suggests creating a ticket
      if (data.createTicket && data.ticketData) {
        setTicketData(data.ticketData);
        setShowTicketForm(true);
      }
      
      // Invalidate and refetch messages
      queryClient.invalidateQueries({ queryKey: [`/api/chat/${sessionId}`] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    sendMessageMutation.mutate(message);
    setMessage("");
  };
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current;
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  }, [messages]);
  
  // Initialize with a welcome message if there are no messages
  useEffect(() => {
    if (messages && messages.length === 0) {
      sendMessageMutation.mutate("Hello");
    }
  }, [messages]);
  
  // Create ticket form schema based on shared schema
  const ticketFormSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    subject: z.string().min(5, "Subject must be at least 5 characters"),
    category: z.string().min(1, "Category is required"),
    priority: z.enum(["low", "medium", "high"], {
      errorMap: () => ({ message: "Priority must be low, medium, or high" }),
    }),
  });
  
  type TicketFormValues = z.infer<typeof ticketFormSchema>;
  
  // Create ticket form
  const form = useForm<TicketFormValues>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: ticketData?.subject || "",
      description: ticketData?.description || "",
      category: ticketData?.category || "",
      priority: ticketData?.priority || "medium",
    },
  });
  
  // Update form defaults when ticketData changes
  useEffect(() => {
    if (ticketData) {
      form.setValue("subject", ticketData.subject || "");
      form.setValue("description", ticketData.description || "");
      form.setValue("category", ticketData.category || "");
      form.setValue("priority", ticketData.priority || "medium");
    }
  }, [ticketData, form]);
  
  // Create ticket mutation
  const createTicketMutation = useMutation({
    mutationFn: async (data: TicketFormValues) => {
      const response = await apiRequest("POST", "/api/tickets", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Ticket Created",
        description: `Ticket #${data.ticketNumber} has been created successfully.`,
      });
      setShowTicketForm(false);
      
      // Send confirmation to chatbot
      sendMessageMutation.mutate(`Thank you for creating ticket #${data.ticketNumber} for me.`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create ticket. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const onSubmitTicket = (data: TicketFormValues) => {
    createTicketMutation.mutate(data);
  };
  
  return (
    <>
      <Card className="h-[600px] flex flex-col">
        <CardHeader className="p-4 border-b bg-primary text-white flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center mr-3">
              <i className="fas fa-robot" />
            </div>
            <div>
              <h2 className="font-semibold text-base">HealthBot Assistant</h2>
              <div className="flex items-center text-xs">
                <span className="h-2 w-2 rounded-full bg-green-400 mr-1"></span>
                <span>Online</span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="text-white">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </CardHeader>
        
        <ScrollArea className="flex-1 p-4 bg-neutral-50" ref={scrollAreaRef}>
          {messages && messages.map((msg: ChatMessage, index: number) => (
            <div 
              key={index}
              className={`chat-message ${msg.sender === 'user' ? 'message-user' : 'message-agent'} max-w-[80%] mb-3 p-3 rounded-xl ${
                msg.sender === 'user' 
                  ? 'bg-neutral-200 text-neutral-800 ml-auto rounded-tr-sm' 
                  : 'bg-primary text-white mr-auto rounded-tl-sm'
              }`}
            >
              <div className="text-sm whitespace-pre-line">{msg.message}</div>
            </div>
          ))}
          
          {sendMessageMutation.isPending && (
            <div className="chat-message message-agent max-w-[80%] mb-3 p-3 rounded-xl bg-primary text-white mr-auto rounded-tl-sm opacity-70">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '600ms' }}></div>
              </div>
            </div>
          )}
        </ScrollArea>
        
        <CardFooter className="p-3 border-t border-neutral-200">
          <form onSubmit={handleSendMessage} className="flex w-full items-center">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              className="flex-1 border-neutral-300 focus:ring-primary"
            />
            <Button type="submit" className="ml-2 bg-primary hover:bg-primary/90">
              <Send className="h-4 w-4" />
            </Button>
          </form>
          
          <div className="mt-2 flex items-center justify-between w-full text-xs text-neutral-500">
            <div className="flex items-center">
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Mic className="h-4 w-4" />
              </Button>
            </div>
            <div>
              <span>Powered by OpenAI</span>
            </div>
          </div>
        </CardFooter>
      </Card>
      
      {/* Ticket Form Dialog */}
      <Dialog open={showTicketForm} onOpenChange={setShowTicketForm}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create Support Ticket</DialogTitle>
            <DialogDescription>
              Please complete the following form to create a support ticket based on your conversation.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitTicket)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your name" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your email" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FormControl>
                      <Input placeholder="Briefly describe your issue" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="authentication">Authentication / Login</SelectItem>
                        <SelectItem value="claims">Claims & Billing</SelectItem>
                        <SelectItem value="coverage">Coverage Information</SelectItem>
                        <SelectItem value="providers">Finding Providers</SelectItem>
                        <SelectItem value="documentation">Documents & Forms</SelectItem>
                        <SelectItem value="technical">Technical Support</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Priority</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex space-x-4"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="low" />
                          </FormControl>
                          <FormLabel className="font-normal">Low</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="medium" />
                          </FormControl>
                          <FormLabel className="font-normal">Medium</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="high" />
                          </FormControl>
                          <FormLabel className="font-normal">High</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Please provide details about your issue..."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end space-x-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowTicketForm(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-primary hover:bg-primary/90"
                  disabled={createTicketMutation.isPending}
                >
                  {createTicketMutation.isPending ? "Creating..." : "Create Ticket"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
