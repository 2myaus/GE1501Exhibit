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
// new Vec2(-50, -50) is 50m up and 50m left
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
        this.zIndex = 0;
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
//   A stationary, 10m x 10m island centered at 5m down, 5m right
class Room {
    constructor(argCanvas) {
        this.timeScale = 1;
        this.canvas = argCanvas;
        const ctx = argCanvas.getContext("2d");
        if (ctx == null)
            throw Error("Couldn't get canvas context!");
        this._ctx = ctx;
        this.cameraWorldPos = new Vec2(0, 0);
        this.viewportWidth = 100;
        this.objects = [];
        this._drawCallCache = [];
    }
    update(deltaMillis) {
        // Update necessary child objects
        this.objects.forEach((object) => {
            object.update(deltaMillis * this.timeScale, this);
        });
    }
    draw(deltaMillis) {
        // Draw necessary child objects
        const ctx = this._ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.objects.sort((a, b) => { return a.zIndex - b.zIndex; });
        this.objects.forEach((object) => {
            object.animate(deltaMillis * this.timeScale, this);
            if (!object.sprite)
                return;
            this._drawSprite(object.worldPosition, object.sprite);
        });
        this._drawCallCache.forEach((callObj) => {
            callObj.func.call(this, ...callObj.args);
        });
        this._drawCallCache = [];
    }
    _worldToScreenPos(worldPos) {
        const pixelsPerMeter = this.canvas.width / this.viewportWidth;
        return new Vec2(this.canvas.width * 0.5 +
            (worldPos.x -
                this.cameraWorldPos.x) *
                pixelsPerMeter, this.canvas.height * 0.5 +
            (worldPos.y -
                this.cameraWorldPos.y) *
                pixelsPerMeter);
    }
    drawSprite(worldCenter, sprite) {
        this._drawCallCache.push({ func: this._drawSprite, args: [worldCenter, sprite] });
    }
    _drawSprite(worldCenter, sprite) {
        const pixelsPerMeter = this.canvas.width / this.viewportWidth;
        this._ctx.drawImage(sprite.bitmap, this.canvas.width * 0.5 +
            (worldCenter.x -
                sprite.size.x * 0.5 -
                this.cameraWorldPos.x) *
                pixelsPerMeter, this.canvas.height * 0.5 +
            (worldCenter.y -
                sprite.size.y * 0.5 -
                this.cameraWorldPos.y) *
                pixelsPerMeter, sprite.size.x * pixelsPerMeter, sprite.size.y * pixelsPerMeter);
    }
    fillRect(worldFrom, worldTo, color) {
        this._drawCallCache.push({ func: this._fillRect, args: [worldFrom, worldTo, color] });
    }
    _fillRect(worldFrom, worldTo, color) {
        const pixelsPerMeter = this.canvas.width / this.viewportWidth;
        const pixelWidth = (worldTo.x - worldFrom.x) * pixelsPerMeter;
        const pixelHeight = (worldTo.y - worldFrom.y) * pixelsPerMeter;
        const topLeftPos = this._worldToScreenPos(worldFrom);
        this._ctx.fillStyle = color;
        this._ctx.fillRect(topLeftPos.x, topLeftPos.y, pixelWidth, pixelHeight);
    }
    outlineRect(worldFrom, worldTo, color, width) {
        this._drawCallCache.push({ func: this._outlineRect, args: [worldFrom, worldTo, color, width] });
    }
    _outlineRect(worldFrom, worldTo, color, width) {
        const pixelsPerMeter = this.canvas.width / this.viewportWidth;
        const pixelWidth = (worldTo.x - worldFrom.x) * pixelsPerMeter;
        const pixelHeight = (worldTo.y - worldFrom.y) * pixelsPerMeter;
        const topLeftPos = this._worldToScreenPos(worldFrom);
        this._ctx.strokeStyle = color;
        this._ctx.lineWidth = width * pixelsPerMeter;
        this._ctx.strokeRect(topLeftPos.x, topLeftPos.y, pixelWidth, pixelHeight);
    }
    drawText(worldCenter, fontSize, text, color) {
        this._drawCallCache.push({ func: this._drawText, args: [worldCenter, fontSize, text, color] });
    }
    _drawText(worldCenter, fontSize, text, color) {
        const pixelsPerMeter = this.canvas.width / this.viewportWidth;
        const centerPos = this._worldToScreenPos(worldCenter);
        this._ctx.textAlign = "center";
        this._ctx.fillStyle = color;
        this._ctx.font = `bold ${Math.round(fontSize * pixelsPerMeter)}px sans-serif`;
        this._ctx.fillText(text, centerPos.x, centerPos.y);
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
