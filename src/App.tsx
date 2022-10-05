import React, { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import Broccoli from './assets/broccoli.png';
import Face from './assets/face.jpeg';
import Cake from './assets/cake.jpeg';
import useInterval from './hooks/useInterval';

const canvasX = 1000;
const canvasY = 1000;
const initialSnake = [
  [4, 10],
  [4, 10],
];
const initialApple = [14, 10];
const scale = 50;
const timeDelay = 100;
const winningScore = 50;
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
  context.drawImage( image, -axisX, -axisY, 1, 1 );
  context.rotate( -angleDegrees * toRadians );
  context.translate( -positionX, -positionY );
}

const App = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [snake, setSnake] = useState(initialSnake);
  const [apple, setApple] = useState(initialApple);
  const [direction, setDirection] = useState([0, -1]);
  const [delay, setDelay] = useState<number | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [wonGame, setWonGame] = useState(false);
  const [score, setScore] = useState(0);

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

  return (
    <div onKeyDown={e => changeDirection(e)}>
      <div className="scoreBox">
        <h2>Score: {score}</h2>
        <h2>High Score: {localStorage.getItem('snakeScore')}</h2>
      </div>
      <img id="fruit" src={Broccoli} alt="fruit" width="30" />
      <img id="face" src={Face} alt="face" width="30" />
      <img src={Cake} alt="fruit" className="monitor" />
      <canvas
        className="playArea"
        ref={canvasRef}
        width={`${canvasX}px`}
        height={`${canvasY}px`}
      />
      {gameOver && <div className="gameOver">{`:()`}</div>}
      {wonGame && <div className="wonGame">{`:)`}</div>}
      <button onClick={play} className="playButton">
        Play
      </button>
    </div>
  );
};

export default App;
