const contentful = require('contentful');

const create = (spaceId, accessToken) => {
  contentful.createClient({
    space: spaceId,
    environment: 'master',
    accessToken: accessToken
  });
};

// initialize contenful client.
module.exports.createClient = create;