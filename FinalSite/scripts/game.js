"use strict";
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
    }
    animate(deltaMillis, currentRoom) {
        super.animate(deltaMillis, currentRoom);
        let bitmap;
        if (this.velocity.x >= 0) {
            bitmap =
                game === null || game === void 0 ? void 0 : game.loadedBitmaps[this.attachmentConfig.partName + "AttachmentRight"];
        }
        else {
            bitmap =
                game === null || game === void 0 ? void 0 : game.loadedBitmaps[this.attachmentConfig.partName + "AttachmentLeft"];
        }
        if (!bitmap) {
            throw Error("Invalid attachment bitmap! Did you load both left and right textures?");
        }
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
    }
    animate(deltaMillis, currentRoom) {
        this.sprite.size = new Vec2(20, 20).times(1 + this.heldCargo * 0.001);
        super.animate(deltaMillis, currentRoom);
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
                toPosition = this.target.worldPosition;
                const targetDist = Vec2.distance(toPosition, this.worldPosition);
                if (targetDist < this.targetStopDistance) {
                    this.state = ShipState.loadingCargo;
                }
                break;
            }
            case ShipState.goingHome: {
                toPosition = this.home.worldPosition;
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
                if (this.target.heldCargo < 0) {
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
        if (this.attachment1) {
            if (currentRoom.objects.indexOf(this.attachment1) == -1) {
                currentRoom.objects.push(this.attachment1);
            }
            this.attachment1.worldPosition = this.worldPosition;
            this.attachment1.velocity = this.velocity;
            this.attachment1.update(deltaMillis, currentRoom);
        }
        if (this.attachment2) {
            if (currentRoom.objects.indexOf(this.attachment2) == -1) {
                currentRoom.objects.push(this.attachment2);
            }
            this.attachment2.worldPosition = this.worldPosition;
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
        this.sprite = new Sprite(bitmap, this.sprite.size);
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
        game.preloadBitmap("islandTarget", "https://static.vecteezy.com/system/resources/previews/023/271/197/original/tropical-island-illustrations-free-png.png"),
        game.preloadBitmap("homeTarget", "https://www.pngmart.com/files/4/Island-Transparent-PNG.png"),
        game.preloadBitmap("rectangleSailAttachmentRight", "Assets/SailboatRight.png"),
        game.preloadBitmap("rectangleSailAttachmentLeft", "Assets/SailboatLeft.png"),
        game.preloadBitmap("frontsailright", "Assets/FrontSailNoOutlineRight.png"),
        game.preloadBitmap("backsailright", "Assets/BackSailNoOutlineRight.png"),
        game.preloadBitmap("frontsailleft", "Assets/FrontSailNoOutlineLeft.png"),
        game.preloadBitmap("backsailleft", "Assets/BackSailNoOutlineLeft.png"),
    ]).then(() => {
        if (hull == "")
            return;
        const ship = new Ship(hull, a1, a2, new Vec2(-20, 0));
        const home = new CargoTarget("home", new Vec2(-50, 0));
        const target = new CargoTarget("island", new Vec2(50, 0));
        target.heldCargo = 1000;
        ship.home = home;
        ship.target = target;
        game.room.objects = [ship, home, target];
        game.room.viewportWidth = 150;
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        game.start();
    });
};
