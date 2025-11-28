import Phaser from 'phaser';
import { GameConfig } from './SantaMazeGame';

const PIXEL_SIZE = 4;

type PixelMatrix = string[];

const drawPixelTexture = (
  scene: Phaser.Scene,
  key: string,
  matrix: PixelMatrix,
  palette: Record<string, number>,
  pixelSize = PIXEL_SIZE
) => {
  if (scene.textures.exists(key)) {
    return;
  }
  const width = matrix[0]?.length ?? 0;
  const height = matrix.length;
  const graphics = scene.add.graphics();
  matrix.forEach((row, y) => {
    row.split('').forEach((cell, x) => {
      const color = palette[cell];
      if (!color) {
        return;
      }
      graphics.fillStyle(color, 1);
      graphics.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
    });
  });
  graphics.generateTexture(key, width * pixelSize, height * pixelSize);
  graphics.destroy();
};

const PLATFORM_MATRIX: PixelMatrix = [
  'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
  'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
  'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
  'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
];

const PLATFORM_PALETTE: Record<string, number> = {
  G: 0x0d8c5d,
};

// Use a single uniform gift size for clean stacking
const GIFT_MATRIX: PixelMatrix = [
  '..BBBBBBBBBB..',
  '.BBBBBBBBBBBB.',
  'BBBBBBBBBBBBBB',
  'BBBBRRRRBBBBBB',
  'BBBBRRRRBBBBBB',
  'BBRRRRRRRRRRRB',
  'BBRRRRRRRRRRRB',
  'BBBBRRRRBBBBBB',
  'BBBBRRRRBBBBBB',
  'BBBBBBBBBBBBBB',
  '.BBBBBBBBBBBB.',
  '..BBBBBBBBBB..',
];

const GIFT_BLUE_PALETTE: Record<string, number> = {
  B: 0x3b6cfb,
  R: 0xffd166, // ribbon
};

const GIFT_RED_PALETTE: Record<string, number> = {
  B: 0xd7263d,
  R: 0xffd166,
};

const GIFT_GREEN_PALETTE: Record<string, number> = {
  B: 0x0d8c5d,
  R: 0xffd166,
};

const SPARKLE_MATRIX: PixelMatrix = [
  '...S...',
  '..SSS..',
  '.SSSSS.',
  '..SSS..',
  '...S...',
];

const SPARKLE_PALETTE: Record<string, number> = {
  S: 0xffffff,
};

const SPARKLE_KEY = 'stack-sparkle';

// Grid configuration
const GIFT_SIZE = 50; // Uniform gift size
const GRID_COLS = 3; // 3 columns for stacking
const GRID_ROWS = 6; // Maximum 6 rows high

interface GridCell {
  col: number;
  row: number;
  sprite: Phaser.GameObjects.Image | null;
}

