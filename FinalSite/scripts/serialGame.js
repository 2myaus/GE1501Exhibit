const startButton = document.createElement("button");
startButton.style.zIndex = 1000;
startButton.style.position = "absolute";
startButton.style.top = "10px";
startButton.style.left = "10px";
startButton.textContent = "Select device";

const serialOutput = document.createElement("div");
const shipImage = document.createElement("img");

let port;
let reader;
let writer;

let iBuf = "";

let pinVals = {};

const startSerial = async () => {
  const ports = await navigator.serial.getPorts();
  if (ports.length > 0) {
    port = ports[0];
  }
  else {
    port = await navigator.serial.requestPort();
  }
  await port.open({ baudRate: 9600 });

  startButton.remove();

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

    if (iBuf.endsWith("end")) {
      let [first, second, third, ..._rest] = iBuf.split("\r\n");
      iBuf = [];

      if (
        !(
          first.startsWith("White: ") &&
          second.startsWith("Blue: ") &&
          third.startsWith("Green: ")
        )
      ) {
        continue;
      }

      const hullNum = parseInt(first.split("White: ")[1]); // Hull
      const frontNum = parseInt(second.split("Blue: ")[1]); // Front sail
      const backNum = parseInt(third.split("Green: ")[1]); // Rear sail

      let hullName = "";
      let frontName = "";
      let backName = "";

      hullName = (() => {
        if (hullNum < 395) return "cargo";
        else if (hullNum < 580) return "pirate";
        else return "";
      })();

      const getAttachment = (num) => {
        if (num < 45) return "rectangleSail";
        else if (num < 60) return "cargo";
        else if (num < 130) return "cargo";
        else if (num < 580) return "flettner";
        else return "";
      };

      frontName = getAttachment(frontNum);
      backName = getAttachment(backNum);

      if (hullName == "") {
        alert("No hull detected!");
      }

      if(game){ game.stop(); }
      startGame(hullName, frontName, backName);

      console.log(hullName, frontName, backName);
    }
  }
};

startButton.addEventListener("click", startSerial);

window.addEventListener("load", () => {
  document.body.appendChild(startButton);
  if(navigator.serial){
    navigator.serial.getPorts().then(async (ports) => {
      if(ports.length == 0) return;
      await startSerial();  
    });
  }
  else{
    // startGame("pirate", "rectangleSail", "flettner");
    startGame(prompt("hull?"), prompt("att1?"), prompt("att2?"));
  }
});


