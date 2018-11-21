const express = require("express");
const easy = require('./easy');
const app = express();
const port = process.env.PORT || 3001;
const amqp = require('amqplib/callback_api');
let amqpConn = null;
let channel = null;
let message = 'por iniciar';
const conectionURL = process.env.CLOUDAMQP_URL;

function init() {
    
  const q = 'messages';

  channel.assertQueue(q, {durable: false});
  channel.consume(q, function(msg) {
    message = msg.content.toString();
    const search = JSON.parse(message);

    publishStatus(search, 'processing');

    easy(search)
      .then(
        (result) => {
          publishStatus(search, 'processed');
          publishResult(result);
        }
      )
      .catch(
        (err) => {
          console.log(err);
          publishStatus(search, 'failed');
        }
      );
    
  }, {noAck: true});
  
}

function publishResult(data) {

  const q = 'result';

  channel.assertQueue(q, {durable: false});
  channel.sendToQueue(q, Buffer.from(JSON.stringify(data)));
  
}

function publishStatus(data, status) {
  
  const q = 'status';
  const updateStatus = {
    id : data.id,
    status : status
  };
 
  channel.assertQueue(q, {durable: false});
  channel.sendToQueue(q, Buffer.from(JSON.stringify(updateStatus)));
  
}

amqp.connect(conectionURL, function(err, conn) {
  
  amqpConn = conn;  

  conn.createChannel(function(err, ch) {
    channel = ch;
    init();
  });

});

app.get("/", function(request, response) {
  console.log(message);
  response.send(message);
});

app.listen(port, function() {
  console.log("Express app started on port "+ port);
});

process
  .on('SIGTERM', shutdown('SIGTERM'))
  .on('SIGINT', shutdown('SIGINT'))
  .on('uncaughtException', shutdown('uncaughtException'));

function shutdown(signal) {
  return (err) => {
    channel.close();
    amqpConn.close();
    process.exit(err ? 1 : 0);

  };
}