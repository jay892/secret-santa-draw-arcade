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

const GIFT_SMALL_MATRIX: PixelMatrix = [
  '.BBBBBBBBBB.',
  'BBBBBBBBBBBB',
  'BBBBBBBBBBBB',
  'BBYYBBYYBBBB',
  'BBBBBBBBBBBB',
  'BBBBBBBBBBBB',
  'BBYYBBYYBBBB',
  'BBBBBBBBBBBB',
  'BBBBBBBBBBBB',
  '.BBBBBBBBBB.',
];

const GIFT_MEDIUM_MATRIX: PixelMatrix = [
  '.BBBBBBBBBBBBBB.',
  'BBBBBBBBBBBBBBBB',
  'BBBBBBBBBBBBBBBB',
  'BBBBBBBBBBBBBBBB',
  'BBYYBBYYBBYYBBBB',
  'BBBBBBBBBBBBBBBB',
  'BBBBBBBBBBBBBBBB',
  'BBBBBBBBBBBBBBBB',
  'BBYYBBYYBBYYBBBB',
  'BBBBBBBBBBBBBBBB',
  'BBBBBBBBBBBBBBBB',
  'BBBBBBBBBBBBBBBB',
  '.BBBBBBBBBBBBBB.',
];

const GIFT_LARGE_MATRIX: PixelMatrix = [
  '.BBBBBBBBBBBBBBBBBB.',
  'BBBBBBBBBBBBBBBBBBBB',
  'BBBBBBBBBBBBBBBBBBBB',
  'BBBBBBBBBBBBBBBBBBBB',
  'BBBBBBBBBBBBBBBBBBBB',
  'BBYYBBYYBBYYBBYYBBBB',
  'BBBBBBBBBBBBBBBBBBBB',
  'BBBBBBBBBBBBBBBBBBBB',
  'BBBBBBBBBBBBBBBBBBBB',
  'BBBBBBBBBBBBBBBBBBBB',
  'BBYYBBYYBBYYBBYYBBBB',
  'BBBBBBBBBBBBBBBBBBBB',
  'BBBBBBBBBBBBBBBBBBBB',
  'BBBBBBBBBBBBBBBBBBBB',
  '.BBBBBBBBBBBBBBBBBB.',
];

const GIFT_PALETTE: Record<string, number> = {
  B: 0x3b6cfb,
  Y: 0xffd166,
};

const GIFT_RED_PALETTE: Record<string, number> = {
  B: 0xd7263d,
  Y: 0xffd166,
};

