const { createMachine } = require('@xmachina/message');
const contentful = require('./contentful-client');
const http = require('http');

const { PORT = 3000 } = process.env;

const main = (cb, spaceId, accessToken, contentType) => {
  // initialize Contenful client.
  contentful.createClient(spaceId, accessToken);
  http.createServer(async (req, res) => {
      let body = '';
      
      req.on('data', (data) => {
        body += data;
      });
    
      req.on('end', async () => {
        try {
          const reply = await processRequest(JSON.parse(body));
          res.writeHead(200, {'Content-Type': 'application/json'});
          res.write(JSON.stringify(reply));
        } catch (error) {
          console.log(error);
          res.writeHead(500, {'Content-Type': 'application/json'});
          res.write(JSON.stringify(error));
        }
        cb();
        res.end();
      });
      
  }).listen(PORT);

  const processRequest = async (obj) => {
    let result = {};
    // initialize object for interrogating input.
    const machine = createMachine();
    machine.updateWorkObj(obj);

    // grab a copy of the validated data object
    const args = machine.getWorkObj();

    // begin to construct the response object
    result.sender = args.message.From;
    result.orgmessage = args;
    result.reply = [];

    //retrieve data for reply array of message object.
    const response = await getMessageArray(args);
    result.machine = response.next;
    result.reply = response.msgArray.slice();
    machine.setResponse(result);
    return machine.getWorkObj();
  }
  
  const getMessageArray = async (args) => {
    const retObj = {
      msgArray: [],
      next: null
    };
    
    const topic = args.classifier.topclass.toLowerCase();
  
    const chooseObjectProperities = obj => {
      for (let property in obj) {
        if (obj instanceof Array) {
          retObj.msgArray.push({msg: obj[getRandomInt(obj.length - 1)]});
          return;
        }
        else if (typeof obj[property] === 'object') {
          chooseObjectProperities(obj[property]);
        } else {
          if (obj[property].startsWith('http://loc')) {
            retObj.next = obj[property];
          } else {
            retObj.msgArray.push({msg: obj[property]});
          }
        }
      }
    };
  
    // call contenful cms to retrieve predefined content.
    const response = await contentful.getEntries(contentType);
  
    // filter response by the topic provided.
    const queryResult = response.items.filter(r => r.fields.topic === topic);
    if (queryResult.length === 0) {
      retObj.msgArray.push({msg: 'I did not understand your request. Please try again.'});
      retObj.next = `http://localhost:${process.env.PORT}`; // TODO: update this
    } else {
      const fields = queryResult[0].fields;
      // don't include the topic field in the response.
      delete fields.topic;
      chooseObjectProperities(fields);   
    }
    return retObj;
  };
  
  // Retrieve random number from 0 to max.
  const getRandomInt = (max) => {
    return Math.floor(Math.random() * (max + 1));
  };
};

module.exports.startServer = main;