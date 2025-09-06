import express from "express";
import {
	delete_products,
	get_products,
	post_products,
} from "./controllers/products_controller";
import {
	delete_product,
	get_product,
	put_product,
} from "./controllers/product_controller";
import { statistcs } from "./controllers/statistic";

export const api_routes = express.Router();
export default api_routes;

api_routes.get("/products", get_products);
api_routes.post("/products", post_products);
api_routes.delete("/products", delete_products);

api_routes.get("/product/:id", get_product);
api_routes.put("/product/:id", put_product);
api_routes.delete("/product/:id", delete_product);

api_routes.get("/products/stats", statistcs);
