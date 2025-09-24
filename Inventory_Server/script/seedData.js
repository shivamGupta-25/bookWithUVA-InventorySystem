// node scripts/seedData.js

import { config } from "dotenv";
import mongoose from "mongoose";

// Import real models to keep schema in sync
import { user_model, UserRole } from "../models/user.ts";
import { settings_model } from "../models/settings.ts";
import { distributor_model } from "../models/distributor.ts";
import { product_model } from "../models/products.ts";
import { order_model, OrderStatus } from "../models/order.ts";
import { stockAlert_model } from "../models/stockAlert.ts";
import { activityLog_model, ActivityType } from "../models/activityLog.ts";
import { calculateItemTotals, calculateOrderTotals } from "../utils/monetaryUtils.ts";

// Load environment variables
config();

const MONGODB_URI = process.env.DATABASE_URI || process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("MONGODB_URI not found in environment variables");
  process.exit(1);
}

// Utilities
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pickOne = (arr) => arr[randInt(0, arr.length - 1)];
const pickMany = (arr, n) => {
  const copy = [...arr];
  const out = [];
  while (n-- > 0 && copy.length) out.push(copy.splice(randInt(0, copy.length - 1), 1)[0]);
  return out;
};
const daysAgo = (d) => new Date(Date.now() - d * 24 * 60 * 60 * 1000);
const hoursAgo = (h) => new Date(Date.now() - h * 60 * 60 * 1000);

// Order number generator with predictable dummy IDs per seed run
function generateOrderNumber(index = 0) {
  // Predictable, clearly dummy, and unique within this seed run
  return `ORD-DUMMY-${String(index + 1).padStart(6, "0")}`;
}

async function clearCollections() {
  const collections = [
    "users",
    "settings",
    "distributors",
    "products",
    "orders",
    "stockalerts",
    "activitylogs",
  ];
  for (const name of collections) {
    try {
      await mongoose.connection.db.collection(name).deleteMany({});
      console.log(`Cleared collection: ${name}`);
    } catch (_) {
      // ignore if collection doesn't exist yet
    }
  }
}

function buildDistributors() {
  return [
    { name: "Penguin Random House", phoneNumber: "9876543210", email: "sales@penguinrandomhouse.in", address: "BKC, Mumbai", gstinNumber: "27ABCDE1234F1Z5" },
    { name: "HarperCollins Publishers", phoneNumber: "8765432109", email: "partners@harpercollins.co.in", address: "Gurugram, Haryana", gstinNumber: "06PQRSX7890L2Z1" },
    { name: "Bloomsbury Publishing", phoneNumber: "7654321098", email: "india@bloomsbury.com", address: "Noida, UP", gstinNumber: "09BLOOM1234P3Z6" },
    { name: "Hachette Book Group", phoneNumber: "6543210987", email: "support@hbg.in", address: "Bengaluru, KA", gstinNumber: "29HACHET1234K7Z2" },
    { name: "Stationery World", phoneNumber: "9123456789", email: "contact@stationeryworld.in", address: "Chennai, TN", gstinNumber: "33STATIO5678J5Z3" },
    { name: "Office Supplies Co.", phoneNumber: "9012345678", email: "hello@officesupplies.co.in", address: "Pune, MH", gstinNumber: "27OFFSUP1234M9Z8" },
    { name: "Tech Tools Ltd", phoneNumber: "9898989898", email: "sales@techtools.in", address: "Hyderabad, TS", gstinNumber: "36TECHTL5678Q1Z9" },
    { name: "Academic Books India", phoneNumber: "9812345678", email: "orders@academicbooks.in", address: "Ahmedabad, GJ", gstinNumber: "24ACDBK1234Z5Z6" },
    { name: "UVA Supplies", phoneNumber: "9988776655", email: "support@uvasupplies.in", address: "Jaipur, RJ", gstinNumber: "08UVASUP1234F1Z2" },
  ];
}

