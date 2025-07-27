import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gamepad2, Users, Trophy, Target, Heart, Zap, Star, Play, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const games = [
  {
    id: "love_trivia",
    name: "Love Trivia",
    description: "How well do you know each other?",
    icon: "❤️",
    players: "2",
    difficulty: "Easy",
    category: "Romance"
  },
  {
    id: "tic_tac_hearts",
    name: "Tic Tac Hearts",
    description: "Classic game with a romantic twist",
    icon: "💕",
    players: "2",
    difficulty: "Easy",
    category: "Strategy"
  },
  {
    id: "memory_match",
    name: "Memory Match",
    description: "Match cards of your favorite moments",
    icon: "🧠",
    players: "2",
    difficulty: "Medium",
    category: "Memory"
  },
  {
    id: "word_love",
    name: "Word Love",
    description: "Create romantic words together",
    icon: "📝",
    players: "2",
    difficulty: "Medium",
    category: "Word"
  },
  {
    id: "distance_quest",
    name: "Distance Quest",
    description: "Adventure game for long-distance couples",
    icon: "🗺️",
    players: "2",
    difficulty: "Hard",
    category: "Adventure"
  },
  {
    id: "love_puzzles",
    name: "Love Puzzles",
    description: "Solve puzzles together",
    icon: "🧩",
    players: "2",
    difficulty: "Medium",
    category: "Puzzle"
  }
];

// Tic Tac Toe Game Component
const TicTacHeartsGame = ({ user, gameSession, onBack, onMove }) => {
  const board = gameSession.game_state.board || Array(3).fill(Array(3).fill(""));
  const currentPlayer = gameSession.game_state.current_player || 0;
  const isMyTurn = gameSession.players[currentPlayer] === user?.id;
  const myPlayerIndex = gameSession.players.indexOf(user?.id);
  const symbol = myPlayerIndex === 0 ? "❤️" : "💙";
  
  const handleClick = (row, col) => {
    if (!isMyTurn || board[row][col] !== "" || gameSession.status === "completed") return;
    
    onMove({
      row,
      col
    });
  };

  return (
    <Card className="p-8 bg-gradient-gaming shadow-glow">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-script font-bold text-primary-foreground">
          Tic Tac Hearts 💕
        </h3>
        <p className="text-primary-foreground/80">
          {gameSession.status === "completed" 
            ? gameSession.winner === "draw" 
              ? "It's a draw! 🤝" 
              : `Winner: ${gameSession.winner === user?.id ? "You!" : "Your Partner!"} 🎉`
            : isMyTurn 
              ? `Your turn (${symbol})`
              : "Waiting for your partner..."}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto mb-6">
        {board.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <Button
              key={`${rowIndex}-${colIndex}`}
              variant="secondary"
              className="h-20 w-20 text-2xl hover:scale-105 transition-bounce"
              onClick={() => handleClick(rowIndex, colIndex)}
              disabled={!isMyTurn || cell !== "" || gameSession.status === "completed"}
            >
              {cell}
            </Button>
          ))
        )}
      </div>

      <div className="flex justify-center space-x-4">
        <Button variant="romantic" onClick={() => window.location.reload()}>
          New Game
        </Button>
        <Button variant="heart" onClick={onBack}>
          Back to Games
        </Button>
      </div>
    </Card>
  );
};

// Love Trivia Game Component
const LoveTriviaGame = ({ user, gameSession, onBack, onMove }) => {
  const gameState = gameSession.game_state;
  const currentQuestion = gameState.questions?.[gameState.current_question];
  const isMyTurn = gameSession.players[gameState.current_player || 0] === user?.id;

  const handleAnswer = (answer) => {
    if (!isMyTurn) return;
    
    onMove({
      answer,
      question_index: gameState.current_question
    });
  };

  if (!currentQuestion) {
    return (
      <Card className="p-8 bg-gradient-gaming shadow-glow">
        <div className="text-center">
          <h3 className="text-2xl font-script font-bold text-primary-foreground mb-4">
            Love Trivia ❤️
          </h3>
          <p className="text-primary-foreground/80">Loading questions...</p>
          <Button variant="heart" onClick={onBack} className="mt-4">
            Back to Games
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-8 bg-gradient-gaming shadow-glow">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-script font-bold text-primary-foreground">
          Love Trivia ❤️
        </h3>
        <p className="text-primary-foreground/80">
          Question {(gameState.current_question || 0) + 1} of {gameState.questions?.length || 0}
        </p>
      </div>

      <div className="max-w-2xl mx-auto mb-6">
        <h4 className="text-xl text-primary-foreground mb-4 text-center">
          {currentQuestion.question}
        </h4>
        
        {currentQuestion.type === "multiple_choice" && currentQuestion.options && (
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <Button
                key={index}
                variant="secondary"
                className="w-full text-left justify-start"
                onClick={() => handleAnswer(option)}
                disabled={!isMyTurn}
              >
                {option}
              </Button>
            ))}
          </div>
        )}
        
        {currentQuestion.type === "open" && (
          <div className="text-center">
            <p className="text-primary-foreground/80 mb-4">
              This is an open question - discuss together!
            </p>
            <Button
              variant="romantic"
              onClick={() => handleAnswer("discussed")}
              disabled={!isMyTurn}
            >
              We discussed this! ❤️
            </Button>
          </div>
        )}
      </div>

      <div className="text-center">
        <Button variant="heart" onClick={onBack}>
          Back to Games
        </Button>
      </div>
    </Card>
  );
};

