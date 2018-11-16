const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const amqp = require('amqplib/callback_api');
let amqpConn = 'por iniciar';
const conectionURL = process.env.CLOUDAMQP_URL;

amqp.connect(conectionURL, function(err, conn) {
  conn.createChannel(function(err, ch) {
    var q = 'hello';

    ch.assertQueue(q, {durable: false});
    // Note: on Node 6 Buffer.from(msg) should be used
    ch.sendToQueue(q, new Buffer('Hello World!'));
    console.log(" [x] Sent 'Hello World!'");
    ch.close(function() {conn.close()})
  });
});

amqp.connect(conectionURL, function(err, conn) {
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

app.get("/", function(request, response) {
  console.log(amqpConn);
  response.send(amqpConn);
});

app.listen(port, function() {
  console.log("Express app started on port "+ port);
});