"use client";

import Image from "next/image";
import {
  GestureRecognizer,
  HandLandmarker,
  FilesetResolver,
  DrawingUtils,
} from "@mediapipe/tasks-vision";
import { MutableRefObject, use, useEffect, useRef, useState } from "react";

export default function Home() {
  const videoRef = useRef() as MutableRefObject<HTMLVideoElement>;
  const canvasRef = useRef() as MutableRefObject<HTMLCanvasElement>;
  const [results2, setResults2] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [gestureRecognizer, setGestureRecognizer] =
    useState<GestureRecognizer>();

  const [handLandmarker, setHandLandmarker] = useState<HandLandmarker>();
  let runningMode = "IMAGE";

  const createGestureRecognizer = async () => {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
    );
    const gestureRecognizerTemp = await GestureRecognizer.createFromOptions(
      vision,
      {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
          delegate: "GPU",
        },
        //@ts-ignore
        runningMode: runningMode,
      }
    );
    setGestureRecognizer(gestureRecognizerTemp);
  };
  // const createHandLandMarker = async () => {
  //   const vision = await FilesetResolver.forVisionTasks(
  //     "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
  //   );
  //   const handLandmarkerTemp = await HandLandmarker.createFromOptions(vision, {
  //     baseOptions: {
  //       modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
  //       delegate: "GPU",
  //     },
  //     //@ts-ignore
  //     runningMode: runningMode,
  //     numHands: 2,
  //   });
  //   setHandLandmarker(handLandmarkerTemp);
  // };

  useEffect(() => {
    const initVisionTaks = async () => {
      await createGestureRecognizer();
      // await createHandLandMarker();
      if (hasGetUserMedia()) {
        enableCam();
      }
    };
    initVisionTaks();
  }, []);

  useEffect(() => {
    if (loading) {
      return;
    }
    // setInterval(() => {
    //   setCount((prevCount) => prevCount + 1);
    //   predictWebcam();
    // }, 10);

    let animationFrameId: number;
    const animate = () => {
      // setCount((prevCount) => prevCount + 1);
      predictWebcam();
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrameId);
  }, [loading]);

  function hasGetUserMedia() {
    return navigator.permissions.query({ name: "camera" }).then((res) => {
      if (
        res.state == "granted" &&
        !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
      ) {
        // has permission
        return true;
      } else {
        alert("Please enable camera permission and then reload");
        return false;
      }
    });
    // return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }
  // Enable the live webcam view and start detection.
  function enableCam() {
    // if (!handLandmarker || !gestureRecognizer) {
    //   console.log("Wait! objectDetector not loaded yet.");
    //   return;
    // }

    // getUsermedia parameters.
    const constraints = {
      video: true,
    };

    // Activate the webcam stream.
    navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
      videoRef.current.srcObject = stream;
      setLoading(false);
      // videoRef.current.addEventListener("loadeddata", predictWebcam);
    });
  }

  function draw(results: any) {
    const canvasCtx = canvasRef.current.getContext("2d");
    canvasCtx!.save();
    canvasCtx!.clearRect(
      0,
      0,
      canvasRef.current.width,
      canvasRef.current.height
    );
    const drawingUtils = new DrawingUtils(
      canvasRef.current.getContext("2d") as CanvasRenderingContext2D
    );

    for (const landmarks of results.landmarks) {
      drawingUtils.drawConnectors(
        landmarks,
        GestureRecognizer.HAND_CONNECTIONS,
        {
          color: "#00FF00",
          lineWidth: 5,
        }
      );
      drawingUtils.drawLandmarks(landmarks, {
        color: "blue",
        lineWidth: 2,
      });
    }
    canvasCtx!.restore();
    if (results.gestures.length > 0) {
      console.log(results.gestures[0][0].categoryName);
      if (results?.gestures[0][0]?.categoryName === "Pointing_Up") {
        videoRef.current.style.filter = "grayscale(100%)";
      } else if (results?.gestures[0][0]?.categoryName === "Open_Palm") {
        videoRef.current.style.filter = "blur(8px)";
      } else if (results?.gestures[0][0]?.categoryName === "Thumb_Down") {
        videoRef.current.style.filter = "brightness(20%)";
      } else if (results?.gestures[0][0]?.categoryName === "Thumb_Up") {
        videoRef.current.style.filter = "brightness(160%)";
      } else {
        videoRef.current.style.filter = "grayscale(0%)";
        videoRef.current.style.filter = "blur(0px)";
      }
    }

    //   gestureOutput.style.display = "block";
    //   gestureOutput.style.width = "100%";
    //   const categoryName = results.gestures[0][0].categoryName;
    //   const categoryScore = parseFloat(
    //     results.gestures[0][0].score * 100
    //   ).toFixed(2);
    //   const handedness = results.handednesses[0][0].displayName;
    //   gestureOutput.innerText = `GestureRecognizer: ${categoryName}\n Confidence: ${categoryScore} %\n Handedness: ${handedness}`;
    // } else {
    //   gestureOutput.style.display = "none";
    // }
  }

  async function predictWebcam() {
    let lastVideoTime = -1;
    let results = undefined;

    canvasRef.current.style.width = "640px";
    canvasRef.current.style.height = "480px";
    canvasRef.current.width = 640;
    canvasRef.current.height = 480;

    // Now let's start detecting the stream.
    if (runningMode === "IMAGE") {
      runningMode = "VIDEO";
      // await handLandmarker.setOptions({ runningMode: "VIDEO" });
      await gestureRecognizer.setOptions({ runningMode: "VIDEO" });
    }
    let startTimeMs = performance.now();
    if (lastVideoTime !== videoRef.current.currentTime) {
      lastVideoTime = videoRef.current.currentTime;
      // results = handLandmarker.detectForVideo(video, startTimeMs);
      results = gestureRecognizer.recognizeForVideo(
        videoRef.current,
        startTimeMs
      );
      setResults2(results);
      draw(results);
      // console.log("resultsTemp", results);
      // setResults(resultsTemp);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-24 justify-start from-emerald-100 bg-gradient-to-t to-teal-200	">
      <section id="demos" className="flex flex-row">
        <div id="liveView" className="videoView">
          <p id="gesture_output" className="output" />
          <div className="relative w-[640px] h-[480px]">
            <video
              ref={videoRef}
              id="webcam"
              autoPlay
              className="rounded-xl"
              style={{ position: "absolute", left: "0px", top: "0px" }}
            ></video>
            <canvas
              ref={canvasRef}
              className="output_canvas rounded-xl"
              id="output_canvas"
              style={{ position: "absolute", left: "0px", top: "0px" }}
            ></canvas>
          </div>
        </div>
      </section>
    </main>
  );
}
