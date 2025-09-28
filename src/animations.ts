import chalk from 'chalk';
import readline from 'readline';

export class LoadingAnimations {
    private interval: NodeJS.Timeout | null = null;
    private currentFrame = 0;

    // ASCII Art Cooking Animation
    private cookingFrames = [
        '🔪 Chopping vegetables...',
        '🥄 Mixing ingredients...',
        '🍳 Heating the pan...',
        '👨‍🍳 Seasoning to taste...',
        '🔥 Cooking with love...',
        '📋 Planning your meals...'
    ];

    // Spinning chef animation
    private chefSpinner = ['👨‍🍳', '👩‍🍳', '🧑‍🍳', '👨‍🍳'];

    // Fasting clock animation
    private clockFrames = ['🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗', '🕘', '🕙', '🕚', '🕛'];

    // Food transformation animation
    private foodTransform = [
        '🥬 → 🥗 Fresh ingredients',
        '🥩 → 🍖 Quality proteins',
        '🥑 → 🥙 Healthy fats',
        '🧄 → 🍲 Flavorful spices',
        '🔥 → 🍽️ Delicious meals'
    ];

    // Progress messages
    private progressMessages = [
        'Analyzing your nutritional needs...',
        'Consulting the keto database...',
        'Calculating perfect macros...',
        'Crafting your meal timeline...',
        'Adding cooking instructions...',
        'Finalizing your plan...'
    ];

    private clearLine() {
        if (process.stdout.isTTY) {
            readline.clearLine(process.stdout, 0);
            readline.cursorTo(process.stdout, 0);
        }
    }

    // Cooking animation with progress
    startCookingAnimation(): void {
        this.currentFrame = 0;
        console.log(chalk.cyan('\n🍳 Your AI chef is preparing your meal plan...\n'));

        this.interval = setInterval(() => {
            this.clearLine();
            const frame = this.cookingFrames[this.currentFrame % this.cookingFrames.length];
            const spinner = this.chefSpinner[this.currentFrame % this.chefSpinner.length];
            process.stdout.write(chalk.yellow(`${spinner} ${frame}`));
            this.currentFrame++;
        }, 800);
    }

    // Fasting clock animation
    startFastingClock(): void {
        this.currentFrame = 0;
        console.log(chalk.cyan('\n⏰ Planning your fasting schedule...\n'));

        this.interval = setInterval(() => {
            this.clearLine();
            const clock = this.clockFrames[this.currentFrame % this.clockFrames.length];
            const message = this.progressMessages[Math.floor(this.currentFrame / 3) % this.progressMessages.length];
            process.stdout.write(chalk.blue(`${clock} ${message}`));
            this.currentFrame++;
        }, 500);
    }

    // Food transformation animation
    startFoodTransform(): void {
        this.currentFrame = 0;
        console.log(chalk.cyan('\n🔄 Transforming ingredients into your perfect meal plan...\n'));

        this.interval = setInterval(() => {
            this.clearLine();
            const transform = this.foodTransform[this.currentFrame % this.foodTransform.length];
            process.stdout.write(chalk.green(transform));
            this.currentFrame++;
        }, 1200);
    }

    // Simple spinner with custom messages
    startSpinner(messages: string[] = this.progressMessages): void {
        this.currentFrame = 0;
        const spinChars = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

        this.interval = setInterval(() => {
            this.clearLine();
            const spin = spinChars[this.currentFrame % spinChars.length];
            const message = messages[Math.floor(this.currentFrame / 10) % messages.length];
            process.stdout.write(chalk.cyan(`${spin} ${message}`));
            this.currentFrame++;
        }, 100);
    }

    // Stop any running animation
    stop(): void {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        this.clearLine();
        console.log(chalk.green('✅ Your meal plan is ready!\n'));
    }
}

// Keto Quiz Mini-Game
export class KetoQuiz {
    private questions = [
        {
            question: "What's the ideal carb limit per day on keto?",
            options: ["50g", "20-25g", "100g", "No limit"],
            correct: 1,
            explanation: "Most people stay in ketosis with 20-25g net carbs per day!"
        },
        {
            question: "Which food is keto-friendly?",
            options: ["Banana", "Avocado", "Rice", "Bread"],
            correct: 1,
            explanation: "Avocados are perfect - high fat, low carb!"
        },
        {
            question: "What happens during a 36-hour fast?",
            options: ["Muscle loss", "Ketosis deepens", "Metabolism stops", "Dehydration"],
            correct: 1,
            explanation: "Extended fasting can deepen ketosis and promote autophagy!"
        },
        {
            question: "Best keto fat source?",
            options: ["Olive oil", "Margarine", "Vegetable oil", "Low-fat cheese"],
            correct: 0,
            explanation: "Olive oil provides healthy monounsaturated fats!"
        }
    ];

    private currentQuestion = 0;
    private score = 0;

