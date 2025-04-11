let game: Game;

type shipPart = {
  partName: string;
  windSpeedBoost: number; // Percent of relative wind speed that is added to the ship's acceleration (m/s^2 per m/s)
  baseWaterSpeed: number; // Base speed relative to water (m/s)
  waterDrag: number; // Percent of relative water speed that is subtracted from the ship's acceleration (m/s^2 per m/s)
  cargoCapacity: number; // Capacity of cargo in units
};

class ShipAttachment extends GameObject {
  attachmentConfig: shipPart;

  _elapsedMillis: number;

  static maybeNew(argAttName: string): ShipAttachment | null {
    if (argAttName == "") return null;
    return new ShipAttachment(argAttName);
  }

  constructor(argAttName: string) {
    let maybeAttachmentConfig: shipPart | null = null;
    let spriteSize = Vec2.zero;

    switch (argAttName) {
      case "rectangleSail":
        maybeAttachmentConfig = {
          partName: "rectangleSail",
          windSpeedBoost: 100,
          baseWaterSpeed: 0,
          waterDrag: 0,
          cargoCapacity: 0,
        };
        spriteSize = new Vec2(5, 5);
        break;
      case "cargo1":
        maybeAttachmentConfig = {
          partName: "cargo1",
          windSpeedBoost: 0,
          baseWaterSpeed: 0,
          waterDrag: 10,
          cargoCapacity: 150
        };
        spriteSize = new Vec2(2, 2);
        break;
      case "cargo2":
        maybeAttachmentConfig = {
          partName: "cargo2",
          windSpeedBoost: 0,
          baseWaterSpeed: 0,
          waterDrag: 18,
          cargoCapacity: 250
        };
        spriteSize = new Vec2(4, 4);
        break;
      case "flettner":
        maybeAttachmentConfig = {
          partName: "flettner",
          windSpeedBoost: 70,
          baseWaterSpeed: 0,
          waterDrag: 0,
          cargoCapacity: 50
        };
        spriteSize = new Vec2(3, 3);
        break;
      default:
        break;
    }
    if (!maybeAttachmentConfig) {
      throw Error("Invalid attachment!");
    }

    const bitmap =
      game?.loadedBitmaps[maybeAttachmentConfig.partName + "AttachmentRight"];

    if (!bitmap) {
      throw Error(
        `Invalid attachment bitmap: ${argAttName + "AttachmentRight"}!`,
      );
    }

    const sprite = new Sprite(bitmap, spriteSize);
    super(sprite, Vec2.zero, Vec2.zero);

    this.attachmentConfig = maybeAttachmentConfig;
    this._elapsedMillis = 0;
  }

  animate(deltaMillis: number, currentRoom: Room) {
    super.animate(deltaMillis, currentRoom);

    let bitmap: ImageBitmap | undefined;

    if (this.attachmentConfig.partName == "flettner") {
      const animStep = Math.floor(this._elapsedMillis / 250) % 8 + 1;
      bitmap = game?.loadedBitmaps[`flettner${animStep}`];
    }

    else {
      if (this.velocity.x >= 0) {
        bitmap =
          game?.loadedBitmaps[this.attachmentConfig.partName + "AttachmentRight"];
      } else {
        bitmap =
          game?.loadedBitmaps[this.attachmentConfig.partName + "AttachmentLeft"];
      }
    }

    this._elapsedMillis += deltaMillis;

    if (!bitmap) {
      throw Error(
        "Invalid attachment bitmap! Did you load both left and right textures?",
      );
    }

    if (!this.sprite) return;

    this.sprite = new Sprite(bitmap, this.sprite.size);
  }
}

class CargoTarget extends GameObject {
  heldCargo: number;
  maxCargo: number; // For visual progress bar only
  targetType: string;

  constructor(targetType: string, worldPos: Vec2) {
    let spriteSize = Vec2.zero;
    let bitmapName = "";
    switch (targetType) {
      case "home":
        spriteSize = new Vec2(20, 20);
        bitmapName = "islandEmpty";
        break;
      case "island":
        spriteSize = new Vec2(25, 25);
        bitmapName = "islandEmpty";
        break;
      default:
        break;
    }

    const bitmap = game?.loadedBitmaps[bitmapName];

    if (!bitmap) {
      throw Error(`Invalid cargotarget bitmap: ${bitmapName}!`);
    }

    const sprite = new Sprite(bitmap, spriteSize);
    super(sprite, worldPos, Vec2.zero);
    this.heldCargo = 0;
    this.maxCargo = 1800;
    this.zIndex = -50;
    this.targetType = targetType;
  }

