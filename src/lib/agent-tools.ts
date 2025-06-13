import prisma from "@/lib/prisma";
import { z } from "zod";

// Database tool functions for the AI agent
export const getProductsSchema = z.object({
  category: z.string().optional().nullable(),
  lowStock: z.boolean().optional().nullable(),
  search: z.string().optional().nullable(),
});

export const getProducts = async (
  params: z.infer<typeof getProductsSchema>
) => {
  const { category, lowStock, search } = params;

  const where: any = {};

  if (category) {
    where.category = {
      contains: category,
      mode: "insensitive",
    };
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { barcode: { contains: search, mode: "insensitive" } },
    ];
  }

  const products = await prisma.products.findMany({
    where,
    include: {
      inventory_movements: {
        take: 5,
        orderBy: { created_at: "desc" },
      },
    },
    orderBy: { created_at: "desc" },
  });

  let filteredProducts = products;

  if (lowStock) {
    filteredProducts = products.filter(
      (product) => product.stock_quantity <= (product.min_stock_level || 5)
    );
  }

  return filteredProducts.map((product) => ({
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price.toString(),
    stock_quantity: product.stock_quantity,
    min_stock_level: product.min_stock_level,
    category: product.category,
    barcode: product.barcode,
    recent_movements: product.inventory_movements.length,
  }));
};

export const createProductSchema = z.object({
  name: z.string(),
  description: z.string().optional().nullable(),
  price: z.number(),
  stock_quantity: z.number(),
  min_stock_level: z.number().optional().nullable(),
  category: z.string().optional().nullable(),
  barcode: z.string().optional().nullable(),
  userId: z.string(),
});

export const createProduct = async (
  params: z.infer<typeof createProductSchema>
) => {
  // Validate UUID format for userId
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(params.userId)) {
    throw new Error(
      `Invalid user ID format: "${params.userId}". User ID must be a valid UUID.`
    );
  }

  const product = await prisma.products.create({
    data: {
      name: params.name,
      description: params.description || null,
      price: params.price,
      stock_quantity: params.stock_quantity,
      min_stock_level: params.min_stock_level || 5,
      category: params.category || null,
      barcode: params.barcode || null,
      user_id: params.userId,
    },
  });

  return {
    id: product.id,
    name: product.name,
    price: product.price.toString(),
    stock_quantity: product.stock_quantity,
    category: product.category,
  };
};

export const updateStockSchema = z.object({
  productId: z.string(),
  quantity: z.number(),
  movementType: z.enum(["purchase", "sale", "adjustment", "return"]),
  notes: z.string().optional().nullable(),
  userId: z.string(),
});

export const updateStock = async (
  params: z.infer<typeof updateStockSchema>
) => {
  const { productId, quantity, movementType, notes, userId } = params;

  console.log("updateStock called with params:", {
    productId,
    quantity,
    movementType,
    notes,
    userId,
  });

  // Validate UUID format for productId
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(productId)) {
    throw new Error(
      `Invalid product ID format: "${productId}". Product ID must be a valid UUID. Please search for the product first to get its proper ID.`
    );
  }

  if (!uuidRegex.test(userId)) {
    throw new Error(
      `Invalid user ID format: "${userId}". User ID must be a valid UUID.`
    );
  }

  try {
    const product = await prisma.products.findUnique({
      where: { id: productId },
    });

    console.log("Found product:", product);

    if (!product) {
      throw new Error(
        `Product not found with ID: ${productId}. Please verify the product exists and use the correct UUID.`
      );
    }

    const previousStock = product.stock_quantity;
    const newStock = previousStock + quantity;

    console.log("Stock calculation:", { previousStock, quantity, newStock });

    if (newStock < 0) {
      throw new Error("Insufficient stock for this operation");
    }

    console.log("Starting transaction...");

    const [updatedProduct, movement] = await prisma.$transaction(async (tx) => {
      console.log("Updating product stock...");
      const updatedProduct = await tx.products.update({
        where: { id: productId },
        data: { stock_quantity: newStock },
      });

      console.log("Creating inventory movement...");
      const movement = await tx.inventory_movements.create({
        data: {
          product_id: productId,
          movement_type: movementType,
          quantity_change: quantity,
          previous_stock: previousStock,
          new_stock: newStock,
          notes: notes || null,
          user_id: userId,
        },
      });

      console.log("Transaction completed successfully");
      return [updatedProduct, movement];
    });

    const result = {
      product: {
        id: updatedProduct.id,
        name: updatedProduct.name,
        previous_stock: previousStock,
        new_stock: newStock,
        quantity_changed: quantity,
      },
      movement: {
        id: movement.id,
        type: movement.movement_type,
        created_at: movement.created_at,
      },
    };

    console.log("updateStock result:", result);
    return result;
  } catch (error) {
    console.error("updateStock error:", error);
    throw error;
  }
};

export const getCustomersSchema = z.object({
  search: z.string().optional().nullable(),
  limit: z.number().optional().nullable(),
});

