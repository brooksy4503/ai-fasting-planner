# 🎮 Waiting Animations & Mini-Games

While your AI chef prepares your personalized meal plan, enjoy these fun interactive experiences!

## 🎨 Available Experiences

### 🍳 **Cooking Animation**
Watch your AI chef in action with animated cooking steps:
- Chopping vegetables
- Mixing ingredients  
- Seasoning to taste
- Planning your meals

### ⏰ **Fasting Clock**
Animated clock faces showing the meal planning progress with messages like:
- "Analyzing your nutritional needs..."
- "Calculating perfect macros..."
- "Crafting your meal timeline..."

### 🔄 **Food Transformation**
See ingredients transform into delicious meals:
- 🥬 → 🥗 Fresh ingredients
- 🥩 → 🍖 Quality proteins
- 🥑 → 🥙 Healthy fats

### 🌀 **Spinner**
Clean, modern loading spinner with custom progress messages.

### 🧠 **Keto Quiz**
Test your nutrition knowledge with 4 interactive questions:
- Carb limits on keto
- Keto-friendly foods
- Fasting benefits
- Best fat sources

Each question includes explanations to help you learn!

### 🔤 **Word Scramble**
Unscramble nutrition and fasting terms:
- KETOSIS → Fat-burning metabolic state
- AVOCADO → Green superfood fruit
- AUTOPHAGY → Cellular cleanup process

### 📚 **Nutrition Facts**
Learn fascinating facts while you wait:
- "Ketosis typically begins 12-16 hours into a fast"
- "Your brain can run on ketones for fuel"
- "Fasting can increase growth hormone by up to 5x"

### 🎲 **Random**
Can't decide? Let the app surprise you with a random experience!

## 🚀 How to Use

When you run `fast-plan generate`, you'll see:

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

Simply choose your preferred experience and enjoy!

## 🎬 Demo

Want to see all animations in action? Run:
```bash
node demo-animations.mjs
```

## 🎯 Features

- **Interactive Games**: Quiz and word scramble keep you engaged
- **Educational**: Learn about keto and fasting while you wait
- **Non-blocking**: Animations don't slow down meal plan generation
- **Terminal-safe**: Works in all terminal environments
- **Smart timing**: Games play before API calls, animations during

## 🔧 Technical Details

The waiting experience system is built with:
- TypeScript for type safety
- Chalk for colorful terminal output
- Inquirer for interactive prompts
- Modular design for easy extension

Add new animations by extending the `LoadingAnimations` class or create new mini-games by following the `KetoQuiz` pattern.
