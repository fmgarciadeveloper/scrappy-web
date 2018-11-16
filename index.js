const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const amqp = require('amqplib/callback_api');
let amqpConn = null;
let channel = null;
let message = 'por iniciar';
const conectionURL = process.env.CLOUDAMQP_URL;

function init() {
    
  var q = 'messages';

  channel.assertQueue(q, {durable: false});
  channel.consume(q, function(msg) {
    message = msg.content.toString();
  }, {noAck: true});
  
}

function publishResult() {

  var q = 'result';

  ch.assertQueue(q, {durable: false});
  // Note: on Node 6 Buffer.from(msg) should be used
  ch.sendToQueue(q, new Buffer('Hello World!'));
  
}

function publishStatus() {
  
  var q = 'status';

  channel.assertQueue(q, {durable: false});
  // Note: on Node 6 Buffer.from(msg) should be used
  channel.sendToQueue(q, new Buffer('Hello World!'));
  
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