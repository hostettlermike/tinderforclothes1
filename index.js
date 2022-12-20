const express = require("express");
const mustacheExpress = require("mustache-express");
const Pool = require("pg").Pool;
const app = express();
const port = 3010;
const multer = require("multer");
const upload = multer({ dest: "public/uploads/" });
const bcrypt = require("bcrypt");
const sessions = require("express-session");

app.engine("mustache", mustacheExpress());
app.set("view engine", "mustache");
app.set("views", __dirname + "/views");

const pool = new Pool({
  user: "postgres",
  host: "168.119.168.41",
  database: "mili",
  password: "cff5bbc6e9851d8d8d05df294755b844",
  port: 5432
});

app.use(
  sessions({
    secret: "thisismysecrctekeyfhrgfgrfrty84fwir767",
    saveUninitialized: true,
    cookie: { maxAge: 86400000, secure: false },
    resave: false
  })
);

app.use(express.static("public"));

app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  if (!req.session.benutzerid) {
    res.redirect("/login");
    return;
  }
  pool.query("SELECT * FROM posts", (error, result) => {
    if (error) {
      throw error;
    }
    res.render("index", { posts: result.rows });
  });
});

app.post("/like/:id", (req, res) => {
  pool.query(
    "SELECT * FROM posts WHERE id = $1",
    [req.params.id],
    (error, resultP) => {
      const post = resultP.rows[0];
      pool.query(
        "INSERT INTO likes (titel, inhalt, bild, preis, user_id) VALUES ($1, $2, $3, $4, $5)",
        [
          post.titel,
          post.inhalt,
          post.bild,
          post.preis,
          req.session.benutzerid
        ],
        (error, resultL) => {
          if (error) {
            throw error;
          }
          res.redirect("/#popup1");
        }
      );
    }
  );
});

app.post("/delete/:id", (req, res) => {
  pool.query(
    "DELETE FROM likes WHERE id = $1 AND user_id = $2",
    [req.params.id, req.session.benutzerid],
    (error, resultP) => {
      res.redirect("/closet");
    }
  );
});

app.get("/profile", (req, res) => {
  pool.query(
    "SELECT * FROM users WHERE id = $1",
    [req.session.benutzerid],
    (error, result) => {
      if (error) {
        throw error;
      }
      res.render("profile", { profile: result.rows });
    }
  );
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/closet", (req, res) => {
  pool.query(
    "SELECT * FROM likes WHERE user_id = $1",
    [req.session.benutzerid],
    (error, result) => {
      if (error) {
        throw error;
      }
      res.render("closet", { likes: result.rows });
    }
  );
});

app.get("/registration_form", function (req, res) {
  res.render("register");
});

app.post("/register", upload.single("profilepic"), function (req, res) {
  var passwort = bcrypt.hashSync(req.body.passwort, 10);
  pool.query(
    "INSERT INTO users (email, passwort, profilepic) VALUES ($1, $2, $3)",
    [req.body.email, passwort, req.file.filename],
    (error, result) => {
      if (error) {
        throw error;
      }
      res.redirect("/login");
    }
  );
});

app.get("/fileupload", function (req, res) {
  res.render("fileupload");
});

app.get("/fehler", function (req, res) {
  res.render("fehler");
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});

app.post("/login", function (req, res) {
  console.log(req.body);
  pool.query(
    "SELECT * FROM users WHERE email = $1",
    [req.body.email],
    (error, result) => {
      if (error) {
        throw error;
      }
      if (bcrypt.compareSync(req.body.passwort, result.rows[0].passwort)) {
        req.session.benutzerid = result.rows[0].id;
        res.redirect("/");
      } else {
        res.redirect("/login_form");
      }
    }
  );
});
