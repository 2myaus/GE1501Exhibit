class Vec2 {
  x: number; // meters to the right of origin
  y: number; // meters below the origin

  constructor(argX: number, argY: number) {
    this.x = argX;
    this.y = argY;
  }

  add(rhs: Vec2): Vec2 {
    return new Vec2(this.x + rhs.x, this.y + rhs.y);
  }

  minus(rhs: Vec2): Vec2 {
    return new Vec2(this.x - rhs.x, this.y - rhs.y);
  }

  times(rhs: number): Vec2 {
    return new Vec2(this.x * rhs, this.y * rhs);
  }

  magnitude(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  unit(): Vec2 {
    return this.times(1 / this.magnitude());
  }

  static distance(lhs: Vec2, rhs: Vec2) {
    return lhs.minus(rhs).magnitude();
  }

  static zero = new Vec2(0, 0);
  static one = new Vec2(1, 1);
}

// Vec2: A 2-component vector in world space
// ex.
// new Vec2(0, 0) has 0 magnitude
// new Vec2(1000, 0) is 1000m right
// new Vec2(-50, -50) is 50m up and 50m left

class Sprite {
  bitmap: ImageBitmap; // The source image url
  size: Vec2; // The width (x) and height (y) of the sprite in meters

  constructor(argBitmap: ImageBitmap, argSize: Vec2) {
    this.bitmap = argBitmap;
    this.size = argSize;
  }
}

// Sprite: A visual sprite (image)
// ex.
// new Sprite("bee.png", Vec2(1, 2)): a 1m wide, 2m tall sprite of a bee

class GameObject {
  sprite: Sprite | undefined; // The sprite (image) that this object draws
  worldPosition: Vec2; // The world position of the center of this object
  velocity: Vec2; // This object's velocity
  zIndex: number; // The order in which this is drawn, higher = above others

  constructor(argSprite: Sprite | undefined, argWorldPosition: Vec2, argVelocity: Vec2) {
    this.sprite = argSprite;
    this.worldPosition = argWorldPosition;
    this.velocity = argVelocity;
    this.zIndex = 0;
  }

  update(deltaMillis: number, currentRoom: Room) {
    // Runs every game update, for motion/logic
    this.worldPosition = this.worldPosition.add(
      this.velocity.times(deltaMillis * 0.001),
    );
  }
  animate(deltaMillis: number, currentRoom: Room) {
    // Runs every frame, for visual updates/animations
  }
}

// GameObject: A visual, interactive object
// ex.
// new GameObject(new Sprite("island.png", new Vec2(10, 10)), new Vec2(5, 5), new Vec2(0,0)):
//   A stationary, 10m x 10m island centered at 5m down, 5m right

class Room {
  objects: GameObject[]; // The GameObjects active in this room
  canvas: HTMLCanvasElement; // The HTML Canvas to render onto

  cameraWorldPos: Vec2; // The world position of the camera in meters
  viewportWidth: number; // The width of the area shown on-screena in meters

  _ctx: CanvasRenderingContext2D; // The canvas 2d context. Set in constructor

  _drawCallCache: { func: (...args: any[]) => void, args: any[] }[];// Cache of draw-calls to run after main objects are drawn.

  timeScale: number;

  constructor(argCanvas: HTMLCanvasElement) {
    this.timeScale = 1;
    this.canvas = argCanvas;

    const ctx = argCanvas.getContext("2d");

    if (ctx == null) throw Error("Couldn't get canvas context!");
    this._ctx = ctx;

    this.cameraWorldPos = new Vec2(0, 0);
    this.viewportWidth = 100;

    this.objects = [];
    this._drawCallCache = [];
  }

  update(deltaMillis: number) {
    // Update necessary child objects
    this.objects.forEach((object) => {
      object.update(deltaMillis * this.timeScale, this);
    });
  }


  draw(deltaMillis: number) {
    // Draw necessary child objects

    const ctx = this._ctx;

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.objects.sort((a: GameObject, b: GameObject) => { return a.zIndex - b.zIndex; });

    this.objects.forEach((object) => {
      object.animate(deltaMillis, this);
      if (!object.sprite) return;

      this._drawSprite(object.worldPosition, object.sprite);
    });

    this._drawCallCache.forEach((callObj) => {
      callObj.func.call(this, ...callObj.args);
    });

    this._drawCallCache = [];
  }

  _worldToScreenPos(worldPos: Vec2) {
    const pixelsPerMeter = this.canvas.width / this.viewportWidth;

    return new Vec2(
      this.canvas.width * 0.5 +
      (worldPos.x -
        this.cameraWorldPos.x) *
      pixelsPerMeter,
      this.canvas.height * 0.5 +
      (worldPos.y -
        this.cameraWorldPos.y) *
      pixelsPerMeter);
  }

  drawSprite(worldCenter: Vec2, sprite: Sprite) {
    this._drawCallCache.push({ func: this._drawSprite, args: [worldCenter, sprite] });
  }
  _drawSprite(worldCenter: Vec2, sprite: Sprite) {
    const pixelsPerMeter = this.canvas.width / this.viewportWidth;

    this._ctx.drawImage(
      sprite.bitmap,
      this.canvas.width * 0.5 +
      (worldCenter.x -
        sprite.size.x * 0.5 -
        this.cameraWorldPos.x) *
      pixelsPerMeter,
      this.canvas.height * 0.5 +
      (worldCenter.y -
        sprite.size.y * 0.5 -
        this.cameraWorldPos.y) *
      pixelsPerMeter,
      sprite.size.x * pixelsPerMeter,
      sprite.size.y * pixelsPerMeter,
    );
  }

  fillRect(worldFrom: Vec2, worldTo: Vec2, color: string) {
    this._drawCallCache.push({ func: this._fillRect, args: [worldFrom, worldTo, color] });
  }
  _fillRect(worldFrom: Vec2, worldTo: Vec2, color: string) {
    const pixelsPerMeter = this.canvas.width / this.viewportWidth;

    const pixelWidth = (worldTo.x - worldFrom.x) * pixelsPerMeter;
    const pixelHeight = (worldTo.y - worldFrom.y) * pixelsPerMeter;

    const topLeftPos = this._worldToScreenPos(worldFrom);

    this._ctx.fillStyle = color;
    this._ctx.fillRect(topLeftPos.x, topLeftPos.y, pixelWidth, pixelHeight);
  }

  outlineRect(worldFrom: Vec2, worldTo: Vec2, color: string, width: number) {
    this._drawCallCache.push({ func: this._outlineRect, args: [worldFrom, worldTo, color, width] });
  }
  _outlineRect(worldFrom: Vec2, worldTo: Vec2, color: string, width: number) {
    const pixelsPerMeter = this.canvas.width / this.viewportWidth;

    const pixelWidth = (worldTo.x - worldFrom.x) * pixelsPerMeter;
    const pixelHeight = (worldTo.y - worldFrom.y) * pixelsPerMeter;

    const topLeftPos = this._worldToScreenPos(worldFrom);

    this._ctx.strokeStyle = color;
    this._ctx.lineWidth = width * pixelsPerMeter;
    this._ctx.strokeRect(topLeftPos.x, topLeftPos.y, pixelWidth, pixelHeight);
  }

  drawText(worldCenter: Vec2, fontSize: number, text: string, color: string) {
    this._drawCallCache.push({ func: this._drawText, args: [worldCenter, fontSize, text, color] });
  }
  _drawText(worldCenter: Vec2, fontSize: number, text: string, color: string) {
    const pixelsPerMeter = this.canvas.width / this.viewportWidth;

    const centerPos = this._worldToScreenPos(worldCenter);

    this._ctx.textAlign = "center";
    this._ctx.fillStyle = color;
    this._ctx.font = `bold ${Math.round(fontSize * pixelsPerMeter)}px sans-serif`;
    this._ctx.fillText(text, centerPos.x, centerPos.y);
  }
}

class Game {
  room: Room;

  loadedBitmaps: { [id: string]: ImageBitmap };

  _lastFrameReq: number | null;

  async preloadBitmap(argName: string, argSrcUrl: string): Promise<void> {
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
  }

  start() {
    let lastTimestamp: DOMHighResTimeStamp;
    const onFrame = (timestamp: DOMHighResTimeStamp) => {
      let deltaMillis = timestamp - lastTimestamp;

      if (deltaMillis > 60) {
        deltaMillis = 0;
      }

      this.room.update(deltaMillis);
      this.room.draw(deltaMillis);

      lastTimestamp = timestamp;
      this._lastFrameReq = requestAnimationFrame(onFrame);
    };
    requestAnimationFrame((timestamp: DOMHighResTimeStamp) => {
      lastTimestamp = timestamp;
      this._lastFrameReq = requestAnimationFrame(onFrame);
    });
  }

  stop() {
    if(!this._lastFrameReq) return;
    cancelAnimationFrame(this._lastFrameReq);
  }

  constructor(canvas: HTMLCanvasElement) {
    this.room = new Room(canvas);
    this.loadedBitmaps = {};
    this._lastFrameReq = null;
  }
}
