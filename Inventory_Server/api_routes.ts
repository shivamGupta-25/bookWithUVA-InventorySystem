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
import {
    get_distributors,
    post_distributor,
    put_distributor,
    delete_distributor,
    delete_all_distributors,
} from "./controllers/distributors_controller";

export const api_routes = express.Router();
export default api_routes;

api_routes.get("/products", get_products);
api_routes.post("/products", post_products);
api_routes.delete("/products", delete_products);

api_routes.get("/product/:id", get_product);
api_routes.put("/product/:id", put_product);
api_routes.delete("/product/:id", delete_product);

api_routes.get("/products/stats", statistcs);

// Distributors
api_routes.get("/distributors", get_distributors);
api_routes.post("/distributors", post_distributor);
api_routes.put("/distributor/:id", put_distributor);
api_routes.delete("/distributor/:id", delete_distributor);
api_routes.delete("/distributors", delete_all_distributors);