  update(deltaMillis: number, currentRoom: Room) {
    super.update(deltaMillis, currentRoom);
    if (this.heldCargo < 0) {
      this.heldCargo = 0;
    }
    if (this.heldCargo > this.maxCargo) {
      this.heldCargo = this.maxCargo;
    }
  }

  animate(deltaMillis: number, currentRoom: Room) {
    super.animate(deltaMillis, currentRoom);

    if (!this.sprite) return;

    let buildingSprite: Sprite | null = null;
    let buildingStage = Math.min(Math.max(Math.floor(3 * this.heldCargo / this.maxCargo) + 1, 1), 3);
    let off = Vec2.zero;

    if (this.targetType == "home") {
      buildingSprite = new Sprite(game.loadedBitmaps[`homeIslandBuilding${buildingStage}`], new Vec2(15, 15));
      off = new Vec2(-1, 1);
    }
    else {
      buildingSprite = new Sprite(game.loadedBitmaps[`targetIslandBuilding${buildingStage}`], new Vec2(10, 10));
      off = new Vec2(-4, 0);
    }

    if (buildingSprite) {
      currentRoom.drawSprite(this.worldPosition.add(off), buildingSprite);
    }


    const progressBarWidth = 10;
    const progressBarHeight = 1;

    const progressBarOffset = new Vec2(0, this.sprite.size.y * 0.5 + 1);

    currentRoom.outlineRect(
      this.worldPosition.add(progressBarOffset).minus(new Vec2(progressBarWidth, progressBarHeight).times(0.5)),
      this.worldPosition.add(progressBarOffset).add(new Vec2(progressBarWidth, progressBarHeight).times(0.5)),
      "#b08460",
      0.2
    );

    currentRoom.fillRect(
      this.worldPosition.add(progressBarOffset).minus(new Vec2(progressBarWidth, progressBarHeight).times(0.5)),
      this.worldPosition.add(progressBarOffset)
        .add(new Vec2(progressBarWidth, progressBarHeight)
          .times(0.5)
          .minus(new Vec2(progressBarWidth * (1 - this.heldCargo / this.maxCargo), 0))),
      "#b08460"
    );

    currentRoom.drawSprite(this.worldPosition.add(progressBarOffset).minus(new Vec2(progressBarWidth * 0.5 + progressBarHeight * 1.5, 0)),
      new Sprite(game.loadedBitmaps["cargoicon"], new Vec2(progressBarHeight, progressBarHeight).times(2)));

    currentRoom.drawText(this.worldPosition.add(progressBarOffset).add(new Vec2(0, progressBarHeight * 2)), 1.5, Math.round(this.heldCargo).toString(), "#b08460")

    // this.sprite.size = new Vec2(20, 20).times(1 + this.heldCargo * 0.001);
  }
}

enum ShipState {
  idle,
  goingHome,
  goingToTarget,
  loadingCargo,
  unloadingCargo,
}

class Ship extends GameObject {
  hull: shipPart;

  attachment1: ShipAttachment | null;
  attachment2: ShipAttachment | null;

  target: CargoTarget | null;
  targetStopDistance: number; // Distance to stop from the target, in m

  home: CargoTarget | null;
  homeStopDistance: number; // Distance to stop from home, in m

  state: ShipState;

  carryingCargo: number;
  lastBonus: number; // Last bonus cargo amount. Use during return phase to display bonus