export const getCustomers = async (
  params: z.infer<typeof getCustomersSchema>
) => {
  const { search, limit = 10 } = params;

  const where: any = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
    ];
  }

  const customers = await prisma.customers.findMany({
    where,
    take: limit || 10,
    include: {
      sales: {
        take: 3,
        orderBy: { created_at: "desc" },
        select: {
          id: true,
          total_amount: true,
          created_at: true,
        },
      },
    },
    orderBy: { created_at: "desc" },
  });

  return customers.map((customer) => ({
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    address: customer.address,
    recent_sales: customer.sales.length,
    total_recent_sales: customer.sales.reduce(
      (sum, sale) => sum + parseFloat(sale.total_amount.toString()),
      0
    ),
  }));
};

export const createCustomerSchema = z.object({
  name: z.string(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  userId: z.string(),
});

export const createCustomer = async (
  params: z.infer<typeof createCustomerSchema>
) => {
  // Validate UUID format for userId
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(params.userId)) {
    throw new Error(
      `Invalid user ID format: "${params.userId}". User ID must be a valid UUID.`
    );
  }

  const customer = await prisma.customers.create({
    data: {
      name: params.name,
      email: params.email || null,
      phone: params.phone || null,
      address: params.address || null,
      user_id: params.userId,
    },
  });

  return {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
  };
};

export const getSalesSchema = z.object({
  customerId: z.string().optional().nullable(),
  dateFrom: z.string().optional().nullable(),
  dateTo: z.string().optional().nullable(),
  limit: z.number().optional().nullable(),
});

export const getSales = async (params: z.infer<typeof getSalesSchema>) => {
  const { customerId, dateFrom, dateTo, limit = 20 } = params;

  const where: any = {};

  if (customerId) {
    where.customer_id = customerId;
  }

  if (dateFrom || dateTo) {
    where.created_at = {};
    if (dateFrom) where.created_at.gte = new Date(dateFrom);
    if (dateTo) where.created_at.lte = new Date(dateTo);
  }

  const sales = await prisma.sales.findMany({
    where,
    take: limit || 20,
    include: {
      customers: {
        select: {
          name: true,
          email: true,
        },
      },
      sale_items: {
        include: {
          products: {
            select: {
              name: true,
              category: true,
            },
          },
        },
      },
    },
    orderBy: { created_at: "desc" },
  });

  return sales.map((sale) => ({
    id: sale.id,
    customer: sale.customers?.name || "Walk-in Customer",
    total_amount: sale.total_amount.toString(),
    payment_method: sale.payment_method,
    items_count: sale.sale_items.length,
    items: sale.sale_items.map((item) => ({
      product: item.products?.name,
      quantity: item.quantity,
      unit_price: item.unit_price.toString(),
      subtotal: item.subtotal.toString(),
    })),
    created_at: sale.created_at,
  }));
};

export const getInventoryReportSchema = z.object({
  type: z.enum(["low_stock", "movement_summary", "category_summary"]),
  days: z.number().optional().nullable(),
});

export const getInventoryReport = async (
  params: z.infer<typeof getInventoryReportSchema>
) => {
  const { type, days = 30 } = params;

  switch (type) {
    case "low_stock":
      // Get all products and filter for low stock in JavaScript since Prisma doesn't support
      // comparing columns directly in a simple way
      const allProducts = await prisma.products.findMany({
        select: {
          id: true,
          name: true,
          stock_quantity: true,
          min_stock_level: true,
          category: true,
        },
      });

      const lowStockProducts = allProducts.filter((product) => {
        const threshold = product.min_stock_level || 5;
        return product.stock_quantity <= threshold;
      });

      return {
        type: "low_stock",
        products: lowStockProducts,
      };

    case "movement_summary":
      const dateFrom = new Date();
      dateFrom.setDate(dateFrom.getDate() - (days || 30));

      const movements = await prisma.inventory_movements.findMany({
        where: {
          created_at: {
            gte: dateFrom,
          },
        },
        include: {
          products: {
            select: {
              name: true,
              category: true,
            },
          },
        },
        orderBy: { created_at: "desc" },
      });

      const summary = movements.reduce(
        (acc, movement) => {
          const type = movement.movement_type;
          if (!acc[type]) acc[type] = { count: 0, total_quantity: 0 };
          acc[type].count++;
          acc[type].total_quantity += Math.abs(movement.quantity_change);
          return acc;
        },
        {} as Record<string, { count: number; total_quantity: number }>
      );

      return {
        type: "movement_summary",
        period_days: days || 30,
        total_movements: movements.length,
        summary,
      };

    case "category_summary":
      const categoryStats = await prisma.products.groupBy({
        by: ["category"],
        _count: {
          id: true,
        },
        _sum: {
          stock_quantity: true,
        },
        _avg: {
          price: true,
        },
      });

      return {
        type: "category_summary",
        categories: categoryStats.map((stat) => ({
          category: stat.category || "Uncategorized",
          product_count: stat._count.id,
          total_stock: stat._sum.stock_quantity || 0,
          average_price: stat._avg.price?.toString() || "0",
        })),
      };

    default:
      throw new Error("Invalid report type");
  }
};
