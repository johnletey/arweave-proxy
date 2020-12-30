import express from "express";

// @ts-ignore
import evh from "express-vhost";
import { revProxy } from "./handler";

import bodyParser from "body-parser";

const app = express();

app.use(bodyParser.json({ limit: "15mb", type: () => true }));

// use evh middleware and 'trust proxy' to pass X-Forwarded-For header.
app.use(evh.vhost(app.enabled("trust proxy")));

// catch-all for all registered domains
app.all("*", revProxy);

export { app };
