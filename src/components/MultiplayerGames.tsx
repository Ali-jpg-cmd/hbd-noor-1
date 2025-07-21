import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gamepad2, Users, Trophy, Target, Heart, Zap, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const games = [
  {
    id: 1,
    name: "Love Trivia",
    description: "How well do you know each other?",
    icon: "❤️",
    players: "2",
    difficulty: "Easy",
    category: "Romance"
  },
  {
    id: 2,
    name: "Tic Tac Hearts",
    description: "Classic game with a romantic twist",
    icon: "💕",
    players: "2",
    difficulty: "Easy",
    category: "Strategy"
  },
  {
    id: 3,
    name: "Memory Match",
    description: "Match cards of your favorite moments",
    icon: "🧠",
    players: "2",
    difficulty: "Medium",
    category: "Memory"
  },
  {
    id: 4,
    name: "Word Love",
    description: "Create romantic words together",
    icon: "📝",
    players: "2",
    difficulty: "Medium",
    category: "Word"
  },
  {
    id: 5,
    name: "Distance Quest",
    description: "Adventure game for long-distance couples",
    icon: "🗺️",
    players: "2",
    difficulty: "Hard",
    category: "Adventure"
  },
  {
    id: 6,
    name: "Love Puzzles",
    description: "Solve puzzles together",
    icon: "🧩",
    players: "2",
    difficulty: "Medium",
    category: "Puzzle"
  }
];

// Simple Tic Tac Toe Component
const TicTacToe = ({ onBack }) => {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [winner, setWinner] = useState(null);
  const { toast } = useToast();

  const handleClick = (index) => {
    if (board[index] || winner) return;

    const newBoard = [...board];
    newBoard[index] = isXNext ? '❤️' : '💙';
    setBoard(newBoard);
    setIsXNext(!isXNext);

    const gameWinner = checkWinner(newBoard);
    if (gameWinner) {
      setWinner(gameWinner);
      toast({
        title: `${gameWinner} Wins!`,
        description: "Great game! Play another round? 🎉",
      });
    }
  };

  const checkWinner = (squares) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6],
    ];

    for (let line of lines) {
      const [a, b, c] = line;
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return null;
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setWinner(null);
  };

  return (
    <Card className="p-8 bg-gradient-gaming shadow-glow">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-script font-bold text-primary-foreground">
          Tic Tac Hearts 💕
        </h3>
        <p className="text-primary-foreground/80">
          Current Turn: {isXNext ? '❤️ (You)' : '💙 (Your Wife)'}
        </p>
        {winner && (
          <p className="text-xl font-bold text-primary-foreground mt-2">
            Winner: {winner === '❤️' ? 'You!' : 'Your Wife!'} 🎉
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto mb-6">
        {board.map((cell, index) => (
          <Button
            key={index}
            variant="secondary"
            className="h-20 w-20 text-2xl hover:scale-105 transition-bounce"
            onClick={() => handleClick(index)}
            disabled={!!cell || !!winner}
          >
            {cell}
          </Button>
        ))}
      </div>

      <div className="flex justify-center space-x-4">
        <Button variant="romantic" onClick={resetGame}>
          New Game
        </Button>
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
  const [isInGame, setIsInGame] = useState(false);
  const { toast } = useToast();

  const startGame = (game) => {
    setSelectedGame(game);
    setIsInGame(true);
    toast({
      title: `Starting ${game.name}!`,
      description: "Real-time multiplayer requires Supabase integration for sync",
    });
  };

  const exitGame = () => {
    setSelectedGame(null);
    setIsInGame(false);
  };

  if (isInGame && selectedGame?.name === "Tic Tac Hearts") {
    return <TicTacToe onBack={exitGame} />;
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
          <p className="text-2xl font-bold text-primary">12</p>
        </Card>
        
        <Card className="p-4 video-card text-center shadow-blue-glow">
          <Target className="w-8 h-8 text-accent mx-auto mb-2 pulse-blue" />
          <h3 className="font-semibold">Your Wins</h3>
          <p className="text-2xl font-bold text-accent">7</p>
        </Card>
        
        <Card className="p-4 video-card text-center shadow-romantic">
          <Heart className="w-8 h-8 text-primary mx-auto mb-2 floating-heart" />
          <h3 className="font-semibold">Her Wins</h3>
          <p className="text-2xl font-bold text-primary">5</p>
        </Card>
      </div>

      {/* Games Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {games.map((game) => (
          <Card 
            key={game.id} 
            className="p-6 gaming-border hover:shadow-glow transition-romantic cursor-pointer group"
            onClick={() => startGame(game)}
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
              >
                <Gamepad2 className="mr-2" size={16} />
                Play Now
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
              <p className="text-primary-foreground/80 text-sm">You</p>
              <div className="w-2 h-2 bg-green-400 rounded-full mx-auto mt-1"></div>
            </div>
            
            <Zap className="text-primary-foreground pulse-red" size={32} />
            
            <div className="text-center">
              <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center mb-2">
                <Heart className="text-primary-foreground" size={24} />
              </div>
              <p className="text-primary-foreground/80 text-sm">Your Wife</p>
              <div className="w-2 h-2 bg-red-400 rounded-full mx-auto mt-1"></div>
            </div>
          </div>
          
          <p className="text-primary-foreground/60 text-sm mt-4">
            Real-time multiplayer sync requires Supabase integration
          </p>
        </div>
      </Card>
    </div>
  );
};

export default MultiplayerGames;