"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
let game;
class ShipAttachment extends GameObject {
    static maybeNew(argAttName) {
        if (argAttName == "")
            return null;
        return new ShipAttachment(argAttName);
    }
    constructor(argAttName) {
        let maybeAttachmentConfig = null;
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
            case "cargo":
                maybeAttachmentConfig = {
                    partName: "cargo",
                    windSpeedBoost: 0,
                    baseWaterSpeed: 0,
                    waterDrag: 10,
                    cargoCapacity: 150
                };
                spriteSize = new Vec2(2, 2);
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
        const bitmap = game === null || game === void 0 ? void 0 : game.loadedBitmaps[maybeAttachmentConfig.partName + "AttachmentRight"];
        if (!bitmap) {
            throw Error(`Invalid attachment bitmap: ${argAttName + "AttachmentRight"}!`);
        }
        const sprite = new Sprite(bitmap, spriteSize);
        super(sprite, Vec2.zero, Vec2.zero);
        this.attachmentConfig = maybeAttachmentConfig;
        this._elapsedMillis = 0;
    }
    animate(deltaMillis, currentRoom) {
        super.animate(deltaMillis, currentRoom);
        let bitmap;
        if (this.attachmentConfig.partName == "flettner") {
            const animStep = Math.floor(this._elapsedMillis / 250) % 8 + 1;
            bitmap = game === null || game === void 0 ? void 0 : game.loadedBitmaps[`flettner${animStep}`];
        }
        else {
            if (this.velocity.x >= 0) {
                bitmap =
                    game === null || game === void 0 ? void 0 : game.loadedBitmaps[this.attachmentConfig.partName + "AttachmentRight"];
            }
            else {
                bitmap =
                    game === null || game === void 0 ? void 0 : game.loadedBitmaps[this.attachmentConfig.partName + "AttachmentLeft"];
            }
        }
        this._elapsedMillis += deltaMillis;
        if (!bitmap) {
            throw Error("Invalid attachment bitmap! Did you load both left and right textures?");
        }
        if (!this.sprite)
            return;
        this.sprite = new Sprite(bitmap, this.sprite.size);
    }
}
class CargoTarget extends GameObject {
    constructor(targetType, worldPos) {
        let spriteSize = Vec2.zero;
        switch (targetType) {
            case "home":
                spriteSize = new Vec2(20, 20);
                break;
            case "island":
                spriteSize = new Vec2(25, 25);
                break;
            default:
                break;
        }
        const bitmap = game === null || game === void 0 ? void 0 : game.loadedBitmaps[targetType + "Target"];
        if (!bitmap) {
            throw Error(`Invalid cargotarget bitmap: ${targetType}Target !`);
        }
        const sprite = new Sprite(bitmap, spriteSize);
        super(sprite, worldPos, Vec2.zero);
        this.heldCargo = 0;
        this.maxCargo = 1000;
        this.zIndex = -50;
    }
    update(deltaMillis, currentRoom) {
        super.update(deltaMillis, currentRoom);
        if (this.heldCargo < 0) {
            this.heldCargo = 0;
        }
        if (this.heldCargo > this.maxCargo) {
            this.heldCargo = this.maxCargo;
        }
    }
    animate(deltaMillis, currentRoom) {
        super.animate(deltaMillis, currentRoom);
        if (!this.sprite)
            return;
        const progressBarWidth = 10;
        const progressBarHeight = 1;
        const progressBarOffset = new Vec2(0, this.sprite.size.y * 0.5 + 1);
        currentRoom.outlineRect(this.worldPosition.add(progressBarOffset).minus(new Vec2(progressBarWidth, progressBarHeight).times(0.5)), this.worldPosition.add(progressBarOffset).add(new Vec2(progressBarWidth, progressBarHeight).times(0.5)), "#b08460", 0.2);
        currentRoom.fillRect(this.worldPosition.add(progressBarOffset).minus(new Vec2(progressBarWidth, progressBarHeight).times(0.5)), this.worldPosition.add(progressBarOffset)
            .add(new Vec2(progressBarWidth, progressBarHeight)
            .times(0.5)
            .minus(new Vec2(progressBarWidth * (1 - this.heldCargo / this.maxCargo), 0))), "#b08460");
        currentRoom.drawSprite(this.worldPosition.add(progressBarOffset).minus(new Vec2(progressBarWidth * 0.5 + progressBarHeight * 1.5, 0)), new Sprite(game.loadedBitmaps["cargoicon"], new Vec2(progressBarHeight, progressBarHeight).times(2)));
        currentRoom.drawText(this.worldPosition.add(progressBarOffset).add(new Vec2(0, progressBarHeight * 2)), 1.5, Math.round(this.heldCargo).toString(), "#b08460");
        // this.sprite.size = new Vec2(20, 20).times(1 + this.heldCargo * 0.001);
    }
}
var ShipState;
(function (ShipState) {
    ShipState[ShipState["idle"] = 0] = "idle";
    ShipState[ShipState["goingHome"] = 1] = "goingHome";
    ShipState[ShipState["goingToTarget"] = 2] = "goingToTarget";
    ShipState[ShipState["loadingCargo"] = 3] = "loadingCargo";
    ShipState[ShipState["unloadingCargo"] = 4] = "unloadingCargo";
})(ShipState || (ShipState = {}));
class Ship extends GameObject {
    constructor(argHullName, argAtt1Name, argAtt2Name, worldPos) {
        let hull = null;
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
        const bitmap = game === null || game === void 0 ? void 0 : game.loadedBitmaps[hull.partName + "HullRight"];
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
    }
    update(deltaMillis, currentRoom) {
        const windSpeed = 10; // m/s
        const cargoLoadSpeed = 60; // Units per second
        const deltaSeconds = deltaMillis * 0.001;
        let statSum = {
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
        if (!this.target || !this.home)
            this.state = ShipState.idle;
        let toPosition = Vec2.zero; // Where we want to go
        switch (this.state) {
            case ShipState.idle: {
                toPosition = this.worldPosition;
                if (this.home)
                    this.state = ShipState.goingHome;
                break;
            }
            case ShipState.goingToTarget: {
                toPosition = new Vec2(this.target.worldPosition.x, 0);
                const targetDist = Vec2.distance(toPosition, this.worldPosition);
                if (targetDist < this.targetStopDistance) {
                    this.state = ShipState.loadingCargo;
                }
                break;
            }
            case ShipState.goingHome: {
                toPosition = new Vec2(this.home.worldPosition.x, 0);
                const targetDist = Vec2.distance(toPosition, this.worldPosition);
                if (targetDist < this.homeStopDistance) {
                    this.state = ShipState.unloadingCargo;
                }
                break;
            }
            case ShipState.loadingCargo: {
                toPosition = this.worldPosition;
                if (this.target.heldCargo > 0) {
                    this.target.heldCargo -= cargoLoadSpeed * deltaSeconds;
                    this.carryingCargo += cargoLoadSpeed * deltaSeconds;
                }
                if (this.target.heldCargo <= 0) {
                    this.carryingCargo += this.target.heldCargo;
                    this.target.heldCargo = 0;
                    this.state = ShipState.goingHome;
                }
                if (this.carryingCargo < statSum.cargoCapacity) {
                    this.target.heldCargo -= cargoLoadSpeed * deltaSeconds;
                    this.carryingCargo += cargoLoadSpeed * deltaSeconds;
                }
                if (this.carryingCargo >= statSum.cargoCapacity) {
                    this.target.heldCargo += this.carryingCargo - statSum.cargoCapacity;
                    this.carryingCargo = statSum.cargoCapacity;
                    this.state = ShipState.goingHome;
                }
                break;
            }
            case ShipState.unloadingCargo: {
                toPosition = this.worldPosition;
                if (this.carryingCargo > 0) {
                    this.carryingCargo -= cargoLoadSpeed * deltaSeconds;
                    this.home.heldCargo += cargoLoadSpeed * deltaSeconds;
                }
                if (this.carryingCargo <= 0) {
                    this.carryingCargo = 0;
                    this.state = ShipState.goingToTarget;
                }
                break;
            }
        }
        this.velocity = Vec2.zero;
        if ((this.state == ShipState.goingHome ||
            this.state == ShipState.goingToTarget) &&
            toPosition != this.worldPosition) {
            this.velocity = toPosition
                .minus(this.worldPosition)
                .unit()
                .times(statSum.baseWaterSpeed -
                this.velocity.magnitude() * statSum.waterDrag +
                (windSpeed - this.velocity.magnitude()) *
                    statSum.windSpeedBoost *
                    deltaSeconds);
        }
        let att1off = Vec2.zero; // For cargo ship
        let att2off = Vec2.zero; // For cargo ship
        if (this.hull.partName == "pirate") {
            att1off = new Vec2(0, 0);
            att2off = new Vec2(-3, 0).times(this.velocity.x >= 0 ? 1 : -1)
                .add(new Vec2(0, -1.8));
        }
        if (this.attachment1) {
            if (currentRoom.objects.indexOf(this.attachment1) == -1) {
                currentRoom.objects.push(this.attachment1);
            }
            let att1Size = Vec2.zero;
            if (this.attachment1.sprite) {
                att1Size = this.attachment1.sprite.size;
            }
            this.attachment1.worldPosition = this.worldPosition.add(att1off).add(new Vec2(0, -att1Size.y * 0.5));
            this.attachment1.velocity = this.velocity;
            this.attachment1.update(deltaMillis, currentRoom);
        }
        if (this.attachment2) {
            if (currentRoom.objects.indexOf(this.attachment2) == -1) {
                currentRoom.objects.push(this.attachment2);
            }
            let att2Size = Vec2.zero;
            if (this.attachment2.sprite) {
                att2Size = this.attachment2.sprite.size;
            }
            this.attachment2.worldPosition = this.worldPosition.add(att2off).add(new Vec2(0, -att2Size.y * 0.5));
            this.attachment2.velocity = this.velocity;
            this.attachment2.update(deltaMillis, currentRoom);
        }
        super.update(deltaMillis, currentRoom);
    }
    animate(deltaMillis, currentRoom) {
        if (this.attachment1) {
            this.attachment1.animate(deltaMillis, currentRoom);
        }
        if (this.attachment2) {
            this.attachment2.animate(deltaMillis, currentRoom);
        }
        super.animate(deltaMillis, currentRoom);
        let bitmap;
        if (this.velocity.x >= 0) {
            bitmap = game === null || game === void 0 ? void 0 : game.loadedBitmaps[this.hull.partName + "HullRight"];
        }
        else {
            bitmap = game === null || game === void 0 ? void 0 : game.loadedBitmaps[this.hull.partName + "HullLeft"];
        }
        if (!bitmap) {
            throw Error("Invalid hull bitmap! Did you load both left and right textures?");
        }
        if (!this.sprite)
            return;
        this.sprite = new Sprite(bitmap, this.sprite.size);
    }
}
class GameBg extends GameObject {
    constructor() {
        super(undefined, Vec2.zero, Vec2.zero);
        this.zIndex = -100;
    }
    update(deltaMillis, currentRoom) {
        super.update(deltaMillis, currentRoom);
    }
    animate(deltaMillis, currentRoom) {
        super.animate(deltaMillis, currentRoom);
        currentRoom._fillRect(new Vec2(-1000, 1), new Vec2(1000, 500), "#76b0f8"); //This is necessary to get it to be in the background :(
    }
}
const startGame = (hull, a1, a2) => {
    const canvas = document.querySelector("#canvas");
    if (!canvas) {
        throw Error("Couldn't load canvas!");
    }
    game = new Game(canvas);
    window.addEventListener("resize", () => {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    });
    Promise.all([
        game.preloadBitmap("cargoHullRight", "Assets/NoSailNoOutlineRight.png"),
        game.preloadBitmap("cargoHullLeft", "Assets/NoSailNoOutlineLeft.png"),
        game.preloadBitmap("pirateHullRight", "Assets/PirateShip/Right.png"),
        game.preloadBitmap("pirateHullLeft", "Assets/PirateShip/Left.png"),
        game.preloadBitmap("islandTarget", "Assets/Island.png"),
        game.preloadBitmap("homeTarget", "Assets/IslandBase.png"),
        game.preloadBitmap("rectangleSailAttachmentRight", "Assets/SailboatRight.png"),
        game.preloadBitmap("rectangleSailAttachmentLeft", "Assets/SailboatLeft.png"),
        game.preloadBitmap("cargoAttachmentLeft", "Assets/CargoCrate.png"),
        game.preloadBitmap("cargoAttachmentRight", "Assets/CargoCrate.png"),
        game.preloadBitmap("flettnerAttachmentRight", "Assets/Flettner/1.png"),
        game.preloadBitmap("flettnerAttachmentLeft", "Assets/Flettner/1.png"),
        (() => __awaiter(void 0, void 0, void 0, function* () {
            for (let i = 1; i <= 8; i++) {
                yield game.preloadBitmap(`flettner${i}`, `Assets/Flettner/${i}.png`);
            }
        }))(),
        game.preloadBitmap("frontsailright", "Assets/FrontSailNoOutlineRight.png"),
        game.preloadBitmap("backsailright", "Assets/BackSailNoOutlineRight.png"),
        game.preloadBitmap("frontsailleft", "Assets/FrontSailNoOutlineLeft.png"),
        game.preloadBitmap("backsailleft", "Assets/BackSailNoOutlineLeft.png"),
        game.preloadBitmap("cargoicon", "Assets/crate.png"),
    ]).then(() => {
        if (hull == "")
            return;
        const ship = new Ship(hull, a1, a2, new Vec2(-20, 0));
        const home = new CargoTarget("home", new Vec2(-50, -2));
        const target = new CargoTarget("island", new Vec2(50, -4));
        target.heldCargo = 1000;
        ship.home = home;
        ship.target = target;
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        game.room.cameraWorldPos = home.worldPosition.add(new Vec2(0, -2.5));
        game.room.viewportWidth = 60;
        const textObj = new GameObject(undefined, home.worldPosition, Vec2.zero);
        let eMillis = 0;
        textObj.animate = (deltaMillis, currentRoom) => {
            currentRoom.drawText(textObj.worldPosition.add(new Vec2(0, -14)), 3, "Retrieve the gold,", "#ffd866");
            currentRoom.drawText(textObj.worldPosition.add(new Vec2(0, -10)), 3, "Build your island!", "#ffd866");
            eMillis += deltaMillis;
            const widthT = 150;
            const posT = Vec2.zero;
            if (eMillis > 2000 && game.room.viewportWidth < widthT) {
                game.room.viewportWidth += deltaMillis * 0.2;
                game.room.viewportWidth = widthT;
            }
            else if (widthT - game.room.viewportWidth < 1) {
                game.room.viewportWidth = widthT;
            }
            if (eMillis > 2000 && game.room.cameraWorldPos != posT) {
                game.room.cameraWorldPos = game.room.cameraWorldPos.add(posT.minus(game.room.cameraWorldPos).unit().times(deltaMillis * 0.05));
                game.room.cameraWorldPos = posT;
            }
            else if (game.room.cameraWorldPos.minus(posT).x > 0) {
                game.room.cameraWorldPos = posT;
            }
        };
        game.room.objects = [ship, home, target, new GameBg(), textObj];
        document.body.style.backgroundColor = "#eef";
        game.start();
    });
};
window.onload = () => { startGame("pirate", "flettner", "flettner"); };