const GIFT_GREEN_PALETTE: Record<string, number> = {
  B: 0x0d8c5d,
  Y: 0xffd166,
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

interface StackedGift {
  sprite: Phaser.Physics.Arcade.Sprite;
  size: 'small' | 'medium' | 'large';
  stacked: boolean;
}

export class GiftStackingGame extends Phaser.Scene {
  private platform!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: {
    A: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  private gifts!: Phaser.Physics.Arcade.Group;
  private stackedGifts: StackedGift[] = [];
  private timerText!: Phaser.GameObjects.Text;
  private stackText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;
  private letterHints: string[] = [];
  private availableLetters: string[] = [];
  private timeRemaining = 60;
  private timerEvent!: Phaser.Time.TimerEvent;
  private recipient = '';
  private gameOver = false;
  private targetStack = 8;
  private currentStack = 0;
  private spawnTimer!: Phaser.Time.TimerEvent;
  private gameConfigData!: GameConfig;
  private pointerX: number | null = null;

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
    this.stackedGifts = [];
    this.pointerX = null;

    this.cameras.main.setBackgroundColor('#041830');
    this.physics.world.setBounds(0, 0, this.scale.width, this.scale.height);

    this.buildTextures();
    this.createBackground();
    this.createSnow();
    this.createPlatform();
    this.createGroups();
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
    drawPixelTexture(
      this,
      'stack-gift-small',
      GIFT_SMALL_MATRIX,
      GIFT_PALETTE,
      3
    );
    drawPixelTexture(
      this,
      'stack-gift-medium',
      GIFT_MEDIUM_MATRIX,
      GIFT_PALETTE,
      3
    );
    drawPixelTexture(
      this,
      'stack-gift-large',
      GIFT_LARGE_MATRIX,
      GIFT_PALETTE,
      3
    );
    drawPixelTexture(
      this,
      'stack-gift-small-red',
      GIFT_SMALL_MATRIX,
      GIFT_RED_PALETTE,
      3
    );
    drawPixelTexture(
      this,
      'stack-gift-medium-red',
      GIFT_MEDIUM_MATRIX,
      GIFT_RED_PALETTE,
      3
    );
    drawPixelTexture(
      this,
      'stack-gift-large-red',
      GIFT_LARGE_MATRIX,
      GIFT_RED_PALETTE,
      3
    );
    drawPixelTexture(
      this,
      'stack-gift-small-green',
      GIFT_SMALL_MATRIX,
      GIFT_GREEN_PALETTE,
      3
    );
    drawPixelTexture(
      this,
      'stack-gift-medium-green',
      GIFT_MEDIUM_MATRIX,
      GIFT_GREEN_PALETTE,
      3
    );
    drawPixelTexture(
      this,
      'stack-gift-large-green',
      GIFT_LARGE_MATRIX,
      GIFT_GREEN_PALETTE,
      3
    );
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

  private createPlatform() {
    const platformWidth = 200;
    const platformHeight = 24;
    this.platform = this.physics.add
      .sprite(this.scale.width / 2, this.scale.height - 40, 'stack-platform')
      .setDepth(2);
    this.platform.setDisplaySize(platformWidth, platformHeight);
    this.platform.setImmovable(true);
    this.platform.setCollideWorldBounds(true);
    const body = this.platform.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setSize(platformWidth, platformHeight);
  }

  private createGroups() {
    this.gifts = this.physics.add.group();

    // Collision between gifts
    this.physics.add.collider(
      this.gifts,
      this.gifts,
      this.dampenGiftCollision,
      undefined,
      this
    );
    // Collision between gifts and platform
    this.physics.add.collider(
      this.gifts,
      this.platform,
      this.handleLandingCollision,
      undefined,
      this
    );
  }

  private startSpawning() {
    this.spawnTimer = this.time.addEvent({
      delay: 2500,
      callback: this.spawnGift,
      callbackScope: this,
      loop: true,
    });
    // Spawn first gift immediately
    this.spawnGift();
  }

  private spawnGift() {
    if (this.gameOver) return;

    const sizes: Array<'small' | 'medium' | 'large'> = [
      'small',
      'medium',
      'large',
    ];
    const size = sizes[Phaser.Math.Between(0, 2)];
    const colors = ['', '-red', '-green'];
    const color = colors[Phaser.Math.Between(0, 2)];
    const textureKey = `stack-gift-${size}${color}`;

    const x = Phaser.Math.Between(50, this.scale.width - 50);
    const gift = this.gifts.create(
      x,
      -30,
      textureKey
    ) as Phaser.Physics.Arcade.Sprite;

    // Set size-based properties
    let width = 0;
    let height = 0;
    let mass = 1;
    if (size === 'small') {
      width = 60;
      height = 60;
      mass = 0.8;
    } else if (size === 'medium') {
      width = 80;
      height = 80;
      mass = 1.2;
    } else {
      width = 100;
      height = 100;
      mass = 1.5;
    }

    gift.setDisplaySize(width, height);
    gift.setDepth(1);
    gift.setData('size', size);

    const body = gift.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(true);
    body.setGravityY(400);
    body.setSize(width * 0.85, height * 0.85);
    body.setMass(mass);
    body.setBounce(0.1, 0.1);
    body.setDrag(50, 0);
    body.setFriction(1, 0);
    body.setMaxVelocity(300, 500);
    body.setCollideWorldBounds(true);

    // No rotation - keep gifts upright for easier stacking
    gift.setRotation(0);
  }

  private checkGiftStacked(
    gift: Phaser.Physics.Arcade.Sprite,
    size: 'small' | 'medium' | 'large'
  ) {
    if (!gift || !gift.active || this.gameOver) return;

    // Skip if already stacked
    const existing = this.stackedGifts.find(sg => sg.sprite === gift);
    if (existing && existing.stacked) return;

    const body = gift.body as Phaser.Physics.Arcade.Body;

    // Check if gift is near/on the platform level (y position check)
    const platformTop = this.platform.y - this.platform.displayHeight / 2;
    const giftBottom = gift.y + gift.displayHeight / 2;
    const isNearPlatformLevel = giftBottom >= platformTop - 10;

    // Check if gift is touching something below it OR has very low vertical velocity
    const isTouchingDown = body.touching.down || body.blocked.down;
    const hasSettled = Math.abs(body.velocity.y) < 50;

    // Check if gift is above the platform horizontally
    const platformLeft = this.platform.x - this.platform.displayWidth / 2;
    const platformRight = this.platform.x + this.platform.displayWidth / 2;
    const isAbovePlatform = gift.x >= platformLeft - 50 && gift.x <= platformRight + 50;

    if (isNearPlatformLevel && (isTouchingDown || hasSettled) && isAbovePlatform) {
      // Mark as stacked
      if (!existing) {
        this.stackedGifts.push({ sprite: gift, size, stacked: true });
      } else {
        existing.stacked = true;
      }
      this.currentStack += 1;
      this.stackText.setText(
        `Stack: ${this.currentStack}/${this.targetStack} 🎁`
      );
      this.revealHint();
      this.emitSparkles(gift.x, gift.y, 1.0);

      // Make gift more stable once stacked
      body.setBounce(0, 0);
      body.setDrag(100, 0);

      if (this.currentStack >= this.targetStack) {
        this.handleWin();
      }
    }
  }

  private handleGiftFallen(sprite: Phaser.Physics.Arcade.Sprite) {
    const stackedGift = this.stackedGifts.find(sg => sg.sprite === sprite);
    if (stackedGift && stackedGift.stacked) {
      // A stacked gift fell off
      this.currentStack = Math.max(0, this.currentStack - 1);
      this.stackText.setText(
        `Stack: ${this.currentStack}/${this.targetStack} 🎁`
      );
      stackedGift.stacked = false;
    }
    sprite.destroy();
  }

  private getUniqueLetters(): string[] {
    if (!this.recipient) return [];
    const letters = this.recipient.replace(/\s/g, '').toUpperCase().split('');
    return [...new Set(letters)];
  }

  private revealHint() {
    // Refill available letters if exhausted
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
    this.timerText = this.add.text(
      padding,
      padding,
      `Time: ${this.timeRemaining}`,
      {
        fontSize: '20px',
        fontFamily: 'monospace',
        color: '#ffffff',
        backgroundColor: '#00000088',
        padding: { x: 8, y: 4 },
      }
    );
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
    if (this.timerEvent) {
      this.timerEvent.remove();
    }
    if (this.spawnTimer) {
      this.spawnTimer.remove();
    }
    this.emitSparkles(this.platform.x, this.platform.y - 50, 1.5);
    this.showGameOver(true);
  }

  private handleLoss() {
    if (this.gameOver) return;
    this.gameOver = true;
    this.physics.pause();
    if (this.timerEvent) {
      this.timerEvent.remove();
    }
    if (this.spawnTimer) {
      this.spawnTimer.remove();
    }
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
      replayButton.on('pointerover', () =>
        replayButton.setFillStyle(0xff4757, 1)
      );
      replayButton.on('pointerout', () =>
        replayButton.setFillStyle(0xd7263d, 1)
      );
      this.input.keyboard!.once('keydown-R', restartScene);
    } else {
      const failText = this.add.text(
        this.scale.width / 2,
        this.scale.height / 2 - 40,
        'STACK FAILED!',
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
      retryButton.on('pointerover', () =>
        retryButton.setFillStyle(0xff4757, 1)
      );
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
    if (!this.platform || this.gameOver) return;

    const speed = 300;
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
      const diff = this.pointerX - this.platform.x;
      if (Math.abs(diff) > 10) {
        dirX = diff > 0 ? 1 : -1;
      }
    }

    const platformBody = this.platform.body as Phaser.Physics.Arcade.Body;
    platformBody.setVelocityX(dirX * speed);

    // Move stacked gifts with the platform (Arcade Physics doesn't do this automatically)
    this.stackedGifts.forEach(stackedGift => {
      if (stackedGift.stacked && stackedGift.sprite.active) {
        const giftBody = stackedGift.sprite.body as Phaser.Physics.Arcade.Body;
        // Apply platform's horizontal velocity to stacked gifts
        giftBody.setVelocityX(platformBody.velocity.x);
      }
    });

    // Check for gifts that fell off the bottom
    this.gifts.children.entries.forEach(gift => {
      const sprite = gift as Phaser.Physics.Arcade.Sprite;
      if (sprite && sprite.active && sprite.y > this.scale.height + 50) {
        this.handleGiftFallen(sprite);
      }
    });

    // Continuously check if non-stacked gifts should be counted as stacked
    this.gifts.children.entries.forEach(gift => {
      const sprite = gift as Phaser.Physics.Arcade.Sprite;
      if (!sprite || !sprite.active) return;

      // Skip if already tracked as stacked
      const existing = this.stackedGifts.find(sg => sg.sprite === sprite);
      if (existing && existing.stacked) return;

      const size = sprite.getData('size') as 'small' | 'medium' | 'large';
      if (size) {
        this.checkGiftStacked(sprite, size);
      }
    });

    // Check if previously stacked gifts have fallen off screen
    this.stackedGifts.forEach(stackedGift => {
      if (stackedGift.stacked && stackedGift.sprite.active) {
        // If gift fell below screen, mark as fallen
        if (stackedGift.sprite.y > this.scale.height + 50) {
          this.handleGiftFallen(stackedGift.sprite);
        }
      }
    });
  }

  private dampenGiftCollision: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback =
    (obj1, obj2) => {
      const spriteA = obj1 as Phaser.Physics.Arcade.Sprite;
      const spriteB = obj2 as Phaser.Physics.Arcade.Sprite;
      this.settleGift(spriteA);
      this.settleGift(spriteB);
    };

  private handleLandingCollision: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback =
    (_platform, gift) => {
      const sprite = gift as Phaser.Physics.Arcade.Sprite;
      this.settleGift(sprite, true);
    };

  private settleGift(
    sprite: Phaser.Physics.Arcade.Sprite,
    clampVertical = false
  ) {
    if (!sprite.active) return;
    const body = sprite.body as Phaser.Physics.Arcade.Body;
    const vx = body.velocity.x * 0.4;
    const vy = clampVertical
      ? Math.min(body.velocity.y, 120)
      : body.velocity.y * 0.6;
    body.setVelocity(vx, vy);
    body.setAngularVelocity((body.angularVelocity ?? 0) * 0.4);
    body.setDrag(140, 120);
    body.setAngularDrag(320);
  }
}
