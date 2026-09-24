import os
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"
os.environ["HF_HUB_DISABLE_PROGRESS_BARS"] = "1"

print("Starting model download...")
from transformers import AutoModelForCausalLM, AutoTokenizer

model_id = "Qwen/Qwen2.5-0.5B-Instruct"
print(f"Downloading tokenizer for {model_id}...")
tokenizer = AutoTokenizer.from_pretrained(model_id)

print(f"Downloading model for {model_id} (this may take a few minutes depending on internet speed)...")
model = AutoModelForCausalLM.from_pretrained(model_id)

print("Download complete!")
