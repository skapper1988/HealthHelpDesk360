import { useState } from "react";
import { Bell, Search, ChevronDown, Menu } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  DropdownMenu,
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  toggleSidebar: () => void;
}

export default function Header({ toggleSidebar }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  
  return (
    <header className="bg-white border-b border-neutral-200 py-2 px-4 flex justify-between items-center shadow-sm">
      <div className="flex items-center">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleSidebar} 
          className="md:hidden mr-2"
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        <div className="flex items-center">
          <span className="font-semibold text-xl text-primary mr-1">Health</span>
          <span className="font-semibold text-xl text-secondary mr-1">Help</span>
          <span className="font-semibold text-xl text-accent">Desk360</span>
        </div>
      </div>
      
      <div className="flex items-center">
        <div className="relative mr-4 hidden sm:block">
          <Input
            type="text"
            placeholder="Search..."
            className="w-40 md:w-64 h-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="h-4 w-4 absolute right-3 top-2.5 text-neutral-400" />
        </div>
        
        <div className="flex items-center">
          <div className="mr-4 relative">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5 text-neutral-500" />
              <span className="absolute -top-1 -right-1 bg-destructive text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                3
              </span>
            </Button>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center cursor-pointer">
                <Avatar className="h-8 w-8 bg-secondary text-white">
                  <AvatarFallback>JS</AvatarFallback>
                </Avatar>
                <span className="ml-2 text-sm font-medium hidden md:block">John Smith</span>
                <ChevronDown className="h-4 w-4 ml-1 text-neutral-500" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
