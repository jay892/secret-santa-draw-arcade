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

// Snowball (7x7)
const SNOWBALL_MATRIX: PixelMatrix = [
  '..WWW..',
  '.WWWWW.',
  'WWWWWWW',
  'WWWHWWW',
  'WWWWWWW',
  '.WWWWW.',
  '..WWW..',
];

const SNOWBALL_PALETTE: Record<string, number> = {
  W: 0xffffff,
  H: 0xe8f4ff, // slight highlight
};

// Ornament (6x8)
const ORNAMENT_MATRIX: PixelMatrix = [
  '..GG..',
  '..GG..',
  '.OOOO.',
  'OOHOO.',
  'OOOOOO',
  'OOOOOO',
  '.OOOO.',
  '..OO..',
];

const ORNAMENT_PALETTES: Record<string, Record<string, number>> = {
  red: { G: 0x888888, O: 0xe53935, H: 0xff8a80 },
  green: { G: 0x888888, O: 0x43a047, H: 0xa5d6a7 },
  gold: { G: 0x888888, O: 0xffd54f, H: 0xffecb3 },
  blue: { G: 0x888888, O: 0x1e88e5, H: 0x90caf9 },
};

// Slingshot (8x12)
const SLINGSHOT_MATRIX: PixelMatrix = [
  'B......B',
  'B......B',
  'B......B',
  '.B....B.',
  '.B....B.',
  '..B..B..',
  '..B..B..',
  '..BBBB..',
  '...BB...',
  '...BB...',
  '...BB...',
  '...BB...',
];

const SLINGSHOT_PALETTE: Record<string, number> = {
  B: 0x6d4c41,
};

// Star for tree top (5x5)
const STAR_MATRIX: PixelMatrix = [
  '..Y..',
  '.YYY.',
  'YYYYY',
  '.YYY.',
  '..Y..',
];

const STAR_PALETTE: Record<string, number> = {
  Y: 0xffd54f,
};

// Sparkle for effects
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

// Game constants
const MAX_PULL_DISTANCE = 100;
const SNOWBALL_VELOCITY_MULT = 8;
const GRAVITY = 400;
const GAME_DURATION = 60;
const TOTAL_ORNAMENTS = 5;
const RESET_DELAY = 3000;

interface OrnamentData {
  sprite: Phaser.Physics.Arcade.Sprite;
  collected: boolean;
  color: string;
}

