import Phaser from 'phaser';

export interface GameConfig {
  recipient: string;
}

const TILE_SIZE = 48;
const PIXEL_SIZE = 4;

type PixelMatrix = string[];

const drawPixelTexture = (
  scene: Phaser.Scene,
  key: string,
  matrix: PixelMatrix,
  palette: Record<string, number>,
  pixelSize = PIXEL_SIZE
) => {
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

const SANTA_MATRIX: PixelMatrix = [
  '..............',
  '.....RRRR.....',
  '....RRRRRR....',
  '....RRRRRR....',
  '.....RRRR.....',
  '....WWWWWW....',
  '....WF..FW....',
  '...WFFAAFFW...',
  '...WFAAAAFW...',
  '...WFAAAAFW...',
  '....WAAAAW....',
  '.....AAAA.....',
  '...GGGGGGGG...',
  '..GGGGGGGGGG..',
  '..GGGGGGGGGG..',
  '..GGGYYGGGGG..',
  '...GGGGGGGG...',
  '....G....G....',
  '....G....G....',
  '....T....T....',
  '....T....T....',
  '....T....T....',
];

const SANTA_PALETTE: Record<string, number> = {
  R: 0xd7263d,
  W: 0xfff7e6,
  F: 0xffd9b0,
  A: 0xffc092,
  G: 0x0d8c5d,
  Y: 0xffd166,
  T: 0x382411,
};

const CANDY_WALL_MATRIX: PixelMatrix = [
  'RRRRRRRRRRRR',
  'RWWRRWWRRWWR',
  'RRRRRRRRRRRR',
  'RWWRRWWRRWWR',
  'RRRRRRRRRRRR',
  'RWWRRWWRRWWR',
  'RRRRRRRRRRRR',
  'RWWRRWWRRWWR',
];

const CANDY_WALL_PALETTE: Record<string, number> = {
  R: 0xbd0f2b,
  W: 0xfff3f0,
};

const ORNAMENT_MATRIX: PixelMatrix = [
  '....TTTT....',
  '...TTTTTT...',
  '..TTTTTTTT..',
  '.TTTTTTTTTT.',
  '.TTTTTTTTTT.',
  '..TTTTTTTT..',
  '...TTTTTT...',
  '....TTTT....',
  '.....HH.....',
  '.....HH.....',
];

const PRESENT_MATRIX: PixelMatrix = [
  '.BBBBBBBBBB.',
  'BBBBBBBBBBBB',
  'BBBBBBBBBBBB',
  'BBYYBBYYBBYB',
  'BBBBBBBBBBBB',
  'BBBBBBBBBBBB',
  'BBBBBBBBBBBB',
  'BBYYBBYYBBYB',
  'BBBBBBBBBBBB',
  'BBBBBBBBBBBB',
  'BBBBBBBBBBBB',
  '.BBBBBBBBBB.',
];

const PRESENT_PALETTE: Record<string, number> = {
  B: 0x3b6cfb,
  Y: 0xffd166,
};

const SPARKLE_MATRIX: PixelMatrix = [
  '....S....',
  '...SSS...',
  '..SSSSS..',
  '.SSSSSSS.',
  'SSSSSSSSS',
  '.SSSSSSS.',
  '..SSSSS..',
  '...SSS...',
  '....S....',
];

const SPARKLE_PALETTE: Record<string, number> = {
  S: 0xffffff,
};

interface MazeCell {
  x: number;
  y: number;
}

interface MazeData {
  grid: number[][];
  start: MazeCell;
  goal: MazeCell;
  pathCells: MazeCell[];
}

const toWorld = (cell: MazeCell) => ({
  x: cell.x * TILE_SIZE + TILE_SIZE / 2,
  y: cell.y * TILE_SIZE + TILE_SIZE / 2,
});

const shuffle = <T>(items: T[]): T[] =>
  Phaser.Utils.Array.Shuffle(items.slice());

// Check if two cells are connected via paths
const isConnected = (
  grid: number[][],
  start: MazeCell,
  target: MazeCell,
  width: number,
  height: number
): boolean => {
  const visited = new Set<string>();
  const queue: MazeCell[] = [start];
  visited.add(`${start.x},${start.y}`);

  while (queue.length > 0) {
    const current = queue.shift()!;

    if (current.x === target.x && current.y === target.y) {
      return true;
    }

    const directions = [
      { x: 0, y: -1 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: -1, y: 0 },
    ];

    for (const dir of directions) {
      const nx = current.x + dir.x;
      const ny = current.y + dir.y;
      const key = `${nx},${ny}`;

      if (
        nx >= 0 &&
        nx < width &&
        ny >= 0 &&
        ny < height &&
        grid[ny][nx] === 1 &&
        !visited.has(key)
      ) {
        visited.add(key);
        queue.push({ x: nx, y: ny });
      }
    }
  }

  return false;
};

const generateMaze = (width: number, height: number): MazeData => {
  // Initialize all cells as walls (0 = wall, 1 = path)
  const grid: number[][] = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => 0)
  );

  // Ensure borders are always walls (single cell thick)
  for (let y = 0; y < height; y++) {
    grid[y][0] = 0; // Left border
    grid[y][width - 1] = 0; // Right border
  }
  for (let x = 0; x < width; x++) {
    grid[0][x] = 0; // Top border
    grid[height - 1][x] = 0; // Bottom border
  }

  const start: MazeCell = { x: 1, y: 1 };
  const goal: MazeCell = { x: width - 2, y: height - 2 };

  const carve = (x: number, y: number) => {
    // Never carve border cells
    if (x <= 0 || y <= 0 || x >= width - 1 || y >= height - 1) {
      return;
    }

    grid[y][x] = 1;
    const directions = shuffle([
      { x: 0, y: -1 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: -1, y: 0 },
    ]);

    directions.forEach(dir => {
      const nx = x + dir.x * 2;
      const ny = y + dir.y * 2;
      // Ensure we never carve into borders
      if (nx <= 0 || ny <= 0 || nx >= width - 1 || ny >= height - 1) {
        return;
      }
      if (grid[ny][nx] === 0) {
        grid[y + dir.y][x + dir.x] = 1;
        carve(nx, ny);
      }
    });
  };

  carve(start.x, start.y);

  // Ensure goal is accessible - carve a path to it if needed
  if (goal.x > 0 && goal.x < width - 1 && goal.y > 0 && goal.y < height - 1) {
    grid[goal.y][goal.x] = 1;

    // Ensure goal has at least one connection
    const goalDirs = [
      { x: 0, y: -1 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: -1, y: 0 },
    ];

    let hasConnection = false;
    for (const dir of goalDirs) {
      const nx = goal.x + dir.x;
      const ny = goal.y + dir.y;
      if (
        nx > 0 &&
        nx < width - 1 &&
        ny > 0 &&
        ny < height - 1 &&
        grid[ny][nx] === 1
      ) {
        hasConnection = true;
        break;
      }
    }

    // If goal is isolated, connect it to nearest path
    if (!hasConnection) {
      for (const dir of shuffle(goalDirs)) {
        const nx = goal.x + dir.x;
        const ny = goal.y + dir.y;
        if (nx > 0 && nx < width - 1 && ny > 0 && ny < height - 1) {
          grid[ny][nx] = 1;
          break;
        }
      }
    }
  }

  // Add some extra connections to improve flow and aesthetics
  // Connect some dead ends to nearby paths
  for (let attempt = 0; attempt < 5; attempt++) {
    const y = Phaser.Math.Between(2, height - 3);
    const x = Phaser.Math.Between(2, width - 3);

    if (grid[y][x] === 0) {
      // Count adjacent paths
      let pathCount = 0;
      const dirs = [
        { x: 0, y: -1 },
        { x: 1, y: 0 },
        { x: 0, y: 1 },
        { x: -1, y: 0 },
      ];

      for (const dir of dirs) {
        const nx = x + dir.x;
        const ny = y + dir.y;
        if (grid[ny] && grid[ny][nx] === 1) {
          pathCount++;
        }
      }

      // If wall has 2+ adjacent paths, sometimes convert it to path for better flow
      if (pathCount >= 2 && Math.random() < 0.3) {
        grid[y][x] = 1;
      }
    }
  }

  // Ensure borders remain walls (single cell thick)
  for (let y = 0; y < height; y++) {
    grid[y][0] = 0; // Left border
    grid[y][width - 1] = 0; // Right border
  }
  for (let x = 0; x < width; x++) {
    grid[0][x] = 0; // Top border
    grid[height - 1][x] = 0; // Bottom border
  }

  const pathCells: MazeCell[] = [];
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (grid[y][x] === 1) {
        pathCells.push({ x, y });
      }
    }
  }

  return { grid, start, goal, pathCells };
};

