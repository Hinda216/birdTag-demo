import os
import uuid
import shutil
from birdnet_analyzer.analyze.core import analyze

def run_model_on_audio_bytes(file_path: str) -> dict:
    # Temporarily save the audio file
    tmp_output_dir = f"/tmp/{uuid.uuid4()}_result"

    os.makedirs(tmp_output_dir, exist_ok=True)

    # Run BirdNET analyze
    analyze(
        input=file_path,
        output=tmp_output_dir,
        min_conf=0.1,
        rtype="csv"
    )

    # Parse the CSV output and extract species tags
    tags = {}
    try:
        for file in os.listdir(tmp_output_dir):
            if file.endswith(".csv"):
                with open(os.path.join(tmp_output_dir, file), "r") as f:
                    for line in f:
                        parts = line.strip().split(",")
                        if len(parts) >= 5:
                            species = parts[3]
                            tags.setdefault(species, 1)
    except Exception as e:
        print(f"[Error parsing output] {e}")

    # Clean up temporary files
    try:    
        shutil.rmtree(tmp_output_dir)
    except Exception as e:
        print(f"[Warning] Failed to clean up temp files: {e}")

    return {
        'tags': tags
    }