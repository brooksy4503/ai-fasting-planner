#!/usr/bin/env node

// Demo script to showcase all the waiting animations
// Run with: node demo-animations.js

import { LoadingAnimations, KetoQuiz, WordScramble, NutritionFacts } from './dist/animations.js';
import chalk from 'chalk';

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function demoAnimations() {
    console.log(chalk.cyan('🎬 Welcome to the AI Fasting Planner Animation Demo!\n'));
    
    const animations = new LoadingAnimations();
    const facts = new NutritionFacts();
    
    // Demo 1: Cooking Animation
    console.log(chalk.yellow('1. 🍳 Cooking Animation Demo'));
    animations.startCookingAnimation();
    await sleep(5000);
    animations.stop();
    
    // Demo 2: Fasting Clock
    console.log(chalk.yellow('2. ⏰ Fasting Clock Demo'));
    animations.startFastingClock();
    await sleep(4000);
    animations.stop();
    
    // Demo 3: Food Transform
    console.log(chalk.yellow('3. 🔄 Food Transformation Demo'));
    animations.startFoodTransform();
    await sleep(6000);
    animations.stop();
    
    // Demo 4: Spinner
    console.log(chalk.yellow('4. 🌀 Spinner Demo'));
    animations.startSpinner(['Creating your perfect meal plan...', 'Almost ready...', 'Final touches...']);
    await sleep(3000);
    animations.stop();
    
    // Demo 5: Nutrition Facts
    console.log(chalk.yellow('5. 📚 Nutrition Facts Demo'));
    facts.displayRandomFacts(5000);
    await sleep(6000);
    
    console.log(chalk.green('🎉 Demo complete! These animations will now play during your meal plan generation.\n'));
    console.log(chalk.cyan('To try the interactive games (Quiz & Word Scramble), run your meal planner:'));
    console.log(chalk.gray('npm start generate\n'));
}

// Run the demo
demoAnimations().catch(console.error);
