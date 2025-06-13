import { useState } from "react";

export interface ChatMessage {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  error?: string;
}

export interface AgentResponse {
  success: boolean;
  response?: string;
  user?: string;
  error?: string;
  details?: string;
}

export const useAgentChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      content:
        "Hello! I'm your AI assistant. I can help you with general questions or manage your inventory system. I can search products, track stock levels, manage customers, analyze sales, and generate reports. How can I help you today?",
      role: "assistant",
      timestamp: new Date(),
    },
  ]);

  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content,
      role: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/agent/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: content,
        }),
      });

      const data: AgentResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get response");
      }

      // Add assistant response
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content:
          data.response ||
          "Sorry, I encountered an error processing your request.",
        role: "assistant",
        timestamp: new Date(),
        error: data.success ? undefined : data.error,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);

      // Add error message
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : "Unknown error"}`,
        role: "assistant",
        timestamp: new Date(),
        error: error instanceof Error ? error.message : "Unknown error",
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearMessages = () => {
    setMessages([
      {
        id: "1",
        content:
          "Hello! I'm your AI assistant. I can help you with general questions or manage your inventory system. I can search products, track stock levels, manage customers, analyze sales, and generate reports. How can I help you today?",
        role: "assistant",
        timestamp: new Date(),
      },
    ]);
  };

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
  };
};