// Memory Match Game Component
const MemoryMatchGame = ({ user, gameSession, onBack, onMove }) => {
  const gameState = gameSession.game_state;
  const cards = gameState.cards || [];
  const flipped = gameState.flipped || [];
  const matched = gameState.matched || [];
  const currentPlayer = gameState.current_player || 0;
  const isMyTurn = gameSession.players[currentPlayer] === user?.id;

  const handleCardClick = (index) => {
    if (!isMyTurn || flipped.includes(index) || matched.includes(index) || flipped.length >= 2) return;
    
    onMove({
      card_index: index
    });
  };

  return (
    <Card className="p-8 bg-gradient-gaming shadow-glow">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-script font-bold text-primary-foreground">
          Memory Match 🧠
        </h3>
        <p className="text-primary-foreground/80">
          {isMyTurn ? "Your turn!" : "Partner's turn..."}
        </p>
        <p className="text-primary-foreground/60 text-sm">
          Matches found: {matched.length / 2} / {cards.length / 2}
        </p>
      </div>

      <div className="grid grid-cols-4 gap-2 max-w-md mx-auto mb-6">
        {cards.map((card, index) => (
          <Button
            key={index}
            variant="secondary"
            className="h-16 w-16 text-xl"
            onClick={() => handleCardClick(index)}
            disabled={!isMyTurn || matched.includes(index)}
          >
            {flipped.includes(index) || matched.includes(index) ? card : "?"}
          </Button>
        ))}
      </div>

      <div className="text-center">
        <Button variant="heart" onClick={onBack}>
          Back to Games
        </Button>
      </div>
    </Card>
  );
};

interface MultiplayerGamesProps {
  user: any;
}

