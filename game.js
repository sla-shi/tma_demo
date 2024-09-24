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
    zIndex: 10, 
    textShadow: '2px 2px 4px rgba(0,0,0,0.5)', // Optional: add a text shadow for better visibility on varying backgrounds
  }}>
    Score: {score}
  </div>
);

const AboutModal = ({ isOpen, onClose, gameInfo, environment, isTMA }) => {
  if (!isOpen) return null;
  const [userId, setUserId] = useState('N/A');
  
  useEffect(() => {
    const fetchTelegramUserId = () => {
      if (window.Telegram && window.Telegram.WebApp) {
        const initDataUnsafe = window.Telegram.WebApp.initDataUnsafe || {};
        
        setUserId(initDataUnsafe.user?.id || 'N/A');
        // Update the user-id element if it exists (for compatibility with index.html)
        const userIdElement = document.getElementById('user-id');
        if (userIdElement) {
          userIdElement.textContent = `Telegram user ID: ${initDataUnsafe.user?.id || 'N/A'}`;
        }
      }
    };
    fetchTelegramUserId();
  }, []);

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
        <h3>Telegram User Info (Debug)</h3>
        <p>User ID: {userId}</p>
        <h3>Environment</h3>
        <p>Current environment: {environment}</p>
        <h3>TMA mode</h3>
        <p>Is in TMA: {isTMA}</p>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

const MainMenu = ({ onStartGame, onPause, onResume, onShowTopScores, onQuit, onShowAbout, gameState }) => {

  const handlePauseClick = useCallback(() => {
    onPause();
    if (window.TE && typeof window.TE.offerWall === 'function') {
      window.TE.offerWall();
    } else {
      console.error('TE is not defined or offerWall is not a function');
    }
  }, [onPause]);
    
  return (
  <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 10 }}>
    {gameState === 'menu' && <button onClick={onStartGame}>Start New Game</button>}
    {gameState === 'playing' && <button onClick={handlePauseClick}>Pause</button>}
    {gameState === 'paused' && <button onClick={onResume}>Resume</button>}
    <button onClick={onShowTopScores}>Top Scores</button>
    <button onClick={onShowAbout}>About</button>
    <button onClick={onQuit}>Quit</button>
  </div>);
}

const GameTitle = ({ title }) => (
  <h1 style={{
    position: 'absolute',
    top: 60,
    left: 10,
    fontSize: '28px',
    color: 'white',
    fontWeight: 'bold',
    zIndex: 10,
    textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
  }}>
    {title}
  </h1>
);