export class SnowballSlingshotGame extends Phaser.Scene {
  private snowball!: Phaser.Physics.Arcade.Sprite;
  private slingshotBase = { x: 0, y: 0 };
  private isDragging = false;
  private currentPull = { x: 0, y: 0 };
  private trajectoryLine!: Phaser.GameObjects.Graphics;
  private ornaments: OrnamentData[] = [];
  private ornamentsCollected = 0;
  private timerText!: Phaser.GameObjects.Text;
  private progressText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;
  private letterHints: string[] = [];
  private availableLetters: string[] = [];
  private timeRemaining = GAME_DURATION;
  private timerEvent!: Phaser.Time.TimerEvent;
  private recipient = '';
  private gameOver = false;
  private gameConfigData!: GameConfig;
  private resetTimer: Phaser.Time.TimerEvent | null = null;
  private bandGraphics!: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: 'SnowballSlingshotGame' });
  }

  init(data: GameConfig) {
    this.gameConfigData = data;
    this.recipient = data.recipient;
  }

  create() {
    this.gameOver = false;
    this.ornamentsCollected = 0;
    this.letterHints = [];
    this.availableLetters = this.getUniqueLetters();
    this.timeRemaining = GAME_DURATION;
    this.isDragging = false;
    this.currentPull = { x: 0, y: 0 };
    this.ornaments = [];
    this.resetTimer = null;

    this.cameras.main.setBackgroundColor('#0a1628');

    this.buildTextures();
    this.createBackground();
    this.createSnow();
    this.createTree();
    this.createOrnaments();
    this.createSlingshot();
    this.createSnowball();
    this.createUI();
    this.setupInput();
    this.setupCollisions();

    this.timerEvent = this.time.addEvent({
      delay: 1000,
      callback: this.updateTimer,
      callbackScope: this,
      loop: true,
    });
  }

  private buildTextures() {
    drawPixelTexture(this, 'sling-snowball', SNOWBALL_MATRIX, SNOWBALL_PALETTE);
    drawPixelTexture(this, 'sling-slingshot', SLINGSHOT_MATRIX, SLINGSHOT_PALETTE);
    drawPixelTexture(this, 'sling-star', STAR_MATRIX, STAR_PALETTE, 3);
    drawPixelTexture(this, 'sling-sparkle', SPARKLE_MATRIX, SPARKLE_PALETTE, 2);

    Object.entries(ORNAMENT_PALETTES).forEach(([color, palette]) => {
      drawPixelTexture(this, `sling-ornament-${color}`, ORNAMENT_MATRIX, palette);
    });
  }

  private createBackground() {
    const width = this.scale.width;
    const height = this.scale.height;

    // Night sky gradient
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x0a1628, 0x0a1628, 0x051018, 0x051018, 1, 1, 1, 1);
    sky.fillRect(0, 0, width, height);
    sky.generateTexture('sling-sky', width, height);
    sky.destroy();

    this.add
      .image(width / 2, height / 2, 'sling-sky')
      .setDepth(-10)
      .setDisplaySize(width, height);

    // Stars
    const stars = this.add.graphics();
    for (let i = 0; i < 80; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height * 0.7);
      const size = Phaser.Math.Between(1, 2);
      const alpha = Phaser.Math.FloatBetween(0.3, 0.9);
      stars.fillStyle(0xffffff, alpha);
      stars.fillRect(x, y, size, size);
    }
    stars.setDepth(-9);

    // Snow ground
    const groundHeight = height * 0.15;
    const ground = this.add.graphics();
    ground.fillStyle(0xdce8f5, 1);
    ground.fillRect(0, height - groundHeight, width, groundHeight);

    // Snow mounds
    ground.fillStyle(0xeef4fb, 1);
    for (let i = 0; i < 8; i++) {
      const x = (width / 8) * i + Phaser.Math.Between(-20, 20);
      const moundWidth = Phaser.Math.Between(60, 100);
      const moundHeight = Phaser.Math.Between(15, 30);
      ground.fillEllipse(x, height - groundHeight + 5, moundWidth, moundHeight);
    }
    ground.setDepth(-5);
  }

  private createSnow() {
    const particles = this.add.particles(0, 0, 'sling-sparkle', {
      x: { min: 0, max: this.scale.width },
      y: 0,
      lifespan: 6000,
      speedY: { min: 20, max: 50 },
      speedX: { min: -10, max: 10 },
      scale: { start: 0.3, end: 0 },
      alpha: { start: 0.7, end: 0.1 },
      quantity: 1,
      frequency: 200,
      tint: 0xffffff,
      blendMode: 'ADD',
    });
    particles.setDepth(-4);
  }

  private createTree() {
    const treeX = this.scale.width * 0.65;
    const treeBaseY = this.scale.height * 0.85;

    const tree = this.add.graphics();
    tree.setDepth(0);

    // Tree trunk
    tree.fillStyle(0x5d4037, 1);
    tree.fillRect(treeX - 15, treeBaseY - 30, 30, 50);

    // Tree layers (3 triangular sections)
    const layers = [
      { y: treeBaseY - 50, width: 140, height: 80 },
      { y: treeBaseY - 110, width: 110, height: 70 },
      { y: treeBaseY - 160, width: 80, height: 60 },
    ];

    layers.forEach(layer => {
      tree.fillStyle(0x2e7d32, 1);
      tree.fillTriangle(
        treeX - layer.width / 2,
        layer.y,
        treeX + layer.width / 2,
        layer.y,
        treeX,
        layer.y - layer.height
      );
      // Snow on edges
      tree.fillStyle(0xeef4fb, 0.8);
      tree.fillTriangle(
        treeX - layer.width / 2 + 10,
        layer.y - 5,
        treeX - layer.width / 4,
        layer.y - 5,
        treeX - layer.width / 3,
        layer.y - layer.height / 2
      );
    });

    // Star on top
    this.add
      .image(treeX, treeBaseY - 225, 'sling-star')
      .setDepth(1);
  }

  private createOrnaments() {
    const treeX = this.scale.width * 0.65;
    const treeBaseY = this.scale.height * 0.85;

    // Position ornaments on the tree
    const ornamentPositions = [
      { x: treeX - 40, y: treeBaseY - 70 },
      { x: treeX + 35, y: treeBaseY - 85 },
      { x: treeX - 25, y: treeBaseY - 130 },
      { x: treeX + 20, y: treeBaseY - 145 },
      { x: treeX, y: treeBaseY - 185 },
    ];

    const colors = ['red', 'green', 'gold', 'blue'];
    const shuffledColors = Phaser.Utils.Array.Shuffle([...colors, colors[0]]);

    ornamentPositions.forEach((pos, index) => {
      const color = shuffledColors[index % shuffledColors.length];
      const ornament = this.physics.add.sprite(pos.x, pos.y, `sling-ornament-${color}`);
      ornament.setDisplaySize(28, 36);
      ornament.setDepth(2);

      const body = ornament.body as Phaser.Physics.Arcade.Body;
      body.setAllowGravity(false);
      body.setImmovable(true);
      body.setCircle(14, 0, 4);

      // Add gentle sway animation
      this.tweens.add({
        targets: ornament,
        x: pos.x + Phaser.Math.Between(-4, 4),
        duration: 2000 + index * 300,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      this.ornaments.push({
        sprite: ornament,
        collected: false,
        color,
      });
    });
  }

  private createSlingshot() {
    const baseX = this.scale.width * 0.15;
    const baseY = this.scale.height * 0.75;

    this.slingshotBase = { x: baseX, y: baseY };

    // Create slingshot (Y-shaped)
    this.add
      .image(baseX, baseY, 'sling-slingshot')
      .setDepth(5)
      .setDisplaySize(40, 56);

    // Band graphics (will be drawn during drag)
    this.bandGraphics = this.add.graphics();
    this.bandGraphics.setDepth(4);

    // Trajectory line
    this.trajectoryLine = this.add.graphics();
    this.trajectoryLine.setDepth(3);
  }

  private createSnowball() {
    const startX = this.slingshotBase.x;
    const startY = this.slingshotBase.y - 30;

    this.snowball = this.physics.add.sprite(startX, startY, 'sling-snowball');
    this.snowball.setDisplaySize(32, 32);
    this.snowball.setDepth(6);

    const body = this.snowball.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setCircle(14, 0, 0);
  }

  private setupInput() {
    // Make the snowball interactive with larger hit area
    this.snowball.setInteractive({
      hitArea: new Phaser.Geom.Circle(16, 16, 50),
      hitAreaCallback: Phaser.Geom.Circle.Contains,
      useHandCursor: true,
    });

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.gameOver) return;

      const body = this.snowball.body as Phaser.Physics.Arcade.Body;
      if (body.velocity.x !== 0 || body.velocity.y !== 0) return;

      // Check if pointer is near snowball
      const dist = Phaser.Math.Distance.Between(
        pointer.x,
        pointer.y,
        this.snowball.x,
        this.snowball.y
      );

      if (dist < 60) {
        this.isDragging = true;
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.isDragging || this.gameOver) return;

      // Calculate pull vector (from pointer to slingshot base)
      const pullX = this.slingshotBase.x - pointer.x;
      const pullY = this.slingshotBase.y - pointer.y;

      // Limit pull distance
      const pullDist = Math.sqrt(pullX * pullX + pullY * pullY);
      const limitedDist = Math.min(pullDist, MAX_PULL_DISTANCE);

      if (pullDist > 0) {
        this.currentPull.x = (pullX / pullDist) * limitedDist;
        this.currentPull.y = (pullY / pullDist) * limitedDist;
      }

      // Position snowball (opposite of pull direction)
      this.snowball.x = this.slingshotBase.x - this.currentPull.x * 0.5;
      this.snowball.y = this.slingshotBase.y - 30 - this.currentPull.y * 0.5;

      // Draw band and trajectory
      this.drawBand();
      this.drawTrajectory();
    });

    this.input.on('pointerup', () => {
      if (!this.isDragging || this.gameOver) return;

      this.isDragging = false;
      this.bandGraphics.clear();
      this.trajectoryLine.clear();

      const pullPower = Math.sqrt(
        this.currentPull.x * this.currentPull.x +
          this.currentPull.y * this.currentPull.y
      );

      if (pullPower > 10) {
        this.fireSnowball();
      } else {
        this.resetSnowball();
      }

      this.currentPull = { x: 0, y: 0 };
    });
  }

  private drawBand() {
    this.bandGraphics.clear();
    this.bandGraphics.lineStyle(4, 0x8b5a2b, 1);

    // Left band
    this.bandGraphics.beginPath();
    this.bandGraphics.moveTo(this.slingshotBase.x - 20, this.slingshotBase.y - 20);
    this.bandGraphics.lineTo(this.snowball.x, this.snowball.y);
    this.bandGraphics.strokePath();

    // Right band
    this.bandGraphics.beginPath();
    this.bandGraphics.moveTo(this.slingshotBase.x + 20, this.slingshotBase.y - 20);
    this.bandGraphics.lineTo(this.snowball.x, this.snowball.y);
    this.bandGraphics.strokePath();
  }

  private drawTrajectory() {
    this.trajectoryLine.clear();

    const velX = this.currentPull.x * SNOWBALL_VELOCITY_MULT;
    const velY = this.currentPull.y * SNOWBALL_VELOCITY_MULT;

    this.trajectoryLine.fillStyle(0xffffff, 0.5);

    for (let t = 0; t < 1.5; t += 0.08) {
      const x = this.snowball.x + velX * t;
      const y = this.snowball.y + velY * t + 0.5 * GRAVITY * t * t;

      // Stop if off screen
      if (y > this.scale.height || x < 0 || x > this.scale.width) break;

      const alpha = 1 - t / 1.5;
      this.trajectoryLine.fillStyle(0xffffff, alpha * 0.6);
      this.trajectoryLine.fillCircle(x, y, 3);
    }
  }

  private fireSnowball() {
    const body = this.snowball.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(true);
    body.setGravityY(GRAVITY);

    body.setVelocity(
      this.currentPull.x * SNOWBALL_VELOCITY_MULT,
      this.currentPull.y * SNOWBALL_VELOCITY_MULT
    );

    // Schedule reset
    this.resetTimer = this.time.delayedCall(RESET_DELAY, () => {
      if (!this.gameOver) {
        this.resetSnowball();
      }
    });
  }

  private resetSnowball() {
    if (this.resetTimer) {
      this.resetTimer.remove();
      this.resetTimer = null;
    }

    const body = this.snowball.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setVelocity(0, 0);

    this.snowball.x = this.slingshotBase.x;
    this.snowball.y = this.slingshotBase.y - 30;
  }

  private setupCollisions() {
    this.ornaments.forEach(ornamentData => {
      this.physics.add.overlap(
        this.snowball,
        ornamentData.sprite,
        () => this.hitOrnament(ornamentData),
        undefined,
        this
      );
    });
  }

  private hitOrnament(ornamentData: OrnamentData) {
    if (ornamentData.collected || this.gameOver) return;

    ornamentData.collected = true;
    this.ornamentsCollected++;

    // Visual feedback
    this.emitSparkles(ornamentData.sprite.x, ornamentData.sprite.y, ornamentData.color);

    // Animate ornament disappearance
    this.tweens.add({
      targets: ornamentData.sprite,
      scale: 0,
      alpha: 0,
      duration: 300,
      ease: 'Back.in',
      onComplete: () => {
        ornamentData.sprite.destroy();
      },
    });

    // Update progress
    this.revealHint();
    this.updateProgress();

    // Reset snowball
    this.resetSnowball();

    if (this.ornamentsCollected >= TOTAL_ORNAMENTS) {
      this.handleWin();
    }
  }

  private emitSparkles(x: number, y: number, color: string) {
    const tintMap: Record<string, number> = {
      red: 0xff6b6b,
      green: 0x69db7c,
      gold: 0xffd43b,
      blue: 0x74c0fc,
    };

    const particles = this.add.particles(x, y, 'sling-sparkle', {
      lifespan: 500,
      speed: { min: 50, max: 120 },
      quantity: 10,
      scale: { start: 0.8, end: 0 },
      alpha: { start: 1, end: 0.2 },
      tint: tintMap[color] || 0xffffff,
      blendMode: 'ADD',
      angle: { min: 0, max: 360 },
    });
    particles.setDepth(10);
    this.time.delayedCall(600, () => particles.destroy());
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

  private updateProgress() {
    this.progressText.setText(`${this.ornamentsCollected}/${TOTAL_ORNAMENTS}`);
  }

  private createUI() {
    const padding = 12;

    this.timerText = this.add.text(padding, padding, `Time: ${this.timeRemaining}`, {
      fontSize: '20px',
      fontFamily: 'monospace',
      color: '#ffffff',
      backgroundColor: '#00000088',
      padding: { x: 10, y: 6 },
    });
    this.timerText.setScrollFactor(0).setDepth(1000);

    this.progressText = this.add.text(
      this.scale.width / 2,
      padding,
      `${this.ornamentsCollected}/${TOTAL_ORNAMENTS}`,
      {
        fontSize: '22px',
        fontFamily: 'monospace',
        color: '#ffd54f',
        backgroundColor: '#00000088',
        padding: { x: 12, y: 6 },
      }
    );
    this.progressText.setOrigin(0.5, 0).setScrollFactor(0).setDepth(1000);

    this.hintText = this.add.text(padding, padding + 36, 'Hints: ', {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#81d4fa',
      backgroundColor: '#00000066',
      padding: { x: 10, y: 6 },
    });
    this.hintText.setScrollFactor(0).setDepth(1000);

    // Instructions
    this.add
      .text(
        this.slingshotBase.x,
        this.scale.height - 30,
        'Drag snowball back and release!',
        {
          fontSize: '12px',
          fontFamily: 'monospace',
          color: '#ffffff',
        }
      )
      .setOrigin(0.5)
      .setAlpha(0.7)
      .setDepth(100);
  }

  private updateTimer = () => {
    if (this.gameOver) return;
    this.timeRemaining--;
    this.timerText.setText(`Time: ${this.timeRemaining}`);

    if (this.timeRemaining <= 10) {
      this.timerText.setColor('#ff6b6b');
    }

    if (this.timeRemaining <= 0) {
      this.handleLoss();
    }
  };

  private handleWin() {
    if (this.gameOver) return;
    this.gameOver = true;
    this.physics.pause();
    if (this.timerEvent) this.timerEvent.remove();
    if (this.resetTimer) this.resetTimer.remove();
    this.bandGraphics.clear();
    this.trajectoryLine.clear();
    this.showGameOver(true);
  }

  private handleLoss() {
    if (this.gameOver) return;
    this.gameOver = true;
    this.physics.pause();
    if (this.timerEvent) this.timerEvent.remove();
    if (this.resetTimer) this.resetTimer.remove();
    this.bandGraphics.clear();
    this.trajectoryLine.clear();
    this.showGameOver(false);
  }

  private showGameOver(success: boolean) {
    const overlay = this.add.rectangle(
      this.scale.width / 2,
      this.scale.height / 2,
      this.scale.width,
      this.scale.height,
      0x030914,
      0.92
    );
    overlay.setScrollFactor(0).setDepth(5000);

    if (success) {
      const title = this.add.text(
        this.scale.width / 2,
        this.scale.height / 2 - 110,
        'BULLSEYE!',
        {
          fontSize: '36px',
          fontFamily: 'Courier New, monospace',
          color: '#43a047',
          stroke: '#e53935',
          strokeThickness: 5,
        }
      );
      title.setOrigin(0.5).setScrollFactor(0).setDepth(5001);

      const recipientText = this.add.text(
        this.scale.width / 2,
        this.scale.height / 2 - 30,
        `YOU ARE SECRET SANTA FOR:\n${this.recipient.toUpperCase()}`,
        {
          fontSize: '22px',
          fontFamily: 'Courier New, monospace',
          color: '#ffd54f',
          align: 'center',
        }
      );
      recipientText.setOrigin(0.5).setScrollFactor(0).setDepth(5001);

      this.createReplayButton('PLAY AGAIN (R)');
    } else {
      const failText = this.add.text(
        this.scale.width / 2,
        this.scale.height / 2 - 20,
        'TIME UP!',
        {
          fontSize: '32px',
          fontFamily: 'Courier New, monospace',
          color: '#e53935',
          stroke: '#000000',
          strokeThickness: 4,
        }
      );
      failText.setOrigin(0.5).setScrollFactor(0).setDepth(5001);

      this.createReplayButton('TRY AGAIN (R)');
    }
  }

  private createReplayButton(label: string) {
    const buttonY = this.scale.height / 2 + 100;
    const button = this.add
      .rectangle(this.scale.width / 2, buttonY, 240, 64, 0xe53935, 1)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(5001)
      .setInteractive({ useHandCursor: true });
    button.setStrokeStyle(3, 0xffd54f);

    this.add
      .text(this.scale.width / 2, buttonY, label, {
        fontSize: '20px',
        fontFamily: 'Courier New, monospace',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(5002);

    const restartScene = () => this.scene.restart(this.gameConfigData);
    button.on('pointerdown', restartScene);
    button.on('pointerover', () => button.setFillStyle(0xff4757, 1));
    button.on('pointerout', () => button.setFillStyle(0xe53935, 1));
    this.input.keyboard!.once('keydown-R', restartScene);
  }

  update() {
    if (this.gameOver) return;

    // Check if snowball went off screen
    if (
      this.snowball.y > this.scale.height + 50 ||
      this.snowball.x < -50 ||
      this.snowball.x > this.scale.width + 50
    ) {
      this.resetSnowball();
    }
  }
}
