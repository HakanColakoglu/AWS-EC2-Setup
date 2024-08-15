import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

export default function createBlogRoutes(config) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const router = express.Router();

  // Configure the database client
  const { dbUser, dbHost, dbDatabase, dbPassword, dbPort } = config;
  const db = new pg.Client({
    user: dbUser,
    host: dbHost,
    database: dbDatabase,
    password: dbPassword,
    port: dbPort,
  });

  db.connect();

  router.get("/", async (req, res) => {
    try {
      const qres = await db.query("SELECT * FROM blogposts"); // Execute a SQL query to retrieve all blogposts. Use await to wait until it returns
      res.render("mainpage.ejs", { posts: qres.rows }); // Render the mainpage.ejs template with the posts
    } catch (err) {
      console.error("Error executing query", err.stack);
      res.status(500).send("Internal Server Error");
    }
  });

  // Handle POST requests to show the page for submitting a new post
  router.post("/newpost", (req, res) => {
    res.sendFile(path.join(__dirname, "../public/html/newpost_form.html"));
  });

  // Handle the submission of a new blog post
  router.post("/submitnewpost", async (req, res) => {
    try {
      await db.query(
        "INSERT INTO blogposts (blogheader, blogbody, blogauthor) VALUES($1, $2, $3)",
        [req.body.blogheader, req.body.blogbody, req.body.blogauthor]
      ); // Insert the new post data into the database
      res.redirect("/"); // Redirect to the homepage after successful insertion. Preview page could be add here
    } catch (err) {
      console.error("Error inserting post:", err);
      res.status(500).send("Internal Server Error");
    }
  });

  // Handle POST requests to edit a blog post
  router.post("/edit", async (req, res) => {
    const postId = req.body.id; // Get the post ID from the request body
    try {
      const result = await db.query("SELECT * FROM blogposts WHERE id = $1", [
        postId,
      ]); // Query the database for the post with the given ID
      if (result.rows.length > 0) {
        res.render("post_submit_form.ejs", { post: result.rows[0] }); // Render the edit form with the post data if found
      } else {
        res.status(404).send("Post not found"); // Send a 404 Not Found response if the post doesn't exist which is really bad
      }
    } catch (err) {
      console.error("Error retrieving post:", err);
      res.status(500).send("Internal Server Error");
    }
  });

  // Handle POST requests to submit edits to a blog post
  router.post("/editpost", async (req, res) => {
    const postId = req.body.id; // Get the post ID from the request body
    const newHeader = req.body.blogheader; // Get the new post header from the request body
    const newBody = req.body.blogbody; // Get the new post body from the request body
    const newAuthor = req.body.blogauthor; // Get the new post author from the request body

    try {
      await db.query(
        "UPDATE blogposts SET blogheader = $1, blogbody = $2, blogauthor = $3 WHERE id = $4",
        [newHeader, newBody, newAuthor, postId]
      ); // Update the post in the database with the new data
      res.redirect("/");
    } catch (err) {
      console.error("Error updating post:", err);
      res.status(500).send("Internal Server Error");
    }
  });

  // Handle requests to delete a blog post
  router.post("/deletepost", async (req, res) => {
    const postId = req.body.id;

    try {
      await db.query("DELETE FROM blogposts WHERE id = $1", [postId]); // Delete the post from the database with the given ID
      res.redirect("/");
    } catch (err) {
      console.error("Error deleting post:", err);
      res.status(500).send("Internal Server Error");
    }
  });

  // Route to handle POST requests to redirect to the homepage
  router.post("/homepage", (req, res) => {
    res.redirect("/"); // Redirect to the homepage
  });

  // GET requests to retrieve all blog posts from the database
  router.get("/blogposts", async (req, res) => {
    try {
      const result = await db.query("SELECT * FROM blogposts");
      res.json(result.rows);
    } catch (err) {
      console.error("Error retrieving blog posts:", err);
      res.status(500).send("Internal Server Error");
    }
  });

  // GET requests for a specific blog post by ID from the database
  router.get("/blogpost/:id", async (req, res) => {
    const id = parseInt(req.params.id); // Get the ID from the URL parameters and parse it as an integer
    try {
      const result = await db.query("SELECT * FROM blogposts WHERE id = $1", [
        id,
      ]);
      if (result.rows.length > 0) {
        res.json(result.rows[0]);
      } else {
        res.status(404).send("Post not found");
      }
    } catch (err) {
      console.error("Error retrieving blog post:", err);
      res.status(500).send("Internal Server Error");
    }
  });

  // POST requests to create a new blog post in the database
  router.post("/blogpost", async (req, res) => {
    const { blogheader, blogbody, blogauthor } = req.body; // Destructure the request body
    try {
      const result = await db.query(
        "INSERT INTO blogposts (blogheader, blogbody, blogauthor) VALUES ($1, $2, $3) RETURNING *",
        [blogheader, blogbody, blogauthor]
      );
      res.json(result.rows[0]);
    } catch (err) {
      console.error("Error creating blog post:", err);
      res.status(500).send("Internal Server Error");
    }
  });

  // PUT requests to update a blog post by ID in the database
  router.put("/blogpost/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const { blogheader, blogbody, blogauthor } = req.body;
    try {
      const result = await db.query(
        "UPDATE blogposts SET blogheader = $1, blogbody = $2, blogauthor = $3 WHERE id = $4 RETURNING *",
        [blogheader, blogbody, blogauthor, id]
      );
      if (result.rows.length > 0) {
        res.json(result.rows[0]);
      } else {
        res.status(404).send("Post not found");
      }
    } catch (err) {
      console.error("Error updating blog post:", err);
      res.status(500).send("Internal Server Error");
    }
  });

  // PATCH requests to partially update a blog post by ID in the database
  router.patch("/blogpost/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const { blogheader, blogbody, blogauthor } = req.body;
    try {
      const result = await db.query(
        "UPDATE blogposts SET blogheader = COALESCE($1, blogheader), blogbody = COALESCE($2, blogbody), blogauthor = COALESCE($3, blogauthor) WHERE id = $4 RETURNING *",
        [blogheader, blogbody, blogauthor, id]
      );
      if (result.rows.length > 0) {
        res.json(result.rows[0]);
      } else {
        res.status(404).send("Post not found");
      }
    } catch (err) {
      console.error("Error partially updating blog post:", err);
      res.status(500).send("Internal Server Error");
    }
  });

  // DELETE requests to remove a blog post by ID from the database
  router.delete("/blogpost/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    try {
      const result = await db.query(
        "DELETE FROM blogposts WHERE id = $1 RETURNING *",
        [id]
      );
      if (result.rows.length > 0) {
        res.json(result.rows[0]);
      } else {
        res.status(404).send("Post not found");
      }
    } catch (err) {
      console.error("Error deleting blog post:", err);
      res.status(500).send("Internal Server Error");
    }
  });

  return router;
}
