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

      const firstNum = parseInt(first.substr(7)); //rear sail
      const secondNum = parseInt(second.substr(6)); //hull
      const thirdNum = parseInt(third.substr(7)); //front sail

      let hullName = "";
      let a1Name = "";
      let a2Name = "";

      if (firstNum < 500) {
        a2Name = "rectangleSail";
      }
      if (secondNum < 500) {
        hullName = "cargo";
      }
      if (thirdNum < 500) {
        a1Name = "rectangleSail";
      }

      if (hullName == "") {
        alert("No hull detected!");
      }

      startGame(hullName, a1Name, a2Name);

      console.log(hullName, a1Name, a2Name);
    }
  }
});

window.addEventListener("load", () => {
  document.body.appendChild(startButton);
});
