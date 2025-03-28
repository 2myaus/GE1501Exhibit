const startButton = document.createElement("button");
startButton.textContent = "Select device";

const serialOutput = document.createElement("div");
const shipImage = document.createElement("img");

let port;
let reader;
let writer;

let iBuf = "";

let pinVals = {};

const processLine = (line) => {
  const pinValueSets = line.split(" | ");
  pinValueSets.forEach((valueSet) => {
    [pinName, val] = valueSet.split(":");
    val = parseInt(val);
    if(!pinName || isNaN(val)){ return; }
    pinVals[pinName] = parseInt(val);
  });

  if(pinVals["A1"] > 15){
    shipImage.src = "noboat.png";
    return;
  }
  if(pinVals["A0"] >= 17 && pinVals["A0"] <= 18){
    shipImage.src = "backsail.png";
    return
  }
  if(pinVals["A2"] >= 17 && pinVals["A2"] <= 18){
    shipImage.src = "frontsail.png";
    return;
  }
  shipImage.src = "nosail.png";
};

startButton.addEventListener("click", async () => {
  port = await navigator.serial.requestPort();
  await port.open({ baudRate: 9600 });

  const textDecoder = new TextDecoderStream();
  const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
  reader = textDecoder.readable.getReader();

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      reader.releaseLock();
      break;
    }
    iBuf += value;
    
    if(iBuf.includes('\n')){
      let [first, ...rest] = iBuf.split('\n');
      iBuf = rest.join('\n');
      serialOutput.textContent = first;
      processLine(first);
    }
  }
});



window.addEventListener("load", () => {
  document.body.appendChild(startButton);
  document.body.appendChild(serialOutput);
  document.body.appendChild(shipImage);
});
