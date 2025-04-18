import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  icon: string;
  iconColor: "primary" | "secondary" | "success" | "warning" | "error";
  changeType: "increase" | "decrease" | "increase-negative";
  description: string;
}

export default function StatCard({
  title,
  value,
  change,
  icon,
  iconColor,
  changeType,
  description
}: StatCardProps) {
  // Map icon name to its className for Font Awesome
  const iconClass = `fas fa-${icon}`;
  
  // Map color to appropriate Tailwind classes
  const colorClasses = {
    primary: {
      bg: "bg-primary-light bg-opacity-20",
      text: "text-primary"
    },
    secondary: {
      bg: "bg-secondary bg-opacity-20",
      text: "text-secondary"
    },
    success: {
      bg: "bg-success bg-opacity-20",
      text: "text-success"
    },
    warning: {
      bg: "bg-warning bg-opacity-20",
      text: "text-warning"
    },
    error: {
      bg: "bg-destructive bg-opacity-20",
      text: "text-destructive"
    }
  };
  
  // Map change type to appropriate arrow and color
  const changeDisplay = {
    "increase": {
      icon: "fas fa-arrow-up",
      color: "text-success"
    },
    "decrease": {
      icon: "fas fa-arrow-down",
      color: "text-success"
    },
    "increase-negative": {
      icon: "fas fa-arrow-up",
      color: "text-destructive"
    }
  };
  
  return (
    <Card className="border border-neutral-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-neutral-500 font-medium">{title}</h3>
          <div className={cn("h-8 w-8 rounded-full flex items-center justify-center", colorClasses[iconColor].bg)}>
            <i className={cn(iconClass, colorClasses[iconColor].text)}></i>
          </div>
        </div>
        <div className="flex items-end">
          <span className="text-2xl font-semibold text-neutral-800">{value}</span>
          <span className={cn("ml-2 text-xs flex items-center", changeDisplay[changeType].color)}>
            <i className={cn(changeDisplay[changeType].icon, "mr-1")}></i>
            {change}
          </span>
        </div>
        <p className="text-xs text-neutral-500 mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}
