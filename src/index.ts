#!/usr/bin/env node
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables from .env.local first, then .env
dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config(); // This loads .env as fallback
import { Command } from 'commander';
import { generateText } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import inquirer from 'inquirer';
import chalk from 'chalk';
import Table from 'cli-table3';

const program = new Command();

interface Config {
    fastingStart: string;
    fastingEnd: string;
    diet: string;
    apiKey: string;
    currentWeight: string;
    targetWeight: string;
    timeframe: string;
    sex: string;
    age: string;
    height: string;
    activityLevel: string;
}

interface TestConfig {
    fastingStart?: string;
    fastingEnd?: string;
    diet?: string;
    currentWeight?: string;
    targetWeight?: string;
    timeframe?: string;
    sex?: string;
    age?: string;
    height?: string;
    activityLevel?: string;
}

function loadTestConfig(configPath: string): TestConfig {
    try {
        const configFile = fs.readFileSync(configPath, 'utf8');
        const config = JSON.parse(configFile);
        console.log(chalk.yellow(`📁 Loaded test configuration from: ${configPath}`));
        return config;
    } catch (error) {
        console.error(chalk.red(`❌ Error loading config file: ${configPath}`));
        console.error(chalk.red(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`));
        process.exit(1);
    }
}

program
    .name('ai-plan')
    .description('AI-powered keto meal planner with 36-hour fasting support')
    .version('1.0.0');

program
    .command('generate')
    .description('Generate keto meal plan for 36-hour fasting')
    .option('-c, --config <path>', 'Path to test configuration JSON file')
    .action(async (options) => {
        // Load test configuration if provided
        let testConfig: TestConfig = {};
        if (options.config) {
            testConfig = loadTestConfig(options.config);
        }

        const answers: Config = await inquirer.prompt([
            {
                type: 'input',
                name: 'fastingStart',
                message: 'Fasting start?',
                default: testConfig.fastingStart || 'Friday 8pm',
                when: () => !testConfig.fastingStart
            },
            {
                type: 'input',
                name: 'fastingEnd',
                message: 'Fasting end?',
                default: testConfig.fastingEnd || 'Sunday 8am',
                when: () => !testConfig.fastingEnd
            },
            {
                type: 'list',
                name: 'diet',
                message: 'Diet?',
                choices: ['Keto', 'Low-Carb', 'Custom'],
                default: testConfig.diet || 'Keto',
                when: () => !testConfig.diet
            },
            {
                type: 'password',
                name: 'apiKey',
                message: 'OpenRouter API Key?',
                when: () => !process.env.OPENROUTER_API_KEY
            },
            {
                type: 'input',
                name: 'currentWeight',
                message: 'Current weight (e.g., 200 lbs)?',
                when: () => !testConfig.currentWeight
            },
            {
                type: 'input',
                name: 'targetWeight',
                message: 'Target weight (e.g., 180 lbs)?',
                when: () => !testConfig.targetWeight
            },
            {
                type: 'input',
                name: 'timeframe',
                message: 'Timeframe to reach target (e.g., 6 months)?',
                when: () => !testConfig.timeframe
            },
            {
                type: 'list',
                name: 'sex',
                message: 'Sex?',
                choices: ['Male', 'Female', 'Other'],
                when: () => !testConfig.sex
            },
            {
                type: 'input',
                name: 'age',
                message: 'Age (e.g., 35)?',
                when: () => !testConfig.age
            },
            {
                type: 'input',
                name: 'height',
                message: 'Height (e.g., 5\'10" or 178 cm)?',
                when: () => !testConfig.height
            },
            {
                type: 'list',
                name: 'activityLevel',
                message: 'Activity level?',
                choices: [
                    'Sedentary (little to no exercise, <2k steps/day)',
                    'Lightly Active (light exercise, 1-3 days/week, 3-5k steps)',
                    'Moderately Active (moderate exercise, 3-5 days/week, 5-10k steps)',
                    'Very Active (intense exercise, 6-7 days/week, >10k steps)',
                ],
                when: () => !testConfig.activityLevel
            },
        ]);

        // Merge test config values with answers
        const finalAnswers: Config = {
            fastingStart: testConfig.fastingStart || answers.fastingStart,
            fastingEnd: testConfig.fastingEnd || answers.fastingEnd,
            diet: testConfig.diet || answers.diet,
            apiKey: answers.apiKey,
            currentWeight: testConfig.currentWeight || answers.currentWeight,
            targetWeight: testConfig.targetWeight || answers.targetWeight,
            timeframe: testConfig.timeframe || answers.timeframe,
            sex: testConfig.sex || answers.sex,
            age: testConfig.age || answers.age,
            height: testConfig.height || answers.height,
            activityLevel: testConfig.activityLevel || answers.activityLevel,
        };

        const apiKey = finalAnswers.apiKey || process.env.OPENROUTER_API_KEY;
        if (!apiKey) throw new Error('No API key provided');

        const prompt = `Generate 6 keto meals for a week, skipping Saturday due to 36-hour fast (Friday 8pm-Sunday 8am). Meals: home-cooked, <30 mins prep, no junk (pies, sausage rolls, sugary drinks), low/no carbs, no sugars. Inspired by my weight loss: intentional home-cooked meals, cut calories, coffee with milk during fasts. Tailor to: ${finalAnswers.sex}, age ${finalAnswers.age}, height ${finalAnswers.height}, current weight ${finalAnswers.currentWeight}, target weight ${finalAnswers.targetWeight} in ${finalAnswers.timeframe}, ${finalAnswers.activityLevel}. Output as a numbered list: 1. Sunday: [meal], 2. Monday: [meal], etc.`;

        // Create OpenRouter provider instance with API key and attribution headers
        const openrouterProvider = createOpenRouter({
            apiKey: apiKey,
            headers: {
                'HTTP-Referer': process.env.APP_URL || 'https://github.com/your-username/ai-fasting-planner', // Your app's URL
                'X-Title': process.env.APP_TITLE || 'AI Fasting Planner', // Your app's display name
            },
        });

        const { text: mealsText } = await generateText({
            model: openrouterProvider('x-ai/grok-4-fast'),
            prompt,
        });

        // Basic parsing: Extract meals from numbered list (refine on Day 4)
        const meals = mealsText.split('\n').filter(line => line.match(/^\d+\./)).map(line => line.replace(/^\d+\.\s*/, '').trim());
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        const mealPlan = days.map((day, i) => ({ day, meal: meals[i] || `${day} meal placeholder (keto, home-cooked)` }));

        const table = new Table({
            head: [chalk.cyan('Day'), chalk.cyan('Meal')],
            colWidths: [12, 80], // Set fixed column widths
            wordWrap: true // Enable word wrapping
        });
        mealPlan.forEach(({ day, meal }) => table.push([day, meal]));
        console.log(chalk.green(`Your Keto Meal Plan (Fasting: ${finalAnswers.fastingStart} - ${finalAnswers.fastingEnd})`));
        console.log(table.toString());

        const tips = [
            'Ditched pies & sugary drinks—home-cooked meals were my win.',
            'Coffee with milk kept me going during 36-hour fasts.',
            'Hydrate on fasting days to stay sharp.',
        ];
        console.log(chalk.blue('Tips from my weight loss:'));
        tips.forEach(tip => console.log(`- ${tip}`));
    });

// Make generate the default command if no command is specified
if (process.argv.length === 2) {
    process.argv.push('generate');
}

program.parse();
