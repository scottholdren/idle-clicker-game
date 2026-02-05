# Asymptote Game Bot

Automated testing bot for game balance analysis.

## Overview

The Game Bot plays Asymptote automatically using optimal strategies, logging all decisions and performance metrics. It's designed for testing game balance, especially the early-to-mid game progression before influence unlocks.

## Features

- **Two Play Modes:**
  - **Active**: Continuous clicking (10 clicks/sec) + optimal purchasing
  - **Passive**: 100 clicks/hour with cost/benefit allocation + optimal purchasing

- **Speed Options:**
  - **Real-time**: Plays at normal game speed
  - **Simulated**: Accelerated gameplay (configurable multiplier, e.g., 10x, 100x, 1000x)

- **Optimal Strategy:**
  - Purchases generators/upgrades based on efficiency (production gain per cost)
  - Auto-prestiges when beneficial
  - Auto-purchases influence (but deprioritized for early game balance testing)

- **Comprehensive Logging:**
  - Per-prestige logs (purchases, multipliers, duration, click rates)
  - Summary statistics
  - Exportable JSON data
  - Final game state export for simulation chaining

## Usage

### Browser Console Access

The bot is accessible via `window.botConsole` in your browser's developer console.

### Quick Start

```javascript
// See all available commands
botConsole.examples()

// Start a quick test (active mode, 1000x speed, 3 prestiges)
botConsole.start({
  mode: "active",
  speed: "simulated",
  simulationSpeed: 1000,
  maxPrestiges: 3
})

// Stop and view results
botConsole.stop()
botConsole.report()
```

### Configuration Options

```typescript
interface BotConfig {
  mode: 'active' | 'passive'
  speed: 'realtime' | 'simulated'
  simulationSpeed?: number      // For simulated mode (e.g., 10 = 10x speed)
  maxPrestiges?: number          // Stop after N prestiges
  maxDuration?: number           // Stop after N milliseconds
  targetSP?: number              // Stop when reaching this many SP
}
```

### Example Configurations

#### 1. Active Mode - Real-time - 5 Prestiges
```javascript
botConsole.start({
  mode: "active",
  speed: "realtime",
  maxPrestiges: 5
})
```

#### 2. Active Mode - Simulated 10x - Until 100 SP
```javascript
botConsole.start({
  mode: "active",
  speed: "simulated",
  simulationSpeed: 10,
  targetSP: 100
})
```

#### 3. Passive Mode - Simulated 100x - 10 Prestiges
```javascript
botConsole.start({
  mode: "passive",
  speed: "simulated",
  simulationSpeed: 100,
  maxPrestiges: 10
})
```

#### 4. Passive Mode - Real-time - 5 minutes
```javascript
botConsole.start({
  mode: "passive",
  speed: "realtime",
  maxDuration: 300000  // 5 minutes in ms
})
```

#### 5. Quick Balance Test - 1000x Speed
```javascript
botConsole.start({
  mode: "active",
  speed: "simulated",
  simulationSpeed: 1000,
  maxPrestiges: 3
})
```

### Commands

- `botConsole.start(config)` - Start the bot with configuration
- `botConsole.stop()` - Stop the bot and generate report
- `botConsole.pause()` - Pause the bot
- `botConsole.resume()` - Resume the bot
- `botConsole.status()` - Get current status
- `botConsole.report()` - Print last session report
- `botConsole.export()` - Export last session as JSON
- `botConsole.examples()` - Show example configurations

## Strategy Details

### Purchase Efficiency Calculation

The bot calculates efficiency for each possible purchase:

**Generators:**
```
efficiency = (production_gain * idle_multiplier) / cost
```

**Upgrades:**
```
efficiency = estimated_value / cost
```

Where estimated_value depends on upgrade type:
- Click multipliers: `current_click_value * multiplier_gain`
- Idle multipliers: `current_idle_production * multiplier_gain`
- Generator boosts: `target_generator_production * multiplier_gain`

