import { NextRequest, NextResponse } from "next/server";
import { run } from "@openai/agents";
import { createUnifiedAgent, addToMemory } from "@/lib/ai-agent";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // Get the session to verify user authentication
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Use user ID as session ID for memory management (we know it exists from the check above)
    const sessionId = session.user.id as string;

    // Add user message to memory
    addToMemory(sessionId, "user", message);

    // Create the unified agent with session-based memory
    const agent = createUnifiedAgent(sessionId);

    // Add user context to the message for database operations
    const contextualMessage = `[USER_ID: ${sessionId}] ${message}`;

    // Run the agent with the user's message
    const result = await run(agent, contextualMessage);

    // Add assistant response to memory
    addToMemory(sessionId, "assistant", result.finalOutput);

    return NextResponse.json({
      success: true,
      response: result.finalOutput,
      user: session.user.name || session.user.email,
      sessionId: sessionId, // Include session ID for debugging
    });
  } catch (error) {
    console.error("Agent error:", error);

    return NextResponse.json(
      {
        error: "Failed to process request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "AI Agent Chat API is running",
    capabilities: [
      "General conversation and question answering",
      "Product management and inventory control",
      "Stock level tracking and updates",
      "Customer management",
      "Sales analysis and reporting",
      "Inventory reporting and alerts",
      "Low stock monitoring",
      "Conversation memory and context awareness",
    ],
  });
}
