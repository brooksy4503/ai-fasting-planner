#!/usr/bin/env node
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import os from 'os';

// Load environment variables from .env.local first, then .env
dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config(); // This loads .env as fallback
import { Command } from 'commander';
import { generateObject } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import inquirer from 'inquirer';
import chalk from 'chalk';
import Table from 'cli-table3';
import { z } from 'zod';

const program = new Command();

// Zod schema for structured meal plan output
const mealPlanSchema = z.object({
    days: z.array(z.object({
        day: z.string(),
        meals: z.array(z.object({
            name: z.string(),
            type: z.enum(['breakfast', 'lunch', 'dinner', 'snack']).optional(),
            prepTime: z.string().optional(),
            ingredients: z.array(z.string()).optional(),
            instructions: z.array(z.string()).optional(),
            macros: z.object({
                calories: z.number().optional(),
                fat: z.number().optional(),
                protein: z.number().optional(),
                carbs: z.number().optional()
            }).optional()
        }))
    })),
    fastingPeriod: z.object({
        start: z.string(),
        end: z.string(),
        skippedDay: z.string()
    }).optional()
});

type MealPlan = z.infer<typeof mealPlanSchema>;

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
    promptTemplate?: string;
}

interface GlobalConfig {
    apiKey?: string;
    appUrl?: string;
    appTitle?: string;
    defaults?: {
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
    };
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

// Global Configuration Functions
function getGlobalConfigPath(): string {
    return path.join(os.homedir(), '.ai-fasting-planner', 'config.json');
}

function loadGlobalConfig(): GlobalConfig {
    try {
        const configPath = getGlobalConfigPath();
        if (fs.existsSync(configPath)) {
            const configFile = fs.readFileSync(configPath, 'utf8');
            const config = JSON.parse(configFile);
            return config;
        }
    } catch (error) {
        console.warn(chalk.yellow('⚠️  Warning: Could not load global config, using defaults'));
    }
    return {};
}

function saveGlobalConfig(config: GlobalConfig): void {
    try {
        const configPath = getGlobalConfigPath();
        const configDir = path.dirname(configPath);

        // Create directory if it doesn't exist
        if (!fs.existsSync(configDir)) {
            fs.mkdirSync(configDir, { recursive: true });
        }

        // Merge with existing config to preserve other settings
        const existingConfig = loadGlobalConfig();
        const mergedConfig = { ...existingConfig, ...config };

        fs.writeFileSync(configPath, JSON.stringify(mergedConfig, null, 2));
        console.log(chalk.green(`✅ Configuration saved to: ${configPath}`));
    } catch (error) {
        console.error(chalk.red('❌ Error saving configuration'));
        console.error(chalk.red(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
}

async function promptToSaveApiKey(apiKey: string): Promise<void> {
    const { saveKey } = await inquirer.prompt([{
        type: 'confirm',
        name: 'saveKey',
        message: 'Save API key for future use?',
        default: true
    }]);

    if (saveKey) {
        const globalConfig = loadGlobalConfig();
        globalConfig.apiKey = apiKey;
        saveGlobalConfig(globalConfig);
    }
}

function clearGlobalConfig(): void {
    try {
        const configPath = getGlobalConfigPath();
        if (fs.existsSync(configPath)) {
            fs.unlinkSync(configPath);
            console.log(chalk.green('✅ Global configuration cleared'));
        } else {
            console.log(chalk.yellow('⚠️  No global configuration found to clear'));
        }
    } catch (error) {
        console.error(chalk.red('❌ Error clearing configuration'));
        console.error(chalk.red(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
}

function evaluatePromptTemplate(template: string, finalAnswers: Config): string {
    // Replace template variables with actual values
    return template
        .replace(/\$\{finalAnswers\.sex\}/g, finalAnswers.sex)
        .replace(/\$\{finalAnswers\.age\}/g, finalAnswers.age)
        .replace(/\$\{finalAnswers\.height\}/g, finalAnswers.height)
        .replace(/\$\{finalAnswers\.currentWeight\}/g, finalAnswers.currentWeight)
        .replace(/\$\{finalAnswers\.targetWeight\}/g, finalAnswers.targetWeight)
        .replace(/\$\{finalAnswers\.timeframe\}/g, finalAnswers.timeframe)
        .replace(/\$\{finalAnswers\.activityLevel\}/g, finalAnswers.activityLevel)
        .replace(/\$\{finalAnswers\.fastingStart\}/g, finalAnswers.fastingStart)
        .replace(/\$\{finalAnswers\.fastingEnd\}/g, finalAnswers.fastingEnd)
        .replace(/\$\{finalAnswers\.diet\}/g, finalAnswers.diet);
}

function formatMealPlanForTable(mealPlan: MealPlan): Array<{ day: string; meal: string }> {
    const targetDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    return targetDays.map(targetDay => {
        const dayData = mealPlan.days.find(d => d.day.toLowerCase() === targetDay.toLowerCase());

        if (!dayData || dayData.meals.length === 0) {
            return { day: targetDay, meal: `${targetDay} meal (keto, home-cooked)` };
        }

        if (dayData.meals.length === 1) {
            const meal = dayData.meals[0];
            let mealText = meal.name;

            // Add prep time if available
            if (meal.prepTime) {
                mealText += ` (${meal.prepTime})`;
            }

            // Add macros if available
            if (meal.macros && (meal.macros.calories || meal.macros.fat || meal.macros.protein || meal.macros.carbs)) {
                const macros = [];
                if (meal.macros.calories) macros.push(`${meal.macros.calories}cal`);
                if (meal.macros.fat) macros.push(`${meal.macros.fat}g fat`);
                if (meal.macros.protein) macros.push(`${meal.macros.protein}g protein`);
                if (meal.macros.carbs) macros.push(`${meal.macros.carbs}g carbs`);

                if (macros.length > 0) {
                    mealText += ` | ${macros.join(', ')}`;
                }
            }

            return { day: targetDay, meal: mealText };
        } else {
            // Multiple meals - show count and names
            const mealNames = dayData.meals.map(m => m.name).join(', ');
            return { day: targetDay, meal: `${dayData.meals.length} meals: ${mealNames}` };
        }
    });
}

async function showDetailedMealPlan(mealPlan: MealPlan): Promise<void> {
    console.log(chalk.cyan('\n🔍 Want to see detailed recipes and instructions?'));

    const { viewDetails } = await inquirer.prompt([{
        type: 'confirm',
        name: 'viewDetails',
        message: 'View detailed meal information?',
        default: true
    }]);

    if (!viewDetails) {
        console.log(chalk.gray('Detailed view skipped. Your meal plan is ready!'));
        return;
    }

    let continueViewing = true;

    while (continueViewing) {
        // Create menu choices for available days
        const dayChoices = mealPlan.days.map(day => ({
            name: `${day.day} (${day.meals.length} meals)`,
            value: day.day
        }));

        dayChoices.push(
            { name: '📄 Export full meal plan', value: 'export' },
            { name: '❌ Exit detailed view', value: 'exit' }
        );

        const { selectedAction } = await inquirer.prompt([{
            type: 'list',
            name: 'selectedAction',
            message: 'What would you like to view?',
            choices: dayChoices
        }]);

        if (selectedAction === 'exit') {
            continueViewing = false;
            console.log(chalk.green('Happy cooking! 🍳'));
            break;
        }

        if (selectedAction === 'export') {
            await exportMealPlan(mealPlan);
            continue;
        }

        // Show detailed day view
        await showDayDetails(mealPlan, selectedAction);
    }
}

async function showDayDetails(mealPlan: MealPlan, selectedDay: string): Promise<void> {
    const dayData = mealPlan.days.find(d => d.day.toLowerCase() === selectedDay.toLowerCase());

    if (!dayData) {
        console.log(chalk.red('Day not found in meal plan.'));
        return;
    }

    console.log(chalk.green(`\n📅 ${dayData.day} Meal Plan`));
    console.log(chalk.gray('─'.repeat(50)));

    dayData.meals.forEach((meal, index) => {
        console.log(chalk.cyan(`\n${index + 1}. ${meal.name}`));

        if (meal.type) {
            console.log(chalk.gray(`   Type: ${meal.type.charAt(0).toUpperCase() + meal.type.slice(1)}`));
        }

        if (meal.prepTime) {
            console.log(chalk.gray(`   Prep Time: ${meal.prepTime}`));
        }

        // Show macros if available
        if (meal.macros) {
            const macroItems = [];
            if (meal.macros.calories) macroItems.push(`${meal.macros.calories} cal`);
            if (meal.macros.fat) macroItems.push(`${meal.macros.fat}g fat`);
            if (meal.macros.protein) macroItems.push(`${meal.macros.protein}g protein`);
            if (meal.macros.carbs) macroItems.push(`${meal.macros.carbs}g carbs`);

            if (macroItems.length > 0) {
                console.log(chalk.yellow(`   Macros: ${macroItems.join(' | ')}`));
            }
        }

        // Show ingredients if available
        if (meal.ingredients && meal.ingredients.length > 0) {
            console.log(chalk.blue('\n   Ingredients:'));
            meal.ingredients.forEach(ingredient => {
                console.log(chalk.gray(`   • ${ingredient}`));
            });
        }

        // Show instructions if available
        if (meal.instructions && meal.instructions.length > 0) {
            console.log(chalk.blue('\n   Instructions:'));
            meal.instructions.forEach((instruction, stepIndex) => {
                console.log(chalk.gray(`   ${stepIndex + 1}. ${instruction}`));
            });
        }

        console.log(''); // Add spacing between meals
    });

    // Show daily totals if we can calculate them
    const dailyTotals = calculateDailyTotals(dayData.meals);
    if (dailyTotals.hasData) {
        console.log(chalk.green('📊 Daily Totals:'));
        console.log(chalk.gray(`   Calories: ${dailyTotals.calories} | Fat: ${dailyTotals.fat}g | Protein: ${dailyTotals.protein}g | Carbs: ${dailyTotals.carbs}g`));
    }
}

function calculateDailyTotals(meals: any[]): { hasData: boolean; calories: number; fat: number; protein: number; carbs: number } {
    const totals = { hasData: false, calories: 0, fat: 0, protein: 0, carbs: 0 };

    meals.forEach(meal => {
        if (meal.macros) {
            totals.hasData = true;
            totals.calories += meal.macros.calories || 0;
            totals.fat += meal.macros.fat || 0;
            totals.protein += meal.macros.protein || 0;
            totals.carbs += meal.macros.carbs || 0;
        }
    });

    return totals;
}

async function exportMealPlan(mealPlan: MealPlan): Promise<void> {
    const { exportFormat } = await inquirer.prompt([{
        type: 'list',
        name: 'exportFormat',
        message: 'Choose export format:',
        choices: [
            { name: '📄 Detailed Text Format', value: 'text' },
            { name: '📋 JSON Format', value: 'json' },
            { name: '🛒 Shopping List', value: 'shopping' },
            { name: '❌ Cancel', value: 'cancel' }
        ]
    }]);

    if (exportFormat === 'cancel') {
        return;
    }

    const timestamp = new Date().toISOString().slice(0, 10);
    let filename = '';
    let content = '';

    switch (exportFormat) {
        case 'text':
            filename = `meal-plan-${timestamp}.txt`;
            content = generateTextExport(mealPlan);
            break;
        case 'json':
            filename = `meal-plan-${timestamp}.json`;
            content = JSON.stringify(mealPlan, null, 2);
            break;
        case 'shopping':
            filename = `shopping-list-${timestamp}.txt`;
            content = generateShoppingList(mealPlan);
            break;
    }

    try {
        fs.writeFileSync(filename, content);
        console.log(chalk.green(`✅ Exported to: ${filename}`));
    } catch (error) {
        console.error(chalk.red(`❌ Error writing file: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
}

function generateTextExport(mealPlan: MealPlan): string {
    let output = `KETO MEAL PLAN\n`;
    if (mealPlan.fastingPeriod) {
        output += `Fasting Period: ${mealPlan.fastingPeriod.start} - ${mealPlan.fastingPeriod.end}\n`;
        output += `Skipped Day: ${mealPlan.fastingPeriod.skippedDay}\n`;
    }
    output += `Generated: ${new Date().toLocaleDateString()}\n\n`;
    output += '='.repeat(50) + '\n\n';

    mealPlan.days.forEach(day => {
        output += `${day.day.toUpperCase()}\n`;
        output += '-'.repeat(day.day.length) + '\n\n';

        day.meals.forEach((meal, index) => {
            output += `${index + 1}. ${meal.name}\n`;

            if (meal.type) output += `   Type: ${meal.type}\n`;
            if (meal.prepTime) output += `   Prep Time: ${meal.prepTime}\n`;

            if (meal.macros) {
                const macros = [];
                if (meal.macros.calories) macros.push(`${meal.macros.calories} cal`);
                if (meal.macros.fat) macros.push(`${meal.macros.fat}g fat`);
                if (meal.macros.protein) macros.push(`${meal.macros.protein}g protein`);
                if (meal.macros.carbs) macros.push(`${meal.macros.carbs}g carbs`);
                if (macros.length > 0) output += `   Macros: ${macros.join(' | ')}\n`;
            }

            if (meal.ingredients && meal.ingredients.length > 0) {
                output += '\n   Ingredients:\n';
                meal.ingredients.forEach(ingredient => {
                    output += `   • ${ingredient}\n`;
                });
            }

            if (meal.instructions && meal.instructions.length > 0) {
                output += '\n   Instructions:\n';
                meal.instructions.forEach((instruction, stepIndex) => {
                    output += `   ${stepIndex + 1}. ${instruction}\n`;
                });
            }

            output += '\n';
        });

        output += '\n';
    });

    return output;
}

function generateShoppingList(mealPlan: MealPlan): string {
    const ingredients = new Set<string>();

    mealPlan.days.forEach(day => {
        day.meals.forEach(meal => {
            if (meal.ingredients) {
                meal.ingredients.forEach(ingredient => {
                    // Clean up ingredient text (remove quantities for grouping similar items)
                    const cleanIngredient = ingredient.toLowerCase().trim();
                    ingredients.add(cleanIngredient);
                });
            }
        });
    });

    let output = `SHOPPING LIST\n`;
    if (mealPlan.fastingPeriod) {
        output += `For meal plan: ${mealPlan.fastingPeriod.start} - ${mealPlan.fastingPeriod.end}\n`;
    }
    output += `Generated: ${new Date().toLocaleDateString()}\n\n`;
    output += '='.repeat(30) + '\n\n';

    const sortedIngredients = Array.from(ingredients).sort();
    sortedIngredients.forEach(ingredient => {
        output += `☐ ${ingredient}\n`;
    });

    output += '\n\nNote: Check quantities in the detailed meal plan and adjust as needed.\n';

    return output;
}

// Read version from package.json at build time
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));

program
    .name('fast-plan')
    .description('AI-powered keto meal planner with 36-hour fasting support')
    .version(packageJson.version);

// Setup command for initial configuration
program
    .command('setup')
    .description('Set up your API key and default preferences')
    .action(async () => {
        console.log(chalk.cyan('🚀 Welcome to AI Fasting Planner Setup!'));
        console.log(chalk.gray('This will help you configure your API key and default preferences.\n'));

        const globalConfig = loadGlobalConfig();

        // API Key setup
        const { apiKey } = await inquirer.prompt([{
            type: 'password',
            name: 'apiKey',
            message: 'Enter your OpenRouter API Key:',
            default: globalConfig.apiKey,
            validate: (input: string) => {
                if (!input || input.trim().length === 0) {
                    return 'API key is required. Get one from https://openrouter.ai/keys';
                }
                return true;
            }
        }]);

        // App attribution setup
        const { setupAttribution } = await inquirer.prompt([{
            type: 'confirm',
            name: 'setupAttribution',
            message: 'Set up app attribution for OpenRouter analytics? (helps track usage)',
            default: true
        }]);

        let appUrl = globalConfig.appUrl;
        let appTitle = globalConfig.appTitle;

        if (setupAttribution) {
            const attribution = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'appUrl',
                    message: 'App URL (for analytics):',
                    default: globalConfig.appUrl || 'https://github.com/your-username/ai-fasting-planner'
                },
                {
                    type: 'input',
                    name: 'appTitle',
                    message: 'App Title:',
                    default: globalConfig.appTitle || 'AI Fasting Planner'
                }
            ]);
            appUrl = attribution.appUrl;
            appTitle = attribution.appTitle;
        }

        // Default preferences setup
        const { setupDefaults } = await inquirer.prompt([{
            type: 'confirm',
            name: 'setupDefaults',
            message: 'Set up default preferences to skip prompts in the future?',
            default: true
        }]);

        let defaults = globalConfig.defaults || {};

        if (setupDefaults) {
            console.log(chalk.cyan('\n📋 Setting up your default preferences:'));

            const defaultPrefs = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'fastingStart',
                    message: 'Default fasting start:',
                    default: defaults.fastingStart || 'Friday 8pm'
                },
                {
                    type: 'input',
                    name: 'fastingEnd',
                    message: 'Default fasting end:',
                    default: defaults.fastingEnd || 'Sunday 8am'
                },
                {
                    type: 'list',
                    name: 'diet',
                    message: 'Default diet:',
                    choices: ['Keto', 'Low-Carb', 'Custom'],
                    default: defaults.diet || 'Keto'
                },
                {
                    type: 'list',
                    name: 'sex',
                    message: 'Sex:',
                    choices: ['Male', 'Female', 'Other'],
                    default: defaults.sex
                },
                {
                    type: 'input',
                    name: 'age',
                    message: 'Age:',
                    default: defaults.age,
                    validate: (input: string) => {
                        const age = parseInt(input);
                        if (isNaN(age) || age < 1 || age > 120) {
                            return 'Please enter a valid age (1-120)';
                        }
                        return true;
                    }
                },
                {
                    type: 'input',
                    name: 'height',
                    message: 'Height (e.g., 5\'10" or 178 cm):',
                    default: defaults.height
                },
                {
                    type: 'list',
                    name: 'activityLevel',
                    message: 'Activity level:',
                    choices: [
                        'Sedentary (little to no exercise, <2k steps/day)',
                        'Lightly Active (light exercise, 1-3 days/week, 3-5k steps)',
                        'Moderately Active (moderate exercise, 3-5 days/week, 5-10k steps)',
                        'Very Active (intense exercise, 6-7 days/week, >10k steps)',
                    ],
                    default: defaults.activityLevel || 'Moderately Active (moderate exercise, 3-5 days/week, 5-10k steps)'
                },
                {
                    type: 'input',
                    name: 'currentWeight',
                    message: 'Current weight (e.g., 200 lbs or 90 kg):',
                    default: defaults.currentWeight
                },
                {
                    type: 'input',
                    name: 'targetWeight',
                    message: 'Target weight (e.g., 180 lbs or 80 kg):',
                    default: defaults.targetWeight
                },
                {
                    type: 'input',
                    name: 'timeframe',
                    message: 'Timeframe to reach target (e.g., 6 months):',
                    default: defaults.timeframe
                }
            ]);

            defaults = defaultPrefs;
        }

        // Save configuration
        const newConfig: GlobalConfig = {
            apiKey,
            appUrl,
            appTitle,
            defaults
        };

        saveGlobalConfig(newConfig);

        console.log(chalk.green('\n🎉 Setup complete!'));
        console.log(chalk.gray(`Configuration saved to: ${getGlobalConfigPath()}`));
        console.log(chalk.cyan('\nYou can now run: fast-plan generate'));
        console.log(chalk.gray('Your API key and defaults will be used automatically.\n'));
    });

// Config command to view and manage settings
program
    .command('config')
    .description('View or manage your configuration')
    .option('--show', 'Show current configuration')
    .option('--clear', 'Clear all saved configuration')
    .option('--path', 'Show configuration file path')
    .action(async (options) => {
        const configPath = getGlobalConfigPath();

        if (options.path) {
            console.log(chalk.cyan('Configuration file path:'));
            console.log(configPath);
            return;
        }

        if (options.clear) {
            const { confirm } = await inquirer.prompt([{
                type: 'confirm',
                name: 'confirm',
                message: 'Are you sure you want to clear all saved configuration?',
                default: false
            }]);

            if (confirm) {
                clearGlobalConfig();
            } else {
                console.log(chalk.yellow('Configuration clearing cancelled.'));
            }
            return;
        }

        if (options.show) {
            const globalConfig = loadGlobalConfig();

            if (Object.keys(globalConfig).length === 0) {
                console.log(chalk.yellow('⚠️  No global configuration found.'));
                console.log(chalk.gray('Run "fast-plan setup" to configure your settings.'));
                return;
            }

            console.log(chalk.cyan('📋 Current Configuration:'));
            console.log(chalk.gray(`Location: ${configPath}\n`));

            // Show API key status (masked)
            if (globalConfig.apiKey) {
                const maskedKey = globalConfig.apiKey.substring(0, 8) + '...' + globalConfig.apiKey.slice(-4);
                console.log(chalk.green(`✅ API Key: ${maskedKey}`));
            } else {
                console.log(chalk.red('❌ API Key: Not set'));
            }

            // Show app attribution
            if (globalConfig.appUrl || globalConfig.appTitle) {
                console.log(chalk.cyan('\n🔗 App Attribution:'));
                if (globalConfig.appUrl) console.log(`   URL: ${globalConfig.appUrl}`);
                if (globalConfig.appTitle) console.log(`   Title: ${globalConfig.appTitle}`);
            }

            // Show defaults
            if (globalConfig.defaults && Object.keys(globalConfig.defaults).length > 0) {
                console.log(chalk.cyan('\n⚙️  Default Preferences:'));
                const defaults = globalConfig.defaults;

                if (defaults.fastingStart) console.log(`   Fasting Start: ${defaults.fastingStart}`);
                if (defaults.fastingEnd) console.log(`   Fasting End: ${defaults.fastingEnd}`);
                if (defaults.diet) console.log(`   Diet: ${defaults.diet}`);
                if (defaults.sex) console.log(`   Sex: ${defaults.sex}`);
                if (defaults.age) console.log(`   Age: ${defaults.age}`);
                if (defaults.height) console.log(`   Height: ${defaults.height}`);
                if (defaults.activityLevel) console.log(`   Activity Level: ${defaults.activityLevel}`);
                if (defaults.currentWeight) console.log(`   Current Weight: ${defaults.currentWeight}`);
                if (defaults.targetWeight) console.log(`   Target Weight: ${defaults.targetWeight}`);
                if (defaults.timeframe) console.log(`   Timeframe: ${defaults.timeframe}`);
            }

            console.log(chalk.gray('\nTo modify settings, run: fast-plan setup'));
            console.log(chalk.gray('To clear all settings, run: fast-plan config --clear'));
            return;
        }

        // Default action - interactive menu
        const { action } = await inquirer.prompt([{
            type: 'list',
            name: 'action',
            message: 'What would you like to do?',
            choices: [
                { name: '👀 Show current configuration', value: 'show' },
                { name: '⚙️  Modify configuration', value: 'setup' },
                { name: '📁 Show config file path', value: 'path' },
                { name: '🗑️  Clear all configuration', value: 'clear' },
                { name: '❌ Cancel', value: 'cancel' }
            ]
        }]);

        switch (action) {
            case 'show':
                // Recursively call with --show option
                await program.parseAsync(['config', '--show'], { from: 'user' });
                break;
            case 'setup':
                console.log(chalk.cyan('Redirecting to setup...'));
                await program.parseAsync(['setup'], { from: 'user' });
                break;
            case 'path':
                console.log(chalk.cyan('Configuration file path:'));
                console.log(configPath);
                break;
            case 'clear':
                await program.parseAsync(['config', '--clear'], { from: 'user' });
                break;
            case 'cancel':
                console.log(chalk.gray('Cancelled.'));
                break;
        }
    });

program
    .command('generate')
    .description('Generate keto meal plan for 36-hour fasting')
    .option('-c, --config <path>', 'Path to meal plan configuration JSON file')
    .action(async (options) => {
        // Load global configuration
        const globalConfig = loadGlobalConfig();
        const defaults = globalConfig.defaults || {};

        // Load meal plan configuration if provided
        let testConfig: TestConfig = {};
        if (options.config) {
            testConfig = loadTestConfig(options.config);
        }

        const answers: Config = await inquirer.prompt([
            {
                type: 'input',
                name: 'fastingStart',
                message: 'Fasting start?',
                default: testConfig.fastingStart || defaults.fastingStart || 'Friday 8pm',
                when: () => !testConfig.fastingStart && !defaults.fastingStart
            },
            {
                type: 'input',
                name: 'fastingEnd',
                message: 'Fasting end?',
                default: testConfig.fastingEnd || defaults.fastingEnd || 'Sunday 8am',
                when: () => !testConfig.fastingEnd && !defaults.fastingEnd
            },
            {
                type: 'list',
                name: 'diet',
                message: 'Diet?',
                choices: ['Keto', 'Low-Carb', 'Custom'],
                default: testConfig.diet || defaults.diet || 'Keto',
                when: () => !testConfig.diet && !defaults.diet
            },
            {
                type: 'password',
                name: 'apiKey',
                message: 'OpenRouter API Key?',
                when: () => !globalConfig.apiKey && !process.env.OPENROUTER_API_KEY
            },
            {
                type: 'input',
                name: 'currentWeight',
                message: 'Current weight (e.g., 200 lbs)?',
                default: testConfig.currentWeight || defaults.currentWeight,
                when: () => !testConfig.currentWeight && !defaults.currentWeight
            },
            {
                type: 'input',
                name: 'targetWeight',
                message: 'Target weight (e.g., 180 lbs)?',
                default: testConfig.targetWeight || defaults.targetWeight,
                when: () => !testConfig.targetWeight && !defaults.targetWeight
            },
            {
                type: 'input',
                name: 'timeframe',
                message: 'Timeframe to reach target (e.g., 6 months)?',
                default: testConfig.timeframe || defaults.timeframe,
                when: () => !testConfig.timeframe && !defaults.timeframe
            },
            {
                type: 'list',
                name: 'sex',
                message: 'Sex?',
                choices: ['Male', 'Female', 'Other'],
                default: testConfig.sex || defaults.sex,
                when: () => !testConfig.sex && !defaults.sex
            },
            {
                type: 'input',
                name: 'age',
                message: 'Age (e.g., 35)?',
                default: testConfig.age || defaults.age,
                when: () => !testConfig.age && !defaults.age
            },
            {
                type: 'input',
                name: 'height',
                message: 'Height (e.g., 5\'10" or 178 cm)?',
                default: testConfig.height || defaults.height,
                when: () => !testConfig.height && !defaults.height
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
                default: testConfig.activityLevel || defaults.activityLevel,
                when: () => !testConfig.activityLevel && !defaults.activityLevel
            },
        ]);

        // Merge test config values with answers and global defaults
        const finalAnswers: Config = {
            fastingStart: testConfig.fastingStart || answers.fastingStart || defaults.fastingStart || 'Friday 8pm',
            fastingEnd: testConfig.fastingEnd || answers.fastingEnd || defaults.fastingEnd || 'Sunday 8am',
            diet: testConfig.diet || answers.diet || defaults.diet || 'Keto',
            apiKey: answers.apiKey,
            currentWeight: testConfig.currentWeight || answers.currentWeight || defaults.currentWeight || '',
            targetWeight: testConfig.targetWeight || answers.targetWeight || defaults.targetWeight || '',
            timeframe: testConfig.timeframe || answers.timeframe || defaults.timeframe || '',
            sex: testConfig.sex || answers.sex || defaults.sex || '',
            age: testConfig.age || answers.age || defaults.age || '',
            height: testConfig.height || answers.height || defaults.height || '',
            activityLevel: testConfig.activityLevel || answers.activityLevel || defaults.activityLevel || '',
        };

        // Get API key from multiple sources (priority order)
        const apiKey = globalConfig.apiKey || finalAnswers.apiKey || process.env.OPENROUTER_API_KEY;

        // Debug API key loading
        if (process.env.DEBUG_PROMPT || testConfig.promptTemplate) {
            console.log(chalk.gray('🔑 API Key sources:'));
            console.log(chalk.gray('   globalConfig.apiKey:'), globalConfig.apiKey ? 'SET' : 'NOT SET');
            console.log(chalk.gray('   finalAnswers.apiKey:'), finalAnswers.apiKey ? 'SET' : 'NOT SET');
            console.log(chalk.gray('   process.env.OPENROUTER_API_KEY:'), process.env.OPENROUTER_API_KEY ? 'SET' : 'NOT SET');
            console.log(chalk.gray('   Final apiKey:'), apiKey ? 'SET' : 'NOT SET');
        }

        if (!apiKey) {
            console.error(chalk.red('❌ No API key found!'));
            console.log(chalk.yellow('Please run "fast-plan setup" to configure your API key.'));
            console.log(chalk.gray('Or set the OPENROUTER_API_KEY environment variable.'));
            process.exit(1);
        }

        // If user entered API key manually, offer to save it
        if (finalAnswers.apiKey && !globalConfig.apiKey) {
            await promptToSaveApiKey(finalAnswers.apiKey);
        }

        // Use custom prompt template if provided, otherwise use default
        const defaultPrompt = `Generate 6 keto meals for a week, skipping Saturday due to 36-hour fast (${finalAnswers.fastingStart} to ${finalAnswers.fastingEnd}). 

Requirements:
- Home-cooked meals, under 30 minutes prep time
- No junk food (pies, sausage rolls, sugary drinks)
- Low/no carbs, no sugars, keto-friendly
- Inspired by intentional home-cooked meals for weight loss

Tailor to: ${finalAnswers.sex}, age ${finalAnswers.age}, height ${finalAnswers.height}, current weight ${finalAnswers.currentWeight}, target weight ${finalAnswers.targetWeight} in ${finalAnswers.timeframe}, activity level: ${finalAnswers.activityLevel}.

Provide meals for: Sunday, Monday, Tuesday, Wednesday, Thursday, Friday (skip Saturday for fasting).

For each day, you can provide 1-3 meals (breakfast, lunch, dinner) as appropriate. Include meal names, optional prep time, and optional basic macros if available.`;

        const prompt = testConfig.promptTemplate
            ? evaluatePromptTemplate(testConfig.promptTemplate, finalAnswers)
            : defaultPrompt;

        // Debug logging for development
        if (testConfig.promptTemplate) {
            console.log(chalk.yellow('🧪 Using custom prompt template from config'));
            console.log(chalk.gray('📋 Final answers:'), finalAnswers);
            console.log(chalk.gray('📝 Raw template:'), testConfig.promptTemplate);
            console.log(chalk.gray('🔄 Evaluated prompt:'), prompt);
        } else {
            console.log(chalk.blue('📝 Using default prompt'));
            if (process.env.NODE_ENV === 'development' || process.env.DEBUG_PROMPT) {
                console.log(chalk.gray('🔄 Prompt:'), prompt);
            }
        }

        // Create OpenRouter provider instance with API key and attribution headers
        const openrouterProvider = createOpenRouter({
            apiKey: apiKey,
            headers: {
                'HTTP-Referer': globalConfig.appUrl || process.env.APP_URL || 'https://github.com/your-username/ai-fasting-planner',
                'X-Title': globalConfig.appTitle || process.env.APP_TITLE || 'AI Fasting Planner',
            },
        });

        const { object: mealPlan } = await generateObject({
            model: openrouterProvider('x-ai/grok-4-fast'),
            prompt,
            schema: mealPlanSchema,
        });

        // Debug: Log AI response for troubleshooting
        if (process.env.DEBUG_PROMPT || testConfig.promptTemplate) {
            console.log(chalk.gray('🤖 AI Response:'), JSON.stringify(mealPlan, null, 2));
            console.log(chalk.gray('📊 Days generated:'), mealPlan.days.length);
        }

        // Format structured data for table display
        const mealPlanForTable = formatMealPlanForTable(mealPlan);

        const table = new Table({
            head: [chalk.cyan('Day'), chalk.cyan('Meal')],
            colWidths: [12, 80], // Set fixed column widths
            wordWrap: true // Enable word wrapping
        });
        mealPlanForTable.forEach(({ day, meal }) => table.push([day, meal]));
        console.log(chalk.green(`Your Keto Meal Plan (Fasting: ${finalAnswers.fastingStart} - ${finalAnswers.fastingEnd})`));
        console.log(table.toString());

        const tips = [
            'Ditched pies & sugary drinks—home-cooked meals were my win.',
            'Coffee with milk kept me going during 36-hour fasts.',
            'Hydrate on fasting days to stay sharp.',
        ];
        console.log(chalk.blue('Tips from my weight loss:'));
        tips.forEach(tip => console.log(`- ${tip}`));

        // Interactive detailed view
        await showDetailedMealPlan(mealPlan);
    });

// Make generate the default command if no command is specified
if (process.argv.length === 2) {
    process.argv.push('generate');
}

program.parse();
