// game.js

const { useState, useEffect, useCallback } = React;

const GameObject = ({ position, onClick, imageUrl }) => (
  <img
    src={imageUrl}
    style={{
      position: 'absolute',
      left: `${position.x}px`,
      top: `${position.y}px`,
      cursor: 'pointer',
      transition: 'all 0.3s ease',
    }}
    onClick={onClick}
    alt="Game Object"
  />
);

const ScorePanel = ({ score }) => (
  <div style={{
    position: 'absolute',
    top: 10,
    left: 10,
    fontSize: '24px',
    color: 'white',
    fontWeight: 'bold',
    zIndex: 1000, 
    textShadow: '2px 2px 4px rgba(0,0,0,0.5)', // Optional: add a text shadow for better visibility on varying backgrounds
  }}>
    Score: {score}
  </div>
);

const AboutModal = ({ isOpen, onClose, gameInfo }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 2000,
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '10px',
        maxWidth: '80%',
        maxHeight: '80%',
        overflow: 'auto',
      }}>
        <h2>About {gameInfo.name}</h2>
        <h3>Background Image</h3>
        <p dangerouslySetInnerHTML={{ __html: gameInfo.backgroundCredit }} />
        <h3>Object Image</h3>
        <p dangerouslySetInnerHTML={{ __html: gameInfo.objectCredit }} />
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

const MainMenu = ({ onStartGame, onPause, onResume, onShowTopScores, onQuit, onShowAbout, gameState }) => (
  <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 1000 }}>
    {gameState === 'menu' && <button onClick={onStartGame}>Start New Game</button>}
    {gameState === 'playing' && <button onClick={onPause}>Pause</button>}
    {gameState === 'paused' && <button onClick={onResume}>Resume</button>}
    <button onClick={onShowTopScores}>Top Scores</button>
    <button onClick={onShowAbout}>About</button>
    <button onClick={onQuit}>Quit</button>
  </div>
);



const Game = ({ config }) => {
  const [score, setScore] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [gameState, setGameState] = useState('menu');
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  const moveObject = useCallback(() => {
    const maxX = window.innerWidth - 100;  // Assuming object width is 100px
    const maxY = window.innerHeight - 150; // 100px for object height + 50px for ad banner
    setPosition({
      x: Math.random() * maxX,
      y: Math.random() * maxY + 50, // Add 50px to account for ad banner
    });
  }, []);

  useEffect(() => {
    if (gameState === 'playing') {
      const interval = setInterval(moveObject, config.moveInterval);
      return () => clearInterval(interval);
    }
  }, [gameState, moveObject, config.moveInterval]);

  const handleClick = () => {
    setScore(prevScore => prevScore + 1);
    moveObject();
  };

  const startGame = () => {
    setScore(0);
    setGameState('playing');
    moveObject();
  };

  const pauseGame = () => setGameState('paused');
  const resumeGame = () => setGameState('playing');
  const showTopScores = () => alert('Top Scores: Coming soon!');
  const quitGame = () => {
    setGameState('menu');
    setScore(0);
  };

  const showAbout = () => setIsAboutOpen(true);
  const closeAbout = () => setIsAboutOpen(false);

 return (
    <div style={{
      width: '100%',
      height: '100%',
      backgroundImage: `url(${config.backgroundUrl})`,
      backgroundSize: 'cover',
      position: 'relative',
    }}>
      <ScorePanel score={score} />
      <MainMenu
        onStartGame={startGame}
        onPause={pauseGame}
        onResume={resumeGame}
        onShowTopScores={showTopScores}
        onShowAbout={showAbout}
        onQuit={quitGame}
        gameState={gameState}
      />
      {gameState !== 'menu' && (
        <GameObject
          position={position}
          onClick={handleClick}
          imageUrl={config.objectUrl}
        />
      )}
      <AboutModal
        isOpen={isAboutOpen}
        onClose={closeAbout}
        gameInfo={{
          name: config.name,
          backgroundCredit: config.backgroundCredit,
          objectCredit: config.objectCredit,
        }}
      />
    </div>
  );
};

const games = {
  cosmicClicker: {
    name: "Cosmic Clicker",
    backgroundUrl: 'game_assets/space-background.jpg',
    backgroundCredit: 'Photo by <a href="https://unsplash.com/@andyjh07?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Andy Holmes</a> on <a href="https://unsplash.com/photos/milky-way-during-night-time-LUpDjlJv4_c?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Unsplash</a>',
    objectUrl: 'game_assets/planet1.jpg',
    objectCredit: 'Photo by <a href="https://unsplash.com/@simonppt?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">SIMON LEE</a> on <a href="https://unsplash.com/photos/a-picture-of-a-blue-object-on-a-blue-background-MzZ4WW3IT_U?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Unsplash</a>',
    moveInterval: 3000,
  },
  forestFriend: {
    name: "Forest Friend",
    backgroundUrl: 'game_assets/forest-background.jpg',
    backgroundCredit: 'Photo by <a href="https://unsplash.com/@howardbouchevereau?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Howard Bouchevereau</a> on <a href="https://unsplash.com/photos/a-forest-of-tall-trees-nifQzholGAc?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Unsplash</a>',
    objectUrl: 'game_assets/animal.jpg',
    objectCredit: 'Photo by <a href="https://unsplash.com/@greg_rosenke?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Greg Rosenke</a> on <a href="https://unsplash.com/photos/a-close-up-of-a-frog-_GpN4quSVjg?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Unsplash</a>',
    moveInterval: 2500,
  },
  balloonBopper: {
    name: "Balloon Bopper",
    backgroundUrl: 'game_assets/sky-background.jpg',
    backgroundCredit: 'Photo by <a href="https://unsplash.com/@thomasdupon_be?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Thomas Dupon</a> on <a href="https://unsplash.com/photos/white-clouds-and-blue-sky-during-daytime-KuuHp9HgCI0?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Unsplash</a>',
    objectUrl: 'game_assets/balloon.jpg',
    objectCredit: 'Photo by <a href="https://unsplash.com/@neonbrand?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Kenny Eliason</a> on <a href="https://unsplash.com/photos/worms-eye-view-photography-of-multicolored-hot-air-balloon-lJ6iASrFAnQ?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Unsplash</a>',
    moveInterval: 3500,
  },
  deepSeaClicker: {
    name: "Deep Sea Clicker",
    backgroundUrl: 'game_assets/ocean-background.jpg',
    backgroundCredit: 'Photo by <a href="https://unsplash.com/@silasbaisch?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Silas Baisch</a> on <a href="https://unsplash.com/photos/blue-and-clear-body-of-water-K785Da4A_JA?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Unsplash</a>',
    objectUrl: 'game_assets/jellyfish.jpg',
    objectCredit: 'Photo by <a href="https://unsplash.com/@kanyonbollinger?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Kanyon Bollinger</a> on <a href="https://unsplash.com/photos/underwater-photography-of-white-jellyfish-1AjxqINfBYs?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Unsplash</a>',
    moveInterval: 4000,
  },
};

// Get the game type from the URL, default to cosmicClicker
const getGameType = () => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('game') || 'cosmicClicker';
};

const gameType = getGameType();
const gameConfig = games[gameType] || games.cosmicClicker;


ReactDOM.render(
  <Game config={gameConfig} />,
  document.getElementById('game-container')
);
