#!/usr/bin/env node
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import os from 'os';

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

function parseMealPlan(aiResponse: string): string[] {
    const meals: string[] = [];
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    // Split response into lines for processing
    const lines = aiResponse.split('\n');

    // Try multiple parsing strategies

    // Strategy 1: Look for "### N. DayName" pattern (most detailed format)
    for (const day of days) {
        const dayPattern = new RegExp(`###\\s*\\d+\\.\\s*${day}`, 'i');
        const dayIndex = lines.findIndex(line => dayPattern.test(line));

        if (dayIndex !== -1) {
            // Find the next day or end of section to get all content for this day
            const nextDayIndex = lines.findIndex((line, idx) =>
                idx > dayIndex && /###\s*\d+\.\s*(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)/i.test(line)
            );

            const endIndex = nextDayIndex !== -1 ? nextDayIndex : lines.length;
            const dayContent = lines.slice(dayIndex, endIndex).join('\n');

            // Extract meal information from the day's content
            const mealInfo = extractMealInfo(dayContent);
            meals.push(mealInfo);
            continue;
        }
    }

    // Strategy 2: Look for simple numbered list "N. DayName:" pattern
    if (meals.length === 0) {
        for (const day of days) {
            const dayPattern = new RegExp(`^\\d+\\.\\s*${day}:?\\s*(.+)`, 'i');
            const dayLine = lines.find(line => dayPattern.test(line));

            if (dayLine) {
                const match = dayLine.match(dayPattern);
                if (match && match[1]) {
                    meals.push(match[1].trim());
                }
            }
        }
    }

    // Strategy 3: Look for any line containing day names with meal info
    if (meals.length === 0) {
        for (const day of days) {
            const dayPattern = new RegExp(`${day}[:\\-\\s]+(.+)`, 'i');
            const dayLine = lines.find(line => dayPattern.test(line) && !line.includes('###'));

            if (dayLine) {
                const match = dayLine.match(dayPattern);
                if (match && match[1]) {
                    meals.push(match[1].trim());
                }
            }
        }
    }

    return meals;
}

function extractMealInfo(dayContent: string): string {
    const lines = dayContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    // Skip the day header line
    const contentLines = lines.slice(1);

    // Extract breakfast, lunch, dinner information
    const meals: string[] = [];
    let currentMeal = '';

    for (const line of contentLines) {
        // Check if this is a meal header (Breakfast, Lunch, Dinner)
        if (/^####?\s*(Breakfast|Lunch|Dinner):/i.test(line)) {
            if (currentMeal) {
                meals.push(currentMeal.trim());
            }
            currentMeal = line.replace(/^####?\s*/i, '').replace(':', '').trim();
        } else if (line.startsWith('- **') || line.startsWith('**')) {
            // This is meal details (ingredients, instructions, macros)
            if (currentMeal) {
                // Add a brief summary instead of full details for table display
                if (line.includes('Ingredients')) {
                    // Skip ingredients for table - too detailed
                    continue;
                } else if (line.includes('Instructions')) {
                    // Skip instructions for table - too detailed  
                    continue;
                } else if (line.includes('Macros')) {
                    // Include macro summary
                    const macroInfo = line.replace(/^-?\s*\*\*Macros\*\*[^:]*:\s*/i, '');
                    currentMeal += ` (${macroInfo})`;
                }
            }
        } else if (/^Daily Totals/i.test(line)) {
            // End of meals for this day
            break;
        }
    }

    // Add the last meal if exists
    if (currentMeal) {
        meals.push(currentMeal.trim());
    }

    // Return combined meal summary or first meal if multiple
    if (meals.length > 0) {
        return meals.length === 1 ? meals[0] : `${meals.length} meals: ${meals.join(', ')}`;
    }

    // Fallback: return first meaningful line after day header
    const meaningfulLine = contentLines.find(line =>
        line.length > 10 &&
        !line.startsWith('#') &&
        !line.startsWith('**Daily Totals') &&
        !line.includes('Daily Totals')
    );

    return meaningfulLine || 'Keto meal (details in full response)';
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
        const defaultPrompt = `Generate 6 keto meals for a week, skipping Saturday due to 36-hour fast (Friday 8pm-Sunday 8am). Meals: home-cooked, <30 mins prep, no junk (pies, sausage rolls, sugary drinks), low/no carbs, no sugars. Inspired by my weight loss: intentional home-cooked meals, cut calories, coffee with milk during fasts. Tailor to: ${finalAnswers.sex}, age ${finalAnswers.age}, height ${finalAnswers.height}, current weight ${finalAnswers.currentWeight}, target weight ${finalAnswers.targetWeight} in ${finalAnswers.timeframe}, ${finalAnswers.activityLevel}. Output as a numbered list: 1. Sunday: [meal], 2. Monday: [meal], etc.`;

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

        const { text: mealsText } = await generateText({
            model: openrouterProvider('x-ai/grok-4-fast'),
            prompt,
        });

        // Debug: Log AI response for troubleshooting
        if (process.env.DEBUG_PROMPT || testConfig.promptTemplate) {
            console.log(chalk.gray('🤖 AI Response:'), mealsText);
            console.log(chalk.gray('📏 Response length:'), mealsText.length);
        }

        // Enhanced parsing: Extract meals from complex AI response format
        const meals = parseMealPlan(mealsText);
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
