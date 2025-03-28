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
class Vec2 {
    constructor(argX, argY) {
        this.x = argX;
        this.y = argY;
    }
    add(rhs) {
        return new Vec2(this.x + rhs.x, this.y + rhs.y);
    }
    minus(rhs) {
        return new Vec2(this.x - rhs.x, this.y - rhs.y);
    }
    times(rhs) {
        return new Vec2(this.x * rhs, this.y * rhs);
    }
    magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    unit() {
        return this.times(1 / this.magnitude());
    }
    static distance(lhs, rhs) {
        return lhs.minus(rhs).magnitude();
    }
}
Vec2.zero = new Vec2(0, 0);
Vec2.one = new Vec2(1, 1);
// Vec2: A 2-component vector in world space
// ex.
// new Vec2(0, 0) has 0 magnitude
// new Vec2(1000, 0) is 1000m right
// new Vec2(-50, -50) is 50m down and 50m left
class Sprite {
    constructor(argBitmap, argSize) {
        this.bitmap = argBitmap;
        this.size = argSize;
    }
}
// Sprite: A visual sprite (image)
// ex.
// new Sprite("bee.png", Vec2(1, 2)): a 1m wide, 2m tall sprite of a bee
class GameObject {
    constructor(argSprite, argWorldPosition, argVelocity) {
        this.sprite = argSprite;
        this.worldPosition = argWorldPosition;
        this.velocity = argVelocity;
    }
    update(deltaMillis, currentRoom) {
        // Runs every game update, for motion/logic
        this.worldPosition = this.worldPosition.add(this.velocity.times(deltaMillis * 0.001));
    }
    animate(deltaMillis, currentRoom) {
        // Runs every frame, for visual updates/animations
    }
}
// GameObject: A visual, interactive object
// ex.
// new GameObject(new Sprite("island.png", new Vec2(10, 10)), new Vec2(5, 5), new Vec2(0,0)):
//   A stationary, 10m x 10m island centered at 5m up, 5m right
class Room {
    constructor(argCanvas) {
        this.canvas = argCanvas;
        const ctx = argCanvas.getContext("2d");
        if (ctx == null)
            throw Error("Couldn't get canvas context!");
        this._ctx = ctx;
        this.cameraWorldPos = new Vec2(0, 0);
        this.viewportWidth = 100;
        this.objects = [];
    }
    update(deltaMillis) {
        // Update necessary child objects
        this.objects.forEach((object) => {
            object.update(deltaMillis, this);
        });
    }
    draw(deltaMillis) {
        // Draw necessary child objects
        const ctx = this._ctx;
        const pixelsPerMeter = this.canvas.width / this.viewportWidth;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.objects.forEach((object) => {
            object.animate(deltaMillis, this);
            ctx.drawImage(object.sprite.bitmap, this.canvas.width * 0.5 +
                (object.worldPosition.x -
                    object.sprite.size.x * 0.5 -
                    this.cameraWorldPos.x) *
                    pixelsPerMeter, this.canvas.height * 0.5 +
                (object.worldPosition.y -
                    object.sprite.size.y * 0.5 -
                    this.cameraWorldPos.y) *
                    pixelsPerMeter, object.sprite.size.x * pixelsPerMeter, object.sprite.size.y * pixelsPerMeter);
        });
    }
}
class Game {
    preloadBitmap(argName, argSrcUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            //Asynchronously create a Sprite from a url
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.src = argSrcUrl;
                img.onload = () => {
                    createImageBitmap(img)
                        .then((bmp) => {
                        this.loadedBitmaps[argName] = bmp;
                        resolve();
                    })
                        .catch((err) => {
                        reject(`Image failed to convert to bitmap: ${err}`);
                    });
                };
                img.onerror = (err) => {
                    reject(`Image failed to load: ${err}`);
                };
            });
        });
    }
    start() {
        let lastTimestamp = performance.now();
        const onFrame = (timestamp) => {
            let deltaMillis = timestamp - lastTimestamp;
            if (deltaMillis > 60) {
                deltaMillis = 0;
            }
            this.room.update(deltaMillis);
            this.room.draw(deltaMillis);
            lastTimestamp = timestamp;
            requestAnimationFrame(onFrame);
        };
        requestAnimationFrame(onFrame);
    }
    constructor(canvas) {
        this.room = new Room(canvas);
        this.loadedBitmaps = {};
    }
}
