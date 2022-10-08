import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import Broccoli from './assets/broccoli.png';
import Face from './assets/face.png';
import Demon2 from './assets/demon.png';
import Sam from './assets/sam.png';
import Siena from './assets/siena.png';
import Cake from './assets/cake.jpeg';
import Pacman from './assets/pacman.png';
import Rosa from './assets/rosa.png';
import Ruby from './assets/ruby.png';
import Max from './assets/max.png';
import Miles from './assets/miles.png';
import Andrew from './assets/andrew.png';
import Dylan from './assets/dylan.png';
import useInterval from './hooks/useInterval';

interface Player {
  id: string;
  picture: string;
}

const urlSearchParams = new URLSearchParams(window.location.search);
const params = Object.fromEntries(urlSearchParams.entries());
const winningScoreParam = parseInt(params.winningScore);
const winningScoreParamAsNum = isNaN(winningScoreParam) ? undefined : winningScoreParam;
const altClue = !!params.alt;

const clue = altClue ? 'Check Sam\'s email.' : 'In past years it was jello but that was too mellow. We\'ve had to step it up, let\'s hope no one throws up.';

const canvasX = 1000;
const canvasY = 1000;
const initialSnake = [
  [4, 10],
  [4, 10],
];
const initialApple = [14, 10];
const scale = 50;
const timeDelay = 100;
const winningScore = winningScoreParamAsNum ?? 50;
const toRadians = Math.PI/180; 

function rotateAndPaintImage (
  context: CanvasRenderingContext2D,
  image: HTMLCanvasElement,
  angleDegrees: number,
  positionX: number,
  positionY: number,
  axisX: number,
  axisY: number
) {
  context.translate( positionX, positionY );
  context.rotate( angleDegrees * toRadians );
  context.drawImage( image, -axisX, -axisY - 1, 3, 3 );
  context.rotate( -angleDegrees * toRadians );
  context.translate( -positionX, -positionY );
}

const players = [
  { id: 'mouth', picture: Face },
  { id: 'demon2', picture: Demon2}, 
  { id: 'sam', picture: Sam },
  { id: 'pacman', picture: Pacman },
  { id: 'siena', picture: Siena },
  { id: 'rosa', picture: Rosa },
  { id: 'ruby', picture: Ruby },
  { id: 'max', picture: Max },
  { id: 'miles', picture: Miles },
  { id: 'andrew', picture: Andrew },
  { id: 'dylan', picture: Dylan },
].sort((a, b) => 0.5 - Math.random());

