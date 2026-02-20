
const numFrames = 30; // Number of frames to average over

let frameRates = []; // Array to store the last numFrames frame rates
let lastAverage = 0;

let lastRenderTimeMs = 0;

export function averageFrameRate () {
    if (!lastRenderTimeMs) {
        return 0;
    } else {
        // Calculate the current frame rate by dividing 1000 (the number of milliseconds in a second) by the currentFrameRenderTimeMs
        const currentFrameRate = 1000 / lastRenderTimeMs;
        frameRates.push(currentFrameRate);
    }

    if (frameRates.length >= numFrames) {
        // Calculate the sum of the frame rates in the array
        lastAverage = frameRates.reduce((a, b) => a + b, 0) / numFrames;
        frameRates = [];
    }

    return lastAverage;
}

let startTime;
let endTime;

export function startMeasuringFrameTime() {
    startTime = performance.now();
}

export function finishMeasuringFrameTime() {
    endTime = performance.now();
    const elapsedTime = endTime - startTime;
    // console.log(`Execution time: ${elapsedTime} milliseconds`);
    // if (lastRenderTimeMs > 20) {
    //     console.warn(`HEY ITS GOING SLOW ${lastRenderTimeMs}ms`)
    // }
    lastRenderTimeMs = elapsedTime;
    // return (elapsedTime);
}


let tempStartTime = -1;

export function startMeasuringExecutionTime() {
  if (tempStartTime !== -1) {
    console.error('oh my god your starting too many execution timers');
  }
  tempStartTime = performance.now();
}

export function finishMeasuringExecutionTime() {
    let endTime = performance.now();
    const elapsedTime = endTime - tempStartTime;
    console.log(`Execution time: ${elapsedTime} milliseconds`);
    //reset starttime
    tempStartTime = -1;
    return (elapsedTime);
}