function buildProducts(distributorsByName) {
  const rows = [
    { title: "The Great Gatsby", distributor: "Penguin Random House", category: "Books", subCategory: "Novels", price: 299, gst: 5, stock: 40 },
    { title: "To Kill a Mockingbird", distributor: "HarperCollins Publishers", category: "Books", subCategory: "Novels", price: 349, gst: 5, stock: 30 },
    { title: "1984", distributor: "Penguin Random House", category: "Books", subCategory: "Novels", price: 329, gst: 5, stock: 26 },
    { title: "Pride and Prejudice", distributor: "Penguin Random House", category: "Books", subCategory: "Novels", price: 279, gst: 5, stock: 18 },
    { title: "The Catcher in the Rye", distributor: "Hachette Book Group", category: "Books", subCategory: "Novels", price: 359, gst: 5, stock: 12 },
    { title: "The Lord of the Rings", distributor: "HarperCollins Publishers", category: "Books", subCategory: "Fantasy", price: 899, gst: 5, stock: 7 },
    { title: "Harry Potter and the Philosopher's Stone", distributor: "Bloomsbury Publishing", category: "Books", subCategory: "Fantasy", price: 499, gst: 5, stock: 60 },
    { title: "The Hobbit", distributor: "HarperCollins Publishers", category: "Books", subCategory: "Fantasy", price: 449, gst: 5, stock: 22 },
    { title: "The Chronicles of Narnia", distributor: "HarperCollins Publishers", category: "Books", subCategory: "Fantasy", price: 699, gst: 5, stock: 14 },
    { title: "The Alchemist", distributor: "HarperCollins Publishers", category: "Books", subCategory: "Novels", price: 299, gst: 5, stock: 35 },
    { title: "A4 Notebook - 200 Pages", distributor: "Stationery World", category: "Stationery", subCategory: "Notebooks", price: 120, gst: 12, stock: 120 },
    { title: "Ball Point Pen Set - 10 Pack", distributor: "Office Supplies Co.", category: "Stationery", subCategory: "Pens", price: 199, gst: 12, stock: 80 },
    { title: "Scientific Calculator", distributor: "Tech Tools Ltd", category: "Stationery", subCategory: "Calculators", price: 1299, gst: 18, stock: 20 },
    // Additional realistic catalog breadth and edge cases
    { title: "Engineering Mathematics Vol. 1", distributor: "Academic Books India", category: "Books", subCategory: "Textbooks", price: 799, gst: 5, stock: 0 }, // out of stock
    { title: "Organic Chemistry Essentials", distributor: "Academic Books India", category: "Books", subCategory: "Textbooks", price: 999, gst: 5, stock: 3 }, // low stock
    { title: "Exam Guide: JEE Advanced 2025", distributor: "UVA Supplies", category: "Books", subCategory: "Exam Prep", price: 1199, gst: 5, stock: 55 },
    { title: "Premium Fountain Pen", distributor: "Office Supplies Co.", category: "Stationery", subCategory: "Pens", price: 1499, gst: 12, stock: 8 }, // low stock
    { title: "Graph Notebook - 100 Pages", distributor: "Stationery World", category: "Stationery", subCategory: "Notebooks", price: 180, gst: 12, stock: 5 }, // low stock
    { title: "Advanced Scientific Calculator Pro", distributor: "Tech Tools Ltd", category: "Stationery", subCategory: "Calculators", price: 2499, gst: 18, stock: 12 },
    { title: "Data Structures in C++", distributor: "Penguin Random House", category: "Books", subCategory: "Programming", price: 699, gst: 5, stock: 25 },
    { title: "Introduction to Algorithms", distributor: "Hachette Book Group", category: "Books", subCategory: "Programming", price: 1999, gst: 5, stock: 10 }, // low stock
  ];

  return rows.map((r, idx) => ({
    title: r.title,
    distributor: distributorsByName.get(r.distributor),
    category: r.category,
    subCategory: r.subCategory,
    price: r.price,
    stock: r.stock,
    gst: r.gst,
    description: `${r.title} from ${r.distributor} in ${r.category}/${r.subCategory}`,
    // Mark a small subset as inactive to test filters
    isActive: idx % 17 === 0 ? false : true,
  }));
}

function buildUsers() {
  return [
    { name: "Shivam Gupta", email: "guptashivam25oct@gmail.com", role: UserRole.ADMIN, avatar: "/avatars/Male_Avatar.png", isActive: true, lastLogin: daysAgo(2) },
    { name: "Tanya", email: "japanishweeb@gmail.com", role: UserRole.MANAGER, avatar: "/avatars/Female_Avatar.png", isActive: true, lastLogin: daysAgo(1) },
  ];
}

