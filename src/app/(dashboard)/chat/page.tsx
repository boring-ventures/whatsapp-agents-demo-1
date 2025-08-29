"use client";

// Force dynamic rendering to prevent static generation issues with cookies
export const dynamic = "force-dynamic";

import { Send, Bot, User, Settings, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAgentChat } from "@/hooks/use-agent-chat";
import { useState } from "react";

export default function ChatPage() {
  const { messages, isLoading, sendMessage, clearMessages } = useAgentChat();

  const [inputValue, setInputValue] = useState("");

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    await sendMessage(inputValue);
    setInputValue("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] w-full p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">AI Assistant Chat</h1>
            <p className="text-muted-foreground">
              Chat with your AI assistant for general questions and inventory
              management
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="default"
              className="bg-gradient-to-r from-blue-500 to-purple-600"
            >
              <Zap className="w-3 h-3 mr-1" />
              Unified Agent
            </Badge>
            <Button variant="outline" size="sm" onClick={clearMessages}>
              <Settings className="w-4 h-4 mr-2" />
              Clear Chat
            </Button>
          </div>
        </div>
      </div>

      <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-4 h-4 text-blue-600" />
          <span className="font-medium text-blue-900">
            AI Assistant Capabilities
          </span>
        </div>
        <p className="text-sm text-blue-700">
          I can help you with general questions, manage inventory, track
          products, handle customers, analyze sales, and generate reports. Try
          asking: <strong>&quot;Show me low stock products&quot;</strong> or{" "}
          <strong>&quot;Create a new customer&quot;</strong> or{" "}
          <strong>&quot;What&apos;s the weather like?&quot;</strong>
        </p>
      </div>

      <Card className="flex-1 flex flex-col w-full">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start gap-3 ${
                  message.role === "user" ? "flex-row-reverse" : "flex-row"
                }`}
              >
                <Avatar className="w-8 h-8">
                  <AvatarFallback>
                    {message.role === "user" ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Bot className="w-4 h-4" />
                    )}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`rounded-lg px-3 py-2 max-w-[70%] ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground ml-auto"
                      : message.error
                        ? "bg-destructive/10 border border-destructive/20"
                        : "bg-muted"
                  }`}
                >
                  {message.error && (
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="destructive" className="text-xs">
                        Error
                      </Badge>
                    </div>
                  )}
                  <div className="text-sm whitespace-pre-wrap prose prose-sm max-w-none">
                    {message.content}
                  </div>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarFallback>
                    <Bot className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">
                      AI Processing
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Thinking...
                    </span>
                  </div>
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything or request inventory operations..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              size="icon"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() =>
                setInputValue("Show me products that are low on stock")
              }
              disabled={isLoading}
            >
              Low Stock Alert
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => setInputValue("Show me recent sales")}
              disabled={isLoading}
            >
              Recent Sales
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() =>
                setInputValue("Generate inventory report by category")
              }
              disabled={isLoading}
            >
              Category Report
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => setInputValue("Search for customers")}
              disabled={isLoading}
            >
              Find Customers
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => setInputValue("What's the weather like today?")}
              disabled={isLoading}
            >
              General Question
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
