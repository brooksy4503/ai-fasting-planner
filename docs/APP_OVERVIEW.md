# AI Fasting Planner - Complete Overview

This is a **command-line application** that generates personalized keto meal plans with 36-hour fasting support using AI. Here's what it does:

## 🎯 **Core Purpose**
- **AI-powered meal planning** for keto diets with intermittent fasting
- **36-hour fasting support** (typically Friday 8pm to Sunday 8am)
- **Personalized recommendations** based on your weight, height, age, sex, and activity level
- **Interactive waiting experience** with games and animations while the AI generates your meal plan

## 🚀 **Key Features**

### **1. Smart Meal Planning**
- Uses **xAI's Grok-4-Fast model** via OpenRouter API
- Generates 6-day meal plans (skips Saturday for fasting)
- Focuses on **home-cooked, low-carb meals** under 30 minutes prep time
- Avoids processed foods, sugary drinks, and high-carb items
- Includes detailed cooking instructions, ingredients, and nutritional macros

### **2. Interactive Waiting Experience**
While the AI generates your meal plan, you can choose from:
- **🍳 Cooking Animation** - Watch your AI chef in action
- **⏰ Fasting Clock** - Animated clock with progress messages
- **🔄 Food Transformation** - See ingredients transform into meals
- **🧠 Keto Quiz** - 4 interactive questions about keto and fasting
- **🔤 Word Scramble** - Unscramble nutrition terms
- **📚 Nutrition Facts** - Learn fascinating facts about keto and fasting
- **🎲 Random** - Let the app surprise you

### **3. Flexible Configuration**
- **Interactive prompts** for first-time users
- **Configuration files** to skip repetitive questions
- **Global settings** saved to `~/.ai-fasting-planner/config.json`
- **Custom prompt templates** for developers
- **Environment variables** for API keys

### **4. Advanced Features**
- **Detailed meal view** with ingredients, instructions, and macros
- **Export options** (text, JSON, shopping list)
- **Shopping list generation** from meal ingredients
- **Daily macro totals** calculation
- **OpenRouter analytics** integration for usage tracking

## 🛠 **Technical Architecture**

### **Built With:**
- **TypeScript** for type safety
- **Commander.js** for CLI interface
- **Inquirer.js** for interactive prompts
- **Chalk** for colorful terminal output
- **OpenRouter AI SDK** for AI integration
- **Zod** for data validation

### **File Structure:**
```
src/
├── index.ts              # Main CLI application
├── waitingExperience.ts  # Waiting experience orchestration
└── animations.ts         # Loading animations and mini-games
```

## 🎮 **User Experience Flow**

### **1. Setup** (first time): `fast-plan setup`
- Configure API key
- Set default preferences
- Set up app attribution

### **2. Generate Meal Plan**: `fast-plan generate`
- Answer questions about your goals and preferences
- Choose waiting experience
- AI generates personalized meal plan
- View detailed meal information
- Export options available

### **3. Configuration Management**: `fast-plan config`
- View current settings
- Modify configuration
- Clear saved data

## 📊 **Example Output**
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
```

## 🎯 **Target Users**
- **Keto dieters** looking for meal planning help
- **Intermittent fasters** wanting 36-hour fasting support
- **Health-conscious individuals** seeking AI-powered nutrition guidance
- **Developers** interested in AI integration and CLI tools

## 💡 **Unique Value Proposition**
This app combines **AI-powered meal planning** with **entertaining waiting experiences**, making the process of getting personalized nutrition advice both practical and engaging. The interactive games and animations turn what could be a boring wait time into an educational and fun experience.

The app is particularly well-suited for people who want structured meal planning with fasting support, appreciate detailed cooking instructions, and enjoy interactive terminal-based applications.

## 🔗 **Related Documentation**
- [WAITING_ANIMATIONS.md](./WAITING_ANIMATIONS.md) - Detailed guide to all waiting experiences
- [PROMPT_TEMPLATES.md](./PROMPT_TEMPLATES.md) - Custom prompt template system for developers
- [README.md](../README.md) - Installation and usage instructions
