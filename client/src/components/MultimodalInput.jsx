/**
 * Multimodal Input Component
 * Handles text, voice, and image input for Kiro AI processing
 */

import React, { useState, useRef, useCallback } from 'react';
import kiroAIService from '../services/kiroAIService';

const MultimodalInput = ({ 
  onResult, 
  context = {}, 
  placeholder = "Ask Kiro AI anything...",
  className = "" 
}) => {
  const [inputMode, setInputMode] = useState('text');
  const [textInput, setTextInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState(null);

  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordingIntervalRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Text input handling
  const handleTextSubmit = async (e) => {
    e.preventDefault();
    if (!textInput.trim() || isProcessing) return;

    setIsProcessing(true);
    setError(null);

    try {
      const result = await kiroAIService.processMultimodalInput('text', textInput, context);
      onResult(result);
      setTextInput('');
    } catch (error) {
      setError('Failed to process text input');
      console.error('Text processing error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Voice input handling
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await processVoiceInput(audioBlob);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start recording timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      setError('Failed to access microphone');
      console.error('Recording error:', error);
    }
  }, [context]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  }, [isRecording]);

  const processVoiceInput = async (audioBlob) => {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await kiroAIService.processVoiceInput(audioBlob, context);
      onResult(result);
    } catch (error) {
      setError('Failed to process voice input');
      console.error('Voice processing error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Image input handling
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image file too large. Please select a file under 10MB');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const result = await kiroAIService.processImageInput(file, context);
      onResult(result);
    } catch (error) {
      setError('Failed to process image');
      console.error('Image processing error:', error);
    } finally {
      setIsProcessing(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const formatRecordingTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`multimodal-input bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-4 ${className}`}>
      {/* Input Mode Selector */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setInputMode('text')}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            inputMode === 'text'
              ? 'bg-blue-500 text-white shadow-lg'
              : 'bg-white/10 text-gray-300 hover:bg-white/20'
          }`}
        >
          💬 Text
        </button>
        <button
          onClick={() => setInputMode('voice')}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            inputMode === 'voice'
              ? 'bg-blue-500 text-white shadow-lg'
              : 'bg-white/10 text-gray-300 hover:bg-white/20'
          }`}
        >
          🎤 Voice
        </button>
        <button
          onClick={() => setInputMode('image')}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            inputMode === 'image'
              ? 'bg-blue-500 text-white shadow-lg'
              : 'bg-white/10 text-gray-300 hover:bg-white/20'
          }`}
        >
          🖼️ Image
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-200 text-sm">
          {error}
        </div>
      )}

      {/* Text Input Mode */}
      {inputMode === 'text' && (
        <form onSubmit={handleTextSubmit} className="space-y-3">
          <div className="relative">
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={placeholder}
              className="w-full p-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
              rows={3}
              disabled={isProcessing}
            />
            {textInput && (
              <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                {textInput.length} characters
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={!textInput.trim() || isProcessing}
            className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Processing...
              </>
            ) : (
              <>
                <span>✨</span>
                Ask Kiro AI
              </>
            )}
          </button>
        </form>
      )}

      {/* Voice Input Mode */}
      {inputMode === 'voice' && (
        <div className="space-y-4">
          <div className="text-center">
            {!isRecording && !isProcessing && (
              <button
                onClick={startRecording}
                className="w-20 h-20 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-2xl transition-colors shadow-lg"
              >
                🎤
              </button>
            )}
            
            {isRecording && (
              <div className="space-y-3">
                <button
                  onClick={stopRecording}
                  className="w-20 h-20 bg-red-600 text-white rounded-full flex items-center justify-center text-2xl animate-pulse shadow-lg"
                >
                  ⏹️
                </button>
                <div className="text-white">
                  Recording: {formatRecordingTime(recordingTime)}
                </div>
              </div>
            )}

            {isProcessing && (
              <div className="space-y-3">
                <div className="w-20 h-20 bg-blue-500 text-white rounded-full flex items-center justify-center text-2xl shadow-lg">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
                </div>
                <div className="text-white">Processing audio...</div>
              </div>
            )}
          </div>
          
          <div className="text-center text-sm text-gray-400">
            {!isRecording && !isProcessing && "Click to start recording"}
            {isRecording && "Click to stop recording"}
            {isProcessing && "Analyzing your voice input..."}
          </div>
        </div>
      )}

      {/* Image Input Mode */}
      {inputMode === 'image' && (
        <div className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-white/30 rounded-lg p-8 text-center cursor-pointer hover:border-white/50 hover:bg-white/5 transition-all"
          >
            {isProcessing ? (
              <div className="space-y-3">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto"></div>
                <div className="text-white">Processing image...</div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-4xl">🖼️</div>
                <div className="text-white font-medium">Upload an image</div>
                <div className="text-sm text-gray-400">
                  Sketches, mockups, diagrams, or screenshots
                  <br />
                  Max 10MB • PNG, JPG, GIF, WebP
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Processing Indicator */}
      {isProcessing && (
        <div className="mt-4 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-200 text-sm flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-400 border-t-transparent"></div>
          Kiro AI is analyzing your input...
        </div>
      )}
    </div>
  );
};

export default MultimodalInput;