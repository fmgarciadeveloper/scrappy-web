const express = require("express");
const easy = require('./easy');
const ebay = require('./ebay');
const amazon = require('./amazon');
const mercado = require('./mercado');
const app = express();
const port = process.env.PORT || 3001;
const amqp = require('amqplib/callback_api');
let amqpConn = null;
let channel = null;
let messageInit = 'por iniciar';
const conectionURL = process.env.CLOUDAMQP_URL;

function init() {
    
  const q = 'messages';

  channel.assertQueue(q, {durable: false});
  channel.consume(q, function(msg) {
    const message = msg.content.toString();
    const search = JSON.parse(message);

    publishStatus(search, 'processing');

    console.log('Busqueda >>> '+search.searchQuery);

    switch(search.provider) {
      case 'easy':
        console.log('Provider 1 >>> '+search.provider);
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
        break;
      case 'ebay':
       console.log('Provider 2 >>> '+search.provider);
        ebay(search)
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
        break;      
      case 'amazon':
        console.log('Provider 3 >>> '+search.provider);
        amazon(search)
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
        break;
      case 'mercado':
        console.log('Provider 4 >>> '+search.provider);
        mercado(search)
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
        break;
      default:
          console.log('ninguno');
    }   
    
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
  console.log('Conectado a Rabbitm');
  conn.createChannel(function(err, ch) {

    console.log('Channel creado');
    channel = ch;
    init();
  });

});

app.get("/", function(request, response) {
 
  response.send(messageInit);
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
    console.log('ERROR: '+err);
    channel.close();
    amqpConn.close();
    process.exit(err ? 1 : 0);
  };
}