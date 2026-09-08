import express from "express";
import { booksRouter } from "./routes/books.routes.js";
import { usersRouter } from "./routes/users.routes.js";

const app = express();

app.use(express.json());

app.use((req, res, next) => {
  console.log(new Date().toLocaleString(), req.method, req.url);
  next();
});

app.use(logger);

app.use(createLogger("info"));

app.use("/users", usersRouter);
app.use("/books", booksRouter);

app.use((err, req, res, next) => {
  console.log("err", err);
  res.status(500).json({ error: "something went wrong" });
});

app.listen(3000, () => {
  console.log("listening on port 3000");
});

function logger(req, res, next) {
  console.log(new Date().toLocaleString(), req.method, req.url);
  next();
}

function createLogger(type) {
  return (req, res, next) => {
    console.log(type, new Date().toLocaleString(), req.method, req.url);
    next();
  };
}