**Influence:**
- Intentionally low priority (0.1 efficiency) to focus on pre-influence balance

### Prestige Decision

The bot prestiges when:
1. Minimum 30 seconds have passed, AND
2. Can gain at least 1 SP, AND
3. Either:
   - 60+ seconds have passed, OR
   - Can gain 10%+ more SP

### Passive Mode Click Allocation

In passive mode (100 clicks/hour):
- Early game: Use all clicks to bootstrap
- Mid/late game: Use clicks only when needed for valuable purchases
- Cost/benefit analysis determines if clicks should be spent or saved

## Report Format

The bot generates detailed reports including:

### Summary Statistics
- Total duration
- Total prestiges completed
- Average prestige duration
- Total SP gained
- Final SP count

### Per-Prestige Details
- Duration
- SP progression (start → end, +gained)
- Click statistics (manual/total, rate)
- Final multipliers (click, idle, strategy, engagement)
- Purchase breakdown by type
- Final currency state

### Example Report Output
```
================================================================================
BOT SESSION REPORT
================================================================================
Session ID: bot-1234567890
Mode: active
Speed: simulated (100x)
Total Duration: 45.2s
Total Prestiges: 5

SUMMARY STATISTICS
  Average prestige duration: 9.0s
  Total SP gained: 25
  Final SP: 25

--------------------------------------------------------------------------------
PRESTIGE DETAILS
--------------------------------------------------------------------------------

Prestige #0
  Duration: 12.3s
  SP: 0 → 5 (+5)
  Clicks: 123 manual / 123 total (10.00/s)
  Multipliers: Click x2.5, Idle x1.5, Strategy x1.0, Engagement x1.0
  Purchases: 15 total
    Generators: Click Bot x10, Script Farm x5
    Upgrades: Double Click x1, Idle Boost x1
...
```

## Exporting Data

Export session data for analysis or simulation chaining:

```javascript
// Export as JSON
const json = botConsole.export()

// Copy to clipboard or save to file
// The JSON includes:
// - All prestige logs
// - Purchase history
// - Final game state (for loading into new simulation)
```

## Use Cases

### 1. Early Game Balance Testing
```javascript
// Test first 5 prestiges in active mode
botConsole.start({
  mode: "active",
  speed: "simulated",
  simulationSpeed: 100,
  maxPrestiges: 5
})
```

### 2. Passive Progression Analysis
```javascript
// Simulate 24 hours of passive play
botConsole.start({
  mode: "passive",
  speed: "simulated",
  simulationSpeed: 3600,  // 1 hour per second
  maxDuration: 24000      // 24 seconds = 24 simulated hours
})
```

### 3. SP Milestone Testing
```javascript
// Test progression to 100 SP
botConsole.start({
  mode: "active",
  speed: "simulated",
  simulationSpeed: 500,
  targetSP: 100
})
```

## Architecture

### Components

- **GameBot** (`GameBot.ts`) - Main orchestrator
  - Manages game loop
  - Handles active/passive modes
  - Controls simulation speed
  - Tracks stop conditions

- **BotStrategy** (`BotStrategy.ts`) - Decision making
  - Purchase efficiency calculations
  - Prestige timing decisions
  - Passive click allocation

- **BotLogger** (`BotLogger.ts`) - Data collection
  - Per-prestige logging
  - Purchase tracking
  - Report generation
  - JSON export

- **BotConsole** (`BotConsole.ts`) - User interface
  - Browser console API
  - Command handling
  - Report display

## Tips

1. **Start with fast simulations** (1000x) for quick iteration
2. **Use passive mode** to test idle-focused balance
3. **Export data** after each run for comparison
4. **Focus on pre-influence** balance by checking early prestiges
5. **Compare active vs passive** to ensure both playstyles are viable

## Future Enhancements

Potential additions:
- Multiple strategy profiles (aggressive, conservative, balanced)
- A/B testing between strategies
- Automated balance recommendations
- Visual charts/graphs of progression
- Batch simulation runner
- Statistical analysis tools
