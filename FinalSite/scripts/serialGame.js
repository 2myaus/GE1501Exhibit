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

      const hullNum = parseInt(first.split("White: ")[1]); // Hull
      const frontNum = parseInt(second.split("Blue: ")[1]); // Front sail
      const backNum = parseInt(third.split("Green")[1]); // Rear sail

      let hullName = "";
      let frontName = "";
      let backName = "";

      hullName = (() => {
        if(hullNum < 1) return "cargo";
        else if(hullNum < 2) return "pirate";
        else return "";
      });

      const getAttachment = (num) => {
        if(num < 1) return "rectangleSail";
        else if(num < 2) return "flettner";
        else if(num < 3) return "cargo";
        else if(num < 4) return "cargo";
        else return "";
      };

      frontName = getAttachment(frontNum);
      backName = getAttachment(backName);

      if (hullName == "") {
        alert("No hull detected!");
      }

      startGame(hullName, frontName, backName);

      console.log(hullName, frontName, backName);
    }
  }
});

window.addEventListener("load", () => {
  document.body.appendChild(startButton);
});
