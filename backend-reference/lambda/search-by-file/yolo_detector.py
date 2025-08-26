#!/usr/bin/env python3
import sys
import json
import os
from ultralytics import YOLO
import supervision as sv
import cv2 as cv
import numpy as np

model_path = './model.pt'
_model = None

def load_model():
    global _model
    if _model is None:
        _model = YOLO(model_path)
    return _model

def run_detection(file_path, file_type, confidence=0.5):
    """
    Run YOLO detection on image or video file and return tags.
    """
    print(f"Running detection on {file_path} with type {file_type}")
    print(f"File exists: {os.path.exists(file_path)}")
    # Initialize YOLO model
    model = load_model()
    class_dict = model.names
    
    tag_counts = {}
    frame_count = 0
    
    if file_type == 'image':
        # Process image
        image = cv.imread(file_path)

        if image is None:
            raise ValueError(f"Could not load image: {file_path}")
        
        # Run detection
        results = model(image)[0]
        detections = sv.Detections.from_ultralytics(results)
        
        # Filter by confidence and count detections
        if detections.class_id is not None:
            filtered_detections = detections[detections.confidence > confidence]
            
            for cls_id in filtered_detections.class_id:
                species = class_dict[cls_id]
                tag_counts[species] = tag_counts.get(species, 0) + 1
                
    elif file_type == 'video':
        # Process video
        # Considering the application scenario, it's most useful to record the highest number of birds in a frame.
        cap = cv.VideoCapture(file_path)
        if not cap.isOpened():
            raise ValueError(f"Could not open video: {file_path}")
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            
            # Run detection on frame
            results = model(frame)[0]
            detections = sv.Detections.from_ultralytics(results)
            tag_counts_in_frame = {}
            # Filter by confidence and count detections
            if detections.class_id is not None:
                filtered_detections = detections[detections.confidence > confidence]
                
                for cls_id in filtered_detections.class_id:
                    species = class_dict[cls_id]
                    tag_counts_in_frame[species] = tag_counts_in_frame.get(species, 0) + 1

            for species, count in tag_counts_in_frame.items():
                if count > tag_counts.get(species, 0):
                    tag_counts[species] = count
            
            frame_count += 1
        cap.release()
    
    # Calculate average confidence (simplified)
    avg_confidence = confidence if len(tag_counts) > 0 else 0.0
    
    result = {
        'tags': tag_counts,
        'confidence': round(avg_confidence, 2),
        'processedFrames': frame_count if file_type == 'video' else 1
    }
    
    return result
    