const Game = ({ config }) => {
  const [score, setScore] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [gameState, setGameState] = useState('menu');
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [environment, setEnvironment] = useState('prod');
  const [clickVerified, setClickVerified] = useState(false);
  const [isTMA, setIsTMA] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const env = urlParams.get('env') || 'prod';
    setEnvironment(env);

    // Detect if we're in TMA mode
    const tg = window.Telegram?.WebApp;
    setIsTMA(!!tg);

    let clickId = null;
    let userId = null;

    if (isTMA) {
      // In TMA mode, get clickId from initData
      const initDataUnsafe = tg.initDataUnsafe;
      userId = initDataUnsafe.user?.id;
      clickId = initDataUnsafe.start_param;
      if (clickId && clickId.startsWith('clickid_')) {
        clickId = clickId.split('_')[1];  // Extract the actual click ID
      }
    } else {
      // In normal mode, get clickId from URL parameter
      clickId = urlParams.get('click_id');
    }
    
    verifyClick(clickId, userId, env);

    const script = document.createElement('script');
    script.src = env === 'dev' 
      ? "https://tma-demo.dmtp.tech/sdk/0.0.6/bec.js?walletAddress=QnLOYksIDhA3MfBLoRL%2ByIa8jRggeovB3NtN3d7LD7g%3D"
      : "https://bec.dmtp.tech/0.0.6/bec.js?walletAddress=QnLOYksIDhA3MfBLoRL%2ByIa8jRggeovB3NtN3d7LD7g%3D";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const verifyClick = async (clickId, userId, env) => {
    try {
      const tg = window.Telegram?.WebApp;
      const _isTMA = !!tg;
      console.log(`Verification isTMA: ${isTMA} vs ${_isTMA}`);
      console.log('Verifying click:', { clickId, userId, env }); // Debug log
      
      let apiUrl;
      const baseUrl = env === 'dev' ? 'https://click-dev.dmtp.tech' : 'https://click.dmtp.tech';

      if (_isTMA) {
        if (!userId) {
          console.error('User ID is required for TMA mode verification');
          return;
        }
        apiUrl = `${baseUrl}/banners/verify?tui=${encodeURIComponent(userId || '')}`;
        if (clickId) {
          apiUrl += `&click_id=${encodeURIComponent(clickId)}`;
        }
      } else {
        if (!clickId) {
          console.error('Click ID is required for non-TMA mode verification');
          return;
        }
        apiUrl = `${baseUrl}/banners/verify/?click_id=${encodeURIComponent(clickId || '')}`;
      }

      console.log(`Verification request: ${apiUrl}`);
      const response = await fetch(apiUrl);
      if (!response.ok) {
        console.log(`Verification failed: ${response}`);
      }
      const data = await response.json();
      console.log(`Verification response: ${data}`);
      if (data.valid) {
        setClickVerified(true);
        setScore(100); // Set initial score to 100 for verified clicks
        console.log('Click ID verified, set score to 100!');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  useEffect(() => {
    document.title = config.name;
  }, [config.name]);

  const moveObject = useCallback(() => {
    const maxX = window.innerWidth - 100; // Assuming object width is 100px
    const maxY = window.innerHeight - 155; // 100px for object height + 50px for ad banner
    setPosition({
      x: Math.random() * maxX,
      y: Math.random() * maxY + 155, // Add 115px to account for ad banner
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
    if (!clickVerified) {
      setScore(0); // Reset score to 0 for non-verified clicks
    }
    setGameState('playing');
    moveObject();
  };

  const pauseGame = useCallback(() => {
    setGameState('paused');
    // The offer wall is now opened in the MainMenu component
  }, []);

  const resumeGame = () => setGameState('playing');
  const showTopScores = () => alert('Top Scores: Coming soon!');
  const quitGame = () => {
    setGameState('menu');
    if (!clickVerified) {
      setScore(0);
    }
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
      <GameTitle title={config.name} />
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
        environment={environment}
        isTMA={isTMA}
      />
    </div>
  );
};

const games = {
  cosmicClicker: {
    name: "Cosmic Clicker",
    backgroundUrl: 'game_assets/space-background.jpg',
    backgroundCredit: 'Photo by <a href="https://unsplash.com/@andyjh07?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Andy Holmes</a> on <a href="https://unsplash.com/photos/milky-way-during-night-time-LUpDjlJv4_c?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Unsplash</a>',
    objectUrl: 'game_assets/spaceship-cute.png',
    objectCredit: 'Photo by <a href="https://designer.microsoft.com/consumerTermsOfUse/en-GB/consumerTermsOfUse.pdf">DALLE 3</a>',
    moveInterval: 3000,
  },
  forestFriend: {
    name: "Forest Friend",
    backgroundUrl: 'game_assets/forest-background.jpg',
    backgroundCredit: 'Photo by <a href="https://unsplash.com/@howardbouchevereau?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Howard Bouchevereau</a> on <a href="https://unsplash.com/photos/a-forest-of-tall-trees-nifQzholGAc?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Unsplash</a>',
    objectUrl: 'game_assets/forest_friend-cute.png',
    objectCredit: 'Photo by <a href="https://designer.microsoft.com/consumerTermsOfUse/en-GB/consumerTermsOfUse.pdf">DALLE 3</a>',
    moveInterval: 2500,
  },
  balloonBopper: {
    name: "Balloon Bopper",
    backgroundUrl: 'game_assets/sky-background.jpg',
    backgroundCredit: 'Photo by <a href="https://unsplash.com/@thomasdupon_be?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Thomas Dupon</a> on <a href="https://unsplash.com/photos/white-clouds-and-blue-sky-during-daytime-KuuHp9HgCI0?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Unsplash</a>',
    objectUrl: 'game_assets/balloon-cute.png',
    objectCredit: 'Photo by <a href="https://designer.microsoft.com/consumerTermsOfUse/en-GB/consumerTermsOfUse.pdf">DALLE 3</a>',
    moveInterval: 3500,
  },
  deepSeaClicker: {
    name: "Deep Sea Clicker",
    backgroundUrl: 'game_assets/ocean-background.jpg',
    backgroundCredit: 'Photo by <a href="https://unsplash.com/@silasbaisch?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Silas Baisch</a> on <a href="https://unsplash.com/photos/blue-and-clear-body-of-water-K785Da4A_JA?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Unsplash</a>',
    objectUrl: 'game_assets/jellyfish-cute.png',
    objectCredit: 'Photo by <a href="https://designer.microsoft.com/consumerTermsOfUse/en-GB/consumerTermsOfUse.pdf">DALLE 3</a>',
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