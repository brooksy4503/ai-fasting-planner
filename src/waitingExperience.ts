import chalk from 'chalk';
import { LoadingAnimations, KetoQuiz, WordScramble, NutritionFacts } from './animations';

export type WaitingExperienceType = 'cooking' | 'clock' | 'transform' | 'spinner' | 'quiz' | 'scramble' | 'facts' | 'random';

export class WaitingExperience {
    private animation: LoadingAnimations;
    private quiz: KetoQuiz;
    private scramble: WordScramble;
    private facts: NutritionFacts;

    constructor() {
        this.animation = new LoadingAnimations();
        this.quiz = new KetoQuiz();
        this.scramble = new WordScramble();
        this.facts = new NutritionFacts();
    }

    async start(type: WaitingExperienceType = 'random'): Promise<void> {
        // If random, pick a random experience (weighted towards educational content)
        if (type === 'random') {
            const options: WaitingExperienceType[] = [
                'cooking', 'clock', 'transform', 'spinner',
                'quiz', 'scramble',
                'facts', 'facts' // Give facts double chance since it's educational
            ];
            type = options[Math.floor(Math.random() * options.length)];
            console.log(chalk.gray(`🎲 Random choice: ${type === 'facts' ? 'Nutrition Facts' : type} experience`));
        }

        switch (type) {
            case 'cooking':
                this.animation.startCookingAnimation();
                break;
            case 'clock':
                this.animation.startFastingClock();
                break;
            case 'transform':
                this.animation.startFoodTransform();
                break;
            case 'spinner':
                this.animation.startSpinner();
                break;
            case 'quiz':
                await this.quiz.playQuiz();
                break;
            case 'scramble':
                await this.scramble.playScramble();
                break;
            case 'facts':
                this.facts.displayRandomFacts();
                break;
        }
    }

    stop(): void {
        this.animation.stop();
    }

    // Prompt user to choose their waiting experience
    static async chooseExperience(): Promise<WaitingExperienceType> {
        const inquirer = await import('inquirer');

        const { experience } = await inquirer.default.prompt([{
            type: 'list',
            name: 'experience',
            message: 'While your AI chef prepares your meal plan, what would you like to do?',
            choices: [
                { name: '🎲 Surprise me! (Random experience)', value: 'random' },
                { name: '🍳 Watch the cooking animation', value: 'cooking' },
                { name: '⏰ See the fasting clock', value: 'clock' },
                { name: '🔄 Food transformation animation', value: 'transform' },
                { name: '🌀 Simple loading spinner', value: 'spinner' },
                { name: '🧠 Play keto knowledge quiz', value: 'quiz' },
                { name: '🔤 Word scramble game', value: 'scramble' },
                { name: '📚 Learn nutrition facts', value: 'facts' }
            ]
        }]);

        return experience;
    }

    // Wrapper function to handle the entire waiting experience
    static async handleWaitingPeriod<T>(
        asyncOperation: () => Promise<T>,
        experienceType: WaitingExperienceType = 'random'
    ): Promise<T> {
        const experience = new WaitingExperience();

        // For interactive experiences (quiz, scramble), run them before the async operation
        if (experienceType === 'quiz' || experienceType === 'scramble') {
            console.log(chalk.cyan('🎮 Let\'s play while your meal plan generates in the background!'));
            await experience.start(experienceType);

            // Then show a simple animation for the actual waiting
            experience.animation.startSpinner(['Finalizing your personalized meal plan...']);
            const result = await asyncOperation();
            experience.stop();
            return result;
        }

        // For animations and facts, run them during the async operation
        const operationPromise = asyncOperation();

        if (experienceType === 'facts') {
            // Start facts display and let it run while the operation completes
            experience.facts.displayRandomFacts(20000); // Show facts for up to 20 seconds
            const result = await operationPromise;

            // Give a moment for facts to finish displaying if operation was quick
            await new Promise(resolve => setTimeout(resolve, 1000));
            return result;
        } else {
            // Start animation
            await experience.start(experienceType);

            // Wait for the operation to complete
            const result = await operationPromise;

            // Stop animation
            experience.stop();
            return result;
        }
    }
}
