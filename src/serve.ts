const http = require("http");

import { app } from "./proxy";

const port = 8045;

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
