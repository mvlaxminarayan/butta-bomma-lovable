import { z } from "zod";

export const productSchema = z.object({
  name: z.string().trim().min(1, "Enter a product name.").max(200, "Product name must be at most 200 characters."),
  description: z.string().trim().max(10000, "Description must be at most 10,000 characters."),
  price: z.number().finite().positive("Enter a price greater than zero."),
  category: z.string().trim().min(1, "Choose a category.").max(200),
  stock_quantity: z.number().finite().int("Stock quantity must be a whole number.").min(0, "Stock quantity cannot be negative.").max(2147483647),
  weight_grams: z.number().finite().positive("Enter the shipping weight.").max(1000000, "Weight must be at most 1000 kg."),
  images: z.array(z.string().trim().min(1)).min(1, "Upload at least one product photo before saving."),
});