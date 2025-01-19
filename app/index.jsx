import { Alert, useWindowDimensions } from "react-native";
import {
  Canvas,
  useImage,
  Image,
  Group,
  Text,
  Circle,
  Rect,
  rect,
} from "@shopify/react-native-skia";
import { StatusBar } from "expo-status-bar";
import {
  useSharedValue,
  withTiming,
  Easing,
  withSequence,
  withRepeat,
  useFrameCallback,
  useDerivedValue,
  interpolate,
  Extrapolation,
  useAnimatedReaction,
  cancelAnimation,
  runOnJS,
} from "react-native-reanimated";
import { useEffect, useState } from "react";

const GRAVITY = 1000;
const JUMP_FORCE = -500;

const pipeWidth = 104;
const pipeHeight = 640;

const App = () => {
  const { width, height } = useWindowDimensions();

  const [score, setScore] = useState(0);

  const bg = useImage(require("../assets/sprites/background-day.png"));
  const bird = useImage(require("../assets/sprites/yellowbird-upflap.png"));
  const pipebottom = useImage(require("../assets/sprites/pipe-green.png"));
  const pipeTop = useImage(require("../assets/sprites/pipe-green-top.png"));
  const base = useImage(require("../assets/sprites/base.png"));

 
  const gameOver = useSharedValue(false);
  const pipeX = useSharedValue(width);
  const birdY = useSharedValue(height / 3);
  const birdX = width / 4;
  
  const birdYVelocity = useSharedValue(0);

 
  const pipeOffset = useSharedValue(0);

  const topPipeY = useDerivedValue(() => pipeOffset.value - 200);
  const bottomPipeY = useDerivedValue(() =>height - 450 + pipeOffset.value);
  const pipeSpeed = useDerivedValue(()=>{
    return interpolate(score, [0,10],[1,2]);
  });

  const obstacles =  useDerivedValue(() => [
      //  Bottom pipe
      {
        x: pipeX.value,
        y: bottomPipeY.value,
        h: pipeHeight,
        w: pipeWidth
      },
      //  Top  pipe
      {
        x: pipeX.value,
        y: topPipeY.value,
        h: pipeHeight,
        w: pipeWidth
      },
    ]);
 

  useEffect(() => {
    moveTheMap();
  }, []);

  const moveTheMap = () => {
    pipeX.value = withRepeat(
      withSequence(
        withTiming(-150, { duration: 3000 / pipeSpeed.value, easing: Easing.linear }),
        withTiming(width, { duration: 0 })
      ),
      -1
    );
  };

  const restartGame = () => {
    birdY.value = height / 3;
    birdYVelocity.value = 0;
    gameOver.value = false;
    pipeX.value = width;
    runOnJS(moveTheMap)();
    pipeSpeed.value = 1;
  };
// scroring value
  useAnimatedReaction(
    () => pipeX.value,

    (currentValue, previousValue) => {
      const middle = birdX;

      if(previousValue && currentValue < -100 && previousValue > -100){
           pipeOffset.value = Math.random() * 400 - 200;
      }

      if (
        currentValue !== previousValue &&
        previousValue &&
        currentValue <= middle &&
        previousValue > middle
      ) {
        runOnJS(setScore)(score + 1);
      }
    }
  );
    
  const isPointCollidingWithRect = (point,rect) =>{
     // Bottom Pipe
     'worklet';
     return (
      point.x >= rect.x &&
      point.x <= rect.x  + rect.w &&
      point.y >= rect.y &&
      point.y <= rect.y + rect.h
     );
  };
   
  // collision detection
  useAnimatedReaction(
    () => birdY.value,
    (currentValue, previousValue) => {
       const center = {
        x : birdX+32,
        y : birdY.value+24
       }     

      if (currentValue > height - 100 || currentValue < 0) {
        gameOver.value = true;
      }
     
      const isColliding = obstacles.value.some((rect)=>
        isPointCollidingWithRect(center,rect)
      );
      if(isColliding){
        gameOver.value = true;
      }
    }
  );

  useAnimatedReaction(
    () => gameOver.value,
    (currentValue, previousValue) => {
      if (currentValue && !previousValue) {
        cancelAnimation(pipeX);
      }
    }
  );

  useFrameCallback(({ timeSincePreviousFrame: dt }) => {
    if (!dt || gameOver.value) {
      return;
    }
    birdY.value = birdY.value + (birdYVelocity.value * dt) / 1000;
    birdYVelocity.value = birdYVelocity.value + (GRAVITY * dt) / 1000;
  });

  const birdTransform = useDerivedValue(() => {
    return [
      {
        rotate: interpolate(
          birdYVelocity.value,
          [-500, 500],
          [-0.5, 0.5],
          Extrapolation.CLAMP
        ),
      },
    ];
  });
  const birdOrigin = useDerivedValue(() => {
    return { x: width / 4 + 32, y: birdY.value + 24 };
  });


  return (
    <Canvas
      style={{ width, height }}
      onTouchStart={() => {
        if (gameOver.value) {
          restartGame();
        } else {
          birdYVelocity.value = JUMP_FORCE;
        }
      }}
    >
      <Text
        x={100} // Center the text horizontally
        y={100} // Position the text at the top
        text={"hello"}
      />

      <StatusBar
        style="dark"
        translucent={true}
        backgroundColor="transparent"
      />

      {/* BG */}
      <Image image={bg} width={width} height={height} fit={"cover"} />

      {/* pipes */}
      <Image
        image={pipeTop}
        y={topPipeY}
        x={pipeX}
        width={pipeWidth}
        height={pipeHeight}
      />
      <Image
        image={pipebottom}
        y={bottomPipeY}
        x={pipeX}
        width={pipeWidth}
        height={pipeHeight }
      />

      {/* Base */}
      <Image
        image={base}
        width={width}
        height={150}
        y={height - 75}
        x={pipeX}
        fit={"cover"}
      />
      <Image
        image={base}
        width={width}
        height={150}
        y={height - 75}
        x={0}
        fit={"cover"}
      />

      {/* Bird */}
      <Group transform={birdTransform} origin={birdOrigin}>
        <Image image={bird} y={birdY} x={birdX} width={64} height={48} />
      </Group>
     
      {/* Scrore */}
      <Text
        x={100} // Center the text horizontally
        y={100} // Position the text at the top
        text={"hello"}
      />
    </Canvas>
  );
};
export default App;