  constructor(
    argHullName: string,
    argAtt1Name: string,
    argAtt2Name: string,
    worldPos: Vec2,
  ) {
    let hull: shipPart | null = null;

    switch (argHullName) {
      case "cargo":
        hull = {
          partName: "cargo",
          windSpeedBoost: 0,
          baseWaterSpeed: 10,
          waterDrag: 10,
          cargoCapacity: 250,
        };
        break;
      case "pirate":
        hull = {
          partName: "pirate",
          windSpeedBoost: 1,
          baseWaterSpeed: 13,
          waterDrag: 10,
          cargoCapacity: 150
        };
        break;
      default:
        hull = null;
        break;
    }

    if (!hull) {
      throw Error("Invalid hull!");
    }

    const bitmap = game?.loadedBitmaps[hull.partName + "HullRight"];

    if (!bitmap) {
      throw Error(`Invalid hull bitmap: ${hull.partName}HullRight !`);
    }

    const sprite = new Sprite(bitmap, new Vec2(10, 10));

    super(sprite, worldPos, Vec2.zero);

    this.hull = hull;
    this.attachment1 = ShipAttachment.maybeNew(argAtt1Name);
    this.attachment2 = ShipAttachment.maybeNew(argAtt2Name);

    this.target = null;
    this.targetStopDistance = 15;
    this.home = null;
    this.homeStopDistance = 15;
    this.carryingCargo = 0;

    this.state = ShipState.idle;

    this.zIndex = 50;
    this.lastBonus = 0;

    let statSum: shipPart = {
      partName: "sum",
      waterDrag: this.hull.waterDrag,
      cargoCapacity: this.hull.cargoCapacity,
      baseWaterSpeed: this.hull.baseWaterSpeed,
      windSpeedBoost: this.hull.windSpeedBoost,
    };

    if (this.attachment1) {
      statSum.waterDrag += this.attachment1.attachmentConfig.waterDrag;
      statSum.cargoCapacity += this.attachment1.attachmentConfig.cargoCapacity;
      statSum.baseWaterSpeed +=
        this.attachment1.attachmentConfig.baseWaterSpeed;
      statSum.windSpeedBoost +=
        this.attachment1.attachmentConfig.windSpeedBoost;
    }

    if (this.attachment2) {
      statSum.waterDrag += this.attachment2.attachmentConfig.waterDrag;
      statSum.cargoCapacity += this.attachment2.attachmentConfig.cargoCapacity;
      statSum.baseWaterSpeed +=
        this.attachment2.attachmentConfig.baseWaterSpeed;
      statSum.windSpeedBoost +=
        this.attachment2.attachmentConfig.windSpeedBoost;
    }

    this.statSum = statSum;
  }

  statSum: shipPart;

