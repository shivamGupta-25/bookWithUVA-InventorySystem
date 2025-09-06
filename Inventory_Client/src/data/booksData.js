// Dummy data for books inventory
export const booksData = [
  {
    id: 1,
    title: "The Great Gatsby",
    distributor: "Penguin Random House",
    category: "Books",
    subCategory: "Novels",
    price: 12.99,
    stock: 25,
    gst: 18
  },
  {
    id: 2,
    title: "To Kill a Mockingbird",
    distributor: "HarperCollins Publishers",
    category: "Books",
    subCategory: "Novels",
    price: 14.99,
    stock: 18,
    gst: 18
  },
  {
    id: 3,
    title: "1984",
    distributor: "Penguin Random House",
    category: "Books",
    subCategory: "Novels",
    price: 13.99,
    stock: 32,
    gst: 18
  },
  {
    id: 4,
    title: "Pride and Prejudice",
    distributor: "Penguin Random House",
    category: "Books",
    subCategory: "Novels",
    price: 11.99,
    stock: 22,
    gst: 18
  },
  {
    id: 5,
    title: "The Catcher in the Rye",
    distributor: "Hachette Book Group",
    category: "Books",
    subCategory: "Novels",
    price: 15.99,
    stock: 15,
    gst: 18
  },
  {
    id: 6,
    title: "The Lord of the Rings",
    distributor: "HarperCollins Publishers",
    category: "Books",
    subCategory: "Fantasy",
    price: 24.99,
    stock: 8,
    gst: 18
  },
  {
    id: 7,
    title: "Harry Potter and the Philosopher's Stone",
    distributor: "Bloomsbury Publishing",
    category: "Books",
    subCategory: "Fantasy",
    price: 16.99,
    stock: 45,
    gst: 18
  },
  {
    id: 8,
    title: "The Hobbit",
    distributor: "HarperCollins Publishers",
    category: "Books",
    subCategory: "Fantasy",
    price: 18.99,
    stock: 20,
    gst: 18
  },
  {
    id: 9,
    title: "The Chronicles of Narnia",
    distributor: "HarperCollins Publishers",
    category: "Books",
    subCategory: "Fantasy",
    price: 22.99,
    stock: 12,
    gst: 18
  },
  {
    id: 10,
    title: "The Alchemist",
    distributor: "HarperCollins Publishers",
    category: "Books",
    subCategory: "Novels",
    price: 13.99,
    stock: 28,
    gst: 18
  },
  {
    id: 11,
    title: "The Kite Runner",
    distributor: "Penguin Random House",
    category: "Books",
    subCategory: "Novels",
    price: 15.99,
    stock: 19,
    gst: 18
  },
  {
    id: 12,
    title: "The Book Thief",
    distributor: "Penguin Random House",
    category: "Books",
    subCategory: "Novels",
    price: 14.99,
    stock: 24,
    gst: 18
  },
  {
    id: 13,
    title: "A4 Notebook - 200 Pages",
    distributor: "Stationery World",
    category: "Stationery",
    subCategory: "Notebooks",
    price: 8.99,
    stock: 50,
    gst: 12
  },
  {
    id: 14,
    title: "Ball Point Pen Set - 10 Pack",
    distributor: "Office Supplies Co.",
    category: "Stationery",
    subCategory: "Pens",
    price: 12.99,
    stock: 35,
    gst: 12
  },
  {
    id: 15,
    title: "Scientific Calculator",
    distributor: "Tech Tools Ltd",
    category: "Stationery",
    subCategory: "Calculators",
    price: 25.99,
    stock: 15,
    gst: 12
  }
];

// Categories for filtering
export const categories = [
  "All",
  "Books",
  "Stationery",
  "Electronics",
  "Accessories"
];

// Sub Categories for filtering
export const subCategories = [
  "All",
  "Novels",
  "Fantasy",
  "Notebooks",
  "Pens",
  "Calculators",
  "Textbooks",
  "Reference Books"
];

// Price ranges for filtering
export const priceRanges = [
  { label: "All Prices", min: 0, max: Infinity },
  { label: "Under ₹10", min: 0, max: 10 },
  { label: "₹10 - ₹15", min: 10, max: 15 },
  { label: "₹15 - ₹20", min: 15, max: 20 },
  { label: "₹20+", min: 20, max: Infinity }
];

// Stock status options
export const stockStatus = [
  { label: "All", value: "all" },
  { label: "In Stock", value: "in-stock" },
  { label: "Low Stock", value: "low-stock" },
  { label: "Out of Stock", value: "out-of-stock" }
];