export class GiftStackingGame extends Phaser.Scene {
  private stackContainer!: Phaser.GameObjects.Container;
  private platform!: Phaser.GameObjects.Image;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: {
    A: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  private fallingGifts!: Phaser.Physics.Arcade.Group;
  private catchZone!: Phaser.Physics.Arcade.Sprite;
  private grid: GridCell[][] = [];
  private timerText!: Phaser.GameObjects.Text;
  private stackText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;
  private letterHints: string[] = [];
  private availableLetters: string[] = [];
  private timeRemaining = 60;
  private timerEvent!: Phaser.Time.TimerEvent;
  private recipient = '';
  private gameOver = false;
  private targetStack = 6;
  private currentStack = 0;
  private spawnTimer!: Phaser.Time.TimerEvent;
  private gameConfigData!: GameConfig;
  private pointerX: number | null = null;
  private containerX = 0;
  private platformWidth = 160;

  constructor() {
    super({ key: 'GiftStackingGame' });
  }

  init(data: GameConfig) {
    this.gameConfigData = data;
    this.recipient = data.recipient;
  }

  create() {
    this.gameOver = false;
    this.currentStack = 0;
    this.letterHints = [];
    this.availableLetters = this.getUniqueLetters();
    this.timeRemaining = 60;
    this.pointerX = null;
    this.containerX = this.scale.width / 2;

    this.cameras.main.setBackgroundColor('#041830');

    this.buildTextures();
    this.createBackground();
    this.createSnow();
    this.initGrid();
    this.createStackContainer();
    this.createCatchZone();
    this.createFallingGroup();
    this.createUI();
    this.startSpawning();

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasdKeys = this.input.keyboard!.addKeys('A,D') as {
      A: Phaser.Input.Keyboard.Key;
      D: Phaser.Input.Keyboard.Key;
    };

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.isDown) {
        this.pointerX = pointer.x;
      }
    });

    this.input.on('pointerup', () => {
      this.pointerX = null;
    });

    this.timerEvent = this.time.addEvent({
      delay: 1000,
      callback: this.updateTimer,
      callbackScope: this,
      loop: true,
    });
  }

  private buildTextures() {
    drawPixelTexture(this, 'stack-platform', PLATFORM_MATRIX, PLATFORM_PALETTE);
    drawPixelTexture(this, 'stack-gift-blue', GIFT_MATRIX, GIFT_BLUE_PALETTE, 3);
    drawPixelTexture(this, 'stack-gift-red', GIFT_MATRIX, GIFT_RED_PALETTE, 3);
    drawPixelTexture(this, 'stack-gift-green', GIFT_MATRIX, GIFT_GREEN_PALETTE, 3);
    drawPixelTexture(this, SPARKLE_KEY, SPARKLE_MATRIX, SPARKLE_PALETTE, 2);
  }

  private createBackground() {
    const width = this.scale.width;
    const height = this.scale.height;
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x022345, 0x022345, 0x03152d, 0x03152d, 1, 1, 1, 1);
    sky.fillRect(0, 0, width, height);
    sky.generateTexture('stack-sky', width, height);
    sky.destroy();
    this.add
      .image(width / 2, height / 2, 'stack-sky')
      .setDepth(-5)
      .setDisplaySize(width, height);

    const stars = this.add.graphics({
      fillStyle: { color: 0xffffff, alpha: 0.8 },
    });
    for (let i = 0; i < 60; i += 1) {
      const size = Phaser.Math.Between(1, 2);
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      const alpha = Phaser.Math.FloatBetween(0.3, 0.9);
      stars.fillStyle(0xffffff, alpha);
      stars.fillRect(x, y, size, size);
    }
    stars.generateTexture('stack-starfield', width, height);
    stars.destroy();
    this.add
      .tileSprite(0, 0, width, height, 'stack-starfield')
      .setOrigin(0)
      .setDepth(-4)
      .setScrollFactor(0);
  }

  private createSnow() {
    const particles = this.add.particles(0, 0, SPARKLE_KEY, {
      x: { min: 0, max: this.scale.width },
      y: 0,
      lifespan: 5000,
      speedY: { min: 30, max: 60 },
      speedX: { min: -8, max: 8 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.8, end: 0.1 },
      quantity: 1,
      frequency: 150,
      tint: 0xffffff,
      blendMode: 'ADD',
    });
    particles.setDepth(-3);
  }

  private initGrid() {
    this.grid = [];
    for (let col = 0; col < GRID_COLS; col++) {
      this.grid[col] = [];
      for (let row = 0; row < GRID_ROWS; row++) {
        this.grid[col][row] = { col, row, sprite: null };
      }
    }
  }

  private createStackContainer() {
    // Container holds platform + all stacked gifts and moves as one unit
    this.stackContainer = this.add.container(this.containerX, this.scale.height - 40);
    this.stackContainer.setDepth(2);

    // Platform is centered in the container (at local 0,0)
    this.platform = this.add.image(0, 0, 'stack-platform');
    this.platform.setDisplaySize(this.platformWidth, 24);
    this.stackContainer.add(this.platform);
  }

  private createCatchZone() {
    // Invisible physics body that moves with the container for catching gifts
    // Thin zone at top of platform - gifts must actually touch to be caught
    this.catchZone = this.physics.add.sprite(
      this.containerX,
      this.scale.height - 52, // Top edge of platform
      'stack-platform'
    );
    this.catchZone.setVisible(false);
    this.catchZone.setImmovable(true);
    const body = this.catchZone.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setSize(this.platformWidth, 6); // Very thin - must be close to catch
  }

  private createFallingGroup() {
    this.fallingGifts = this.physics.add.group();

    // When a falling gift hits the catch zone, snap it to the grid
    this.physics.add.overlap(
      this.fallingGifts,
      this.catchZone,
      this.catchGift,
      undefined,
      this
    );
  }

  private startSpawning() {
    this.spawnTimer = this.time.addEvent({
      delay: 1800,
      callback: this.spawnGift,
      callbackScope: this,
      loop: true,
    });
    // Spawn first gift immediately
    this.spawnGift();
  }

  private spawnGift() {
    if (this.gameOver) return;

    const colors = ['blue', 'red', 'green'];
    const color = colors[Phaser.Math.Between(0, 2)];
    const textureKey = `stack-gift-${color}`;

    const x = Phaser.Math.Between(60, this.scale.width - 60);
    const gift = this.fallingGifts.create(x, -30, textureKey) as Phaser.Physics.Arcade.Sprite;

    gift.setDisplaySize(GIFT_SIZE, GIFT_SIZE);
    gift.setDepth(1);
    gift.setData('color', color);

    const body = gift.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(true);
    body.setGravityY(300);
    body.setSize(GIFT_SIZE, GIFT_SIZE);
    body.setVelocityY(100);
  }

  private catchGift: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (
    _zone,
    giftObj
  ) => {
    const gift = giftObj as Phaser.Physics.Arcade.Sprite;
    if (!gift.active) return;

    // Find the best column to place this gift (closest to where it landed)
    const giftLocalX = gift.x - this.containerX;
    const colWidth = this.platformWidth / GRID_COLS;
    let bestCol = Math.floor((giftLocalX + this.platformWidth / 2) / colWidth);
    bestCol = Phaser.Math.Clamp(bestCol, 0, GRID_COLS - 1);

    // Find the lowest empty row in this column
    let targetRow = -1;
    for (let row = 0; row < GRID_ROWS; row++) {
      if (!this.grid[bestCol][row].sprite) {
        targetRow = row;
        break;
      }
    }

    // If column is full, try adjacent columns
    if (targetRow === -1) {
      for (let offset = 1; offset < GRID_COLS; offset++) {
        for (const dir of [-1, 1]) {
          const col = bestCol + offset * dir;
          if (col >= 0 && col < GRID_COLS) {
            for (let row = 0; row < GRID_ROWS; row++) {
              if (!this.grid[col][row].sprite) {
                bestCol = col;
                targetRow = row;
                break;
              }
            }
            if (targetRow !== -1) break;
          }
        }
        if (targetRow !== -1) break;
      }
    }

    // If all columns are full, gift falls through (miss)
    if (targetRow === -1) {
      return;
    }

    // Calculate local position in container
    const localX = (bestCol - (GRID_COLS - 1) / 2) * GIFT_SIZE;
    const localY = -12 - GIFT_SIZE / 2 - targetRow * GIFT_SIZE; // Stack upward from platform

    // Create a static image in the container (no physics)
    const color = gift.getData('color') as string;
    const stackedGift = this.add.image(localX, localY, `stack-gift-${color}`);
    stackedGift.setDisplaySize(GIFT_SIZE, GIFT_SIZE);
    this.stackContainer.add(stackedGift);

    // Update grid
    this.grid[bestCol][targetRow].sprite = stackedGift;

    // Remove the physics gift
    gift.destroy();

    // Update score
    this.currentStack++;
    this.stackText.setText(`Stack: ${this.currentStack}/${this.targetStack} 🎁`);
    this.revealHint();
    this.emitSparkles(this.containerX + localX, this.stackContainer.y + localY, 0.8);

    // Extend catch zone height as stack grows
    this.updateCatchZoneHeight();

    if (this.currentStack >= this.targetStack) {
      this.handleWin();
    }
  };

  private updateCatchZoneHeight() {
    // Find the highest stacked gift
    let maxRow = 0;
    for (let col = 0; col < GRID_COLS; col++) {
      for (let row = 0; row < GRID_ROWS; row++) {
        if (this.grid[col][row].sprite) {
          maxRow = Math.max(maxRow, row + 1);
        }
      }
    }

    // Move catch zone up to the top of the stack (thin zone stays thin)
    // Gifts must land on top of the stack to be caught
    this.catchZone.y = this.scale.height - 52 - maxRow * GIFT_SIZE;
  }

  private getUniqueLetters(): string[] {
    if (!this.recipient) return [];
    const letters = this.recipient.replace(/\s/g, '').toUpperCase().split('');
    return [...new Set(letters)];
  }

  private revealHint() {
    if (this.availableLetters.length === 0) {
      this.availableLetters = this.getUniqueLetters();
    }
    if (this.availableLetters.length === 0) {
      return;
    }
    const index = Phaser.Math.Between(0, this.availableLetters.length - 1);
    const letter = this.availableLetters[index];
    this.availableLetters.splice(index, 1);
    this.letterHints.push(letter);
    this.hintText.setText(`Hints: ${this.letterHints.join(' ')}`);
  }

  private createUI() {
    const padding = 12;
    this.timerText = this.add.text(padding, padding, `Time: ${this.timeRemaining}`, {
      fontSize: '20px',
      fontFamily: 'monospace',
      color: '#ffffff',
      backgroundColor: '#00000088',
      padding: { x: 8, y: 4 },
    });
    this.timerText.setScrollFactor(0).setDepth(1000);

    this.stackText = this.add.text(
      padding + 150,
      padding,
      `Stack: ${this.currentStack}/${this.targetStack} 🎁`,
      {
        fontSize: '18px',
        fontFamily: 'monospace',
        color: '#ffe066',
        backgroundColor: '#00000066',
        padding: { x: 8, y: 4 },
      }
    );
    this.stackText.setScrollFactor(0).setDepth(1000);

    this.hintText = this.add.text(padding, padding + 32, 'Hints: ', {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#ffff66',
      backgroundColor: '#00000066',
      padding: { x: 8, y: 4 },
    });
    this.hintText.setScrollFactor(0).setDepth(1000);
  }

  private updateTimer = () => {
    if (this.gameOver) return;
    this.timeRemaining -= 1;
    this.timerText.setText(`Time: ${this.timeRemaining}`);
    if (this.timeRemaining <= 0) {
      if (this.currentStack >= this.targetStack) {
        this.handleWin();
      } else {
        this.handleLoss();
      }
    }
  };

  private handleWin() {
    if (this.gameOver) return;
    this.gameOver = true;
    this.physics.pause();
    if (this.timerEvent) this.timerEvent.remove();
    if (this.spawnTimer) this.spawnTimer.remove();
    this.emitSparkles(this.containerX, this.stackContainer.y - 80, 1.5);
    this.showGameOver(true);
  }

  private handleLoss() {
    if (this.gameOver) return;
    this.gameOver = true;
    this.physics.pause();
    if (this.timerEvent) this.timerEvent.remove();
    if (this.spawnTimer) this.spawnTimer.remove();
    this.showGameOver(false);
  }

  private showGameOver(success: boolean) {
    const overlay = this.add.rectangle(
      this.scale.width / 2,
      this.scale.height / 2,
      this.scale.width,
      this.scale.height,
      0x020915,
      0.9
    );
    overlay.setScrollFactor(0).setDepth(2000);

    if (success) {
      const title = this.add.text(
        this.scale.width / 2,
        this.scale.height / 2 - 100,
        'STACK COMPLETE!',
        {
          fontSize: '36px',
          fontFamily: 'Courier New, monospace',
          color: '#0d8c5d',
          stroke: '#d7263d',
          strokeThickness: 6,
        }
      );
      title.setOrigin(0.5).setScrollFactor(0).setDepth(2001);

      const recipientText = this.add.text(
        this.scale.width / 2,
        this.scale.height / 2,
        `YOU ARE SECRET SANTA FOR:\n${this.recipient.toUpperCase()}`,
        {
          fontSize: '24px',
          fontFamily: 'Courier New, monospace',
          color: '#ffd166',
          align: 'center',
        }
      );
      recipientText.setOrigin(0.5).setScrollFactor(0).setDepth(2001);

      const replayButtonY = this.scale.height / 2 + 120;
      const replayButton = this.add
        .rectangle(this.scale.width / 2, replayButtonY, 240, 64, 0xd7263d, 1)
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(2001)
        .setInteractive({ useHandCursor: true });
      replayButton.setStrokeStyle(3, 0xfff066);

      this.add
        .text(this.scale.width / 2, replayButtonY, 'PLAY AGAIN (R)', {
          fontSize: '20px',
          fontFamily: 'Courier New, monospace',
          color: '#ffffff',
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(2002);

      const restartScene = () => this.scene.restart(this.gameConfigData);
      replayButton.on('pointerdown', restartScene);
      replayButton.on('pointerover', () => replayButton.setFillStyle(0xff4757, 1));
      replayButton.on('pointerout', () => replayButton.setFillStyle(0xd7263d, 1));
      this.input.keyboard!.once('keydown-R', restartScene);
    } else {
      const failText = this.add.text(
        this.scale.width / 2,
        this.scale.height / 2 - 40,
        'TIME UP!',
        {
          fontSize: '32px',
          fontFamily: 'Courier New, monospace',
          color: '#d7263d',
          stroke: '#000000',
          strokeThickness: 4,
        }
      );
      failText.setOrigin(0.5).setScrollFactor(0).setDepth(2001);

      const retryButtonY = this.scale.height / 2 + 80;
      const retryButton = this.add
        .rectangle(this.scale.width / 2, retryButtonY, 220, 56, 0xd7263d, 1)
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(2001)
        .setInteractive({ useHandCursor: true });
      retryButton.setStrokeStyle(3, 0xfff066);

      this.add
        .text(this.scale.width / 2, retryButtonY, 'TRY AGAIN (R)', {
          fontSize: '18px',
          fontFamily: 'Courier New, monospace',
          color: '#ffffff',
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(2002);

      const restartScene = () => this.scene.restart(this.gameConfigData);
      retryButton.on('pointerdown', restartScene);
      retryButton.on('pointerover', () => retryButton.setFillStyle(0xff4757, 1));
      retryButton.on('pointerout', () => retryButton.setFillStyle(0xd7263d, 1));
      this.input.keyboard!.once('keydown-R', restartScene);
    }
  }

  private emitSparkles(x: number, y: number, scale = 1) {
    const particles = this.add.particles(x, y, SPARKLE_KEY, {
      lifespan: 500,
      speed: { min: 60, max: 120 },
      quantity: 8,
      scale: { start: 0.5 * scale, end: 0 },
      alpha: { start: 1, end: 0.2 },
      tint: 0xffffff,
      blendMode: 'ADD',
      angle: { min: 0, max: 360 },
    });
    particles.setDepth(3);
    this.time.delayedCall(600, () => particles.destroy());
  }

  update() {
    if (this.gameOver) return;

    const speed = 400;
    let dirX = 0;

    // Keyboard controls
    if (this.cursors.left?.isDown || this.wasdKeys.A.isDown) {
      dirX -= 1;
    }
    if (this.cursors.right?.isDown || this.wasdKeys.D.isDown) {
      dirX += 1;
    }

    // Touch/mouse controls
    if (this.pointerX !== null) {
      const diff = this.pointerX - this.containerX;
      if (Math.abs(diff) > 10) {
        dirX = diff > 0 ? 1 : -1;
      }
    }

    // Move the container
    const delta = this.game.loop.delta / 1000;
    this.containerX += dirX * speed * delta;

    // Clamp to screen bounds
    const halfWidth = this.platformWidth / 2;
    this.containerX = Phaser.Math.Clamp(
      this.containerX,
      halfWidth,
      this.scale.width - halfWidth
    );

    // Update container position
    this.stackContainer.x = this.containerX;

    // Update catch zone position to match
    this.catchZone.x = this.containerX;

    // Remove gifts that fell off screen
    this.fallingGifts.children.entries.forEach(gift => {
      const sprite = gift as Phaser.Physics.Arcade.Sprite;
      if (sprite && sprite.active && sprite.y > this.scale.height + 50) {
        sprite.destroy();
      }
    });
  }
}