  update(deltaMillis: number, currentRoom: Room) {
    const windSpeed = 12; // m/s
    const cargoLoadSpeed = 120; // Units per second
    const deltaSeconds = deltaMillis * 0.001;


    if (!this.target || !this.home) this.state = ShipState.idle;
    let toPosition: Vec2 = Vec2.zero; // Where we want to go

    switch (this.state) {
      case ShipState.idle: {
        toPosition = this.worldPosition;
        if (this.home) this.state = ShipState.goingHome;
        break;
      }
      case ShipState.goingToTarget: {
        this.lastBonus = 0;
        toPosition = new Vec2(this.target!.worldPosition.x, 0);
        const targetDist = Vec2.distance(toPosition, this.worldPosition);
        if (targetDist < this.targetStopDistance) {
          this.state = ShipState.loadingCargo;
        }
        break;
      }
      case ShipState.goingHome: {
        toPosition = new Vec2(this.home!.worldPosition.x, 0);
        const targetDist = Vec2.distance(toPosition, this.worldPosition);
        if (targetDist < this.homeStopDistance) {
          this.state = ShipState.unloadingCargo;
        }
        if (buttonPressed) {
          const offDist = Math.abs(Vec2.distance(this.worldPosition, toPosition) - this.homeStopDistance * 1.5);
          const cargoBonus = Math.min(Math.max(5 - offDist, 0), 5) * 30;

          const oldTargetCargo = this.target!.heldCargo;
          this.target!.heldCargo -= cargoBonus;
          if (this.target!.heldCargo < 0) { this.target!.heldCargo = 0; }
          const realCargoBonus = oldTargetCargo - this.target!.heldCargo;
          this.carryingCargo += realCargoBonus;
          this.lastBonus = realCargoBonus;

          buttonPresses += 1;
        }

        if (this.lastBonus == 0 && !game.over && this.target!.heldCargo > 0) {
          currentRoom.outlineCircle(this.home!.worldPosition, this.homeStopDistance * 1.5, "#0fa", 2);
          currentRoom.outlineCircle(this.home!.worldPosition, Vec2.distance(this.worldPosition, toPosition), "#0af", 0.3)
        }

        break;
      }
      case ShipState.loadingCargo: {
        toPosition = this.worldPosition;
        if (this.target!.heldCargo > 0) {
          this.target!.heldCargo -= cargoLoadSpeed * deltaSeconds;
          this.carryingCargo += cargoLoadSpeed * deltaSeconds;
        }
        if (this.target!.heldCargo <= 0) {
          this.carryingCargo += this.target!.heldCargo;
          this.target!.heldCargo = 0;
          this.state = ShipState.goingHome;
        }
        if (this.carryingCargo < this.statSum.cargoCapacity) {
          this.target!.heldCargo -= cargoLoadSpeed * deltaSeconds;
          this.carryingCargo += cargoLoadSpeed * deltaSeconds;
        }
        if (this.carryingCargo >= this.statSum.cargoCapacity) {
          this.target!.heldCargo += this.carryingCargo - this.statSum.cargoCapacity;
          this.carryingCargo = this.statSum.cargoCapacity;
          this.state = ShipState.goingHome;
        }
        break;
      }
      case ShipState.unloadingCargo: {
        toPosition = this.worldPosition;
        if (this.carryingCargo > 0) {
          this.carryingCargo -= cargoLoadSpeed * deltaSeconds;
          this.home!.heldCargo += cargoLoadSpeed * deltaSeconds;
        }
        if (this.carryingCargo <= 0) {
          this.carryingCargo = 0;
          this.state = ShipState.goingToTarget;
        }

        break;
      }
    }

    this.velocity = Vec2.zero;
    if (
      (this.state == ShipState.goingHome ||
        this.state == ShipState.goingToTarget) &&
      toPosition != this.worldPosition
    ) {
      this.velocity = toPosition
        .minus(this.worldPosition)
        .unit()
        .times(
          this.statSum.baseWaterSpeed -
          this.velocity.magnitude() * this.statSum.waterDrag +
          (windSpeed - this.velocity.magnitude()) *
          this.statSum.windSpeedBoost *
          deltaSeconds,
        );
    }

    let att1off = Vec2.zero; // For cargo ship
    let att2off = Vec2.zero; // For cargo ship
    if (this.hull.partName == "pirate") {
      att1off = new Vec2(0, 0);
      att2off = new Vec2(-3, 0).times(this.velocity.x >= 0 ? 1 : -1)
        .add(new Vec2(0, -1.8));
    }
    else if (this.hull.partName == "cargo") {
      att1off = new Vec2(2, 0).times(this.velocity.x >= 0 ? 1 : -1)
        .add(new Vec2(0, -0.5));
      att2off = new Vec2(-1, 0).times(this.velocity.x >= 0 ? 1 : -1)
        .add(new Vec2(0, -0.5));
    }

    if (this.attachment1) {
      if (currentRoom.objects.indexOf(this.attachment1) == -1) {
        currentRoom.objects.push(this.attachment1);
      }
      let att1Size = Vec2.zero;
      if (this.attachment1.sprite) { att1Size = this.attachment1.sprite.size; }
      this.attachment1.worldPosition = this.worldPosition.add(att1off).add(new Vec2(0, -att1Size.y * 0.5));
      this.attachment1.velocity = this.velocity;
      this.attachment1.update(deltaMillis, currentRoom);
    }
    if (this.attachment2) {
      if (currentRoom.objects.indexOf(this.attachment2) == -1) {
        currentRoom.objects.push(this.attachment2);
      }
      let att2Size = Vec2.zero;
      if (this.attachment2.sprite) { att2Size = this.attachment2.sprite.size; }
      this.attachment2.worldPosition = this.worldPosition.add(att2off).add(new Vec2(0, -att2Size.y * 0.5));
      this.attachment2.velocity = this.velocity;
      this.attachment2.update(deltaMillis, currentRoom);
    }
    super.update(deltaMillis, currentRoom);
    buttonPressed = false;
  }

  animate(deltaMillis: number, currentRoom: Room) {
    if (this.attachment1) {
      this.attachment1.animate(deltaMillis, currentRoom);
    }
    if (this.attachment2) {
      this.attachment2.animate(deltaMillis, currentRoom);
    }
    super.animate(deltaMillis, currentRoom);
    let bitmap: ImageBitmap | undefined;

    if (this.velocity.x >= 0) {
      bitmap = game?.loadedBitmaps[this.hull.partName + "HullRight"];
    } else {
      bitmap = game?.loadedBitmaps[this.hull.partName + "HullLeft"];
    }

    if (!bitmap) {
      throw Error(
        "Invalid hull bitmap! Did you load both left and right textures?",
      );
    }

    if (!this.sprite) return;

    this.sprite = new Sprite(bitmap, this.sprite.size);
    if (this.lastBonus > 0) {
      currentRoom.drawText(this.worldPosition.add(new Vec2(0, -4)), 3, `+${this.lastBonus.toFixed(0)}`, "#0f8");
    }
  }
}

