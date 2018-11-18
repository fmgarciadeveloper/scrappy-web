const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
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
    publishStatus(message);
  }, {noAck: true});
  
}

function publishResult(data) {

  const q = 'result';

  ch.assertQueue(q, {durable: false});
  ch.sendToQueue(q, Buffer.from('Hello World!'));
  
}

function publishStatus(data) {
  
  const q = 'status';
  const search = JSON.parse(data);
  const status = {
    id: search.id,
    status:'processing'
  };

  channel.assertQueue(q, {durable: false});
  channel.sendToQueue(q, Buffer.from(JSON.stringify(status)));
  
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