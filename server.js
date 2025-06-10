const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const app = express();
const db = require("knex")({
  client: "pg",
  connection: {
    host: "127.0.0.1",
    port: 5432,
    user: "postgres",
    database: "ztm-smartbrain",
    password: "localhost",
  },
});

app.use(cors());

app.use(express.json());

app.get("/", async (req, res) => {
  try {
    const users = await db("users").select();
    res.json(users);
  } catch (e) {
    res.status(500).json("Internal server error");
  }
});

app.post("/signin", async (req, res) => {
  const { email, password } = req.body;
  try {
    const [login] = await db("login").where({ email });
    const hash = await bcrypt.compare(password, login.hash);
    if (!login || !hash) {
      return res.status(400).json("Invalid credentials");
    }

    const [user] = await db("users").where({ email });
    if (!user) {
      return res.status(400).json("User not found");
    }

    res.json(user);
  } catch (e) {
    res.status(500).json("Internal server error");
  }
});

app.post("/register", async (req, res) => {
  const { email, name, password } = req.body;
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    const user = await db.transaction(async (trx) => {
      await trx("login").insert({
        email,
        hash,
      });

      const [newUser] = await trx("users")
        .insert({
          name,
          email,
          joined: new Date(),
        })
        .returning("*");

      return newUser;
    });

    res.json(user);
  } catch (e) {
    res.status(500).json("Unable to register");
  }
});

app.get("/profile/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [user] = await db("users").where({ id });
    if (!user) {
      return res.status(400).json("Profile not found");
    }

    res.json(user);
  } catch (e) {
    res.status(500).json("Internal server error");
  }
});

app.put("/image", async (req, res) => {
  const { id } = req.body;
  try {
    const [user] = await db("users")
      .where({ id })
      .increment("entries", 1)
      .returning("*");

    if (!user) {
      return res.status(400).json("Profile not found");
    }

    res.json(user);
  } catch (e) {
    res.status(500).json("Internal server error");
  }
});

app.listen(8080, () => {
  console.log("app is running on port 8080");
});
