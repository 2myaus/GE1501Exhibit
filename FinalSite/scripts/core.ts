class Vec2 {
  x: number; // meters to the right of origin
  y: number; // meters above the origin

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
// new Vec2(-50, -50) is 50m down and 50m left

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
  sprite: Sprite; // The sprite (image) that this object draws
  worldPosition: Vec2; // The world position of the center of this object
  velocity: Vec2; // This object's velocity

  constructor(argSprite: Sprite, argWorldPosition: Vec2, argVelocity: Vec2) {
    this.sprite = argSprite;
    this.worldPosition = argWorldPosition;
    this.velocity = argVelocity;
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
//   A stationary, 10m x 10m island centered at 5m up, 5m right

class Room {
  objects: GameObject[]; // The GameObjects active in this room
  canvas: HTMLCanvasElement; // The HTML Canvas to render onto

  cameraWorldPos: Vec2; // The world position of the camera in meters
  viewportWidth: number; // The width of the area shown on-screena in meters

  _ctx: CanvasRenderingContext2D; // The canvas 2d context. Set in constructor

  constructor(argCanvas: HTMLCanvasElement) {
    this.canvas = argCanvas;

    const ctx = argCanvas.getContext("2d");

    if (ctx == null) throw Error("Couldn't get canvas context!");
    this._ctx = ctx;

    this.cameraWorldPos = new Vec2(0, 0);
    this.viewportWidth = 100;

    this.objects = [];
  }

  update(deltaMillis: number) {
    // Update necessary child objects
    this.objects.forEach((object) => {
      object.update(deltaMillis, this);
    });
  }

  draw(deltaMillis: number) {
    // Draw necessary child objects

    const ctx = this._ctx;
    const pixelsPerMeter = this.canvas.width / this.viewportWidth;

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.objects.forEach((object) => {
      object.animate(deltaMillis, this);

      ctx.drawImage(
        object.sprite.bitmap,
        this.canvas.width * 0.5 +
          (object.worldPosition.x -
            object.sprite.size.x * 0.5 -
            this.cameraWorldPos.x) *
            pixelsPerMeter,
        this.canvas.height * 0.5 +
          (object.worldPosition.y -
            object.sprite.size.y * 0.5 -
            this.cameraWorldPos.y) *
            pixelsPerMeter,
        object.sprite.size.x * pixelsPerMeter,
        object.sprite.size.y * pixelsPerMeter,
      );
    });
  }
}

class Game {
  room: Room;

  loadedBitmaps: { [id: string]: ImageBitmap };

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
    let lastTimestamp = performance.now();
    const onFrame = (timestamp: DOMHighResTimeStamp) => {
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

  constructor(canvas: HTMLCanvasElement) {
    this.room = new Room(canvas);
    this.loadedBitmaps = {};
  }
}