export class SantaMazeGame extends Phaser.Scene {
  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  private walls!: Phaser.Physics.Arcade.StaticGroup;
  private ornaments!: Phaser.Physics.Arcade.Group;
  private collectedOrnaments: number = 0;
  private totalOrnaments: number = 3;
  private letterHints: string[] = [];
  private availableLetters: string[] = [];
  private timerText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;
  private timeRemaining: number = 60;
  private timerEvent!: Phaser.Time.TimerEvent;
  private present!: Phaser.Physics.Arcade.Sprite | null;
  private mazeData!: MazeData;
  private mazeWidth: number = 0;
  private mazeHeight: number = 0;
  private recipient: string = '';
  private gameOver: boolean = false;
  private touchStartX: number = 0;
  private touchStartY: number = 0;
  private touchDirection: { x: number; y: number } = { x: 0, y: 0 };
  private gameConfigData!: GameConfig;

  constructor() {
    super({ key: 'SantaMazeGame' });
  }

  init(data: GameConfig) {
    this.gameConfigData = data;
    this.recipient = data.recipient;
  }

  create() {
    // Reset game state
    this.letterHints = [];
    this.availableLetters = this.getUniqueLetters();
    this.collectedOrnaments = 0;
    this.gameOver = false;

    // Calculate maze size based on screen
    const screenWidth = this.scale.width;
    const screenHeight = this.scale.height;

    // Calculate optimal maze size - UI overlays at bottom, use full height
    const availableHeight = screenHeight; // UI overlays, so use full height

    // Use a reasonable minimum and maximum for maze size
    const minCols = 15;
    const minRows = 11;
    const maxCols = 25;
    const maxRows = 18;

    this.mazeWidth = Phaser.Math.Clamp(
      Math.floor(screenWidth / TILE_SIZE) - 2,
      minCols,
      maxCols
    );
    this.mazeHeight = Phaser.Math.Clamp(
      Math.floor(availableHeight / TILE_SIZE) - 2,
      minRows,
      maxRows
    );

    // Set up physics world
    this.physics.world.setBounds(
      0,
      0,
      this.mazeWidth * TILE_SIZE,
      this.mazeHeight * TILE_SIZE
    );

    // Set background and camera
    this.cameras.main.setBackgroundColor('#030c1c');
    this.cameras.main.roundPixels = true;

    // Calculate zoom to fit maze on screen (especially for mobile)
    const mazeWorldWidth = this.mazeWidth * TILE_SIZE;
    const mazeWorldHeight = this.mazeHeight * TILE_SIZE;
    const viewWidth = this.scale.width;
    const viewHeight = this.scale.height;

    // Use full screen - UI overlays at bottom
    const gameAreaHeight = viewHeight; // UI overlays, so use full height

    // Calculate zoom needed to fit maze
    const zoomX = viewWidth / mazeWorldWidth;
    const zoomY = gameAreaHeight / mazeWorldHeight;
    const zoom = Math.min(zoomX, zoomY, 1.0); // Don't zoom in, only out

    // Set camera zoom
    this.cameras.main.setZoom(zoom);

    // Center the camera on the maze world
    this.cameras.main.centerOn(mazeWorldWidth / 2, mazeWorldHeight / 2);

    // Build textures
    this.buildTextures();

    // Draw backdrop
    this.drawBackdrop();

    // Generate maze
    this.mazeData = generateMaze(this.mazeWidth, this.mazeHeight);

    // Choose random present location from available path cells (excluding start)
    const availablePresentCells = this.mazeData.pathCells.filter(
      cell =>
        cell.x !== this.mazeData.start.x || cell.y !== this.mazeData.start.y
    );
    if (availablePresentCells.length > 0) {
      const randomPresentCell = shuffle(availablePresentCells)[0];
      this.mazeData.goal = randomPresentCell;
    }

    // Ensure present area is accessible - clear surrounding cells (but not borders)
    const presentCell = this.mazeData.goal;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = presentCell.x + dx;
        const ny = presentCell.y + dy;
        // Don't clear border cells (keep them as walls)
        if (
          nx > 0 &&
          nx < this.mazeWidth - 1 &&
          ny > 0 &&
          ny < this.mazeHeight - 1
        ) {
          this.mazeData.grid[ny][nx] = 1;
          // Add to pathCells if not already there
          const cell = { x: nx, y: ny };
          if (!this.mazeData.pathCells.some(c => c.x === nx && c.y === ny)) {
            this.mazeData.pathCells.push(cell);
          }
        }
      }
    }

    // Re-enforce borders after clearing present area (single cell thick)
    for (let y = 0; y < this.mazeHeight; y++) {
      this.mazeData.grid[y][0] = 0;
      this.mazeData.grid[y][this.mazeWidth - 1] = 0;
    }
    for (let x = 0; x < this.mazeWidth; x++) {
      this.mazeData.grid[0][x] = 0;
      this.mazeData.grid[this.mazeHeight - 1][x] = 0;
    }

    this.drawMaze();

    // Create twinkles
    this.createTwinkles();

    // Create player
    this.createPlayer();

    // Spawn collectibles
    this.spawnCollectibles();

    // Create controls
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasdKeys = this.input.keyboard!.addKeys('W,S,A,D') as {
      W: Phaser.Input.Keyboard.Key;
      A: Phaser.Input.Keyboard.Key;
      S: Phaser.Input.Keyboard.Key;
      D: Phaser.Input.Keyboard.Key;
    };

    // Add touch controls for mobile
    this.input.addPointer(1);
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.touchStartX = pointer.x;
      this.touchStartY = pointer.y;
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.isDown) {
        const deltaX = pointer.x - this.touchStartX;
        const deltaY = pointer.y - this.touchStartY;
        const threshold = 10;

        if (Math.abs(deltaX) > threshold || Math.abs(deltaY) > threshold) {
          if (Math.abs(deltaX) > Math.abs(deltaY)) {
            this.touchDirection.x = deltaX > 0 ? 1 : -1;
            this.touchDirection.y = 0;
          } else {
            this.touchDirection.x = 0;
            this.touchDirection.y = deltaY > 0 ? 1 : -1;
          }
        }
      }
    });

    this.input.on('pointerup', () => {
      this.touchDirection.x = 0;
      this.touchDirection.y = 0;
    });

    // Create UI
    this.createUI();

    // Start timer
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      callback: this.updateTimer,
      callbackScope: this,
      loop: true,
    });
  }

  private buildTextures() {
    if (!this.textures.exists('candy-wall')) {
      drawPixelTexture(
        this,
        'candy-wall',
        CANDY_WALL_MATRIX,
        CANDY_WALL_PALETTE
      );
    }

    if (!this.textures.exists('santa')) {
      drawPixelTexture(this, 'santa', SANTA_MATRIX, SANTA_PALETTE);
    }

    const ornamentColors = [0xff5666, 0x63e6be, 0xffdd57];
    const ornamentKeys = [
      'ornament-crimson',
      'ornament-emerald',
      'ornament-golden',
    ];
    ornamentKeys.forEach((key, index) => {
      if (!this.textures.exists(key)) {
        drawPixelTexture(this, key, ORNAMENT_MATRIX, {
          T: ornamentColors[index % ornamentColors.length],
          H: 0xfff7e6,
        });
      }
    });

    if (!this.textures.exists('present-locked')) {
      drawPixelTexture(this, 'present-locked', PRESENT_MATRIX, PRESENT_PALETTE);
    }

    if (!this.textures.exists('sparkle')) {
      drawPixelTexture(this, 'sparkle', SPARKLE_MATRIX, SPARKLE_PALETTE, 2);
    }
  }

  private drawBackdrop() {
    const width = this.mazeWidth * TILE_SIZE + 20;
    const height = this.mazeHeight * TILE_SIZE + 20;
    const bg = this.add.graphics();
    bg.fillStyle(0x041026, 1);
    bg.fillRect(-10, -10, width, height);
    for (let i = 0; i < 120; i += 1) {
      const size = Phaser.Math.Between(1, 2);
      const x = Phaser.Math.Between(0, this.mazeWidth * TILE_SIZE);
      const y = Phaser.Math.Between(0, this.mazeHeight * TILE_SIZE);
      const alpha = Phaser.Math.FloatBetween(0.3, 0.9);
      bg.fillStyle(0xffffff, alpha);
      bg.fillRect(x, y, size, size);
    }
    bg.setDepth(-5);
  }

  private drawMaze() {
    const floor = this.add.graphics();
    floor.fillStyle(0x0a1426, 1);
    floor.fillRect(
      0,
      0,
      this.mazeWidth * TILE_SIZE,
      this.mazeHeight * TILE_SIZE
    );
    floor.lineStyle(2, 0x101d38, 0.4);
    for (let x = 0; x <= this.mazeWidth * TILE_SIZE; x += TILE_SIZE) {
      floor.lineBetween(x, 0, x, this.mazeHeight * TILE_SIZE);
    }
    for (let y = 0; y <= this.mazeHeight * TILE_SIZE; y += TILE_SIZE) {
      floor.lineBetween(0, y, this.mazeWidth * TILE_SIZE, y);
    }
    floor.setDepth(-3);

    this.walls = this.physics.add.staticGroup();
    // Draw walls - only draw interior walls, borders are handled separately
    this.mazeData.grid.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell === 0) {
          // Only draw walls for interior cells (not borders) to avoid double-thick borders
          // Borders will be drawn as a single layer
          const isBorder =
            x === 0 ||
            x === this.mazeWidth - 1 ||
            y === 0 ||
            y === this.mazeHeight - 1;
          if (!isBorder) {
            const { x: wx, y: wy } = toWorld({ x, y });
            const wall = this.walls.create(wx, wy, 'candy-wall');
            wall.setDepth(-1);
          }
        }
      });
    });

    // Draw border walls as a single layer
    // Top and bottom borders
    for (let x = 0; x < this.mazeWidth; x++) {
      if (this.mazeData.grid[0][x] === 0) {
        const { x: wx, y: wy } = toWorld({ x, y: 0 });
        const wall = this.walls.create(wx, wy, 'candy-wall');
        wall.setDepth(-1);
      }
      if (this.mazeData.grid[this.mazeHeight - 1][x] === 0) {
        const { x: wx, y: wy } = toWorld({ x, y: this.mazeHeight - 1 });
        const wall = this.walls.create(wx, wy, 'candy-wall');
        wall.setDepth(-1);
      }
    }
    // Left and right borders (excluding corners already drawn)
    for (let y = 1; y < this.mazeHeight - 1; y++) {
      if (this.mazeData.grid[y][0] === 0) {
        const { x: wx, y: wy } = toWorld({ x: 0, y });
        const wall = this.walls.create(wx, wy, 'candy-wall');
        wall.setDepth(-1);
      }
      if (this.mazeData.grid[y][this.mazeWidth - 1] === 0) {
        const { x: wx, y: wy } = toWorld({ x: this.mazeWidth - 1, y });
        const wall = this.walls.create(wx, wy, 'candy-wall');
        wall.setDepth(-1);
      }
    }
  }

  private createTwinkles() {
    const particles = this.add.particles(0, 0, 'sparkle', {
      x: { min: 0, max: this.mazeWidth * TILE_SIZE },
      y: { min: 0, max: this.mazeHeight * TILE_SIZE },
      lifespan: 4000,
      speedY: { min: 12, max: 30 },
      scale: { min: 0.2, max: 0.5 },
      alpha: { start: 0.7, end: 0 },
      quantity: 1,
      blendMode: 'ADD',
    });
    particles.setDepth(-2);
  }

  private createPlayer() {
    const startPos = toWorld(this.mazeData.start);
    this.player = this.physics.add.sprite(startPos.x, startPos.y, 'santa');
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(2);
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setSize(PIXEL_SIZE * 6, PIXEL_SIZE * 7);
    body.setOffset(PIXEL_SIZE * 4, PIXEL_SIZE * 9);
    body.setMaxVelocity(220, 220);
    this.physics.add.collider(this.player, this.walls);
  }

  private spawnCollectibles() {
    // Get cells that are accessible from start and have good spacing
    const accessibleCells = this.mazeData.pathCells.filter(cell => {
      // Must be different from start
      if (
        cell.x === this.mazeData.start.x &&
        cell.y === this.mazeData.start.y
      ) {
        return false;
      }
      // Must be different from present location
      if (cell.x === this.mazeData.goal.x && cell.y === this.mazeData.goal.y) {
        return false;
      }
      // Check if accessible from start
      return isConnected(
        this.mazeData.grid,
        this.mazeData.start,
        cell,
        this.mazeWidth,
        this.mazeHeight
      );
    });

    // Shuffle and select ornament positions with good spacing
    const shuffledCells = shuffle(accessibleCells);
    const ornamentPositions: MazeCell[] = [];
    const minDistance = 4; // Minimum Manhattan distance between ornaments

    for (const cell of shuffledCells) {
      if (ornamentPositions.length >= this.totalOrnaments) break;

      // Check if this cell is far enough from already placed ornaments
      const tooClose = ornamentPositions.some(pos => {
        const dist = Math.abs(cell.x - pos.x) + Math.abs(cell.y - pos.y);
        return dist < minDistance;
      });

      // Also check distance from start
      const startDist =
        Math.abs(cell.x - this.mazeData.start.x) +
        Math.abs(cell.y - this.mazeData.start.y);
      if (!tooClose && startDist >= 3) {
        ornamentPositions.push(cell);
      }
    }

    // If we don't have enough positions, fill with remaining accessible cells
    while (
      ornamentPositions.length < this.totalOrnaments &&
      shuffledCells.length > ornamentPositions.length
    ) {
      const remaining = shuffledCells.filter(
        c => !ornamentPositions.some(p => p.x === c.x && p.y === c.y)
      );
      if (remaining.length > 0) {
        ornamentPositions.push(remaining[0]);
      } else {
        break;
      }
    }

    this.ornaments = this.physics.add.group();
    const ornamentKeys = [
      'ornament-crimson',
      'ornament-emerald',
      'ornament-golden',
    ];

    for (
      let i = 0;
      i < this.totalOrnaments && i < ornamentPositions.length;
      i += 1
    ) {
      const cell = ornamentPositions[i];
      const { x, y } = toWorld(cell);
      const textureKey = ornamentKeys[i % ornamentKeys.length];
      const ornament = this.physics.add.sprite(x, y, textureKey);
      (ornament.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
      ornament.setDepth(1);
      this.ornaments.add(ornament);
    }

    this.physics.add.overlap(
      this.player,
      this.ornaments,
      this.collectOrnament,
      undefined,
      this
    );

    // Verify present is accessible
    const presentAccessible = isConnected(
      this.mazeData.grid,
      this.mazeData.start,
      this.mazeData.goal,
      this.mazeWidth,
      this.mazeHeight
    );

    if (!presentAccessible) {
      // Find an accessible cell for the present
      const accessiblePresentCells = accessibleCells.filter(cell => {
        const dist =
          Math.abs(cell.x - this.mazeData.start.x) +
          Math.abs(cell.y - this.mazeData.start.y);
        return dist > 5; // Far from start
      });
      if (accessiblePresentCells.length > 0) {
        this.mazeData.goal = shuffle(accessiblePresentCells)[0];
      }
    }

    const goalPos = toWorld(this.mazeData.goal);
    this.present = this.physics.add.sprite(
      goalPos.x,
      goalPos.y,
      'present-locked'
    );
    (this.present.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    this.present.setImmovable(true);
    this.present.setAlpha(0.7);
    this.present.setTint(0x8aa2ff);
    this.present.setDepth(1);

    this.physics.add.collider(this.player, this.present);
    this.physics.add.overlap(
      this.player,
      this.present,
      this.touchPresent,
      undefined,
      this
    );
  }

  private collectOrnament: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (
    _player,
    ornament
  ) => {
    const sprite = ornament as Phaser.Physics.Arcade.Sprite;
    if (this.gameOver || !sprite.active) {
      return;
    }

    sprite.disableBody(true, true);

    // Get random letter hint
    const letter = this.getRandomLetter();
    this.letterHints.push(letter);
    this.collectedOrnaments++;

    // Update hint display
    const hintsDisplay = this.letterHints.join(' ');
    this.hintText.setText(`Hints: ${hintsDisplay}`);

    // Update ornaments counter
    this.ornamentsText.setText(
      `${this.collectedOrnaments}/${this.totalOrnaments} 🎁`
    );

    // Emit sparkles
    this.emitSparkles(sprite.x, sprite.y);

    // If all collected, unlock present
    if (this.collectedOrnaments >= this.totalOrnaments && this.present) {
      this.present.clearTint();
      this.present.setAlpha(1);
      this.tweens.add({
        targets: this.present,
        scale: { from: 1, to: 1.2 },
        yoyo: true,
        repeat: -1,
        duration: 600,
      });
    }
  };

  private touchPresent = () => {
    if (this.gameOver) {
      return;
    }
    if (this.collectedOrnaments < this.totalOrnaments) {
      this.add
        .tween({
          targets: this.present,
          alpha: { from: 1, to: 0.4 },
          duration: 100,
          ease: 'Sine.easeInOut',
          yoyo: true,
          repeat: 2,
        })
        .once('complete', () => {
          if (this.present) {
            this.present.setAlpha(1);
          }
        });
      return;
    }

    this.handleWin();
  };

  private emitSparkles(x: number, y: number, scale = 1) {
    const particles = this.add.particles(x, y, 'sparkle', {
      lifespan: 500,
      speed: { min: 50, max: 120 },
      quantity: 8,
      scale: { start: 0.5 * scale, end: 0 },
      blendMode: 'ADD',
      angle: { min: 0, max: 360 },
    });
    particles.setDepth(3);
    this.time.delayedCall(600, () => particles.destroy());
  }

  private ornamentsText!: Phaser.GameObjects.Text;

  private createUI() {
    // Get current zoom for UI scaling
    const zoom = this.cameras.main.zoom;
    const uiScale = 1 / zoom; // Scale UI inversely to zoom so it stays readable

    // Position UI horizontally at the absolute top edge - overlay the top wall
    // For elements with scrollFactor(0), coordinates are in screen space
    // Use a small negative offset to ensure it overlays the wall completely
    const topY = -2; // Small negative to overlay the top wall edge
    const startX = 12;
    const spacing = 24; // Space between elements

    // Timer text (left side, top edge)
    this.timerText = this.add.text(
      0,
      0, // Will be repositioned
      `Time: ${this.timeRemaining}`,
      {
        fontSize: `${20 * uiScale}px`,
        fontFamily: 'monospace',
        color: '#ffffff',
        backgroundColor: '#000000',
        padding: { x: 10 * uiScale, y: 8 * uiScale },
        stroke: '#000000',
        strokeThickness: 2 * uiScale,
      }
    );
    this.timerText.setScrollFactor(0);
    this.timerText.setScale(zoom);
    this.timerText.setDepth(10000); // Very high depth to ensure it's on top
    this.timerText.setOrigin(0, 0); // Anchor to top-left
    // Position at absolute top, slightly negative to overlay wall
    this.timerText.x = startX;
    this.timerText.y = topY;

    // Calculate next position using displayWidth (accounts for scale)
    const ornamentsX = startX + this.timerText.displayWidth + spacing;

    // Ornaments collected (middle, top edge)
    this.ornamentsText = this.add.text(
      0,
      0, // Will be repositioned
      `Ornaments: ${this.collectedOrnaments}/${this.totalOrnaments} 🎁`,
      {
        fontSize: `${18 * uiScale}px`,
        fontFamily: 'monospace',
        color: '#ffffff',
        backgroundColor: '#000000',
        padding: { x: 10 * uiScale, y: 8 * uiScale },
        stroke: '#000000',
        strokeThickness: 2 * uiScale,
      }
    );
    this.ornamentsText.setScrollFactor(0);
    this.ornamentsText.setScale(zoom);
    this.ornamentsText.setDepth(10000);
    this.ornamentsText.setOrigin(0, 0);
    // Position at absolute top
    this.ornamentsText.x = ornamentsX;
    this.ornamentsText.y = topY;

    // Calculate next position using displayWidth
    const hintsX = ornamentsX + this.ornamentsText.displayWidth + spacing;

    // Hint text (right side, top edge)
    this.hintText = this.add.text(0, 0, 'Hints: ', {
      fontSize: `${16 * uiScale}px`,
      fontFamily: 'monospace',
      color: '#ffff00',
      backgroundColor: '#000000',
      padding: { x: 10 * uiScale, y: 8 * uiScale },
      stroke: '#000000',
      strokeThickness: 2 * uiScale,
    });
    this.hintText.setScrollFactor(0);
    this.hintText.setScale(zoom);
    this.hintText.setDepth(10000);
    this.hintText.setOrigin(0, 0);
    // Position at absolute top
    this.hintText.x = hintsX;
    this.hintText.y = topY;
  }

  private updateTimer() {
    if (this.gameOver) return;

    this.timeRemaining--;
    this.timerText.setText(`Time: ${this.timeRemaining}`);

    if (this.timeRemaining <= 0) {
      this.gameOver = true;
      this.showGameOver(false);
    }
  }

  private getUniqueLetters(): string[] {
    if (!this.recipient) return [];
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
    const index = Math.floor(Math.random() * this.availableLetters.length);
    const letter = this.availableLetters[index];
    this.availableLetters.splice(index, 1);
    return letter;
  }

  private handleWin() {
    if (this.gameOver) {
      return;
    }
    this.gameOver = true;
    this.timerEvent.remove();
    this.physics.pause();
    this.emitSparkles(this.present!.x, this.present!.y, 1.4);
    this.showGameOver(true);
  }

  private showGameOver(success: boolean) {
    const zoom = this.cameras.main.zoom;
    const uiScale = 1 / zoom; // Scale UI inversely to zoom so it stays readable

    // Create festive overlay with Christmas colors
    const overlay = this.add.rectangle(
      this.scale.width / 2,
      this.scale.height / 2,
      this.scale.width,
      this.scale.height,
      0x030c1c,
      0.9
    );
    overlay.setScrollFactor(0);
    overlay.setDepth(10000);

    // Add sparkles across the screen for festive effect
    for (let i = 0; i < 20; i++) {
      const sparkleX = Phaser.Math.Between(50, this.scale.width - 50);
      const sparkleY = Phaser.Math.Between(50, this.scale.height - 50);
      this.emitSparkles(sparkleX, sparkleY, 0.8);
    }

    if (success) {
      // Christmas success message with festive colors
      const successText = this.add.text(
        this.scale.width / 2,
        this.scale.height / 2 - 100,
        'MERRY CHRISTMAS!',
        {
          fontSize: `${36 / zoom}px`,
          fontFamily: 'Courier New, monospace',
          color: '#0d8c5d', // Christmas green
          stroke: '#d7263d', // Christmas red
          strokeThickness: 6 * uiScale,
          shadow: {
            offsetX: 2 * uiScale,
            offsetY: 2 * uiScale,
            color: '#000000',
            blur: 4 * uiScale,
            stroke: true,
            fill: true,
          },
        }
      );
      successText.setOrigin(0.5);
      successText.setScrollFactor(0);
      successText.setScale(zoom);
      successText.setDepth(10001);

      // Animate the success text
      this.tweens.add({
        targets: successText,
        scale: zoom * 1.1,
        duration: 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      const recipientText = this.add.text(
        this.scale.width / 2,
        this.scale.height / 2 - 20,
        `YOU ARE SECRET SANTA FOR:\n${this.recipient.toUpperCase()}`,
        {
          fontSize: `${26 / zoom}px`,
          fontFamily: 'Courier New, monospace',
          color: '#ffd166', // Gold/yellow
          align: 'center',
          stroke: '#d7263d', // Red stroke
          strokeThickness: 5 * uiScale,
          shadow: {
            offsetX: 2 * uiScale,
            offsetY: 2 * uiScale,
            color: '#000000',
            blur: 4 * uiScale,
            stroke: true,
            fill: true,
          },
        }
      );
      recipientText.setOrigin(0.5);
      recipientText.setScrollFactor(0);
      recipientText.setScale(zoom);
      recipientText.setDepth(10001);

      // Animate recipient text
      this.tweens.add({
        targets: recipientText,
        alpha: 0.9,
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      // Festive replay button with Christmas colors
      const replayButton = this.add.rectangle(
        this.scale.width / 2,
        this.scale.height / 2 + 80,
        220 / zoom,
        60 / zoom,
        0xd7263d // Christmas red
      );
      replayButton.setScrollFactor(0);
      replayButton.setScale(zoom);
      replayButton.setDepth(10001);
      replayButton.setInteractive({ useHandCursor: true });
      replayButton.setStrokeStyle(4 * uiScale, 0x0d8c5d); // Green border

      const replayText = this.add.text(
        this.scale.width / 2,
        this.scale.height / 2 + 80,
        'PLAY AGAIN',
        {
          fontSize: `${22 / zoom}px`,
          fontFamily: 'Courier New, monospace',
          color: '#ffffff',
          stroke: '#000000',
          strokeThickness: 3 * uiScale,
        }
      );
      replayText.setOrigin(0.5);
      replayText.setScrollFactor(0);
      replayText.setScale(zoom);
      replayText.setDepth(10002);

      // Button interactions with Christmas colors
      replayButton.on('pointerover', () => {
        replayButton.setFillStyle(0xff4757); // Lighter red
        replayButton.setStrokeStyle(4 * uiScale, 0xffd166); // Gold border on hover
      });
      replayButton.on('pointerout', () => {
        replayButton.setFillStyle(0xd7263d); // Back to red
        replayButton.setStrokeStyle(4 * uiScale, 0x0d8c5d); // Green border
      });
      replayButton.on('pointerdown', () => {
        this.scene.restart(this.gameConfigData);
      });

      // Also allow keyboard R to replay
      this.input.keyboard!.once('keydown-R', () => {
        this.scene.restart(this.gameConfigData);
      });
    } else {
      // Failure message with Christmas theme
      const failText = this.add.text(
        this.scale.width / 2,
        this.scale.height / 2 - 50,
        "TIME'S UP!",
        {
          fontSize: `${36 / zoom}px`,
          fontFamily: 'Courier New, monospace',
          color: '#d7263d', // Christmas red
          stroke: '#000000',
          strokeThickness: 6 * uiScale,
          shadow: {
            offsetX: 2 * uiScale,
            offsetY: 2 * uiScale,
            color: '#000000',
            blur: 4 * uiScale,
            stroke: true,
            fill: true,
          },
        }
      );
      failText.setOrigin(0.5);
      failText.setScrollFactor(0);
      failText.setScale(zoom);
      failText.setDepth(10001);

      const retryText = this.add.text(
        this.scale.width / 2,
        this.scale.height / 2 + 20,
        'PRESS R TO TRY AGAIN',
        {
          fontSize: `${20 / zoom}px`,
          fontFamily: 'Courier New, monospace',
          color: '#ffd166', // Gold
          stroke: '#000000',
          strokeThickness: 3 * uiScale,
        }
      );
      retryText.setOrigin(0.5);
      retryText.setScrollFactor(0);
      retryText.setScale(zoom);
      retryText.setDepth(10001);

      // Add retry key
      this.input.keyboard!.once('keydown-R', () => {
        this.scene.restart(this.gameConfigData);
      });
    }
  }

  update() {
    if (!this.player || this.gameOver) {
      return;
    }

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const speed = 200;
    let dirX = 0;
    let dirY = 0;

    // Keyboard controls
    if (this.cursors.left?.isDown || this.wasdKeys.A.isDown) {
      dirX -= 1;
    }
    if (this.cursors.right?.isDown || this.wasdKeys.D.isDown) {
      dirX += 1;
    }
    if (this.cursors.up?.isDown || this.wasdKeys.W.isDown) {
      dirY -= 1;
    }
    if (this.cursors.down?.isDown || this.wasdKeys.S.isDown) {
      dirY += 1;
    }

    // Touch controls
    if (this.touchDirection.x !== 0 || this.touchDirection.y !== 0) {
      dirX = this.touchDirection.x;
      dirY = this.touchDirection.y;
    }

    const velocity = new Phaser.Math.Vector2(dirX, dirY);
    if (velocity.lengthSq() > 0) {
      velocity.normalize().scale(speed);
      body.setVelocity(velocity.x, velocity.y);
    } else {
      body.setVelocity(0, 0);
    }
  }
}
