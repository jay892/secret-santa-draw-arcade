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

const SLEIGH_MATRIX: PixelMatrix = [
  '.....................',
  '.........RRRR........',
  '........RRRRRR.......',
  '.......RRWWWWR.......',
  '......RRWF.FWR.......',
  '......RRWF.FWR.......',
  '.......RRWWWWR.......',
  '....GGGGGGGGGG.......',
  '...GGGGGGGGGGGG......',
  '..GGGGGGGGGGGGGG.....',
  '..GGGGGGGGGGGGGG.....',
  '...GGYYYYGGYYYYGG....',
  '..GGGGGGGGGGGGGG.....',
  '..GGGGGGGGGGGGGG.....',
  '..GGGGGGGGGGGGGG.....',
  '.BBBBBBBBBBBBBBBBB...',
  'BBBBBBBBBBBBBBBBBBB..',
  'BBBBB......BBBBBBBB..',
  '.BBBB........BBBB....',
  '.....................',
];

const SLEIGH_PALETTE: Record<string, number> = {
  R: 0xd7263d,
  W: 0xfff7e6,
  F: 0xffd9b0,
  G: 0x0d8c5d,
  Y: 0xffd166,
  B: 0x382411,
};

const STAR_MATRIX: PixelMatrix = [
  '..YY..',
  '.YYYY.',
  'YYYYYY',
  '.YYYY.',
  '..YY..',
];

const STAR_PALETTE: Record<string, number> = {
  Y: 0xfff066,
};

const GIFT_MATRIX: PixelMatrix = [
  '.BBBB.',
  'BBBBBB',
  'BBYYBB',
  'BBBBBB',
  'BBYYBB',
  'BBBBBB',
  '.BBBB.',
];

const GIFT_PALETTE: Record<string, number> = {
  B: 0x3b6cfb,
  Y: 0xffd166,
};

const CLOUD_MATRIX: PixelMatrix = [
  '....WWWW....',
  '..WWWWWWWW..',
  '.WWWWWWWWWW.',
  '.WWWWWWWWWW.',
  '..WWWWWWWW..',
  '...WWWWWW...',
];

const CLOUD_PALETTE: Record<string, number> = {
  W: 0xe3f0ff,
};

const BIRD_MATRIX: PixelMatrix = [
  '..KK......',
  '.KKKK.....',
  'KKKKKK....',
  '.KKKKK....',
  '..KK......',
  '...K......',
];

