# Game Bot Usage Guide

## Accessing the Bot

### Web Interface (Recommended)
1. Open the game in your browser
2. Click the **"Bot Control"** tab in the navigation bar
3. Configure and run the bot using the visual interface

### Browser Console (Advanced)
1. Open browser developer console (F12)
2. Use `botConsole` commands:
   ```javascript
   botConsole.examples()  // See example configurations
   botConsole.start({...}) // Start bot
   botConsole.stop()      // Stop and get report
   ```

## Web Interface Guide

### Configuration Panel

**Play Mode:**
- **Active**: Bot clicks continuously (10 clicks/sec) + makes optimal purchases
- **Passive**: Bot clicks sparingly (100 clicks/hour) + makes optimal purchases

**Speed:**
- **Real-time**: Runs at normal game speed
- **Simulated**: Accelerated gameplay
  - Use slider or preset buttons (10x, 100x, 1000x)
  - Higher speeds = faster testing

**Stop Condition:**
- **Max Prestiges**: Stop after N prestiges (e.g., 5)
- **Max Duration**: Stop after N seconds (e.g., 300 = 5 minutes)
- **Target SP**: Stop when reaching N strategy points (e.g., 100)

### Controls

- **Start Bot**: Begin automated gameplay
- **Pause**: Temporarily pause (can resume)
- **Resume**: Continue from pause
- **Stop**: End session and generate report

### Status Panel

Shows real-time information:
- Current mode and speed
- Elapsed time
- Number of prestiges completed
- Current SP count
- Last prestige duration

### Report Panel

After stopping, displays:
- Session summary (duration, total prestiges, SP gained)
- Per-prestige details (duration, clicks, multipliers, purchases)
- **Export JSON**: Download full session data

## Common Use Cases

### 1. Quick Balance Test
**Goal**: Test first few prestiges quickly

**Configuration:**
- Mode: Active
- Speed: Simulated (1000x)
- Stop: Max Prestiges (3-5)

**Why**: Fast iteration for early game balance

### 2. Early Game Analysis
**Goal**: Detailed analysis of progression to 100 SP

**Configuration:**
- Mode: Active
- Speed: Simulated (100x)
- Stop: Target SP (100)

**Why**: Focus on pre-influence balance

### 3. Passive Play Simulation
**Goal**: Test idle-focused gameplay

**Configuration:**
- Mode: Passive
- Speed: Simulated (100x)
- Stop: Max Prestiges (10)

**Why**: Ensure passive play is viable

### 4. Real-time Observation
**Goal**: Watch bot play in real-time

**Configuration:**
- Mode: Active
- Speed: Real-time
- Stop: Max Duration (300 seconds)

**Why**: Visual verification of bot behavior

### 5. Long-term Progression
**Goal**: Test progression over many prestiges

**Configuration:**
- Mode: Active
- Speed: Simulated (500x)
- Stop: Max Prestiges (20)

**Why**: Identify long-term balance issues

## Understanding Reports

### Summary Statistics
```
Average prestige duration: 9.0s
Total SP gained: 25
Final SP: 25
```
- Shows overall performance
- Compare across different configurations

### Per-Prestige Details
```
Prestige #0
  Duration: 12.3s
  SP: 0 → 5 (+5)
  Clicks: 123 manual / 123 total (10.00/s)
  Multipliers: Click x2.5, Idle x1.5, Strategy x1.0
  Purchases: 15 total
    Generators: Click Bot x10, Script Farm x5
    Upgrades: Double Click x1
```

**Key Metrics:**
- **Duration**: How long the prestige took
- **SP Progression**: Starting → Ending (+Gained)
- **Click Rate**: Manual clicks per second
- **Multipliers**: Final state of all multipliers
- **Purchases**: What the bot bought and when

## Tips

1. **Start Fast**: Use 1000x speed for quick tests
2. **Compare Modes**: Run same config in active vs passive
3. **Export Data**: Save JSON for later analysis
4. **Watch Patterns**: Look for purchase order consistency
5. **Check Balance**: Ensure progression feels smooth

## Troubleshooting

**Bot not starting:**
- Check that all configuration fields are filled
- Ensure stop condition has valid value

**Bot stops immediately:**
- Check stop condition (might be already met)
- Verify prestige threshold is reachable

**Report not showing:**
- Bot must complete at least one prestige
- Click "Stop" to generate report

**Performance issues:**
- Lower simulation speed
- Reduce max prestiges/duration
- Close other browser tabs

## Advanced: Chaining Simulations

1. Run first simulation
2. Click "Export JSON"
3. Save the `finalGameState` from JSON
4. Use game's import feature to load state
5. Run next simulation from that point

This allows testing specific game states without replaying from start.

## Bot Strategy

The bot uses efficiency-based purchasing:

**Efficiency Formula:**
```
Generator: (production_gain * multipliers) / cost
Upgrade: (estimated_value) / cost
```

**Purchase Priority:**
1. Calculate efficiency for all affordable items
2. Buy highest efficiency item
3. Repeat until nothing affordable

**Prestige Timing:**
- Minimum 30 seconds
- Can gain at least 1 SP
- Either 60+ seconds OR 10%+ SP gain

**Passive Click Allocation:**
- Early game: Use all clicks
- Mid/late: Only click when needed for purchases
- Cost/benefit analysis per click

## Interpreting Results

**Good Balance Indicators:**
- Consistent prestige durations
- Smooth SP progression curve
- Varied purchase patterns
- Both generators and upgrades purchased

**Balance Issues:**
- Extremely short/long prestiges
- Stagnant progression
- Only buying one type of item
- Huge gaps between prestiges

Use reports to identify and fix balance issues!
