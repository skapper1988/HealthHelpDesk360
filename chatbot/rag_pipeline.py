from typing import Dict, Any, Optional, List

# Simple in-memory knowledge base
KNOWLEDGE_BASE = [
    {
        "topic": "login",
        "keywords": ["login", "password", "account access", "sign in", "can't log in", "reset password"],
        "answer": "I understand you're having login issues. I can help create a ticket for our technical team to assist you.",
        "should_create_ticket": True,
        "ticket_data": {
            "subject": "Login Access Issues",
            "category": "authentication",
            "priority": "high",
            "description": ""
        }
    },
    {
        "topic": "claims",
        "keywords": ["claim", "denied", "rejected", "not covered", "bill", "reimbursement"],
        "answer": "I'm sorry to hear about your claim issue. Let me create a ticket for our claims department to look into this.",
        "should_create_ticket": True,
        "ticket_data": {
            "subject": "Claim Processing Issue",
            "category": "claims",
            "priority": "medium",
            "description": ""
        }
    },
    {
        "topic": "documents",
        "keywords": ["upload", "document", "file", "attachment", "form", "paperwork"],
        "answer": "To upload documents, go to 'My Account' > 'Documents' > 'Upload New'. You can upload files up to 10MB in PDF, JPG, or PNG format.",
        "should_create_ticket": False
    },
    {
        "topic": "providers",
        "keywords": ["doctor", "provider", "specialist", "hospital", "clinic", "in-network"],
        "answer": "To find in-network providers, you can use our provider directory by clicking on 'Find a Provider' in the main menu.",
        "should_create_ticket": False
    },
    {
        "topic": "technical",
        "keywords": ["error", "problem", "not working", "issue", "bug", "glitch"],
        "answer": "I'm sorry you're experiencing technical difficulties. I'll create a support ticket for our technical team to investigate this issue.",
        "should_create_ticket": True,
        "ticket_data": {
            "subject": "Technical Issue Report",
            "category": "technical",
            "priority": "medium",
            "description": ""
        }
    }
]

def process_query(message: str, session_id: str) -> Dict[str, Any]:
    """
    Process a user query through a RAG-like pipeline.
    
    In a real implementation, this would use embeddings and vector search,
    but for this example we're using simple keyword matching.
    """
    message_lower = message.lower()
    
    # Default response if no match is found
    response = {
        "message": "I'm here to help with your healthcare questions. How can I assist you today?",
        "create_ticket": False,
        "ticket_data": None
    }
    
    # Find the best matching topic in our knowledge base
    best_match = None
    max_keywords = 0
    
    for kb_item in KNOWLEDGE_BASE:
        # Count how many keywords match
        matching_keywords = sum(1 for keyword in kb_item["keywords"] if keyword in message_lower)
        
        if matching_keywords > max_keywords:
            max_keywords = matching_keywords
            best_match = kb_item
    
    # If we found a good match, use it for the response
    if best_match and max_keywords > 0:
        response["message"] = best_match["answer"]
        response["create_ticket"] = best_match.get("should_create_ticket", False)
        
        if response["create_ticket"] and "ticket_data" in best_match:
            # Copy the ticket data and add the user's message to the description
            ticket_data = best_match["ticket_data"].copy()
            ticket_data["description"] = f"User reported: \"{message}\""
            response["ticket_data"] = ticket_data
    
    return response