function randomCustomer() {
  const first = ["Rajesh", "Priya", "Amit", "Sneha", "Vikram", "Anita", "Karthik", "Neha", "Anil", "Pooja", "Ravi", "Ananya"];
  const last = ["Kumar", "Sharma", "Patel", "Reddy", "Singh", "Desai", "Iyer", "Gupta", "Verma", "Chopra", "Das", "Bansal"];
  const cities = [
    { city: "Mumbai", state: "Maharashtra", pincode: "400001" },
    { city: "Delhi", state: "Delhi", pincode: "110015" },
    { city: "Bangalore", state: "Karnataka", pincode: "560001" },
    { city: "Chennai", state: "Tamil Nadu", pincode: "600002" },
    { city: "Kolkata", state: "West Bengal", pincode: "700001" },
    { city: "Hyderabad", state: "Telangana", pincode: "500001" },
  ];
  const f = pickOne(first);
  const l = pickOne(last);
  const place = pickOne(cities);
  const phone = `${randInt(6, 9)}${randInt(0, 9)}${randInt(0, 9)}${randInt(0, 9)}${randInt(0, 9)}${randInt(0, 9)}${randInt(0, 9)}${randInt(0, 9)}${randInt(0, 9)}${randInt(0, 9)}`;
  return {
    name: `${f} ${l}`,
    email: `${f}.${l}${randInt(1, 99)}@example.com`.toLowerCase(),
    phone,
    address: {
      street: `${randInt(1, 999)} Main Road`,
      city: place.city,
      state: place.state,
      pincode: place.pincode,
      country: "India",
    },
  };
}