class GameBg extends GameObject {
  constructor() {
    super(undefined, Vec2.zero, Vec2.zero);
    this.zIndex = -100;
  }

  update(deltaMillis: number, currentRoom: Room) {
    super.update(deltaMillis, currentRoom);
  }

  animate(deltaMillis: number, currentRoom: Room) {
    super.animate(deltaMillis, currentRoom);

    currentRoom._fillRect(new Vec2(-1000, 1), new Vec2(1000, 500), "#76b0f8"); //This is necessary to get it to be in the background :(
  }
}

let mainShip: Ship | undefined;

let buttonPressed = false;
let buttonPresses = 0;

let bestTime = 39500;

const startGame = (hull: string, a1: string, a2: string) => {
  const canvas: HTMLCanvasElement | null =
    document.querySelector<HTMLCanvasElement>("#canvas");

  if (!canvas) {
    throw Error("Couldn't load canvas!");
  }

  game = new Game(canvas);
  buttonPresses = 0;

  window.addEventListener("resize", () => {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  });

  Promise.all([
    game.preloadBitmap("cargoHullRight", "Assets/Cargo/Right.png"),
    game.preloadBitmap("cargoHullLeft", "Assets/Cargo/Left.png"),
    game.preloadBitmap("pirateHullRight", "Assets/PirateShip/Right.png"),
    game.preloadBitmap("pirateHullLeft", "Assets/PirateShip/Left.png"),

    game.preloadBitmap(
      "islandTarget",
      "Assets/Island.png",
    ),
    game.preloadBitmap(
      "homeTarget",
      "Assets/IslandBase.png",
    ),

    game.preloadBitmap("islandEmpty", "Assets/IslandEmpty.png"),
    (async () => {
      for (let i = 1; i <= 3; i++) {
        await game.preloadBitmap(`homeIslandBuilding${i}`, `Assets/HomeBuildings/${i}.png`);
      }
    })(),
    (async () => {
      for (let i = 1; i <= 3; i++) {
        await game.preloadBitmap(`targetIslandBuilding${i}`, `Assets/CoinPiles/${i}.png`);
      }
    })(),

    game.preloadBitmap(
      "rectangleSailAttachmentRight",
      "Assets/RectangleSail/Right.png",
    ),
    game.preloadBitmap(
      "rectangleSailAttachmentLeft",
      "Assets/RectangleSail/Left.png",
    ),
    game.preloadBitmap(
      "cargo1AttachmentLeft",
      "Assets/CargoCrate.png"
    ),
    game.preloadBitmap(
      "cargo1AttachmentRight",
      "Assets/CargoCrate.png"
    ),
    game.preloadBitmap(
      "cargo2AttachmentLeft",
      "Assets/DoubleCargoCrate.png"
    ),
    game.preloadBitmap(
      "cargo2AttachmentRight",
      "Assets/DoubleCargoCrate.png"
    ),
    game.preloadBitmap(
      "flettnerAttachmentRight",
      "Assets/Flettner/1.png"
    ),
    game.preloadBitmap(
      "flettnerAttachmentLeft",
      "Assets/Flettner/1.png"
    ),
    (async () => {
      for (let i = 1; i <= 8; i++) {
        await game.preloadBitmap(`flettner${i}`, `Assets/Flettner/${i}.png`);
      }
    })(),
    game.preloadBitmap("frontsailright", "Assets/FrontSailNoOutlineRight.png"),
    game.preloadBitmap("backsailright", "Assets/BackSailNoOutlineRight.png"),
    game.preloadBitmap("frontsailleft", "Assets/FrontSailNoOutlineLeft.png"),
    game.preloadBitmap("backsailleft", "Assets/BackSailNoOutlineLeft.png"),
    game.preloadBitmap("cargoicon", "Assets/crate.png"),
  ]).then(() => {
    if (hull == "") return;

    const ship = new Ship(hull, a1, a2, new Vec2(-30, 0));
    const home = new CargoTarget("home", new Vec2(-50, -2));
    const target = new CargoTarget("island", new Vec2(50, -4));
    target.heldCargo = target.maxCargo;
    ship.state = ShipState.goingToTarget;
    ship.home = home;
    ship.target = target;

    mainShip = ship;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    game.room.cameraWorldPos = home.worldPosition.add(new Vec2(0, -2.5));
    game.room.viewportWidth = 60;

    const textObj = new GameObject(undefined, home.worldPosition, Vec2.zero);

    let eMillis = 0;
    let eUpdateMillis = 0;

    const startTime = 2000;
    const startViewportWidth = game.room.viewportWidth;
    const startCameraPos = game.room.cameraWorldPos;

    const endTime = 3000;
    const endViewportWidth = 150;
    const endCameraPos = Vec2.zero;

    textObj.update = (deltaMillis: number, _) => {
      if (game.over) return;
      eUpdateMillis += deltaMillis;
    }


    async function sendLog(elapsedMillis: number, buttonPresses: number) {
      const data = {
        elapsedMillis,
        buttonPresses
      };

      try {
        const response = await fetch('http://localhost:8080', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });

        const text = await response.text();
        console.log("Server response:", text);
      } catch (error) {
        console.error("Error sending data:", error);
      }
    }

    let gameWasOver = false;
    const gameOverFunc = () => {
      if (!sendLog) return;
      try {
        sendLog(Math.floor(eUpdateMillis), buttonPresses);
      } catch (e) { }
    };

    textObj.animate = (deltaMillis: number, currentRoom: Room) => {
      if (!game.over) {
        currentRoom.drawText(textObj.worldPosition.add(new Vec2(0, -14)), 3, "Retrieve the gold,", "#ffd866");
        currentRoom.drawText(textObj.worldPosition.add(new Vec2(0, -10)), 3, "Build your island!", "#ffd866");

        eMillis += deltaMillis;

        if (eMillis <= startTime) {
          game.room.viewportWidth = startViewportWidth;
          game.room.cameraWorldPos = startCameraPos;
          game.room.timeScale = 0.001;

          currentRoom.drawText(mainShip!.worldPosition.add(new Vec2(-2, -10)), 2, `Speed: ${mainShip?.statSum.baseWaterSpeed}`, "#a0a8a6");
          currentRoom.drawText(mainShip!.worldPosition.add(new Vec2(-2, -8)), 2, `Wind power: ${mainShip?.statSum.windSpeedBoost}`, "#a0a8a6");
          currentRoom.drawText(mainShip!.worldPosition.add(new Vec2(-2, -6)), 2, `Cargo capacity: ${mainShip?.statSum.cargoCapacity}`, "#a0a8a6");
        }
        else if (eMillis > endTime) {
          game.room.viewportWidth = endViewportWidth;
          game.room.cameraWorldPos = endCameraPos;
          game.room.timeScale = 1;
        }
        else {
          const animationDuration = endTime - startTime;
          const animationCurrentTime = eMillis - startTime;
          game.room.viewportWidth = startViewportWidth + (endViewportWidth - startViewportWidth) * (animationCurrentTime / animationDuration);
          game.room.cameraWorldPos = startCameraPos.add(endCameraPos.minus(startCameraPos).times(animationCurrentTime / animationDuration));
        }

        game.over = home.heldCargo >= home.maxCargo;
      }
      else {
        let wintext = "You win!";
        if(eUpdateMillis < bestTime){
          bestTime = eUpdateMillis;
          wintext = "!! New best time !!";
        }
        else if(eUpdateMillis - 1000 < bestTime){
          wintext = "Amazing!";
        }
        else if(eUpdateMillis - 5000 < bestTime){
          wintext = "Great!";
        }
        else if(eUpdateMillis - 10000 < bestTime){
          wintext = "OK..";
        }
        else{
          wintext = "Sluggish..";
        }
        currentRoom.drawText(new Vec2(0, -20), 5, wintext, "#ffd866");
        currentRoom.drawText(new Vec2(0, -15), 5, `Time: ${(eUpdateMillis * 0.001).toFixed(1)}s`, "#ffd866");
        currentRoom.drawText(new Vec2(0, -10), 5, `Best time: ${(bestTime * 0.001).toFixed(1)}s`, "#ffd866");
        if (!gameWasOver) {
          gameOverFunc();
        }
        gameWasOver = true;
      }
    };

    game.room.objects = [ship, home, target, new GameBg(), textObj];

    document.body.style.backgroundColor = "#eef";
    game.start();

  });
};

// window.onload = () => { startGame("pirate", "flettner", "flettner"); };
