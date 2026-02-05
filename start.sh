#!/bin/bash
echo "🚀 Starting Fantasy API on Railway..."
python3 generate_data.py
gunicorn api_server_complete:app
