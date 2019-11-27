/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * This is basically a RPC endpoint for the frontend to resolve a domain to see
 * if it has MX record, A record, or neither.
 */

'use strict';

const joi = require('joi');
const dns = require('dns');
const resolver = new dns.promises.Resolver();
const results = ['MX', 'A', 'none'].reduce((accumulator, val) => {
  accumulator[val] = val;
  return accumulator;
}, {});
const NotFoundErrorCodes = [dns.NODATA, dns.NOTFOUND];

const tryResolveWith = resolveFunc => async domain => {
  try {
    const records = await resolveFunc(domain);
    // We don't do anything with the records
    return records && records.length;
  } catch (err) {
    if (NotFoundErrorCodes.includes(err.code)) {
      return false;
    }
    throw err;
  }
};

module.exports = function() {
  return {
    method: 'get',
    path: '/validate-email-domain',
    validate: {
      query: {
        domain: joi
          .string()
          .hostname()
          .required(),
      },
    },
    process: async function(req, res, next) {
      const { domain } = req.query;

      try {
        if (await tryResolveWith(resolver.resolveMx.bind(resolver))(domain)) {
          return res.json({ result: results.MX });
        }
        if (await tryResolveWith(resolver.resolve4.bind(resolver))(domain)) {
          return res.json({ result: results.A });
        }
        return res.json({ result: results.none });
      } catch (err) {
        next(err);
      }
    },
  };
};