function buildOrders(products) {
  const paymentMethods = ["cash", "card", "upi", "netbanking", "wallet"];
  const statuses = [OrderStatus.PENDING, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED, OrderStatus.CANCELLED, OrderStatus.REFUNDED];
  const orders = [];
  // Larger volume to exercise analytics (recent + historical)
  const orderCount = 120;
  for (let i = 0; i < orderCount; i++) {
    const itemCount = randInt(1, 5);
    const itemsProducts = pickMany(products, itemCount);
    // Base items
    const baseItems = itemsProducts.map((p) => ({
      product: p._id,
      productName: p.title,
      quantity: randInt(1, 7),
      unitPrice: p.price,
      gstRate: p.gst,
    }));
    const paymentMethod = pickOne(paymentMethods);
    let status = pickOne(statuses);
    const orderDate = daysAgo(randInt(0, 150));
    // Compute item totals
    const items = baseItems.map((it) => {
      const totals = calculateItemTotals({
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        gstRate: it.gstRate,
      });
      return {
        ...it,
        totalPrice: totals.totalPrice,
        gstAmount: totals.gstAmount,
        finalPrice: totals.finalPrice,
      };
    });
    const shippingCharges = [0, 40, 60, 80, 100, 150][randInt(0, 5)];
    const discount = [0, 0, 0, 5, 10, 15][randInt(0, 5)];
    // Compute order totals
    const orderTotals = calculateOrderTotals(
      items.map((x) => ({ totalPrice: x.totalPrice, gstAmount: x.gstAmount })),
      shippingCharges,
      discount
    );
    // Some payments fail regardless of status to test UI
    const paymentStatusPool = ["pending", "paid", "paid", "failed", "refunded"];
    let paymentStatus = pickOne(paymentStatusPool);
    // Derive more realistic payment status from order status
    if (status === OrderStatus.DELIVERED) paymentStatus = pickOne(["paid", "refunded"]);
    if (status === OrderStatus.CANCELLED) paymentStatus = pickOne(["refunded", "failed"]);
    if (status === OrderStatus.REFUNDED) paymentStatus = "refunded";
    if (status === OrderStatus.PENDING) paymentStatus = pickOne(["pending", "failed"]);

    const base = {
      orderNumber: generateOrderNumber(i),
      customer: randomCustomer(),
      items,
      paymentMethod,
      shippingCharges,
      discount,
      notes: "",
      status,
      paymentStatus,
      orderDate,
      subtotal: orderTotals.subtotal,
      totalGst: orderTotals.totalGst,
      totalAmount: orderTotals.totalAmount,
    };

    // Delivery timeline logic to power delivery analytics
    // Assign expected delivery for majority of non-cancelled orders
    if (status !== OrderStatus.CANCELLED && status !== OrderStatus.REFUNDED) {
      const expectedOffsetDays = randInt(1, 7);
      base.expectedDeliveryDate = new Date(orderDate.getTime() + expectedOffsetDays * 24 * 60 * 60 * 1000);
    }
    // For delivered orders, set deliveredDate around expected to create early/late/on-time
    if (status === OrderStatus.DELIVERED) {
      const jitter = pickOne([-2, -1, 0, 0, 1, 2, 3]); // some early, some on-time, some late
      const anchor = base.expectedDeliveryDate || new Date(orderDate.getTime() + 3 * 24 * 60 * 60 * 1000);
      base.deliveredDate = new Date(anchor.getTime() + jitter * 24 * 60 * 60 * 1000);
      // guard against negative timeline
      if (base.deliveredDate < orderDate) base.deliveredDate = new Date(orderDate.getTime() + 1 * 24 * 60 * 60 * 1000);
    }
    // Overdue cases: pending/processing/shipped with expected in the past
    if ([OrderStatus.PENDING, OrderStatus.PROCESSING, OrderStatus.SHIPPED].includes(status)) {
      if (Math.random() < 0.25) {
        const overdueDays = randInt(1, 10);
        base.expectedDeliveryDate = new Date(Date.now() - overdueDays * 24 * 60 * 60 * 1000);
      }
    }
    // Future upcoming deliveries: expected within next 7 days for open statuses
    if ([OrderStatus.PENDING, OrderStatus.PROCESSING, OrderStatus.SHIPPED].includes(status) && Math.random() < 0.4) {
      const inDays = randInt(1, 7);
      base.expectedDeliveryDate = new Date(Date.now() + inDays * 24 * 60 * 60 * 1000);
    }
    if (status === OrderStatus.CANCELLED) {
      base.cancelledDate = new Date(orderDate.getTime() + randInt(0, 3) * 24 * 60 * 60 * 1000);
      base.cancellationReason = pickOne(["Customer cancellation", "Out of delivery area", "Payment issue"]);
    }
    if (status === OrderStatus.REFUNDED) {
      base.cancelledDate = new Date(orderDate.getTime() + randInt(0, 3) * 24 * 60 * 60 * 1000);
      base.refundDate = new Date(orderDate.getTime() + randInt(1, 5) * 24 * 60 * 60 * 1000);
      base.refundReason = pickOne(["Partial refund", "Damaged item", "Delayed delivery"]);
      // Simulate partial refunds sometimes
      if (Math.random() < 0.5) {
        base.refundAmount = Math.round(base.totalAmount * pickOne([0.3, 0.5, 0.75]));
      }
    }
    orders.push(base);
  }
  return orders;
}

async function createStockAlertsForLowStock(settings, products) {
  const lowThreshold = settings.stockAlertThresholds?.lowStockThreshold ?? 10;
  const outThreshold = settings.stockAlertThresholds?.outOfStockThreshold ?? 0;
  let created = 0;
  for (const p of products) {
    if (p.stock <= outThreshold) {
      await stockAlert_model.createAlert({
        product: p._id,
        productName: p.title,
        alertType: "out-of-stock",
        currentStock: p.stock,
        threshold: outThreshold,
        message: `${p.title} is out of stock`,
        priority: "high",
      });
      created++;
    } else if (p.stock <= lowThreshold) {
      await stockAlert_model.createAlert({
        product: p._id,
        productName: p.title,
        alertType: "low-stock",
        currentStock: p.stock,
        threshold: lowThreshold,
        message: `${p.title} stock is low (${p.stock})`,
        priority: p.stock <= Math.max(1, Math.floor(lowThreshold / 2)) ? "high" : "medium",
      });
      created++;
    }
  }
  return created;
}

async function logActivity(user, type, description, extra = {}) {
  await activityLog_model.logActivity({
    user: user._id,
    userName: user.name,
    userEmail: user.email,
    activityType: type,
    description,
    ...extra,
  });
}

