import fs from "fs";
import path from "path";

import * as chai from "chai";

import request from "supertest";

import { rs } from "../src/state";

import { app } from "../src/proxy";

import { addressesForHostname } from "../src/utils";
import { assert } from "chai";

const expect = chai.expect;

function getPayload(txid: string): string {
  const abs_dir = path.join(__dirname, "/payloads");

  return fs.readFileSync(`${abs_dir}/${txid}.json`).toString();
}

describe("TXT records", function () {
  describe("addressForHostname", function () {
    it("should include Jesper's wallet address", async function () {
      const wallets = await addressesForHostname("arweave.noehr.org");
      expect(wallets).to.include("UlLVgC3XsuutTaLnmotFyr4w6qQqXuIKSVaZTDIHv50");
    });

    it("should be empty for non-configured domains", async function () {
      const wallets = await addressesForHostname("google.com");
      expect(wallets.length).to.equal(0);
    });
  });
});

describe("Name updates", function () {
  const agent = request.agent(app);

  describe("Webhooks", function () {
    it("should properly update destination", async function () {
      const tx_payload = getPayload(
        "xAyYZX37P1W5AvE8z3YGQaujRAFf9gUXTCAcvTqXTWc"
      );

      agent
        .post("/v0/tx")
        .send(tx_payload)
        .set("Host", "names.arweave.net")
        .expect(200)
        .then((resp) => {
          rs.get(`domain:arweave.noehr.org`, function (err, res) {
            assert(
              res === "iXrEYWC2zQWnxTT36_SdOp3_G_fwi5g8a-4er0pq99I",
              "state does not reflect what we asked for"
            );
          });
        });
    });
  });
});

describe("Handlers", function () {
  const agent = request.agent(app);

  it("should retrieve the correct content after being updated", async function () {
    const tx_payload = getPayload(
      "xAyYZX37P1W5AvE8z3YGQaujRAFf9gUXTCAcvTqXTWc"
    );

    agent.post("/v0/tx").send(tx_payload).set("Host", "names.arweave.net");

    agent
      .get("/")
      .set("Host", "arweave.noehr.org")
      .then((resp) => {
        const body = resp.body.toString();
        assert(
          body ===
            "UEsDBAoAAAAIAKBlflG4vTqpOgAAAGsAAAANAAAAZW50aXRpZXMuanNvbqtWysxNTE8tVrKKjtVRKi5NKk4uykyC8XMys2HMgvziEiiztDi1CMbMQ1JSmoeuPzk/Nzc1D6KvFgBQSwMECgAAAAgAoGV+UUO/pqMEAAAAAgAAAAgAAABtYXAuanNvbquuBQBQSwECCgAKAAAACACgZX5RuL06qToAAABrAAAADQAAAAAAAAAAAAAApAEAAAAAZW50aXRpZXMuanNvblBLAQIKAAoAAAAIAKBlflFDv6ajBAAAAAIAAAAIAAAAAAAAAAAAAACkAWUAAABtYXAuanNvblBLBQYAAAAAAgACAHEAAACPAAAAAAA="
        );
      });
  });
});
