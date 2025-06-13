# AI Agent Setup Guide

## Overview

This project now includes a unified AI agent powered by the OpenAI Agents SDK that can handle both general conversation and inventory management operations.

## Features

### Unified Agent Capabilities

- **General Conversation**: Answer questions, provide explanations, have friendly conversations
- **Inventory Management**: Search products, manage stock levels, track inventory movements
- **Customer Management**: Find and create customer records
- **Sales Analysis**: View sales history and performance data
- **Reporting**: Generate inventory reports, low stock alerts, category summaries

## Setup Instructions

### 1. Environment Variables

Create or update your `.env.local` file in the project root with your OpenAI API key:

```bash
# OpenAI API configuration
OPENAI_API_KEY=your-openai-api-key-here

# Replace 'your-openai-api-key-here' with your actual OpenAI API key
# You can get one from: https://platform.openai.com/api-keys
```

### 2. Dependencies

The OpenAI Agents SDK is already installed:

```bash
npm install @openai/agents --legacy-peer-deps
```

### 3. Database Requirements

Ensure your database is set up with the required tables:

- `products` - Product inventory
- `customers` - Customer records
- `sales` - Sales transactions
- `sale_items` - Individual sale line items
- `inventory_movements` - Stock movement tracking

## API Endpoints

### Chat with AI Agent

- **POST** `/api/agent/chat`
- **Body**: `{ "message": "your message here" }`
- **Response**: `{ "success": true, "response": "agent response", "user": "username" }`

### Test Agent Tools

- **GET** `/api/agent/test?action=products` - Test product retrieval
- **GET** `/api/agent/test?action=customers` - Test customer retrieval
- **GET** `/api/agent/test?action=sales` - Test sales retrieval
- **GET** `/api/agent/test?action=low-stock` - Test low stock report
- **GET** `/api/agent/test?action=categories` - Test category summary

## Usage Examples

### General Questions

```
User: "What's the weather like today?"
Agent: [Provides general information and conversation]
```

### Inventory Operations

```
User: "Show me products that are low on stock"
Agent: [Calls get_inventory_report tool and displays low stock products]

User: "Create a new customer named John Doe with email john@example.com"
Agent: [Calls create_customer tool and confirms creation]

User: "What are my recent sales?"
Agent: [Calls get_sales tool and displays recent sales data]
```

## File Structure

```
src/
├── lib/
│   ├── ai-agent.ts          # Unified agent configuration
│   ├── agent-tools.ts       # Database tool functions
│   └── prisma.ts           # Database client
├── app/api/agent/
│   ├── chat/route.ts       # Main chat API endpoint
│   └── test/route.ts       # Tool testing endpoint
├── hooks/
│   └── use-agent-chat.ts   # React hook for chat functionality
└── app/(dashboard)/chat/
    └── page.tsx            # Chat interface component
```

## Key Features

### Automatic Context Handling

- User ID is automatically extracted from authentication
- Database operations are scoped to the authenticated user
- Error handling with user-friendly messages

### Smart Tool Selection

- Agent automatically determines when to use inventory tools vs. general conversation
- Seamless switching between basic and inventory operations
- Context-aware responses with proper formatting

### Enhanced UI

- Real-time chat interface
- Quick action buttons for common operations
- Error display and loading states
- Markdown support for formatted responses

## Troubleshooting

### Common Issues

1. **"Unauthorized" Error**

   - Ensure user is logged in
   - Check authentication setup in `/lib/auth.ts`

2. **"OpenAI API Error"**

   - Verify `OPENAI_API_KEY` is set correctly
   - Check API key has sufficient credits
   - Ensure API key has the right permissions

3. **Database Errors**
   - Verify database connection
   - Check Prisma schema matches your database
   - Run `npx prisma generate` if schema changed

### Testing the Agent

Visit `/chat` in your application to test the AI agent, or use the API endpoints directly:

```bash
# Test the chat endpoint
curl -X POST http://localhost:3000/api/agent/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Show me low stock products"}'

# Test tool functionality
curl http://localhost:3000/api/agent/test?action=products
```

## Next Steps

1. **Enhanced Tools**: Add more specific inventory operations
2. **Voice Integration**: Add voice chat capabilities using RealtimeAgent
3. **Analytics**: Add more sophisticated reporting tools
4. **Notifications**: Implement proactive alerts and notifications
