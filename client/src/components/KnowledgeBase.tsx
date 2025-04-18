import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

// Knowledge base articles data
const articles = [
  {
    id: 1,
    title: "How to reset your password",
    url: "#",
  },
  {
    id: 2,
    title: "Understanding your EOB statement",
    url: "#",
  },
  {
    id: 3,
    title: "Filing a claim online",
    url: "#",
  },
  {
    id: 4,
    title: "Finding in-network providers",
    url: "#",
  },
  {
    id: 5,
    title: "Updating your contact information",
    url: "#",
  },
];

export default function KnowledgeBase() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Popular Knowledge Base Articles</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {articles.map(article => (
            <li key={article.id}>
              <a 
                href={article.url} 
                className="flex items-center text-sm hover:text-primary transition-colors"
              >
                <FileText className="h-4 w-4 text-neutral-400 mr-2" />
                <span>{article.title}</span>
              </a>
            </li>
          ))}
        </ul>
        
        <div className="mt-4 text-center">
          <Button variant="link" className="text-primary hover:text-primary/90">
            View All Articles
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
