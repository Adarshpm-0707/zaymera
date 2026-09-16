const { onRequest } = require('firebase-functions/v2/https');
  const server = import('firebase-frameworks');
  exports.ssrzaymeraac122 = onRequest({}, (req, res) => server.then(it => it.handle(req, res)));
  