const BIRD_PALETTE: Record<string, number> = {
  K: 0x2b2d42,
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

const SPARKLE_TEXTURE_KEY = 'rd-sparkle';

export class ReindeerDeliveryGame extends Phaser.Scene {
  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: {
    W: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
  };
  private clouds!: Phaser.Physics.Arcade.Group;
  private birds!: Phaser.Physics.Arcade.Group;
  private gifts!: Phaser.Physics.Arcade.Group;
  private stars!: Phaser.Physics.Arcade.Group;
  private timerText!: Phaser.GameObjects.Text;
  private starsText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;
  private letterHints: string[] = [];
  private availableLetters: string[] = [];
  private collectedStars = 0;
  private totalStars = 4;
  private timeRemaining = 45;
  private timerEvent!: Phaser.Time.TimerEvent;
  private recipient = '';
  private gameOver = false;
  private pointerY: number | null = null;
  private gameConfigData!: GameConfig;

  constructor() {
    super({ key: 'ReindeerDeliveryGame' });
  }

  init(data: GameConfig) {
    this.gameConfigData = data;
    this.recipient = data.recipient;
  }

  create() {
    this.gameOver = false;
    this.collectedStars = 0;
    this.letterHints = [];
    this.availableLetters = this.getUniqueLetters();
    this.timeRemaining = 45;
    this.pointerY = null;

    this.cameras.main.setBackgroundColor('#041830');
    this.physics.world.setBounds(0, 0, this.scale.width, this.scale.height);
    this.buildTextures();
    this.createBackground();
    this.createSnow();
    this.createPlayer();
    this.createUI();
    this.createGroups();
    this.createSpawners();
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasdKeys = this.input.keyboard!.addKeys('W,S') as {
      W: Phaser.Input.Keyboard.Key;
      S: Phaser.Input.Keyboard.Key;
    };

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.isDown) {
        this.pointerY = pointer.y;
      }
    });

    this.input.on('pointerup', () => {
      this.pointerY = null;
    });

    this.timerEvent = this.time.addEvent({
      delay: 1000,
      callback: this.updateTimer,
      callbackScope: this,
      loop: true,
    });
  }

  private buildTextures() {
    drawPixelTexture(this, 'rd-sleigh', SLEIGH_MATRIX, SLEIGH_PALETTE);
    drawPixelTexture(this, 'rd-star', STAR_MATRIX, STAR_PALETTE, 3);
    drawPixelTexture(this, 'rd-gift', GIFT_MATRIX, GIFT_PALETTE, 3);
    drawPixelTexture(this, 'rd-cloud', CLOUD_MATRIX, CLOUD_PALETTE, 4);
    drawPixelTexture(this, 'rd-bird', BIRD_MATRIX, BIRD_PALETTE, 3);
    drawPixelTexture(
      this,
      SPARKLE_TEXTURE_KEY,
      SPARKLE_MATRIX,
      SPARKLE_PALETTE,
      2
    );
  }

  private createBackground() {
    const width = this.scale.width;
    const height = this.scale.height;
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x022345, 0x022345, 0x03152d, 0x03152d, 1, 1, 1, 1);
    sky.fillRect(0, 0, width, height);
    sky.generateTexture('rd-sky', width, height);
    sky.destroy();
    this.add
      .image(width / 2, height / 2, 'rd-sky')
      .setDepth(-5)
      .setDisplaySize(width, height);

    const stars = this.add.graphics({
      fillStyle: { color: 0xffffff, alpha: 0.8 },
    });
    for (let i = 0; i < 80; i += 1) {
      const size = Phaser.Math.Between(1, 2);
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      const alpha = Phaser.Math.FloatBetween(0.3, 0.9);
      stars.fillStyle(0xffffff, alpha);
      stars.fillRect(x, y, size, size);
    }
    stars.generateTexture('rd-starfield', width, height);
    stars.destroy();
    this.add
      .tileSprite(0, 0, width, height, 'rd-starfield')
      .setOrigin(0)
      .setDepth(-4)
      .setScrollFactor(0);
  }

  private createSnow() {
    const particles = this.add.particles(0, 0, SPARKLE_TEXTURE_KEY, {
      x: { min: 0, max: this.scale.width },
      y: 0,
      lifespan: 4000,
      speedY: { min: 35, max: 70 },
      speedX: { min: -10, max: 10 },
      scale: { start: 0.6, end: 0 },
      alpha: { start: 0.9, end: 0.1 },
      quantity: 1,
      frequency: 120,
      tint: 0xffffff,
      blendMode: 'ADD',
    });
    particles.setDepth(-3);
  }

  private createPlayer() {
    this.player = this.physics.add
      .sprite(80, this.scale.height / 2, 'rd-sleigh')
      .setDepth(2);
    this.player.setCollideWorldBounds(true);
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setSize(PIXEL_SIZE * 15, PIXEL_SIZE * 7);
    body.setOffset(PIXEL_SIZE * 3, PIXEL_SIZE * 6);
  }

  private createGroups() {
    this.clouds = this.physics.add.group({ allowGravity: false });
    this.birds = this.physics.add.group({ allowGravity: false });
    this.gifts = this.physics.add.group({ allowGravity: false });
    this.stars = this.physics.add.group({ allowGravity: false });

    this.physics.add.overlap(
      this.player,
      this.gifts,
      this.collectGift,
      undefined,
      this
    );
    this.physics.add.overlap(
      this.player,
      this.stars,
      this.collectStar,
      undefined,
      this
    );
    this.physics.add.overlap(
      this.player,
      this.clouds,
      this.hitObstacle,
      undefined,
      this
    );
    this.physics.add.overlap(
      this.player,
      this.birds,
      this.hitObstacle,
      undefined,
      this
    );
  }

  private createSpawners() {
    this.time.addEvent({
      delay: 1800,
      loop: true,
      callback: this.spawnCloud,
      callbackScope: this,
    });

    this.time.addEvent({
      delay: 2600,
      loop: true,
      callback: this.spawnBird,
      callbackScope: this,
    });

    this.time.addEvent({
      delay: 1300,
      loop: true,
      callback: this.spawnGift,
      callbackScope: this,
    });

    this.time.addEvent({
      delay: 4500,
      loop: true,
      callback: this.spawnStar,
      callbackScope: this,
    });
  }

  private spawnCloud() {
    if (this.gameOver) return;
    const y = Phaser.Math.Between(40, this.scale.height - 40);
    const cloud = this.clouds.create(this.scale.width + 50, y, 'rd-cloud');
    cloud.setDepth(0);
    cloud.setVelocityX(-Phaser.Math.Between(60, 120));
    (cloud.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    this.time.delayedCall(10000, () => cloud.destroy());
  }

  private spawnBird() {
    if (this.gameOver) return;
    const y = Phaser.Math.Between(30, this.scale.height - 30);
    const bird = this.birds.create(this.scale.width + 20, y, 'rd-bird');
    bird.setDepth(1);
    bird.setVelocityX(-Phaser.Math.Between(150, 220));
    bird.setFlipX(true);
    (bird.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    bird.setRotation(Phaser.Math.FloatBetween(-0.05, 0.05));
    this.time.delayedCall(8000, () => bird.destroy());
  }

  private spawnGift() {
    if (this.gameOver) return;
    const y = Phaser.Math.Between(60, this.scale.height - 60);
    const gift = this.gifts.create(this.scale.width + 30, y, 'rd-gift');
    gift.setDepth(1);
    gift.setVelocityX(-Phaser.Math.Between(110, 160));
    gift.setVelocityY(Phaser.Math.Between(-15, 15));
    (gift.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    gift.setAngle(Phaser.Math.Between(-10, 10));
    this.tweens.add({
      targets: gift,
      angle: { from: gift.angle - 3, to: gift.angle + 3 },
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    this.time.delayedCall(8000, () => gift.destroy());
  }

  private spawnStar() {
    if (this.gameOver || this.stars.countActive(true) >= 2) return;
    const y = Phaser.Math.Between(50, this.scale.height - 50);
    const star = this.stars.create(this.scale.width + 40, y, 'rd-star');
    star.setDepth(2);
    star.setScale(1.2);
    star.setTint(0xfff7a8);
    (star.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    star.setVelocityX(-Phaser.Math.Between(140, 190));
    star.setVelocityY(Phaser.Math.Between(-15, 15));

    this.tweens.add({
      targets: star,
      scale: { from: 1.15, to: 1.3 },
      alpha: { from: 0.85, to: 1 },
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const emitter = this.add.particles(star.x, star.y, SPARKLE_TEXTURE_KEY, {
      lifespan: 400,
      speed: { min: 10, max: 30 },
      scale: { start: 0.3, end: 0 },
      alpha: { start: 0.85, end: 0.2 },
      frequency: 140,
      quantity: 1,
      followOffset: { x: -6, y: 0 },
      tint: 0xfffff0,
    });
    emitter.startFollow(star);
    star.once(
      Phaser.GameObjects.Events.DESTROY,
      () => {
        emitter.destroy();
      },
      this
    );

    this.time.delayedCall(8000, () => star.destroy());
  }

  private collectGift: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (
    _p,
    gift
  ) => {
    const sprite = gift as Phaser.Physics.Arcade.Sprite;
    sprite.disableBody(true, true);
    this.emitSparkles(sprite.x, sprite.y, 0.8);
  };

  private collectStar: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (
    _p,
    star
  ) => {
    if (this.gameOver) return;
    const sprite = star as Phaser.Physics.Arcade.Sprite;
    sprite.disableBody(true, true);
    this.emitSparkles(sprite.x, sprite.y, 1.2);
    const letter = this.getRandomLetter();
    this.letterHints.push(letter);
    this.collectedStars += 1;
    this.starsText.setText(`${this.collectedStars}/${this.totalStars} ⭐`);
    this.hintText.setText(`Hints: ${this.letterHints.join(' ')}`);
    if (this.collectedStars >= this.totalStars) {
      this.handleWin();
    }
  };

  private hitObstacle: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback =
    () => {
      if (this.gameOver) return;
      this.handleLoss();
    };

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

    this.starsText = this.add.text(
      padding + 150,
      padding,
      `0/${this.totalStars} ⭐`,
      {
        fontSize: '18px',
        fontFamily: 'monospace',
        color: '#ffe066',
        backgroundColor: '#00000066',
        padding: { x: 8, y: 4 },
      }
    );
    this.starsText.setScrollFactor(0).setDepth(1000);

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
      if (this.collectedStars >= this.totalStars) {
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
    this.timerEvent.remove();
    this.emitSparkles(this.player.x + 30, this.player.y, 1.5);
    this.showGameOver(true);
  }

  private handleLoss() {
    if (this.gameOver) return;
    this.gameOver = true;
    this.physics.pause();
    if (this.timerEvent) {
      this.timerEvent.remove();
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
        'SLEIGH SUCCESS!',
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
        'DELIVERY FAILED!',
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
    const particles = this.add.particles(x, y, SPARKLE_TEXTURE_KEY, {
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

  private getUniqueLetters(): string[] {
    const letters = this.recipient.replace(/\s/g, '').toUpperCase().split('');
    return [...new Set(letters)];
  }

  private getRandomLetter(): string {
    // Refill available letters if exhausted
    if (this.availableLetters.length === 0) {
      this.availableLetters = this.getUniqueLetters();
    }
    if (this.availableLetters.length === 0) {
      return '?';
    }
    const index = Phaser.Math.Between(0, this.availableLetters.length - 1);
    const letter = this.availableLetters[index];
    this.availableLetters.splice(index, 1);
    return letter;
  }

  update() {
    if (!this.player || this.gameOver) return;
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const speed = 220;
    let dirY = 0;
    if (this.cursors.up?.isDown || this.wasdKeys.W.isDown) {
      dirY -= 1;
    }
    if (this.cursors.down?.isDown || this.wasdKeys.S.isDown) {
      dirY += 1;
    }
    if (this.pointerY !== null) {
      if (this.pointerY < this.player.y - 10) {
        dirY = -1;
      } else if (this.pointerY > this.player.y + 10) {
        dirY = 1;
      } else {
        dirY = 0;
      }
    }
    body.setVelocity(0, dirY * speed);
  }
}
