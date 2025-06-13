import { Agent, tool } from "@openai/agents";
import {
  getProducts,
  createProduct,
  updateStock,
  getCustomers,
  createCustomer,
  getSales,
  getInventoryReport,
} from "./agent-tools";

// Memory management for conversation context
interface ConversationMemory {
  messages: Array<{
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
  }>;
  context: {
    currentProduct?: {
      id: string;
      name: string;
      stock_quantity: number;
      min_stock_level: number;
    };
    currentCustomer?: {
      id: string;
      name: string;
    };
    lastAction?: string;
    userId?: string;
  };
}

// In-memory storage for conversation contexts (in production, use Redis or database)
const conversationMemories = new Map<string, ConversationMemory>();

// Helper function to get or create memory for a session
const getConversationMemory = (sessionId: string): ConversationMemory => {
  if (!conversationMemories.has(sessionId)) {
    conversationMemories.set(sessionId, {
      messages: [],
      context: {},
    });
  }
  return conversationMemories.get(sessionId)!;
};

// Helper function to add message to memory
const addToMemory = (
  sessionId: string,
  role: "user" | "assistant",
  content: string
) => {
  const memory = getConversationMemory(sessionId);
  memory.messages.push({
    role,
    content,
    timestamp: new Date(),
  });

  // Keep only last 10 messages to prevent memory bloat
  if (memory.messages.length > 10) {
    memory.messages = memory.messages.slice(-10);
  }
};

// Helper function to update context
const updateContext = (
  sessionId: string,
  updates: Partial<ConversationMemory["context"]>
) => {
  const memory = getConversationMemory(sessionId);
  memory.context = { ...memory.context, ...updates };
};

// Helper function to get conversation context as string
const getContextString = (sessionId: string): string => {
  const memory = getConversationMemory(sessionId);
  let contextStr = "";

  // Add recent conversation history
  if (memory.messages.length > 0) {
    contextStr += "\n## Recent Conversation:\n";
    memory.messages.slice(-5).forEach((msg) => {
      contextStr += `${msg.role.toUpperCase()}: ${msg.content}\n`;
    });
  }

  // Add current context
  if (Object.keys(memory.context).length > 0) {
    contextStr += "\n## Current Context:\n";

    if (memory.context.currentProduct) {
      contextStr += `- Currently discussing product: "${memory.context.currentProduct.name}" (ID: ${memory.context.currentProduct.id})\n`;
      contextStr += `  - Current stock: ${memory.context.currentProduct.stock_quantity}\n`;
      contextStr += `  - Minimum level: ${memory.context.currentProduct.min_stock_level}\n`;
    }

    if (memory.context.currentCustomer) {
      contextStr += `- Currently discussing customer: "${memory.context.currentCustomer.name}" (ID: ${memory.context.currentCustomer.id})\n`;
    }

    if (memory.context.lastAction) {
      contextStr += `- Last action performed: ${memory.context.lastAction}\n`;
    }

    if (memory.context.userId) {
      contextStr += `- User ID: ${memory.context.userId}\n`;
    }
  }

  return contextStr;
};

// Type definitions for tool parameters
interface GetProductsParams {
  category?: string | null;
  lowStock?: boolean | null;
  search?: string | null;
}

interface CreateProductParams {
  name: string;
  description?: string | null;
  price: number;
  stock_quantity: number;
  min_stock_level?: number | null;
  category?: string | null;
  barcode?: string | null;
  userId: string;
}

interface UpdateStockParams {
  productId: string;
  quantity: number;
  movementType: "purchase" | "sale" | "adjustment" | "return";
  notes?: string | null;
  userId: string;
}

interface GetCustomersParams {
  search?: string | null;
  limit?: number | null;
}

interface CreateCustomerParams {
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  userId: string;
}

interface GetSalesParams {
  customerId?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  limit?: number | null;
}

interface GetInventoryReportParams {
  type: "low_stock" | "movement_summary" | "category_summary";
  days?: number | null;
}

