import express from "express";
import cors from "cors";
import helmet from "helmet";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import api_routes from "./api_routes.js";

dotenv.config({ debug: false, quiet: true });
const PORT: number = JSON.parse(process.env.PORT || "4000") as number;
const DATABASE_URI: string = process.env.DATABASE_URI as string;
const ALLOWED_HOSTS: any = process.env.ALLOWED_HOSTS
	? JSON.parse(process.env.ALLOWED_HOSTS)
	: [];

const app = express();
const server = createServer(app);

// Initialize Socket.IO
const io = new SocketIOServer(server, {
	cors: {
		origin: ALLOWED_HOSTS,
		methods: ["GET", "POST"],
		credentials: true,
	},
});

// Make io globally available for stock alerts
(global as any).io = io;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
	cors({
		origin: ALLOWED_HOSTS,
		credentials: true,
	})
);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Socket.IO connection handling
io.on("connection", (socket) => {
	console.log(`Client connected: ${socket.id}`);
	
	socket.on("disconnect", () => {
		console.log(`Client disconnected: ${socket.id}`);
	});
});

server.listen(PORT, async () => {
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
	console.log(`WebSocket server running on ws://localhost:${PORT}`);

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
