var Storage = require("./Storage");
const io = require('socket.io')();
var SerialPort = require('serialport');
var xbee_api = require('xbee-api');
var C = xbee_api.constants;


const port_USB = "COM9";


var xbeeAPI = new xbee_api.XBeeAPI({
  api_mode: 2
});


let serialport = new SerialPort(port_USB, {
  baudRate: 9600,
}, function (err) {
  if (err) {
    return console.log('Error: ', err.message)
  }
});

serialport.pipe(xbeeAPI.parser);
xbeeAPI.builder.pipe(serialport);

serialport.on("open", function () {
  var frame_obj = { // AT Request to be sent
    type: C.FRAME_TYPE.AT_COMMAND,
    command: "NI",
    commandParameter: [],
    
  };
  
  xbeeAPI.builder.write(frame_obj);
  
  frame_obj = { // AT Request to be sent
    type: C.FRAME_TYPE.REMOTE_AT_COMMAND_REQUEST,
    destination64: "FFFFFFFFFFFFFFFF",
    command: "NI",
    commandParameter: [],
};
xbeeAPI.builder.write(frame_obj);

//console.log(frame_obj);

});

// All frames parsed by the XBee will be emitted here

xbeeAPI.parser.on("data", function (frame) {

  //on new device is joined, register it

  //on packet received, dispatch event
  //let dataReceived = String.fromCharCode.apply(null, frame.data);
  if (C.FRAME_TYPE.ZIGBEE_RECEIVE_PACKET === frame.type) {
    console.log("C.FRAME_TYPE.ZIGBEE_RECEIVE_PACKET");
    let dataReceived = String.fromCharCode.apply(null, frame.data);
    console.log(">> ZIGBEE_RECEIVE_PACKET >", dataReceived);

    browserClient && browserClient.emit('pad-event', {
      device: frame.remote64,
      data: dataReceived
      
    });
    
  }

  if (C.FRAME_TYPE.NODE_IDENTIFICATION === frame.type) {
    console.log("NODE_IDENTIFICATION");
    Storage.registerSensor(frame.remote64)


  } else if (C.FRAME_TYPE.ZIGBEE_IO_DATA_SAMPLE_RX === frame.type) {
    console.log("ZIGBEE_IO_DATA_SAMPLE_RX")
    console.log(frame.analogSamples.AD3);
    Storage.registerSample(frame.remote64,frame.analogSamples.AD3)

  } else if (C.FRAME_TYPE.REMOTE_COMMAND_RESPONSE === frame.type) {
  } else if (C.FRAME_TYPE.AT_COMMAND_RESPONSE === frame.type) {

    console.debug("c'est la reponse locale");
    console.debug(frame);
    let dataReceived = String.fromCharCode.apply(null, frame.commandData)
    console.debug(dataReceived);

  } else {
    console.debug("frame");

    console.debug(frame);
    let dataReceived = String.fromCharCode.apply(null, frame.commandData)
    console.debug(dataReceived);
  }

});
let browserClient;
io.on('connection', (client) => {
  console.log(client.client.id);
  browserClient = client;

  client.on('subscribeToPad', (interval) => {
    console.log('client is subscribing to timer with interval ', interval);
    // setInterval(() => {
    //   client.emit('pad-event', {
    //     device: "test device",
    //     data: Math.round(Math.random()) * 2 - 1
    //   })
    //   ;
    // }, Math.random() * 1000);
  });

  client.on("disconnect", () => {
    console.log("Client disconnected");
  });
});
const port = 8000;
io.listen(port);
console.log('listening on port ', port);
