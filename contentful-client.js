const contentful = require('contentful');

let client = null;
const create = (spaceId, accessToken) => {
  client = contentful.createClient({
    space: spaceId,
    environment: 'master',
    accessToken: accessToken
  });
};

const getEntries = async () => {
  if (client === null) {
    throw new Error('Must create client first');
  }
  return await client.getEntries({
    content_type: 'message',
    select: 'sys.id,fields'
  });
}

// initialize contenful client.
module.exports.createClient = create;
module.exports.getEntries = getEntries;