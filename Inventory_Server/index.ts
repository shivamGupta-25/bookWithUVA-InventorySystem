import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import api_routes from "./api_routes";

dotenv.config({ debug: false, quiet: true });
const PORT: number = JSON.parse(process.env.PORT || "8080") as number;
const DATABASE_URI: string = process.env.DATABASE_URI as string;
const ALLOWED_HOSTS: any = process.env.ALLOWED_HOSTS
	? JSON.parse(process.env.ALLOWED_HOSTS)
	: "*";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
	cors({
		origin: ALLOWED_HOSTS,
		credentials: true,
	})
);

app.listen(PORT, async () => {
	await mongoose
		.connect(DATABASE_URI)
		.then(() => {
			console.log("Connected to Database.");
		})
		.catch((err) => {
			console.log(err, "\nDatabase Connection Error !!!");
			process.exit(1);
		});

	console.log(`Server running on port \nhttp://localhost:${PORT}`);

	console.log(ALLOWED_HOSTS);
});

app.get("/", (req, res) => {
	res.status(200).json("Live");
});

app.use("/api", api_routes);

app.use((req, res) => {
	res.status(404).json({
		success: false,
		error: "Requested Route does not exist.",
	});
});
