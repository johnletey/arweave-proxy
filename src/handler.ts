import express from "express";
import httpProxy from "http-proxy";

import { run } from "ar-gql";
import rootQuery from "./queries/root.gql";
import pathQuery from "./queries/path.gql";

import { addressesForHostname } from "./utils";

const revProxy = express.Router();

const proxy = httpProxy.createProxyServer({ changeOrigin: true });

revProxy.all("*", async (req, res, next) => {
  try {
    let tx;
    if (req.url === "/") {
      tx = (
        await run(rootQuery, {
          owners: await addressesForHostname(req.hostname),
          hostname: req.hostname,
        })
      ).data.transactions.edges[0];
    } else {
      tx = (
        await run(pathQuery, {
          owners: await addressesForHostname(req.hostname),
          hostname: req.hostname,
          path: req.url,
        })
      ).data.transactions.edges[0];
    }

    if (tx) {
      let id;
      const tag = tx.node.tags.find((tag) => tag.name === "Arweave-Hash");
      if (tag) {
        id = tag.value;
      } else {
        id = tx.node.id;
      }

      const url = `https://arweave.net/${id}`;
      proxy.web(req, res, { target: url, followRedirects: true });
    } else {
      res.sendStatus(404);
    }
  } catch (e) {
    console.error(e);
    res.status(500).send(`Unexpected error routing request`);
  }
});

export { revProxy };
