@echo off
cd /d "%~dp0"
echo Installing required Python packages...
py -3 -m pip install -r requirements.txt
if errorlevel 1 python -m pip install -r requirements.txt
echo Generating the reproducible dataset and visualizations...
py -3 generate_dataset.py || python generate_dataset.py
py -3 visualize.py || python visualize.py
py -3 build_dashboard.py || python build_dashboard.py
echo Done. Opening the interactive dashboard...
start "" "%~dp0index.html"
pause