const App = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [snake, setSnake] = useState(initialSnake);
  const [apple, setApple] = useState(initialApple);
  const [direction, setDirection] = useState([0, -1]);
  const [delay, setDelay] = useState<number | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [wonGame, setWonGame] = useState(false);
  const [score, setScore] = useState(0);
  const [choosePlayerDialogIsOpen, setChoosePlayerDialogIsOpen] = useState(true);
  const [player, setPlayer] = useState<Player>();
  const playAreaRef = useRef<HTMLDivElement>(null);

  const handleChoosePlayer = useCallback((player: Player) => () => {
    setChoosePlayerDialogIsOpen(false);
    setPlayer(player);
    play();
  }, [])

  useInterval(() => runGame(), delay);

  const angleAndXis = useMemo(() => {
    // left
    if (direction[0] === -1) {
      return [180, 1, 1];
    }
    // right
    if (direction[0] === 1) {
      return [0, 0, 0];
    }
    // up
    if (direction[1] === -1) {
      return [270, 1, 0];
    }
    // down
    if (direction[1] === 1) {
      return [90, 0, 1];
    }
    return [-1, -1, -1];
  }, [direction]);

  useEffect(() => {
    let fruit = document.getElementById('fruit') as HTMLCanvasElement;
    let face = document.getElementById('face') as HTMLCanvasElement;
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.setTransform(scale, 0, 0, scale, 0, 0);
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        ctx.fillStyle = '#a3d001';
        snake.forEach(([x, y], i) => {
          if (i === 0) {
            rotateAndPaintImage(ctx, face, angleAndXis[0], x, y, angleAndXis[1], angleAndXis[2]);
          } else {
            ctx.fillRect(x, y, 1, 1);
          }
        });
        ctx.drawImage(fruit, apple[0], apple[1], 1, 1);
      }
    }
  }, [snake, apple, gameOver, angleAndXis]);

  useEffect(() => {
    if (score >= winningScore) {
      setWonGame(true);
      setDelay(null);
    }
  }, [score]);

  function handleSetScore() {
    if (score > Number(localStorage.getItem('snakeScore'))) {
      localStorage.setItem('snakeScore', JSON.stringify(score));
    }
  }

  function play() {
    setSnake(initialSnake);
    setApple(initialApple);
    setDirection([1, 0]);
    setDelay(timeDelay);
    setScore(0);
    setGameOver(false);
    setWonGame(false);
    requestAnimationFrame(() => playAreaRef.current?.focus());
  }
  function checkCollision(head: number[]) {
    for (let i = 0; i < snake.length; i++) {
      if (head[i] < 0 || head[i] * scale >= canvasX) return true;
    }
    for (const s of snake) {
      if (head[0] === s[0] && head[1] === s[1]) return true;
    }
    return false;
  }
  function appleAte(newSnake: number[][]) {
    let coord = apple.map(() => Math.floor((Math.random() * canvasX) / scale));
    if (newSnake[0][0] === apple[0] && newSnake[0][1] === apple[1]) {
      let newApple = coord;
      setScore(score + 1);
      setApple(newApple);
      return true;
    }
    return false;
  }

  function runGame() {
    const newSnake = [...snake];
    const newSnakeHead = [
      newSnake[0][0] + direction[0],
      newSnake[0][1] + direction[1],
    ];
    newSnake.unshift(newSnakeHead);
    if (checkCollision(newSnakeHead)) {
      setDelay(null);
      setGameOver(true);
      setChoosePlayerDialogIsOpen(true);
      handleSetScore();
    }
    if (!appleAte(newSnake)) {
      newSnake.pop();
    }
    setSnake(newSnake);
  }
  function changeDirection(e: React.KeyboardEvent<HTMLDivElement>) {
    switch (e.key) {
      case 'ArrowLeft':
        setDirection([-1, 0]);
        break;
      case 'ArrowUp':
        setDirection([0, -1]);
        break;
      case 'ArrowRight':
        setDirection([1, 0]);
        break;
      case 'ArrowDown':
        setDirection([0, 1]);
        break;
    }
  }

  if (choosePlayerDialogIsOpen) {
    return (
      <div className="dialog choose-player-dialog">
        {gameOver ? <h1>Game Over :(. Try again...</h1> :  <h1>Choose Your Player</h1>}
        <div>
          {players.map(x => <img key={x.id} src={x.picture} alt="" onClick={handleChoosePlayer(x)} />)}
        </div>
      </div>
    )
  }

  if (wonGame) {
    return (
      <div className="dialog won-game-dialog">
        <h1>You won!</h1>
        <p>{clue}</p>
      </div>
    )
  }

  return (
    <div ref={playAreaRef} tabIndex={0} onKeyDown={changeDirection}>
      <div className="scoreBox">
        <h2>Score: {score}</h2>
        <h2>High Score: {localStorage.getItem('snakeScore')}</h2>
        <h2>Win at: {winningScore}</h2>
      </div>
      <img id="fruit" src={Broccoli} alt="fruit" width="30" />
      <img id="face" src={player?.picture} alt="face" width="30" />
      <img src={Cake} alt="fruit" className="monitor" />
      <canvas
        className="playArea"
        ref={canvasRef}
        width={`${canvasX}px`}
        height={`${canvasY}px`}
      />
      {gameOver && <div className="gameOver">{`:()`}</div>}
      {wonGame && <div className="wonGame">{`:)`}</div>}
      {/* <button onClick={play} className="playButton">
        Play
      </button> */}
    </div>
  );
};

export default App;
