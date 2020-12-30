import { resolveTxt } from "dns";
import { promisify } from "util";

const resolveTxtRecords = promisify(resolveTxt);

const addrRe = /^arweave=(?<wallet>[a-zA-Z0-9_-]{16,44})/;

export const addressesForHostname = async (
  hostname: string
): Promise<Array<string>> => {
  var addresses = new Array();
  const records = await resolveTxtRecords(hostname);

  records.forEach((elements) => {
    elements.forEach((element) => {
      if (addrRe.test(element)) {
        const match = element.match(addrRe);
        addresses.push(match?.groups!.wallet);
      }
    });
  });

  return addresses;
};
