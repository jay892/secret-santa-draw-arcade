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

const CARD_BACK_MATRIX: PixelMatrix = [
  'PPPPPPPPPPPPPPPP',
  'PBBBBBBBBBBBBBBP',
  'PBrrrrrrrrrrrrBP',
  'PBrrrrrrrrrrrrBP',
  'PBrrrrrrrrrrrrBP',
  'PBrrrrrrrrrrrrBP',
  'PBrrrrrrrrrrrrBP',
  'PBrrrrrrrrrrrrBP',
  'PBrrrrrrrrrrrrBP',
  'PBrrrrrrrrrrrrBP',
  'PBrrrrrrrrrrrrBP',
  'PBrrrrrrrrrrrrBP',
  'PBrrrrrrrrrrrrBP',
  'PBrrrrrrrrrrrrBP',
  'PBBBBBBBBBBBBBBP',
  'PPPPPPPPPPPPPPPP',
];

const CARD_BACK_PALETTE: Record<string, number> = {
  P: 0xffffff,
  B: 0xd7263d,
  r: 0x931f2a,
};

const CARD_FACE_MATRIX: PixelMatrix = [
  'PPPPPPPPPPPPPPPP',
  'PFFFFFFFFFFFFFCP',
  'PF...........FP',
  'PF...........FP',
  'PF...........FP',
  'PF...........FP',
  'PF...........FP',
  'PF...........FP',
  'PF...........FP',
  'PF...........FP',
  'PF...........FP',
  'PF...........FP',
  'PF...........FP',
  'PF...........FP',
  'PFFFFFFFFFFFFFCP',
  'PPPPPPPPPPPPPPPP',
];

const CARD_FACE_PALETTE: Record<string, number> = {
  P: 0xffffff,
  F: 0xf7f7f7,
  C: 0xffd166,
  '.': 0x000000,
};

const ICON_MATRICES: Record<string, PixelMatrix> = {
  ornament: [
    '......RRR......',
    '....RRRRRR....',
    '...RRRRRRRR...',
    '..RRRRRRRRRR..',
    '..RRRRRRRRRR..',
    '..RRRRRRRRRR..',
    '..RRRRRRRRRR..',
    '..RRRRRRRRRR..',
    '...RRRRRRRR...',
    '....RRRRRR....',
    '.....RRRR.....',
    '......RR......',
    '......YY......',
    '......YY......',
    '......YY......',
    '......YY......',
  ],
  candy: [
    '....WWWWWW....',
    '...WWWWWWWW...',
    '..WWRRWWRRWW..',
    '.WWRRWWRRWWRR.',
    '.WWRRWWRRWWRR.',
    '.WWRRWWRRWWRR.',
    '..WWRRWWRRWW..',
    '...WWRRWWRR...',
    '....WWRRWW....',
    '.....WWRR.....',
    '......WW......',
    '......WW......',
    '......RR......',
    '.....RRRR.....',
    '....RRRRRR....',
    '...RRRRRRRR...',
  ],
  bell: [
    '......YY......',
    '.....YYYY.....',
    '....YYYYYY....',
    '...YYYYYYYY...',
    '..YYYYYYYYYY..',
    '..YYYYYYYYYY..',
    '..YYYYYYYYYY..',
    '..YYYYYYYYYY..',
    '..YYYYYYYYYY..',
    '..YYYYYYYYYY..',
    '...YYYYYYYY...',
    '...YYYYYYYY...',
    '....YYYYYY....',
    '......YY......',
    '......YY......',
    '......YY......',
  ],
  stocking: [
    '......RRRR....',
    '......RRRR....',
    '......RRRR....',
    '......RRRR....',
    '......RRRR....',
    '......RRRR....',
    '..GGGGGGGGGG..',
    '..GGGGGGGGGG..',
    '..GGGGGGGGGG..',
    '..GGGGGGGGGG..',
    '..GGGGGGGGGG..',
    '..GGGGGGGGGG..',
    '....GGGGGG....',
    '....GGGGGG....',
    '....GGGGGG....',
    '....GGGGGG....',
  ],
  candle: [
    '......YY......',
    '.....YYYY.....',
    '....YYYYYY....',
    '....YYYYYY....',
    '.....YYYY.....',
    '......YY......',
    '......RR......',
    '......RR......',
    '......RR......',
    '......RR......',
    '......RR......',
    '......RR......',
    '......RR......',
    '......RR......',
    '....GGGGGG....',
    '....GGGGGG....',
  ],
  snowflake: [
    '......WW......',
    '......WW......',
    '..WWWWWWWWWW..',
    '..WWWWWWWWWW..',
    '....WWWWWW....',
    '....WWWWWW....',
    'WWWWWWWWWWWWWW',
    'WWWWWWWWWWWWWW',
    '....WWWWWW....',
    '....WWWWWW....',
    '..WWWWWWWWWW..',
    '..WWWWWWWWWW..',
    '......WW......',
    '......WW......',
    '......WW......',
    '......WW......',
  ],
};

