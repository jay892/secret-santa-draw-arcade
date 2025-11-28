import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Phaser from 'phaser';
import { decodePayload, SecretSantaPayload } from '../../utils/encoding';
import { SantaMazeGame } from '../../game/SantaMazeGame';
import { ReindeerDeliveryGame } from '../../game/ReindeerDeliveryGame';
import { StockingMatchGame } from '../../game/StockingMatchGame';
import { GiftStackingGame } from '../../game/GiftStackingGame';
import { SnowballSlingshotGame } from '../../game/SnowballSlingshotGame';
import logo from '../../logo.png';

type GameState = 'intro' | 'playing' | 'completed';

type GameKey =
  | 'SantaMazeGame'
  | 'ReindeerDeliveryGame'
  | 'StockingMatchGame'
  | 'GiftStackingGame'
  | 'SnowballSlingshotGame';

export default function PlayPage() {
  const [searchParams] = useSearchParams();
  const [payload, setPayload] = useState<SecretSantaPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [gameState, setGameState] = useState<GameState>('intro');
  const [gameInstance, setGameInstance] = useState<Phaser.Game | null>(null);
  const [selectedGame, setSelectedGame] = useState<GameKey>('SantaMazeGame');
  const gameContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dataParam = searchParams.get('data');

    if (!dataParam) {
      setError('No data parameter found in URL');
      setLoading(false);
      return;
    }

    const decoded = decodePayload(dataParam);

    if (!decoded) {
      setError('Invalid or corrupted data. Please check your link.');
      setLoading(false);
      return;
    }

    setPayload(decoded);
    setLoading(false);
  }, [searchParams]);

  useEffect(() => {
    // Prevent body scroll when game is active
    if (gameState === 'playing') {
      document.body.classList.add('game-active');
    } else {
      document.body.classList.remove('game-active');
    }

    return () => {
      document.body.classList.remove('game-active');
      // Cleanup game on unmount
      if (gameInstance) {
        gameInstance.destroy(true);
        setGameInstance(null);
      }
    };
  }, [gameInstance, gameState]);

  const startGame = () => {
    if (!payload) return;
    setGameState('playing');
  };

  const handleGameComplete = useCallback(() => {
    setGameState('completed');

    // Cleanup game after a delay
    setTimeout(() => {
      setGameInstance(currentInstance => {
        if (currentInstance) {
          currentInstance.destroy(true);
        }
        return null;
      });
    }, 2000);
  }, []);

  // Pick a random game whenever we return to the intro screen
  useEffect(() => {
    if (gameState !== 'intro') return;
    const choices: GameKey[] = [
      'SantaMazeGame',
      'ReindeerDeliveryGame',
      'StockingMatchGame',
      'GiftStackingGame',
      'SnowballSlingshotGame',
    ];
    const randomChoice = choices[Math.floor(Math.random() * choices.length)];
    setSelectedGame(randomChoice);
  }, [gameState]);

  const challengeDetails = useMemo(() => {
    if (selectedGame === 'ReindeerDeliveryGame') {
      return {
        name: 'Reindeer Delivery Dash',
        mission:
          "Guide Santa's sleigh through the moonlit sky and collect 4 twinkling stars before time runs out.",
        steps: [
          'Dodge clouds and birds while scooping up drifting gifts for bonus sparkles.',
          'Each star you grab reveals a letter hint about your Secret Santa recipient.',
          'Snag all 4 stars in 60 seconds to complete the delivery and unlock the name!',
        ],
        controls:
          'Arrow Keys (↑/↓), W/S, or drag up and down on touch screens to steer the sleigh vertically.',
        duration: '60 seconds • Collect 4 stars',
      };
    }
    if (selectedGame === 'StockingMatchGame') {
      return {
        name: 'Stocking Fill Match',
        mission:
          'Flip cards to match holiday icons—ornaments, candy canes, bells, stockings, and snowflakes!',
        steps: [
          'Tap or click cards to reveal them, and remember their spots to find pairs.',
          'Each successful match sprinkles a new letter hint about your recipient.',
          'Match all 5 pairs before the timer hits zero to reveal the name!',
        ],
        controls: 'Tap / Click cards (touch & mouse friendly).',
        duration: '60 seconds • Match 5 pairs',
      };
    }
    if (selectedGame === 'GiftStackingGame') {
      return {
        name: 'Gift Stack Challenge',
        mission:
          'Balance falling gifts on the platform and stack them high! Each stable gift reveals a letter hint about your Secret Santa recipient.',
        steps: [
          'Use arrow keys or touch to move the platform left and right.',
          'Catch falling gifts and stack them neatly in the grid.',
          'Stack 6 gifts successfully before time runs out to unlock the name!',
        ],
        controls: 'Arrow Keys (←/→), A/D, or drag left/right on touch screens.',
        duration: '60 seconds • Stack 6 gifts',
      };
    }
    if (selectedGame === 'SnowballSlingshotGame') {
      return {
        name: 'Snowball Slingshot',
        mission:
          'Launch snowballs at the ornaments on the Christmas tree! Pull back the slingshot and aim carefully to knock down all 5 ornaments.',
        steps: [
          'Drag the snowball back to pull the slingshot—the further you pull, the more power!',
          'Release to fire and watch your snowball arc through the air.',
          'Each ornament you hit reveals a letter hint about your Secret Santa recipient.',
        ],
        controls: 'Drag snowball back and release to fire (touch & mouse friendly).',
        duration: '60 seconds • Hit 5 ornaments',
      };
    }
    return {
      name: 'Santa Maze',
      mission:
        'Navigate the peppermint maze, collect 3 magical ornaments, and unlock the glowing present to reveal your Secret Santa.',
      steps: [
        'Each ornament you find adds a letter hint to help guess the recipient.',
        'Avoid the candy walls and stay on the path as you search for ornaments.',
        'Once you have all 3, dash to the shimmering present before the timer hits zero!',
      ],
      controls: 'Arrow Keys, WASD, or Touch/Swipe to move around the maze.',
      duration: '60 seconds • Collect 3 ornaments',
    };
  }, [selectedGame]);

  // Initialize game when container is ready
  useEffect(() => {
    if (gameState !== 'playing' || !payload || gameInstance || !selectedGame)
      return;
    if (!gameContainerRef.current) return;

    const container = gameContainerRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // Small delay to ensure container is fully rendered
    const initGame = () => {
      if (!gameContainerRef.current) return;

      // Create Phaser game
      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: width,
        height: height,
        parent: container,
        backgroundColor: '#030c1c',
        physics: {
          default: 'arcade',
          arcade: {
            gravity: { x: 0, y: 0 },
            debug: false,
          },
        },
        scene: [
          SantaMazeGame,
          ReindeerDeliveryGame,
          StockingMatchGame,
          GiftStackingGame,
          SnowballSlingshotGame,
        ],
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
          width: width,
          height: height,
        },
        render: {
          pixelArt: true,
          antialias: false,
          roundPixels: true,
        },
      };

      const game = new Phaser.Game(config);

      // Start the game scene with recipient data
      game.scene.start(selectedGame, {
        recipient: payload.r,
        onComplete: handleGameComplete,
      });

      setGameInstance(game);
    };

    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      setTimeout(initGame, 100);
    });
  }, [gameState, payload, gameInstance, handleGameComplete, selectedGame]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (gameInstance && gameContainerRef.current) {
        const width = gameContainerRef.current.clientWidth;
        const height = gameContainerRef.current.clientHeight;
        if (width > 0 && height > 0) {
          gameInstance.scale.resize(width, height);
        }
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [gameInstance]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="pixel-frame text-center">
          <p className="text-xs uppercase">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="pixel-frame max-w-md w-full text-center">
          <h1 className="text-sm md:text-base mb-4 uppercase">❌ Error</h1>
          <p className="text-xs mb-6 uppercase">{error}</p>
          <Link to="/" className="pixel-button inline-block">
            Go Back
          </Link>
        </div>
      </div>
    );
  }

  if (!payload) {
    return null;
  }

  if (gameState === 'completed') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="pixel-frame pixel-frame-dark max-w-md w-full text-center">
          <h1 className="text-base md:text-lg mb-6 uppercase text-white">
            🎄 Secret Santa Revealed! 🎄
          </h1>
          <div className="border-6 border-yellow-400 p-6 bg-black mb-6">
            <p className="text-xs text-white/80 mb-3 uppercase">
              You are Secret Santa for:
            </p>
            <p className="text-xl md:text-2xl text-yellow-400 font-bold uppercase mb-4">
              {payload.r}
            </p>
            <p className="text-xs text-white/60 uppercase">
              Event: {payload.t}
            </p>
          </div>
          <div className="space-y-3">
            <Link
              to="/"
              className="pixel-button pixel-button-christmas inline-block w-full"
            >
              Create New Event
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleExitGame = () => {
    if (gameInstance) {
      gameInstance.destroy(true);
      setGameInstance(null);
    }
    setGameState('intro');
  };

  if (gameState === 'playing') {
    return (
      <div
        className="fixed inset-0 w-screen h-screen bg-black"
        style={{ zIndex: 9999 }}
      >
        <button
          onClick={handleExitGame}
          className="fixed top-2 right-2 pixel-button pixel-button-secondary text-xs px-3 py-2"
          style={{ zIndex: 10000, position: 'fixed' }}
        >
          Exit
        </button>
        <div
          ref={gameContainerRef}
          className="w-full h-full"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 pb-8">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <img
            src={logo}
            alt="Secret Santa"
            className="mx-auto"
            style={{
              maxWidth: '150px',
              width: '100%',
              height: 'auto',
              border: '5px solid #fff',
              display: 'block',
            }}
          />
        </div>

        {/* Event Info */}
        <div className="pixel-frame mb-4">
          <div className="">
            <h3 className="text-xs md:text-sm font-bold uppercase text-center">
              {payload.t}
            </h3>
            {payload.d && (
              <p className="mt-2 text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">
                {payload.d}
              </p>
            )}
          </div>
        </div>

        {/* Game Explanation */}
        <div className="pixel-frame mb-4">
          <h2 className="text-xs mb-3 text-center uppercase font-bold">
            Play to Unlock
          </h2>
          <div className="space-y-3 text-xs text-gray-700 leading-relaxed">
            <div className="text-center">
              <p className="text-[11px] uppercase tracking-wide text-gray-500 mb-1">
                Today’s Challenge
              </p>
              <p className="text-sm font-bold uppercase text-green-700">
                {challengeDetails.name}
              </p>
            </div>
            <p>
              <strong className="uppercase">Your mission:</strong>{' '}
              {challengeDetails.mission}
            </p>
            <ul className="list-disc list-inside space-y-1">
              {challengeDetails.steps.map(step => (
                <li key={step}>{step}</li>
              ))}
            </ul>
            <p className="text-[11px] font-semibold uppercase text-gray-600">
              {challengeDetails.duration}
            </p>
            <div className="mt-4 pt-3 border-t-2 border-gray-300">
              <p className="text-xs uppercase font-bold mb-2">Controls:</p>
              <p className="text-xs">{challengeDetails.controls}</p>
            </div>
          </div>
        </div>

        {/* Start Game Button */}
        <div className="text-center mb-4">
          <button
            onClick={startGame}
            className="pixel-button pixel-button-christmas w-full text-sm md:text-base py-4"
          >
            Start Game
          </button>
        </div>

        {/* Back Button */}
        <div className="text-center">
          <Link to="/" className="pixel-button block w-full text-xs">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
