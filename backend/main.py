from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os
from deepface import DeepFace
import librosa
import numpy as np
import imageio_ffmpeg
import subprocess

app = FastAPI(title="MoodMirror AI Engine")

# Allow React app to communicate with this server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For dev, allow all. In prod, use specific origins.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "MoodMirror AI Engine is running!"}

@app.post("/analyze/face")
async def analyze_face(file: UploadFile = File(...)):
    try:
        # Save the uploaded file temporarily
        temp_path = f"temp_{file.filename}"
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Run DeepFace emotion analysis
        results = DeepFace.analyze(img_path=temp_path, actions=['emotion'], enforce_detection=False)
        
        # Clean up temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)
            
        if not results or len(results) == 0:
            raise HTTPException(status_code=400, detail="No face detected")
            
        # Get the first face detected
        face = results[0]
        
        # Extract the dominant emotion and its confidence score
        dominant_emotion = face.get("dominant_emotion", "neutral")
        emotion_scores = face.get("emotion", {})
        confidence = emotion_scores.get(dominant_emotion, 0)
        
        # Map deepface emotions to MoodMirror format
        emotion_map = {
            "happy": "Happy",
            "sad": "Sad",
            "angry": "Stressed",
            "fear": "Anxious",
            "disgust": "Stressed",
            "surprise": "Surprised",
            "neutral": "Calm"
        }
        
        mapped_emotion = emotion_map.get(dominant_emotion, "Calm")
        
        # Convert numpy floats to native Python floats so FastAPI can return JSON
        python_confidence = float(confidence)
        python_raw_scores = {k: float(v) for k, v in emotion_scores.items()}
        
        return {
            "emotion": mapped_emotion,
            "confidence": round(python_confidence, 1),
            "raw_scores": python_raw_scores
        }
        
    except Exception as e:
        if 'temp_path' in locals() and os.path.exists(temp_path):
            os.remove(temp_path)
        raise HTTPException(status_code=500, detail=f"Error analyzing face: {str(e)}")

@app.post("/analyze/voice")
async def analyze_voice(file: UploadFile = File(...)):
    try:
        temp_webm = f"temp_{file.filename}"
        temp_wav = f"temp_{file.filename}.wav"
        
        # Save uploaded audio file
        with open(temp_webm, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Convert webm to wav because librosa/soundfile natively reads wav best
        ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
        try:
            subprocess.run([ffmpeg_exe, "-i", temp_webm, temp_wav, "-y"], check=True, capture_output=True, text=True)
        except subprocess.CalledProcessError as e:
            print(f"FFMPEG ERROR: {e.stderr}")
            raise ValueError(f"Failed to process audio format. FFMPEG says: {e.stderr}")
        
        # Load audio with librosa
        y, sr = librosa.load(temp_wav, sr=22050)
        
        # 1. RMS Energy (Volume/Intensity)
        rms = librosa.feature.rms(y=y)[0]
        mean_rms = np.mean(rms)
        
        # 2. Zero Crossing Rate (Roughness/Pitch variations)
        zcr = librosa.feature.zero_crossing_rate(y)[0]
        mean_zcr = np.mean(zcr)
        
        # 3. Tempo (Speaking rate)
        onset_env = librosa.onset.onset_strength(y=y, sr=sr)
        tempo, _ = librosa.beat.beat_track(onset_envelope=onset_env, sr=sr)
        tempo_val = float(np.ravel(tempo)[0])
        
        # Map acoustic features to emotional scores (DSP Heuristics)
        vol_score = min(100, (mean_rms / 0.1) * 100)
        pitch_score = min(100, (mean_zcr / 0.2) * 100)
        tempo_score = min(100, (tempo_val / 160.0) * 100)
        
        stress = min(100, max(0, (vol_score * 0.4 + tempo_score * 0.6)))
        calm = 100 - stress
        confidence = min(100, max(0, (vol_score * 0.6 + (100 - pitch_score) * 0.4)))
        
        breakdown = [
            {"name": "Calm", "value": round(float(calm))},
            {"name": "Stress", "value": round(float(stress))},
            {"name": "Confidence", "value": round(float(confidence))}
        ]
        
        overall_score = round(float(calm * 0.4 + confidence * 0.6))
        
        # Cleanup
        if os.path.exists(temp_webm): os.remove(temp_webm)
        if os.path.exists(temp_wav): os.remove(temp_wav)
        
        return {
            "overall_score": overall_score,
            "breakdown": breakdown
        }
        
    except Exception as e:
        if 'temp_webm' in locals() and os.path.exists(temp_webm): os.remove(temp_webm)
        if 'temp_wav' in locals() and os.path.exists(temp_wav): os.remove(temp_wav)
        raise HTTPException(status_code=500, detail=f"Error analyzing voice: {str(e)}")
