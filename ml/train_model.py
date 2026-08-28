"""
Top-level train_model.py entry point
"""
import os
import sys

# Add ml directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from training.train_model import train_and_save

if __name__ == "__main__":
    train_and_save()