const ICON_PALETTES: Record<string, Record<string, number>> = {
  ornament: { R: 0xff5666, Y: 0xfff3c4 },
  candy: { W: 0xffffff, R: 0xd7263d },
  bell: { Y: 0xffd166 },
  stocking: { R: 0xd7263d, G: 0x0d8c5d },
  candle: { Y: 0xfff7e6, R: 0xd7263d, G: 0x0d8c5d },
  snowflake: { W: 0xdcedff },
};

const CARD_ICON_KEYS = Object.keys(ICON_MATRICES);

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

const SPARKLE_KEY = 'match-sparkle';

interface MemoryCard {
  id: number;
  iconKey: string;
  container: Phaser.GameObjects.Container;
  back: Phaser.GameObjects.Image;
  face: Phaser.GameObjects.Image;
  isFlipped: boolean;
  matched: boolean;
}

export class StockingMatchGame extends Phaser.Scene {
  private cards: MemoryCard[] = [];
  private flippedCards: MemoryCard[] = [];
  private lockBoard = false;
  private matchesFound = 0;
  private totalPairs = 6;
  private timerText!: Phaser.GameObjects.Text;
  private matchesText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;
  private letterHints: string[] = [];
  private availableLetters: string[] = [];
  private timeRemaining = 80;
  private timerEvent!: Phaser.Time.TimerEvent;
  private recipient = '';
  private gameOver = false;
  private gameConfigData!: GameConfig;

  constructor() {
    super({ key: 'StockingMatchGame' });
  }

  init(data: GameConfig) {
    this.gameConfigData = data;
    this.recipient = data.recipient;
  }

  create() {
    this.gameOver = false;
    this.matchesFound = 0;
    this.letterHints = [];
    this.availableLetters = this.getUniqueLetters();
    this.timeRemaining = 80;
    this.lockBoard = false;
    this.cards = [];
    this.flippedCards = [];

    this.cameras.main.setBackgroundColor('#081226');

    this.buildTextures();
    this.createBackdrop();
    this.createBoard();
    this.createUI();

    this.timerEvent = this.time.addEvent({
      delay: 1000,
      callback: this.updateTimer,
      callbackScope: this,
      loop: true,
    });
  }

  private buildTextures() {
    drawPixelTexture(
      this,
      'match-card-back',
      CARD_BACK_MATRIX,
      CARD_BACK_PALETTE
    );
    drawPixelTexture(
      this,
      'match-card-face',
      CARD_FACE_MATRIX,
      CARD_FACE_PALETTE
    );
    CARD_ICON_KEYS.forEach(key => {
      drawPixelTexture(
        this,
        `match-icon-${key}`,
        ICON_MATRICES[key],
        ICON_PALETTES[key]
      );
    });
    drawPixelTexture(this, SPARKLE_KEY, SPARKLE_MATRIX, SPARKLE_PALETTE, 2);
  }

  private createBackdrop() {
    const width = this.scale.width;
    const height = this.scale.height;
    const graphics = this.add.graphics();
    graphics.fillGradientStyle(0x091534, 0x091534, 0x040a1d, 0x040a1d, 1);
    graphics.fillRect(0, 0, width, height);

    for (let i = 0; i < 80; i += 1) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      const size = Phaser.Math.Between(1, 2);
      const alpha = Phaser.Math.FloatBetween(0.2, 0.6);
      graphics.fillStyle(0xffffff, alpha);
      graphics.fillRect(x, y, size, size);
    }
    graphics.generateTexture('match-backdrop', width, height);
    graphics.destroy();

