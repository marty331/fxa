/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Return version info based on package.json, the git sha, and source repo
 *
 * @see lib/version.js
 * @see lib/routes/get-version.json.js
 */

var version = require('../version');

exports.path = '/ver.json';
exports.method = 'get';
exports.process = version.process;