async function seedDatabase() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB successfully!");

    await clearCollections();

    // 1) Users
    const usersInput = buildUsers();
    const users = [];
    for (const u of usersInput) {
      // Secure but predictable dev password
      const doc = await user_model.create({
        name: u.name,
        email: u.email,
        password: "Admin@123",
        avatar: u.avatar,
        role: u.role,
        isActive: u.isActive,
        lastLogin: u.lastLogin,
      });
      users.push(doc);
    }
    const adminUser = users.find((u) => u.role === UserRole.ADMIN);
    console.log(`Inserted ${users.length} users`);
    await logActivity(adminUser, ActivityType.USER_CREATE, "Seeded initial users");

    // 2) Settings
    const settings = await settings_model.getSettings();
    await settings_model.updateSettings({
      stockAlertThresholds: { lowStockThreshold: 12, outOfStockThreshold: 0 },
      notificationSettings: { enableLowStockAlerts: true, enableOutOfStockAlerts: true, alertFrequency: "hourly" },
    }, adminUser._id.toString());
    const updatedSettings = await settings_model.getSettings();
    console.log("Settings initialized");
    await logActivity(adminUser, ActivityType.UPDATE, "Updated global settings", { resource: "Settings" });

    // 3) Distributors
    const distributors = await distributor_model.insertMany(buildDistributors());
    const distributorsByName = new Map(distributors.map((d) => [d.name, d._id]));
    console.log(`Inserted ${distributors.length} distributors`);

    // 4) Products
    const productsToInsert = buildProducts(distributorsByName);
    const products = await product_model.insertMany(productsToInsert);
    console.log(`Inserted ${products.length} products`);
    await logActivity(adminUser, ActivityType.CREATE, "Seeded catalog products", { resource: "Product" });

    // 5) Orders
    const activeProducts = products.filter(p => p.isActive !== false);
    const ordersInput = buildOrders(activeProducts);
    const createdOrders = [];
    for (const data of ordersInput) {
      const order = await order_model.create(data);
      createdOrders.push(order);
      // decrement stock for shipped/processing/delivered
      if ([OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED].includes(order.status)) {
        for (const item of order.items) {
          const prod = await product_model.findById(item.product).select("stock");
          if (!prod) continue;
          const currentStock = typeof prod.stock === "number" ? prod.stock : 0;
          const newStock = Math.max(0, currentStock - item.quantity);
          if (newStock !== currentStock) {
            await product_model.findByIdAndUpdate(item.product, { $set: { stock: newStock } });
          }
        }
      }
    }
    console.log(`Inserted ${createdOrders.length} orders`);
    await logActivity(adminUser, ActivityType.CREATE, "Seeded historical orders", { resource: "Order" });

    // 6) Stock Alerts
    const alertsCreated = await createStockAlertsForLowStock(updatedSettings, await product_model.find());
    console.log(`Created/updated ${alertsCreated} stock alerts`);

    // 7) Activity logs for typical actions (diverse)
    const manager = users.find((u) => u.role === UserRole.MANAGER);
    if (manager) {
      await logActivity(manager, ActivityType.LOGIN, "User logged in", { userAgent: "Chrome/123" });
      await logActivity(manager, ActivityType.UPDATE, "Updated product price", { resource: "Product" });
      await logActivity(manager, ActivityType.PASSWORD_RESET_REQUEST, "Requested password reset", { resource: "User" });
      await logActivity(manager, ActivityType.PASSWORD_RESET, "Completed password reset", { resource: "User" });
      await logActivity(manager, ActivityType.CREATE, "Created new distributor", { resource: "Distributor" });
      await logActivity(manager, ActivityType.DELETE, "Deleted obsolete product", { resource: "Product" });
    }
    const viewer = users.find((u) => u.role === UserRole.VIEWER && u.isActive);
    if (viewer) {
      await logActivity(viewer, ActivityType.LOGIN, "User logged in", { userAgent: "Firefox/118" });
      await logActivity(viewer, ActivityType.PROFILE_UPDATE, "Updated profile details", { resource: "User" });
    }

    console.log("Database seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error?.message || error);
    process.exit(1);
  }
}

seedDatabase();