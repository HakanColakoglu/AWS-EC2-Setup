import dotenv from "dotenv";
import express from "express";
import bodyParser from "body-parser";
import blogRoutes from "./routes/blog_routes.js"; // Import blog routes

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT_BLOGGER || 3004;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Pass environment variables to routes
app.use(
  blogRoutes({
    dbUser: process.env.DB_USER,
    dbHost: process.env.DB_HOST,
    dbDatabase: process.env.DB_DATABASE,
    dbPassword: process.env.DB_PASSWORD,
    dbPort: process.env.DB_PORT,
  })
);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});