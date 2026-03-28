"use client"; // This tells Next.js this is a Client Component (runs in the browser)

import React, { useEffect, useRef, useState } from "react";

// Define the structure of the signaling message to match the Spring Boot backend
interface SignalMessage {
  type: "join" | "offer" | "answer" | "ice-candidate" | "leave";
  conversationId: string;
  senderId: string;
  data?: any;
}

interface VideoCallProps {
  conversationId: string; // The ID of the chat/room
  currentUserId: string;  // The ID of the user currently using the app
}

export default function VideoCall({ conversationId, currentUserId }: VideoCallProps) {
  // --- Phase 1: Refs for Media and Connections ---
  // We use useRef instead of useState for things that don't need to trigger a re-render when they change
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // UI States to control button visibility
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);

  // Configuration for WebRTC connecting (using Google's free public STUN server)
  const rtcConfig = {
    iceServers: [
      {
        urls: "stun:stun.l.google.com:19302",
      },
    ],
  };

  // --- Phase 1: Media Setup ---
  // Turns on the user's camera and microphone
  const startCamera = async () => {
    try {
      // Prompt user for camera and mic permissions
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      // Save the stream in our ref so we can use it later without re-rendering
      localStreamRef.current = stream;

      // Attach the stream to the local <video> element
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      setIsCameraOn(true);
    } catch (error) {
      console.error("Error accessing media devices.", error);
      alert("Could not access camera/microphone.");
    }
  };

  // --- Phase 2: Signaling Client (WebSocket) ---
  const connectWebSocket = () => {
    // Connect to the Spring Boot endpoint we just created
    const wsUrl = `ws://localhost:8080/api/v1/ws/video-signaling`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("WebSocket Connected");
      // As soon as we connect, tell the backend we are joining this conversation
      sendMessage(ws, "join");
      wsRef.current = ws;
      setIsJoined(true);
    };

    // Listen for messages from the backend
    ws.onmessage = async (event) => {
      const message: SignalMessage = JSON.parse(event.data);

      // Ignore our own messages just in case
      if (message.senderId === currentUserId) return;

      switch (message.type) {
        case "offer":
          await handleReceiveOffer(message.data);
          break;
        case "answer":
          await handleReceiveAnswer(message.data);
          break;
        case "ice-candidate":
          await handleNewICECandidateMsg(message.data);
          break;
        case "leave":
          endCall();
          alert("The other person left the call.");
          break;
        default:
          console.warn("Unknown message type:", message.type);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket Error:", error);
    };

    ws.onclose = () => {
      console.log("WebSocket Disconnected");
      setIsJoined(false);
    };
  };

  // Helper to send JSON messages through WebSocket
  const sendMessage = (wsInstance: WebSocket | null, type: SignalMessage["type"], data?: any) => {
    if (wsInstance && wsInstance.readyState === WebSocket.OPEN) {
      const payload: SignalMessage = {
        type,
        conversationId,
        senderId: currentUserId,
        data,
      };
      wsInstance.send(JSON.stringify(payload));
    }
  };

  // --- Phase 3: WebRTC Engine ---
  const initializePeerConnection = () => {
    // 1. Create the RTC connection
    const pc = new RTCPeerConnection(rtcConfig);
    peerConnectionRef.current = pc;

    // 2. Add our local camera/mic tracks to the connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // 3. Listen for the remote user's camera/mic tracks
    pc.ontrack = (event) => {
      // When we receive their video, attach it to our remote <video> element
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    // 4. Listen for ICE candidates (network paths) to send to the other user
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        // Send our network routing info to the other person via backend
        sendMessage(wsRef.current, "ice-candidate", event.candidate);
      }
    };

    return pc;
  };

  // --- Phase 4: The Handshake Flow ---

  // Caller: "I want to call you. Here is my video setup (offer)."
  const makeCall = async () => {
    const pc = initializePeerConnection();
    
    // Create an offer
    const offer = await pc.createOffer();
    // Set it as our local description
    await pc.setLocalDescription(offer);

    // Send it to the other user via WebSocket
    sendMessage(wsRef.current, "offer", offer);
    setIsCallActive(true);
  };

  // Callee: "I received your call. Here is my video setup (answer)."
  const handleReceiveOffer = async (offer: RTCSessionDescriptionInit) => {
    // Even if we are receiving, we need to initialize our Peer Connection
    const pc = initializePeerConnection();

    // Register the caller's setup
    await pc.setRemoteDescription(new RTCSessionDescription(offer));

    // Create our answer
    const answer = await pc.createAnswer();
    // Register our setup locally
    await pc.setLocalDescription(answer);

    // Send the answer back to the caller
    sendMessage(wsRef.current, "answer", answer);
    setIsCallActive(true);
  };

  // Caller: "I received your answer. We are now connected."
  const handleReceiveAnswer = async (answer: RTCSessionDescriptionInit) => {
    if (peerConnectionRef.current) {
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
    }
  };

  // Both: Add network routes as they are discovered
  const handleNewICECandidateMsg = async (candidate: RTCIceCandidateInit) => {
    try {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (e) {
      console.error("Error adding received ice candidate", e);
    }
  };

  // --- Phase 5: Cleanup ---
  const endCall = () => {
    // Notify the other user
    sendMessage(wsRef.current, "leave");

    // 1. Stop all camera/mic tracks
    if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
    }

    // 2. Reset the video elements
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

    // 3. Close the peer connection
    if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
    }

    // 4. Close WebSocket
    if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
    }

    // Reset UI states
    setIsCameraOn(false);
    setIsJoined(false);
    setIsCallActive(false);
  };

  // Automatically clean up when the user leaves the page or unmounts the component
  useEffect(() => {
    return () => {
      endCall();
    };
  }, [endCall]);

  // --- Render UI ---
  return (
    <div className="flex flex-col items-center justify-center p-4 bg-bg space-y-4 rounded-xl shadow-sm border border-gray-200 w-full max-w-4xl mx-auto mt-10 relative">
      <h2 className="text-2xl font-semibold text-primary mb-2">Video Call</h2>
      
      {/* Media Stage */}
      <div className="relative w-full aspect-video bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center shadow-inner">
        
        {/* Remote Video (Large / Background) */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />

        {/* Local Video (Small Picture-in-Picture / Bottom Right) */}
        <div className="absolute bottom-4 right-4 w-1/4 max-w-[200px] aspect-video bg-gray-800 rounded-lg overflow-hidden border-2 border-brand shadow-lg">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted // We must mute our own video so we don't hear our own echo
            className="w-full h-full object-cover transform -scale-x-100" // scale-x-100 mirrors the camera like a real mirror
          />
        </div>

        {/* Fallback text when there's no call active */}
        {!isCallActive && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500 font-medium">
            Waiting for video connection...
          </div>
        )}
      </div>

      {/* Control Buttons */}
      <div className="flex gap-4 flex-wrap justify-center mt-4">
        
        {!isCameraOn && (
          <button 
            onClick={startCamera} 
            className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-full transition shadow"
          >
            Start Camera
          </button>
        )}

        {isCameraOn && !isJoined && (
          <button 
            onClick={connectWebSocket} 
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition shadow"
          >
            Join Room
          </button>
        )}

        {isJoined && !isCallActive && (
          <button 
            onClick={makeCall} 
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-full transition shadow font-medium"
          >
            Call
          </button>
        )}

        {(isCameraOn || isJoined || isCallActive) && (
          <button 
            onClick={endCall} 
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full transition shadow font-medium"
          >
            End Call
          </button>
        )}
      </div>
    </div>
  );
}