    async playQuiz(): Promise<void> {
        console.log(chalk.cyan('\n🧠 Keto Knowledge Quiz - Test your skills while we cook up your plan!\n'));

        const inquirer = await import('inquirer');

        for (const q of this.questions) {
            const { answer } = await inquirer.default.prompt([{
                type: 'list',
                name: 'answer',
                message: q.question,
                choices: q.options.map((option, index) => ({ name: option, value: index }))
            }]);

            if (answer === q.correct) {
                this.score++;
                console.log(chalk.green('✅ Correct! ') + chalk.gray(q.explanation));
            } else {
                console.log(chalk.red('❌ Not quite. ') + chalk.gray(q.explanation));
            }
            console.log('');
        }

        console.log(chalk.yellow(`🎯 Quiz Complete! Score: ${this.score}/${this.questions.length}`));
        if (this.score === this.questions.length) {
            console.log(chalk.green('🏆 Perfect score! You\'re a keto expert!'));
        } else if (this.score >= this.questions.length / 2) {
            console.log(chalk.blue('👍 Good job! You know your keto basics!'));
        } else {
            console.log(chalk.yellow('📚 Keep learning - your meal plan will help!'));
        }
        console.log('');
    }
}

// Word Scramble Game
export class WordScramble {
    private words = [
        { word: 'KETOSIS', hint: 'Fat-burning metabolic state' },
        { word: 'AVOCADO', hint: 'Green superfood fruit' },
        { word: 'FASTING', hint: 'Eating window restriction' },
        { word: 'MACROS', hint: 'Fat, protein, and carbs' },
        { word: 'AUTOPHAGY', hint: 'Cellular cleanup process' }
    ];

    private scrambleWord(word: string): string {
        const letters = word.split('');
        for (let i = letters.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [letters[i], letters[j]] = [letters[j], letters[i]];
        }
        return letters.join('');
    }

    async playScramble(): Promise<void> {
        console.log(chalk.cyan('\n🔤 Word Scramble - Unscramble these nutrition terms!\n'));

        const inquirer = await import('inquirer');
        let score = 0;

        for (const item of this.words) {
            const scrambled = this.scrambleWord(item.word);
            console.log(chalk.yellow(`Hint: ${item.hint}`));

            const { answer } = await inquirer.default.prompt([{
                type: 'input',
                name: 'answer',
                message: `Unscramble: ${chalk.bold(scrambled)}`,
                validate: (input: string) => input.length > 0 || 'Please enter an answer'
            }]);

            if (answer.toUpperCase() === item.word) {
                score++;
                console.log(chalk.green('✅ Correct!\n'));
            } else {
                console.log(chalk.red(`❌ The answer was: ${item.word}\n`));
            }
        }

        console.log(chalk.yellow(`🎯 Scramble Complete! Score: ${score}/${this.words.length}`));
        console.log('');
    }
}

// Nutrition Facts Display
export class NutritionFacts {
    private facts = [
        "💡 Ketosis typically begins 12-16 hours into a fast - your body switches from glucose to fat burning",
        "🧠 Your brain can run entirely on ketones for fuel - they're actually a more efficient energy source than glucose",
        "🔥 Fasting can increase growth hormone by up to 5x, helping preserve muscle mass during weight loss",
        "⚡ Autophagy (cellular cleanup) peaks around 24-48 hours of fasting - it's like spring cleaning for your cells",
        "🥑 MCT oil converts to ketones within 30 minutes, making it perfect for maintaining ketosis",
        "💪 On keto, you need 0.8-1.2g protein per kg body weight - quality matters more than quantity",
        "🧪 Ketone levels of 0.5-3.0 mmol/L indicate nutritional ketosis - the fat-burning sweet spot",
        "🕐 Time-restricted eating can improve insulin sensitivity by up to 40% in just 2 weeks",
        "🍖 Saturated fats aren't the villain - they raise HDL (good) cholesterol and make LDL particles larger",
        "⚖️ Your body can only store ~2000 calories as glycogen, but has 100,000+ calories stored as fat",
        "🧬 Ketones cross the blood-brain barrier easily, providing steady brain fuel without glucose crashes",
        "🔄 It takes 3-7 days to become 'fat-adapted' - when your body efficiently burns fat for fuel"
    ];

    displayRandomFacts(duration: number = 12000): void {
        console.log(chalk.cyan('\n📚 Keto & Fasting Facts - Learning while we prepare your plan!\n'));

        let factIndex = 0;

        // Display facts one by one with proper spacing
        const showNextFact = () => {
            if (factIndex < this.facts.length) {
                const fact = this.facts[factIndex];
                console.log(chalk.blue(`${factIndex + 1}. ${fact}`));
                factIndex++;

                // Show next fact after 2.5 seconds, or finish if we've shown all
                setTimeout(() => {
                    if (factIndex < this.facts.length) {
                        showNextFact();
                    } else {
                        console.log(chalk.green('\n🎓 Hope you learned something new about keto and fasting!\n'));
                    }
                }, 2500);
            }
        };

        // Start showing facts
        showNextFact();
    }
}
