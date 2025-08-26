import os
import uuid
from birdnet_analyzer.analyze.core import analyze

def run_model_on_audio_bytes(audio_bytes: bytes, file_format='wav') -> dict:
    # Temporarily save the audio file
    tmp_id = str(uuid.uuid4())
    tmp_input = f"/tmp/{tmp_id}.{file_format}"
    tmp_output_dir = f"/tmp/{tmp_id}_result"

    os.makedirs(tmp_output_dir, exist_ok=True)

    with open(tmp_input, "wb") as f:
        f.write(audio_bytes)

    # Run BirdNET analyze
    analyze(
        input=tmp_input,
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
                            tags[species] = tags.get(species, 0) + 1
    except Exception as e:
        print(f"[Error parsing output] {e}")

    # Clean up temporary files
    try:
        os.remove(tmp_input)
        for file in os.listdir(tmp_output_dir):
            os.remove(os.path.join(tmp_output_dir, file))
        os.rmdir(tmp_output_dir)
    except Exception as e:
        print(f"[Warning] Failed to clean up temp files: {e}")

    return tags