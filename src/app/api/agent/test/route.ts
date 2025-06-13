import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getProducts,
  createProduct,
  getCustomers,
  getSales,
  getInventoryReport,
} from "@/lib/agent-tools";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    switch (action) {
      case "products":
        const products = await getProducts({});
        return NextResponse.json({
          success: true,
          data: products,
          count: products.length,
        });

      case "customers":
        const customers = await getCustomers({ limit: 5 });
        return NextResponse.json({
          success: true,
          data: customers,
          count: customers.length,
        });

      case "sales":
        const sales = await getSales({ limit: 5 });
        return NextResponse.json({
          success: true,
          data: sales,
          count: sales.length,
        });

      case "low-stock":
        const lowStockReport = await getInventoryReport({
          type: "low_stock",
        });
        return NextResponse.json({
          success: true,
          data: lowStockReport,
        });

      case "categories":
        const categoryReport = await getInventoryReport({
          type: "category_summary",
        });
        return NextResponse.json({
          success: true,
          data: categoryReport,
        });

      default:
        return NextResponse.json({
          message: "Agent Tools Test API",
          available_actions: [
            "products - Get all products",
            "customers - Get customers",
            "sales - Get recent sales",
            "low-stock - Get low stock report",
            "categories - Get category summary",
          ],
          usage: "Add ?action=<action_name> to test specific tools",
        });
    }
  } catch (error) {
    console.error("Test API error:", error);

    return NextResponse.json(
      {
        error: "Test failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case "create-product":
        const newProduct = await createProduct({
          ...data,
          userId: session.user.id,
        });
        return NextResponse.json({
          success: true,
          message: "Product created successfully",
          data: newProduct,
        });

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Test API POST error:", error);

    return NextResponse.json(
      {
        error: "Test failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
