# AI Fasting Planner

AI-powered keto meal planner with 36-hour fasting support. Generate personalized meal plans tailored to your weight loss goals, activity level, and dietary preferences.

## Features

- 🥑 **Keto-focused meal planning** - Home-cooked, low-carb meals under 30 minutes prep time
- ⏰ **36-hour fasting support** - Meal plans that skip Saturday (Friday 8pm - Sunday 8am)
- 🎯 **Personalized recommendations** - Tailored to your weight, height, age, sex, and activity level
- 🚫 **No junk food** - Avoids pies, sausage rolls, sugary drinks, and processed foods
- ☕ **Fasting-friendly** - Includes tips for coffee with milk during fasting periods
- 🤖 **AI-powered** - Uses xAI's Grok-4-Fast model via OpenRouter for intelligent meal suggestions
- 🎮 **Interactive waiting experience** - Enjoy animations, mini-games, and educational content while your meal plan generates

## Quick Start

### 1. Get Your API Key

1. Visit [OpenRouter](https://openrouter.ai)
2. Sign up for a free account  
3. Get your API key from the dashboard

You'll be prompted for this key when you run the CLI, or you can set it as an environment variable (see Configuration section below).

### 2. Installation

#### Option A: Install from npm (Recommended for end users)

```bash
# Install globally
npm install -g ai-fasting-planner

# Or use without installing
npx ai-fasting-planner generate
```

#### Option B: Clone and build (For development)

```bash
# Clone or download the project
cd ai-fasting-planner

# Install dependencies
npm install

# Build the project
npm run build
```

### 3. Configure Your API Key (Optional)

You can either enter your API key when prompted, or set it as an environment variable to avoid entering it each time:

```bash
# Set as environment variable (recommended)
export OPENROUTER_API_KEY=your_actual_api_key_here

# Optional: Configure app attribution for OpenRouter analytics
export APP_URL=https://github.com/your-username/ai-fasting-planner
export APP_TITLE="AI Fasting Planner"
```

**For development**: Create a `.env.local` file in the project directory:
```bash
# .env.local file (development only)
OPENROUTER_API_KEY=your_actual_api_key_here
APP_URL=https://github.com/your-username/ai-fasting-planner
APP_TITLE=AI Fasting Planner
```

### 4. Run the CLI

#### If installed globally via npm:
```bash
# Run the meal planner
fast-plan

# Or explicitly use the generate command
fast-plan generate
```

#### If using npx (no installation):
```bash
# Run the meal planner
npx ai-fasting-planner

# Or explicitly use the generate command  
npx ai-fasting-planner generate
```

#### If cloned for development:
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
- **Waiting experience** (Choose from animations, games, or educational content)
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

## 🎮 Interactive Waiting Experience

While your AI chef prepares your personalized meal plan, enjoy these fun and educational experiences:

### 🎨 Available Experiences

- **🍳 Cooking Animation** - Watch your AI chef in action with animated cooking steps
- **⏰ Fasting Clock** - Animated clock faces showing meal planning progress
- **🔄 Food Transformation** - See ingredients transform into delicious meals
- **🌀 Spinner** - Clean, modern loading spinner with progress messages
- **🧠 Keto Quiz** - Test your nutrition knowledge with 4 interactive questions
- **🔤 Word Scramble** - Unscramble nutrition and fasting terms
- **📚 Nutrition Facts** - Learn fascinating facts about keto and fasting
- **🎲 Random** - Let the app surprise you with a random experience!

### 🚀 How It Works

When you run `fast-plan generate`, you'll be prompted to choose your waiting experience:

```
While your AI chef prepares your meal plan, what would you like to do?
❯ 🎲 Surprise me! (Random experience)
  🍳 Watch the cooking animation
  🧠 Play keto knowledge quiz
  🔤 Word scramble game
  📚 Learn nutrition facts
  ⏰ See the fasting clock
  🔄 Food transformation animation
  🌀 Simple loading spinner
```

### 🎬 Demo

Want to see all animations in action? Run the demo:

```bash
# If installed globally
node demos/demo-animations.mjs

# If cloned for development
node demos/demo-animations.js
```

### 🎯 Features

- **Interactive Games**: Quiz and word scramble keep you engaged
- **Educational**: Learn about keto and fasting while you wait
- **Non-blocking**: Animations don't slow down meal plan generation
- **Terminal-safe**: Works in all terminal environments
- **Smart timing**: Games play before API calls, animations during

For complete details about all available animations and games, see [WAITING_ANIMATIONS.md](docs/WAITING_ANIMATIONS.md).

## Using Configuration Files

You can skip the interactive prompts by creating a configuration file with your preferences.

### Creating Your Own Config File

Create a JSON file anywhere on your system with any combination of these fields:

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

### Using Your Config File

```bash
# If installed globally via npm
fast-plan generate --config /path/to/your-config.json

# Or using npx
npx ai-fasting-planner generate --config ./my-config.json

# Example with a config file in your home directory
fast-plan generate --config ~/fasting-config.json
```

### Config File Options

**Diet Options:**
- `"Keto"` - Ketogenic diet (default)
- `"Low-Carb"` - Low carbohydrate diet
- `"Custom"` - Custom dietary preferences

**Activity Level Options:**
- `"Sedentary (little to no exercise, <2k steps/day)"`
- `"Lightly Active (light exercise, 1-3 days/week, 3-5k steps)"`
- `"Moderately Active (moderate exercise, 3-5 days/week, 5-10k steps)"`
- `"Very Active (intense exercise, 6-7 days/week, >10k steps)"`

**Sex Options:**
- `"Male"`
- `"Female"`
- `"Other"`

### Partial Configuration

You don't need to specify all fields! Any fields not included in your config file will still prompt you interactively. This allows you to:

- Pre-fill only the fields that rarely change (like age, height, sex)
- Create different configs for different goals
- Share configs with family members who have similar profiles

**Example minimal config:**
```json
{
  "sex": "Female",
  "age": "28",
  "height": "5'6\"",
  "diet": "Keto"
}
```

## Development & Testing

For developers working on this project, test configuration files are available in the repository:

```bash
# Development testing (requires cloned repository)
npm run dev -- generate --config test-config.json
node dist/index.js generate --config test-config-female.json
```

**Note**: Test config files are only available during development and are not included in the npm package.

### Prompt Template Testing

The project includes a powerful prompt template system for testing different AI prompt variations during development. This allows you to quickly experiment with different prompt styles without modifying code.

```bash
# Test different prompt templates
fast-plan generate -c test-prompt-detailed.json  # Detailed with cooking instructions
fast-plan generate -c test-prompt-simple.json    # Quick meal names only
fast-plan generate -c test-prompt-budget.json    # Budget-friendly focus
```

#### Creating Custom Prompt Templates

Create a JSON file with a `promptTemplate` field that supports variable substitution:

```json
{
    "promptTemplate": "Your custom prompt with ${finalAnswers.sex}, ${finalAnswers.age} variables...",
    "fastingStart": "Friday 8pm",
    "fastingEnd": "Sunday 8am",
    "diet": "Keto",
    "currentWeight": "180 lbs",
    "targetWeight": "160 lbs",
    "sex": "Male",
    "age": "35",
    "height": "5'10\"",
    "timeframe": "6 months",
    "activityLevel": "Moderately Active (moderate exercise, 3-5 days/week, 5-10k steps)"
}
```

#### Available Template Variables

- `${finalAnswers.sex}` - Male/Female/Other
- `${finalAnswers.age}` - Age in years  
- `${finalAnswers.height}` - Height (e.g., "5'10\"")
- `${finalAnswers.currentWeight}` - Current weight (e.g., "180 lbs")
- `${finalAnswers.targetWeight}` - Target weight (e.g., "160 lbs")
- `${finalAnswers.timeframe}` - Time to reach goal (e.g., "6 months")
- `${finalAnswers.activityLevel}` - Activity level description
- `${finalAnswers.fastingStart}` - Fasting start time (e.g., "Friday 8pm")
- `${finalAnswers.fastingEnd}` - Fasting end time (e.g., "Sunday 8am")
- `${finalAnswers.diet}` - Diet type (Keto/Low-Carb/Custom)

#### Debug Logging

When using custom prompt templates, debug information is automatically displayed:

```
🧪 Using custom prompt template from config
📋 Final answers: { sex: 'Male', age: '35', ... }
📝 Raw template: Your custom prompt with ${finalAnswers.sex}...
🔄 Evaluated prompt: Your custom prompt with Male...
```

For default prompts, enable debug logging with:
```bash
DEBUG_PROMPT=1 fast-plan generate
```

See [PROMPT_TEMPLATES.md](PROMPT_TEMPLATES.md) for complete documentation.

## OpenRouter Analytics & Attribution

This app includes OpenRouter app attribution to track usage analytics and appear in OpenRouter's public rankings. This helps monitor API usage patterns and showcases the app to the OpenRouter developer community.

### Benefits

- **Public App Rankings**: Your app appears in [OpenRouter's rankings](https://openrouter.ai/rankings) with daily, weekly, and monthly leaderboards
- **Model Analytics**: View detailed analytics at `openrouter.ai/apps?url=<your-app-url>` showing:
  - Model usage over time
  - Token consumption patterns
  - Historical usage trends
- **Professional Visibility**: Showcase your app to the OpenRouter developer community

### Configuration

App attribution is configured via environment variables:

```bash
# Your app's URL (used as primary identifier)
APP_URL=https://github.com/your-username/ai-fasting-planner

# Your app's display name in rankings
APP_TITLE=AI Fasting Planner
```

If not configured, the app will use default values. For localhost development, make sure to set `APP_TITLE` to enable tracking.

### Analytics Access

Once configured and after making API calls, you can view your app's analytics at:
`https://openrouter.ai/apps?url=<your-app-url>`

For more information, see the [OpenRouter App Attribution documentation](https://openrouter.ai/docs/app-attribution).

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
│   ├── index.ts          # Main CLI application
│   ├── animations.ts     # Loading animations and mini-games
│   └── waitingExperience.ts # Waiting experience orchestration
├── dist/
│   ├── index.js          # Built JavaScript (after npm run build)
│   ├── animations.js     # Built animations
│   └── waitingExperience.js # Built waiting experience
├── demos/
│   ├── demo-animations.js    # Animation demo (CommonJS)
│   └── demo-animations.mjs   # Animation demo (ES modules)
├── docs/
│   ├── README.md         # This file
│   ├── PROMPT_TEMPLATES.md # Prompt template documentation
│   └── WAITING_ANIMATIONS.md # Detailed animation documentation
├── .env.local           # Your API keys and config (create this)
├── .env.example         # Example environment file
├── .gitignore           # Git ignore rules
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
└── test-*.json         # Test configuration files
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