const MultiplayerGames = ({ user }: MultiplayerGamesProps) => {
  const [selectedGame, setSelectedGame] = useState(null);
  const [gameSession, setGameSession] = useState(null);
  const [gameStats, setGameStats] = useState({ played: 12, wins: 7, partner_wins: 5 });
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const { toast } = useToast();

  const backendUrl = import.meta.env.VITE_REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    // Set up WebSocket connection for real-time game updates
    if (user && gameSession) {
      const ws = new WebSocket(`${backendUrl.replace('https://', 'wss://')}/ws/${user.id}`);
      
      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.type === 'game_move' && message.game_id === gameSession.id) {
          // Update game state
          setGameSession(prev => ({
            ...prev,
            game_state: message.game_state,
            status: message.status,
            winner: message.winner
          }));
          
          if (message.winner && message.winner !== "draw") {
            toast({
              title: message.winner === user.id ? "You Won! 🎉" : "Partner Won! 🎉",
              description: "Great game!",
            });
          } else if (message.winner === "draw") {
            toast({
              title: "It's a Draw! 🤝",
              description: "Well played both!",
            });
          }
        }
      };

      return () => {
        ws.close();
      };
    }
  }, [user, gameSession]);

  const createGame = async (game) => {
    if (!user) {
      toast({
        title: "Please Sign In",
        description: "You need to sign in to play games.",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingGame(true);
    try {
      const response = await fetch(`${backendUrl}/api/games/create?game_type=${game.id}&player_id=${user.id}`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to create game');
      
      const session = await response.json();
      setGameSession(session);
      setSelectedGame(game);
      
      toast({
        title: `${game.name} Created!`,
        description: "Waiting for your partner to join...",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create game",
        variant: "destructive",
      });
    } finally {
      setIsCreatingGame(false);
    }
  };

  const makeMove = async (moveData) => {
    if (!gameSession || !user) return;

    try {
      const response = await fetch(`${backendUrl}/api/games/${gameSession.id}/move`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          game_id: gameSession.id,
          player_id: user.id,
          move_data: moveData
        }),
      });

      if (!response.ok) throw new Error('Failed to make move');
      
      const result = await response.json();
      
      // Update local game state
      setGameSession(prev => ({
        ...prev,
        game_state: result.game_state,
        status: result.game_status,
        winner: result.winner
      }));
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to make move",
        variant: "destructive",
      });
    }
  };

  const exitGame = () => {
    setSelectedGame(null);
    setGameSession(null);
  };

  // Render active game
  if (gameSession && selectedGame) {
    switch (selectedGame.id) {
      case "tic_tac_hearts":
        return <TicTacHeartsGame user={user} gameSession={gameSession} onBack={exitGame} onMove={makeMove} />;
      case "love_trivia":
        return <LoveTriviaGame user={user} gameSession={gameSession} onBack={exitGame} onMove={makeMove} />;
      case "memory_match":
        return <MemoryMatchGame user={user} gameSession={gameSession} onBack={exitGame} onMove={makeMove} />;
      default:
        return (
          <Card className="p-8 bg-gradient-gaming shadow-glow">
            <div className="text-center">
              <h3 className="text-2xl font-script font-bold text-primary-foreground mb-4">
                {selectedGame.name} {selectedGame.icon}
              </h3>
              <p className="text-primary-foreground/80 mb-4">
                This game is coming soon! We're working on making it even more amazing for you.
              </p>
              <Button variant="heart" onClick={exitGame}>
                Back to Games
              </Button>
            </div>
          </Card>
        );
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-script font-bold text-gradient mb-4">
          Play Together 🎮
        </h2>
        <p className="text-muted-foreground">
          Fun games to play together across the distance
        </p>
      </div>

      {/* Game Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="p-4 video-card text-center shadow-romantic">
          <Trophy className="w-8 h-8 text-primary mx-auto mb-2 sparkle" />
          <h3 className="font-semibold">Games Played</h3>
          <p className="text-2xl font-bold text-primary">{gameStats.played}</p>
        </Card>
        
        <Card className="p-4 video-card text-center shadow-blue-glow">
          <Target className="w-8 h-8 text-accent mx-auto mb-2 pulse-blue" />
          <h3 className="font-semibold">Your Wins</h3>
          <p className="text-2xl font-bold text-accent">{gameStats.wins}</p>
        </Card>
        
        <Card className="p-4 video-card text-center shadow-romantic">
          <Heart className="w-8 h-8 text-primary mx-auto mb-2 floating-heart" />
          <h3 className="font-semibold">Her Wins</h3>
          <p className="text-2xl font-bold text-primary">{gameStats.partner_wins}</p>
        </Card>
      </div>

      {/* Games Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {games.map((game) => (
          <Card 
            key={game.id} 
            className="p-6 gaming-border hover:shadow-glow transition-romantic cursor-pointer group"
            onClick={() => createGame(game)}
          >
            <div className="text-center">
              <div className="text-4xl mb-4 group-hover:scale-110 transition-bounce">
                {game.icon}
              </div>
              
              <h3 className="text-lg font-semibold mb-2 text-card-foreground">
                {game.name}
              </h3>
              
              <p className="text-sm text-muted-foreground mb-4">
                {game.description}
              </p>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="flex items-center">
                    <Users size={12} className="mr-1" />
                    {game.players} Players
                  </span>
                  <span className="flex items-center">
                    <Star size={12} className="mr-1" />
                    {game.difficulty}
                  </span>
                </div>
                
                <div className="text-xs text-primary font-medium">
                  {game.category}
                </div>
              </div>
              
              <Button 
                variant="romantic" 
                size="sm" 
                className="mt-4 w-full group-hover:scale-105 transition-bounce"
                disabled={isCreatingGame}
              >
                <Gamepad2 className="mr-2" size={16} />
                {isCreatingGame ? "Creating..." : "Play Now"}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Game Room Status */}
      <Card className="mt-8 p-6 bg-gradient-gaming shadow-glow">
        <div className="text-center">
          <h3 className="text-xl font-script font-bold text-primary-foreground mb-4">
            Game Room Status
          </h3>
          
          <div className="flex justify-center items-center space-x-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-2">
                <Users className="text-primary-foreground" size={24} />
              </div>
              <p className="text-primary-foreground/80 text-sm">
                {user?.email?.split('@')[0] || "You"}
              </p>
              <div className="w-2 h-2 bg-green-400 rounded-full mx-auto mt-1"></div>
            </div>
            
            <Zap className="text-primary-foreground pulse-red" size={32} />
            
            <div className="text-center">
              <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center mb-2">
                <Heart className="text-primary-foreground" size={24} />
              </div>
              <p className="text-primary-foreground/80 text-sm">Your Partner</p>
              <div className="w-2 h-2 bg-yellow-400 rounded-full mx-auto mt-1"></div>
            </div>
          </div>
          
          <p className="text-primary-foreground/60 text-sm mt-4">
            {user ? "Ready for real-time multiplayer!" : "Sign in to play together"}
          </p>
        </div>
      </Card>
    </div>
  );
};

export default MultiplayerGames;