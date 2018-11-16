const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const amqp = require('amqplib/callback_api');
let amqpConn = null;
let message = 'por iniciar';
const conectionURL = 'amqp://muvtbrqj:KNrsfqhxsL9-TymvNnooK4lJ-Iv_HQxQ@toad.rmq.cloudamqp.com/muvtbrqj';
//process.env.CLOUDAMQP_URL || 'amqp://pxojdlzo:AAQwHpLaTEGXbGNw0eaVS2KAldUnM_Fm@baboom.rmq.cloudamqp.com/pxojdlzo npm start';

function init() {
  amqpConn.createChannel(function(err, ch) {
    var q = 'messages';

    ch.assertQueue(q, {durable: false});
    ch.consume(q, function(msg) {
      console.log(" [x] Received %s", msg.content.toString());
      amqpConn = msg.content.toString()
    }, {noAck: true});
  });
}

amqp.connect(conectionURL, function(err, conn) {

  if(!conn){
    console.log('no se pudo conectar...');
    return null;
  }

  amqpConn = conn;

  init();

  /* conn.createChannel(function(err, ch) {
    var q = 'hello';

    ch.assertQueue(q, {durable: false});
    // Note: on Node 6 Buffer.from(msg) should be used
    ch.sendToQueue(q, new Buffer('Hello World!'));
    console.log(" [x] Sent 'Hello World!'");
    ch.close(function() {conn.close()})
  }); */
});


/*
amqp.connect(conectionURL, function(err, conn) {

  if(!conn){
    console.log('no se pudo conectar 2...');
    return null;
  }

  conn.createChannel(function(err, ch) {
    var q = 'hello';

    ch.assertQueue(q, {durable: false});
    console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", q);
    ch.consume(q, function(msg) {
      console.log(" [x] Received %s", msg.content.toString());
      amqpConn = msg.content.toString()
    }, {noAck: true});
  });
});
*/

app.get("/", function(request, response) {
  console.log(amqpConn);
  response.send(amqpConn);
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

    amqpConn.close();
    process.exit(err ? 1 : 0);

  };
}