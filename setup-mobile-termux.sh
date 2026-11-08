#!/data/data/com.termux/files/usr/bin/bash
# ==============================================================================
#  ITHI POORAM POS - 1-CLICK STANDALONE ANDROID INSTALLER (TERMUX)
#  Runs the complete Node.js POS & Database locally on your phone without laptop!
# ==============================================================================

echo "========================================================"
echo "    ITHI POORAM POS - STANDALONE MOBILE INSTALLER       "
echo "========================================================"
echo ""

# 1. Update packages and install Node.js and Git
echo "[1/5] Installing Node.js, Git & dependencies on Android..."
pkg update -y && pkg install -y nodejs-lts git

# 2. Setup storage permission (optional)
# termux-setup-storage

# 3. Clone or pull latest Ithi Pooram repo
POS_DIR="$HOME/IthiPooram_POS"
if [ -d "$POS_DIR" ]; then
    echo "[2/5] Updating existing POS code..."
    cd "$POS_DIR"
    git pull origin main
else
    echo "[2/5] Cloning Ithi Pooram POS repository..."
    git clone https://github.com/adithiyanpv6-glitch/ITHIPOORAM.git "$POS_DIR"
    cd "$POS_DIR"
fi

cd "$POS_DIR/main-billing-admin-app"

# 4. Install dependencies and build production app
echo "[3/5] Installing npm packages (first-time only)..."
npm install --omit=dev

echo "[4/5] Building optimized standalone POS bundle..."
npm run build

# 5. Create 1-tap start script for daily opening
START_SCRIPT="$HOME/start-pos.sh"
cat << 'EOF' > "$START_SCRIPT"
#!/data/data/com.termux/files/usr/bin/bash
cd $HOME/IthiPooram_POS/main-billing-admin-app
echo "Starting Ithi Pooram POS on http://localhost:3000..."
termux-open-url "http://localhost:3000" 2>/dev/null || am start -a android.intent.action.VIEW -d "http://localhost:3000" 2>/dev/null
npm run start -- -p 3000
EOF

chmod +x "$START_SCRIPT"

echo ""
echo "========================================================"
echo "  [SUCCESS] ITHI POORAM POS IS READY ON YOUR PHONE!     "
echo "========================================================"
echo "To start the POS any day, simply type:  ./start-pos.sh"
echo "Opening POS counter in your phone browser now..."
echo ""

# Launch browser and start server
termux-open-url "http://localhost:3000" 2>/dev/null || am start -a android.intent.action.VIEW -d "http://localhost:3000" 2>/dev/null
npm run start -- -p 3000