    this.add
      .image(width / 2, height / 2, 'match-backdrop')
      .setDepth(-5)
      .setDisplaySize(width, height);
  }

  private createBoard() {
    const cols = 4;
    const rows = 3;

    const baseCardWidth = 92;
    const baseCardHeight = 120;
    const baseSpacingX = 16;
    const baseSpacingY = 20;

    const baseBoardWidth = cols * baseCardWidth + (cols - 1) * baseSpacingX;
    const baseBoardHeight = rows * baseCardHeight + (rows - 1) * baseSpacingY;

    const availableWidth = Math.max(this.scale.width - 40, 200);
    const availableHeight = Math.max(this.scale.height - 200, 200);
    const boardScale = Math.min(
      1,
      availableWidth / baseBoardWidth,
      availableHeight / baseBoardHeight
    );

    const cardWidth = baseCardWidth * boardScale;
    const cardHeight = baseCardHeight * boardScale;
    const spacingX = baseSpacingX * boardScale;
    const spacingY = baseSpacingY * boardScale;
    const boardWidth = cols * cardWidth + (cols - 1) * spacingX;
    const boardHeight = rows * cardHeight + (rows - 1) * spacingY;

    const startX = this.scale.width / 2 - boardWidth / 2 + cardWidth / 2;
    const startY =
      this.scale.height / 2 - boardHeight / 2 + cardHeight / 2 + spacingY;

    const iconPool = Phaser.Utils.Array.Shuffle(
      CARD_ICON_KEYS.slice(0, this.totalPairs)
    );
    const deck: string[] = [];
    for (let i = 0; i < this.totalPairs; i += 1) {
      const iconKey = iconPool[i % iconPool.length];
      deck.push(iconKey, iconKey);
    }
    Phaser.Utils.Array.Shuffle(deck);

    deck.forEach((iconKey, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = startX + col * (cardWidth + spacingX);
      const y = startY + row * (cardHeight + spacingY);
      this.cards.push(
        this.createCard(iconKey, x, y, index, cardWidth, cardHeight, boardScale)
      );
    });
  }

  private createCard(
    iconKey: string,
    x: number,
    y: number,
    id: number,
    cardWidth: number,
    cardHeight: number,
    scaleFactor: number
  ): MemoryCard {
    const container = this.add.container(x, y);
    container.setSize(cardWidth, cardHeight);
    container.setInteractive({ useHandCursor: true });

    const back = this.add
      .image(0, 0, 'match-card-back')
      .setOrigin(0.5)
      .setDisplaySize(cardWidth, cardHeight);
    const faceBase = this.add
      .image(0, 0, 'match-card-face')
      .setOrigin(0.5)
      .setDisplaySize(cardWidth, cardHeight);

    const iconSize = 60 * scaleFactor;
    const faceIcon = this.add
      .image(0, cardHeight * 0.05, `match-icon-${iconKey}`)
      .setOrigin(0.5)
      .setDisplaySize(iconSize, iconSize);
    faceIcon.setTint(0xffffff);

    faceBase.setVisible(false);
    faceIcon.setVisible(false);

    container.add([back, faceBase, faceIcon]);

    const card: MemoryCard = {
      id,
      iconKey,
      container,
      back,
      face: faceIcon,
      isFlipped: false,
      matched: false,
    };

    container.on('pointerdown', () => this.handleCardSelect(card));
    return card;
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
        backgroundColor: '#000000aa',
        padding: { x: 10, y: 6 },
      }
    );
    this.timerText.setScrollFactor(0).setDepth(1000);

    this.matchesText = this.add.text(
      padding + 160,
      padding,
      `Matches: 0/${this.totalPairs}`,
      {
        fontSize: '18px',
        fontFamily: 'monospace',
        color: '#ffd166',
        backgroundColor: '#00000088',
        padding: { x: 10, y: 6 },
      }
    );
    this.matchesText.setScrollFactor(0).setDepth(1000);

    this.hintText = this.add.text(padding, padding + 34, 'Hints: ', {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#ffff99',
      backgroundColor: '#00000066',
      padding: { x: 10, y: 6 },
    });
    this.hintText.setScrollFactor(0).setDepth(1000);
  }

  private handleCardSelect(card: MemoryCard) {
    if (this.gameOver || card.matched || card.isFlipped || this.lockBoard) {
      return;
    }
    this.flipCard(card);
    this.flippedCards.push(card);
    if (this.flippedCards.length === 2) {
      this.lockBoard = true;
      this.time.delayedCall(400, () => this.checkMatch());
    }
  }

  private flipCard(card: MemoryCard) {
    card.isFlipped = true;
    this.tweens.add({
      targets: card.container,
      scaleX: 0,
      duration: 120,
      ease: 'Sine.easeIn',
      onComplete: () => {
        card.back.setVisible(false);
        card.face.setVisible(true);
        card.face.setAlpha(1);
        this.tweens.add({
          targets: card.container,
          scaleX: 1,
          duration: 120,
          ease: 'Sine.easeOut',
        });
      },
    });
  }

  private flipCardBack(card: MemoryCard) {
    this.tweens.add({
      targets: card.container,
      scaleX: 0,
      duration: 120,
      onComplete: () => {
        card.back.setVisible(true);
        card.face.setVisible(false);
        card.isFlipped = false;
        this.tweens.add({
          targets: card.container,
          scaleX: 1,
          duration: 120,
        });
      },
    });
  }

  private checkMatch() {
    if (this.flippedCards.length < 2) {
      this.lockBoard = false;
      return;
    }
    const [first, second] = this.flippedCards;
    if (first.iconKey === second.iconKey) {
      first.matched = true;
      second.matched = true;
      this.matchesFound += 1;
      this.matchesText.setText(
        `Matches: ${this.matchesFound}/${this.totalPairs}`
      );
      this.revealHint();
      this.emitSparkles(
        (first.container.x + second.container.x) / 2,
        (first.container.y + second.container.y) / 2
      );
      this.flippedCards = [];
      this.lockBoard = false;
      if (this.matchesFound >= this.totalPairs) {
        this.handleWin();
      }
    } else {
      this.time.delayedCall(600, () => {
        this.flipCardBack(first);
        this.flipCardBack(second);
        this.flippedCards = [];
        this.lockBoard = false;
      });
    }
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

  private updateTimer() {
    if (this.gameOver) return;
    this.timeRemaining -= 1;
    this.timerText.setText(`Time: ${this.timeRemaining}`);
    if (this.timeRemaining <= 0) {
      this.handleLoss();
    }
  }

  private handleWin() {
    if (this.gameOver) return;
    this.gameOver = true;
    if (this.timerEvent) {
      this.timerEvent.remove();
    }
    this.showGameOver(true);
  }

  private handleLoss() {
    if (this.gameOver) return;
    this.gameOver = true;
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
      0x030914,
      0.92
    );
    overlay.setScrollFactor(0).setDepth(5000);

    if (success) {
      const title = this.add.text(
        this.scale.width / 2,
        this.scale.height / 2 - 110,
        'MATCH COMPLETE!',
        {
          fontSize: '34px',
          fontFamily: 'Courier New, monospace',
          color: '#0d8c5d',
          stroke: '#d7263d',
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
          color: '#ffd166',
          align: 'center',
        }
      );
      recipientText.setOrigin(0.5).setScrollFactor(0).setDepth(5001);

      this.createReplayButton('PLAY AGAIN (R)');
    } else {
      const failText = this.add.text(
        this.scale.width / 2,
        this.scale.height / 2 - 20,
        'TIME RAN OUT!',
        {
          fontSize: '30px',
          fontFamily: 'Courier New, monospace',
          color: '#d7263d',
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
      .rectangle(this.scale.width / 2, buttonY, 240, 64, 0xd7263d, 1)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(5001)
      .setInteractive({ useHandCursor: true });
    button.setStrokeStyle(3, 0xfff066);

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
    button.on('pointerout', () => button.setFillStyle(0xd7263d, 1));
    this.input.keyboard!.once('keydown-R', restartScene);
  }

  private emitSparkles(x: number, y: number) {
    const particles = this.add.particles(x, y, SPARKLE_KEY, {
      lifespan: 400,
      speed: { min: 40, max: 100 },
      quantity: 12,
      scale: { start: 0.7, end: 0 },
      alpha: { start: 1, end: 0.1 },
      tint: 0xffffff,
      blendMode: 'ADD',
      angle: { min: 0, max: 360 },
    });
    particles.setDepth(10);
    this.time.delayedCall(500, () => particles.destroy());
  }

  update() {
    // No continuous movement required; logic handled via events
  }
}
