# AI Fasting Planner

AI-powered keto meal planner with 36-hour fasting support. Generate personalized meal plans tailored to your weight loss goals, activity level, and dietary preferences.

## Features

- 🥑 **Keto-focused meal planning** - Home-cooked, low-carb meals under 30 minutes prep time
- ⏰ **36-hour fasting support** - Meal plans that skip Saturday (Friday 8pm - Sunday 8am)
- 🎯 **Personalized recommendations** - Tailored to your weight, height, age, sex, and activity level
- 🚫 **No junk food** - Avoids pies, sausage rolls, sugary drinks, and processed foods
- ☕ **Fasting-friendly** - Includes tips for coffee with milk during fasting periods
- 🤖 **AI-powered** - Uses xAI's Grok-4-Fast model via OpenRouter for intelligent meal suggestions

## Quick Start

### 1. First-Time Setup

```bash
# 1. Copy the example environment file
cp .env.example .env.local

# 2. Edit .env.local and add your OpenRouter API key
# OPENROUTER_API_KEY=your_actual_api_key_here
```

### 2. Installation

```bash
# Clone or download the project
cd ai-fasting-planner

# Install dependencies
npm install

# Build the project
npm run build
```

### 3. Configure Your API Key

1. Visit [OpenRouter](https://openrouter.ai)
2. Sign up for a free account
3. Get your API key from the dashboard
4. Add it to your `.env.local` file:

```bash
# Edit .env.local file
OPENROUTER_API_KEY=your_actual_api_key_here
```

**Alternative**: Set as environment variable:
```bash
export OPENROUTER_API_KEY=your_key_here
```

### 4. Run the CLI

```bash
# Using npm script (development)
npm start

# Or using the built version
node dist/index.js

# Or with the generate command explicitly
npm start generate
```

## Usage

The CLI will prompt you for:

- **Fasting window** (default: Friday 8pm - Sunday 8am)
- **Diet type** (Keto, Low-Carb, or Custom)
- **Current weight** (e.g., 200 lbs)
- **Target weight** (e.g., 180 lbs)
- **Timeframe** (e.g., 6 months)
- **Personal details** (sex, age, height)
- **Activity level** (Sedentary to Very Active)
- **OpenRouter API Key** (if not set as environment variable)

### Example Output

```
Your Keto Meal Plan (Fasting: Friday 8pm - Sunday 8am)
┌───────────┬─────────────────────────────────────────────────────────┐
│ Day       │ Meal                                                    │
├───────────┼─────────────────────────────────────────────────────────┤
│ Sunday    │ Scrambled eggs with avocado and spinach                 │
│ Monday    │ Grilled chicken salad with olive oil dressing          │
│ Tuesday   │ Salmon with roasted broccoli and cauliflower           │
│ Wednesday │ Beef stir-fry with zucchini noodles                    │
│ Thursday  │ Pork chops with green beans and butter                 │
│ Friday    │ Tuna salad with mixed greens (before fasting)          │
└───────────┴─────────────────────────────────────────────────────────┘

Tips from my weight loss:
- Ditched pies & sugary drinks—home-cooked meals were my win.
- Coffee with milk kept me going during 36-hour fasts.
- Hydrate on fasting days to stay sharp.
```

## Testing

For quick testing without manually entering all the prompts, you can use pre-configured JSON files:

### Using Test Configuration Files

```bash
# Method 1: Use npm run with -- to pass arguments
npm run dev -- generate --config test-config.json

# Method 2: Use the built version directly (recommended for testing)
node dist/index.js generate --config test-config.json

# Method 3: Use ts-node directly
npx ts-node src/index.ts generate --config test-config.json

# Test with different configurations
node dist/index.js generate --config test-config-female.json
node dist/index.js generate --config test-config-minimal.json
```

### Available Test Configurations

- **`test-config.json`** - Complete male profile (35yr, 200→180 lbs, moderately active)
- **`test-config-female.json`** - Female profile (28yr, 150→130 lbs, very active)
- **`test-config-minimal.json`** - Minimal config (only required fields, will prompt for others)

### Creating Custom Test Configs

Create your own JSON file with any combination of these fields:

```json
{
  "fastingStart": "Friday 8pm",
  "fastingEnd": "Sunday 8am",
  "diet": "Keto",
  "currentWeight": "200 lbs",
  "targetWeight": "180 lbs",
  "timeframe": "6 months",
  "sex": "Male",
  "age": "35",
  "height": "5'10\"",
  "activityLevel": "Moderately Active (moderate exercise, 3-5 days/week, 5-10k steps)"
}
```

**Note**: Any fields not specified in the config file will still prompt you interactively. This allows for partial automation where you only pre-fill the fields you want to test with.

## Development

```bash
# Run in development mode
npm start

# Build the project
npm run build

# View help
npm start -- --help
```

## Project Structure

```
ai-fasting-planner/
├── src/
│   └── index.ts          # Main CLI application
├── dist/
│   └── index.js          # Built JavaScript (after npm run build)
├── .env.local           # Your API keys and config (create this)
├── .env.example         # Example environment file
├── .gitignore           # Git ignore rules
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
└── README.md           # This file
```

## Troubleshooting

### Package Installation Issues
- Ensure npm version is up to date: `npm -v` (should be 10+)
- Clear npm cache: `npm cache clean --force`

### TypeScript Errors
- Ensure `ts-node` is available: `npm install -g ts-node`
- Restart your terminal if imports fail

### API Call Failures
- Verify your OpenRouter API key is valid
- Check that you have sufficient credits in your OpenRouter account
- Test with a shorter prompt first if needed

### Parsing Issues
- The current parsing is basic (Day 1 implementation)
- Day 4 will include more robust parsing with regex patterns
- Placeholders will appear if parsing fails

## Roadmap

- **Day 2**: Refine prompts and parsing
- **Day 3**: Add more dietary options and customization
- **Day 4**: Robust parsing and error handling
- **Day 5**: Enhanced UI and additional features

## License

ISC