// Create a unified AI agent that can handle both basic and inventory operations
export const createUnifiedAgent = (sessionId: string = "default") => {
  const getProductsTool = tool({
    name: "get_products",
    description:
      "Search and retrieve products from the inventory. Can filter by category, search term, or show only low stock items.",
    parameters: {
      type: "object",
      properties: {
        category: {
          type: ["string", "null"],
          description: "Product category to filter by (optional)",
        },
        lowStock: {
          type: ["boolean", "null"],
          description: "Whether to show only low stock products (optional)",
        },
        search: {
          type: ["string", "null"],
          description:
            "Search term for product name, description, or barcode (optional)",
        },
      },
      required: ["category", "lowStock", "search"],
      additionalProperties: false,
    },
    execute: async (params: GetProductsParams) => {
      // Convert null values to undefined for processing
      const cleanParams = {
        category: params.category || undefined,
        lowStock: params.lowStock || undefined,
        search: params.search || undefined,
      };

      const result = await getProducts(cleanParams);

      // Update context if we found products
      if (result.length > 0) {
        updateContext(sessionId, {
          lastAction: `Retrieved ${result.length} products`,
          // If searching for a specific product, set it as current
          ...(params.search && result.length === 1
            ? {
                currentProduct: {
                  id: result[0].id,
                  name: result[0].name,
                  stock_quantity: result[0].stock_quantity,
                  min_stock_level: result[0].min_stock_level || 5,
                },
              }
            : {}),
        });
      }

      return JSON.stringify(result);
    },
  });

  const createProductTool = tool({
    name: "create_product",
    description: "Create a new product in the inventory system.",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Product name",
        },
        description: {
          type: ["string", "null"],
          description: "Product description (optional)",
        },
        price: {
          type: "number",
          description: "Product price",
        },
        stock_quantity: {
          type: "number",
          description: "Initial stock quantity",
        },
        min_stock_level: {
          type: ["number", "null"],
          description:
            "Minimum stock level for alerts (optional, defaults to 5)",
        },
        category: {
          type: ["string", "null"],
          description: "Product category (optional)",
        },
        barcode: {
          type: ["string", "null"],
          description: "Product barcode (optional)",
        },
        userId: {
          type: "string",
          description: "User ID creating the product",
        },
      },
      required: [
        "name",
        "description",
        "price",
        "stock_quantity",
        "min_stock_level",
        "category",
        "barcode",
        "userId",
      ],
      additionalProperties: false,
    },
    execute: async (params: CreateProductParams) => {
      const result = await createProduct(params);

      // Update context with the newly created product
      updateContext(sessionId, {
        currentProduct: {
          id: result.id,
          name: result.name,
          stock_quantity: result.stock_quantity,
          min_stock_level: params.min_stock_level || 5,
        },
        lastAction: `Created product "${result.name}"`,
        userId: params.userId,
      });

      return JSON.stringify(result);
    },
  });

  const updateStockTool = tool({
    name: "update_stock",
    description:
      "Update stock levels for a product. This creates an inventory movement record.",
    parameters: {
      type: "object",
      properties: {
        productId: {
          type: "string",
          description: "Product ID to update",
        },
        quantity: {
          type: "number",
          description:
            "Quantity change (positive for increase, negative for decrease)",
        },
        movementType: {
          type: "string",
          enum: ["purchase", "sale", "adjustment", "return"],
          description: "Type of stock movement",
        },
        notes: {
          type: ["string", "null"],
          description: "Notes about the stock movement (optional)",
        },
        userId: {
          type: "string",
          description: "User ID performing the update",
        },
      },
      required: ["productId", "quantity", "movementType", "notes", "userId"],
      additionalProperties: false,
    },
    execute: async (params: UpdateStockParams) => {
      const result = await updateStock(params);

      // Update context with the updated product info
      updateContext(sessionId, {
        currentProduct: {
          id: result.product.id,
          name: result.product.name,
          stock_quantity: result.product.new_stock,
          min_stock_level: 5, // We don't get this back from the update, so use default
        },
        lastAction: `Updated stock for "${result.product.name}" by ${params.quantity} (${params.movementType})`,
        userId: params.userId,
      });

      return JSON.stringify(result);
    },
  });

  const getCustomersTool = tool({
    name: "get_customers",
    description: "Search and retrieve customer information.",
    parameters: {
      type: "object",
      properties: {
        search: {
          type: ["string", "null"],
          description:
            "Search term for customer name, email, or phone (optional)",
        },
        limit: {
          type: ["number", "null"],
          description:
            "Maximum number of customers to return (optional, defaults to 10)",
        },
      },
      required: ["search", "limit"],
      additionalProperties: false,
    },
    execute: async (params: GetCustomersParams) => {
      const result = await getCustomers(params);

      // Update context if we found customers
      if (result.length > 0) {
        updateContext(sessionId, {
          lastAction: `Retrieved ${result.length} customers`,
          // If searching for a specific customer, set it as current
          ...(params.search && result.length === 1
            ? {
                currentCustomer: {
                  id: result[0].id,
                  name: result[0].name,
                },
              }
            : {}),
        });
      }

      return JSON.stringify(result);
    },
  });

  const createCustomerTool = tool({
    name: "create_customer",
    description: "Create a new customer record.",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Customer name",
        },
        email: {
          type: ["string", "null"],
          description: "Customer email address (optional)",
        },
        phone: {
          type: ["string", "null"],
          description: "Customer phone number (optional)",
        },
        address: {
          type: ["string", "null"],
          description: "Customer address (optional)",
        },
        userId: {
          type: "string",
          description: "User ID creating the customer",
        },
      },
      required: ["name", "email", "phone", "address", "userId"],
      additionalProperties: false,
    },
    execute: async (params: CreateCustomerParams) => {
      const result = await createCustomer(params);

      // Update context with the newly created customer
      updateContext(sessionId, {
        currentCustomer: {
          id: result.id,
          name: result.name,
        },
        lastAction: `Created customer "${result.name}"`,
        userId: params.userId,
      });

      return JSON.stringify(result);
    },
  });

  const getSalesTool = tool({
    name: "get_sales",
    description:
      "Retrieve sales history with optional filtering by customer or date range.",
    parameters: {
      type: "object",
      properties: {
        customerId: {
          type: ["string", "null"],
          description: "Customer ID to filter by (optional)",
        },
        dateFrom: {
          type: ["string", "null"],
          description:
            "Start date for filtering in YYYY-MM-DD format (optional)",
        },
        dateTo: {
          type: ["string", "null"],
          description: "End date for filtering in YYYY-MM-DD format (optional)",
        },
        limit: {
          type: ["number", "null"],
          description:
            "Maximum number of sales to return (optional, defaults to 20)",
        },
      },
      required: ["customerId", "dateFrom", "dateTo", "limit"],
      additionalProperties: false,
    },
    execute: async (params: GetSalesParams) => {
      const result = await getSales(params);

      updateContext(sessionId, {
        lastAction: `Retrieved ${result.length} sales records`,
      });

      return JSON.stringify(result);
    },
  });

  const getInventoryReportTool = tool({
    name: "get_inventory_report",
    description:
      "Generate various inventory and sales reports including low stock alerts, movement summaries, and category analysis.",
    parameters: {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: ["low_stock", "movement_summary", "category_summary"],
          description: "Type of report to generate",
        },
        days: {
          type: ["number", "null"],
          description:
            "Number of days to include in the report (optional, defaults to 30)",
        },
      },
      required: ["type", "days"],
      additionalProperties: false,
    },
    execute: async (params: GetInventoryReportParams) => {
      const result = await getInventoryReport(params);

      updateContext(sessionId, {
        lastAction: `Generated ${params.type} report`,
      });

      return JSON.stringify(result);
    },
  });

  return new Agent({
    name: "UnifiedAssistant",
    instructions: `
You are a helpful AI assistant with specialized capabilities for inventory management. You can handle both general conversation and inventory system operations.

${getContextString(sessionId)}

## Your Dual Capabilities:

### Basic Mode Operations:
- Answer general questions clearly and accurately
- Provide helpful explanations on various topics
- Have friendly conversations
- Offer information assistance

### Inventory Mode Operations:
- **Product Management**: Search, create, and manage products in the inventory
- **Stock Management**: Update stock levels, track inventory movements
- **Customer Management**: Find and create customer records
- **Sales Analysis**: View sales history and performance
- **Reporting**: Generate various inventory and sales reports

## CRITICAL: ID Usage Guidelines
- **ALWAYS use proper UUIDs for productId**: Never use product names like "Test" as IDs
- **Get product ID first**: If user mentions a product by name, search for it first to get the proper UUID
- **Current product context**: Use the currentProduct.id from context when available
- **Example workflow**: 
  1. User says "add stock to Test product" 
  2. First search for products with name "Test" to get the UUID
  3. Then use that UUID for stock operations

## Key Guidelines:
1. **Use conversation memory**: Reference previous messages and context when relevant
2. **Remember current items**: If discussing a specific product or customer, remember their details
3. **Provide contextual responses**: Use the conversation history to give more relevant answers
4. **Suggest follow-up actions**: Based on previous interactions, suggest logical next steps
5. **ALWAYS validate IDs**: Never pass product names as productId - always use proper UUIDs
6. For inventory operations, use the available tools to interact with the database
7. Always provide clear, actionable responses with proper formatting
8. When showing data, format it in a readable way using tables or bullet points
9. For stock operations, always confirm the changes made
10. When showing monetary values, include currency formatting (assume USD)
11. For dates, use human-readable formats

## Memory and Context Usage:
- **Current Product**: If we're discussing a specific product, I'll remember its details including the proper UUID
- **Current Customer**: If we're discussing a specific customer, I'll remember their info
- **Recent Actions**: I'll remember what we just did and can reference it
- **User Preferences**: I'll remember your user ID and preferences within the conversation
- **Conversation Flow**: I'll maintain context across multiple messages

## User Context:
- When you see [USER_ID: xxx] in a message, extract that user ID and use it for any database operations that require a userId parameter
- Always prioritize accuracy and be explicit about what actions you're taking

## Response Formatting:
- Use markdown formatting for better readability
- Create tables for product lists, sales data, etc.
- Use bullet points for summaries
- Highlight important information like low stock alerts
- Always explain what you did and what the results mean

## Tool Usage Notes:
- For optional parameters, pass null if you don't want to filter by that parameter
- Always extract the userId from the user's message when it's provided in the format [USER_ID: xxx]
- Use appropriate date formats (YYYY-MM-DD) for date filtering
- Stock quantity changes can be positive (increase) or negative (decrease)
- **CRITICAL**: When updating stock, ALWAYS use the product's UUID (from context or search results), never use the product name
- If user refers to "this product" or "the current product", use currentProduct.id from context
- If user mentions a product by name, search for it first to get the proper UUID

You can seamlessly switch between basic conversation and inventory management based on what the user needs, while maintaining memory of our conversation.
    `,
    model: "gpt-4o",
    tools: [
      getProductsTool,
      createProductTool,
      updateStockTool,
      getCustomersTool,
      createCustomerTool,
      getSalesTool,
      getInventoryReportTool,
    ],
  });
};

// Export memory management functions for use in API routes
export { addToMemory, updateContext, getConversationMemory };
