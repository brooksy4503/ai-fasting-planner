import { USDAAPIService, USDAFoodItem } from './usdaApi';

export interface ParsedIngredient {
    quantity: number;
    unit: string;
    ingredient: string;
    original: string;
}

export interface NutritionalInfo {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
}

export interface IngredientNutrition {
    ingredient: ParsedIngredient;
    nutrition: NutritionalInfo;
    confidence: 'high' | 'medium' | 'low';
    source: 'usda' | 'fallback';
}

export interface MealNutrition {
    total: NutritionalInfo;
    ingredients: IngredientNutrition[];
    confidence: 'high' | 'medium' | 'low';
}

export interface USDAAPIInterface {
    findBestMatch(ingredientQuery: string): Promise<any>;
    getMacros(foodNutrients: any[]): {
        calories: number | null;
        protein: number | null;
        fat: number | null;
        carbs: number | null;
    };
}

export class NutritionCalculator {
    private readonly unitConversions: { [key: string]: { toGrams: number; type: 'volume' | 'weight' } } = {
        // Weight units
        'g': { toGrams: 1, type: 'weight' },
        'gram': { toGrams: 1, type: 'weight' },
        'grams': { toGrams: 1, type: 'weight' },
        'kg': { toGrams: 1000, type: 'weight' },
        'kilogram': { toGrams: 1000, type: 'weight' },
        'kilograms': { toGrams: 1000, type: 'weight' },
        'oz': { toGrams: 28.35, type: 'weight' },
        'ounce': { toGrams: 28.35, type: 'weight' },
        'ounces': { toGrams: 28.35, type: 'weight' },
        'lb': { toGrams: 453.59, type: 'weight' },
        'pound': { toGrams: 453.59, type: 'weight' },
        'pounds': { toGrams: 453.59, type: 'weight' },

        // Volume units (approximate conversions for common ingredients)
        'cup': { toGrams: 240, type: 'volume' }, // Water-based, will be adjusted per ingredient
        'cups': { toGrams: 240, type: 'volume' },
        'c': { toGrams: 240, type: 'volume' },
        'tbsp': { toGrams: 15, type: 'volume' },
        'tablespoon': { toGrams: 15, type: 'volume' },
        'tablespoons': { toGrams: 15, type: 'volume' },
        'tsp': { toGrams: 5, type: 'volume' },
        'teaspoon': { toGrams: 5, type: 'volume' },
        'teaspoons': { toGrams: 5, type: 'volume' },
        'ml': { toGrams: 1, type: 'volume' }, // For water-based liquids
        'milliliter': { toGrams: 1, type: 'volume' },
        'milliliters': { toGrams: 1, type: 'volume' },
        'l': { toGrams: 1000, type: 'volume' },
        'liter': { toGrams: 1000, type: 'volume' },
        'liters': { toGrams: 1000, type: 'volume' },
    };

    constructor(private usdaApi: USDAAPIInterface) { }

    /**
     * Parse an ingredient string into quantity, unit, and ingredient name
     */
    parseIngredient(ingredientText: string): ParsedIngredient {
        const text = ingredientText.trim().toLowerCase();

        // Common patterns:
        // "2 cups spinach"
        // "4 oz ground beef"
        // "1 tbsp olive oil"
        // "salt to taste" (no quantity)
        // "2 eggs"

        // Handle "to taste" or similar qualitative amounts
        if (text.includes('to taste') || text.includes('pinch') || text.includes('dash')) {
            return {
                quantity: 0, // Will be handled as negligible
                unit: 'to taste',
                ingredient: ingredientText.replace(/\s*\([^)]*\)/g, '').trim(), // Remove parentheses
                original: ingredientText
            };
        }

        // Try to match quantity at the start - handle various formats
        // Order matters: more specific patterns first
        const quantityMatch = text.match(/^(\d+\/\d+|\d+(?:\s+\d+\/\d+)(?:\.\d+)?|\d+(?:\.\d+)|\d+)/);
        if (!quantityMatch) {
            // No quantity found, assume 1 unit
            return {
                quantity: 1,
                unit: 'unit',
                ingredient: this.cleanIngredientName(ingredientText.replace(/\s*\([^)]*\)/g, '').trim()),
                original: ingredientText
            };
        }

        const quantityStr = quantityMatch[1];
        let remaining = text.substring(quantityMatch[0].length).trim();

        // Parse quantity (handle fractions like "1 1/2")
        let quantity = this.parseQuantity(quantityStr);
        let unit = 'unit';
        let ingredient = remaining;

        // Check if the remaining starts with a valid unit
        const validUnits = Object.keys(this.unitConversions);
        const words = remaining.split(/\s+/);

        if (words.length > 0) {
            const potentialUnit = words[0].toLowerCase();
            if (validUnits.includes(potentialUnit)) {
                unit = potentialUnit;
                ingredient = remaining.substring(words[0].length).trim();
            }
        }

        // Clean up ingredient name (remove parenthetical notes and preparation descriptors)
        ingredient = this.cleanIngredientName(ingredient.replace(/\s*\([^)]*\)/g, '').replace(/\s*,\s*$/, '').trim());

        return {
            quantity,
            unit,
            ingredient,
            original: ingredientText
        };
    }

    /**
     * Clean ingredient name by removing preparation descriptors that confuse USDA search
     */
    private cleanIngredientName(ingredient: string): string {
        // Remove common preparation descriptors that might cause USDA to return wrong results
        // (e.g., "avocado, sliced" should just be "avocado")
        const descriptorsToRemove = [
            'sliced', 'diced', 'chopped', 'minced', 'grated', 'shredded', 'crushed',
            'ground', 'powdered', 'fresh', 'frozen', 'canned', 'dried',
            'raw', 'cooked', 'roasted', 'baked', 'fried', 'grilled', 'steamed',
            'boneless', 'skinless', 'with skin', 'peeled'
        ];

        let cleaned = ingredient.toLowerCase();

        // Remove descriptors
        for (const descriptor of descriptorsToRemove) {
            // Use word boundaries to avoid partial matches (e.g., "ground" shouldn't match "ground beef")
            const regex = new RegExp(`\\b${descriptor}\\b`, 'gi');
            cleaned = cleaned.replace(regex, '');
        }

        // Clean up extra spaces and commas
        cleaned = cleaned.replace(/\s*,\s*/g, ' ').replace(/\s+/g, ' ').trim();

        // If we end up with an empty string, return the original
        return cleaned || ingredient;
    }

    /**
     * Parse quantity strings including fractions
     */
    private parseQuantity(quantityStr: string): number {
        // Handle "1 1/2" format
        const parts = quantityStr.split(/\s+/);
        let total = 0;

        for (const part of parts) {
            if (part.includes('/')) {
                // Fraction like "1/2"
                const [numerator, denominator] = part.split('/').map(Number);
                if (denominator && denominator !== 0) {
                    total += numerator / denominator;
                }
            } else {
                // Whole number or decimal
                total += parseFloat(part) || 0;
            }
        }

        return total;
    }

    /**
     * Convert ingredient quantity to grams
     */
    quantityToGrams(quantity: number, unit: string, ingredient: string): number {
        const unitInfo = this.unitConversions[unit.toLowerCase()];

        // Handle unit-less ingredients (e.g., "3 eggs", "2 apples")
        if (!unitInfo) {
            return this.getUnitlessIngredientGrams(quantity, ingredient);
        }

        let gramsPerUnit = unitInfo.toGrams;

        // Adjust for volume conversions based on ingredient density
        if (unitInfo.type === 'volume') {
            gramsPerUnit = this.getDensityAdjustment(ingredient, unit, gramsPerUnit);
        }

        return quantity * gramsPerUnit;
    }

    /**
     * Estimate grams for ingredients without explicit units
     */
    private getUnitlessIngredientGrams(quantity: number, ingredient: string): number {
        const ingredientLower = ingredient.toLowerCase();

        // Common unit-less ingredients with standard weights
        if (ingredientLower.includes('egg')) {
            // Large egg ≈ 50g
            return quantity * 50;
        }
        if (ingredientLower.includes('apple') || ingredientLower.includes('orange')) {
            // Medium fruit ≈ 150g
            return quantity * 150;
        }
        if (ingredientLower.includes('banana')) {
            // Medium banana ≈ 120g
            return quantity * 120;
        }
        if (ingredientLower.includes('avocado')) {
            // Medium avocado ≈ 150g (whole)
            return quantity * 150;
        }
        if (ingredientLower.includes('cucumber')) {
            // Medium cucumber ≈ 300g
            return quantity * 300;
        }
        if (ingredientLower.includes('clove garlic') || ingredientLower.includes('garlic clove')) {
            // Single garlic clove ≈ 3g
            return quantity * 3;
        }
        if (ingredientLower.includes('lemon') || ingredientLower.includes('lime')) {
            // Small citrus ≈ 100g
            return quantity * 100;
        }

        // For unknown unit-less ingredients, assume they mean grams
        // This is a fallback and may not be accurate
        return quantity;
    }

    /**
     * Get density adjustment for volume measurements
     * Only applies to liquid ingredients where density significantly differs from water
     */
    private getDensityAdjustment(ingredient: string, unit: string, defaultGrams: number): number {
        const ingredientLower = ingredient.toLowerCase();

        // Only adjust density for actual liquids, not solid ingredients measured by volume
        if (ingredientLower.includes('oil') || ingredientLower.includes('olive oil')) {
            return Math.round(defaultGrams * 0.92); // ~0.92 g/ml density
        }
        if (ingredientLower.includes('honey') || ingredientLower.includes('syrup') || ingredientLower.includes('maple syrup')) {
            return Math.round(defaultGrams * 1.42); // ~1.42 g/ml density
        }
        if (ingredientLower.includes('milk') || ingredientLower.includes('cream') || ingredientLower.includes('yogurt')) {
            return Math.round(defaultGrams * 1.03); // ~1.03 g/ml density
        }

        // Special cases for lightweight vegetables
        if (ingredientLower.includes('spinach') || ingredientLower.includes('lettuce') || ingredientLower.includes('greens')) {
            // Leafy greens are much lighter - 1 cup ≈ 30g
            return defaultGrams * 0.125; // 240g → 30g
        }
        if (ingredientLower.includes('mushroom') || ingredientLower.includes('onion')) {
            // Chopped vegetables are lighter - 1 cup ≈ 150g
            return defaultGrams * 0.625; // 240g → 150g
        }

        // For other solid ingredients (butter, cheese, flour, sugar, etc.), use standard volume conversions
        // Do NOT apply density adjustments to solids measured by volume
        return defaultGrams;
    }

    /**
     * Get nutritional information for a parsed ingredient
     */
    async getIngredientNutrition(parsedIngredient: ParsedIngredient): Promise<IngredientNutrition> {
        // Debug logging
        if (process.env.DEBUG_NUTRITION) {
            console.log(`🔍 Processing ingredient: "${parsedIngredient.original}"`);
            console.log(`   Parsed: ${parsedIngredient.quantity} ${parsedIngredient.unit} ${parsedIngredient.ingredient}`);
        }
        // Skip ingredients with no quantity (to taste, etc.)
        if (parsedIngredient.quantity === 0) {
            return {
                ingredient: parsedIngredient,
                nutrition: { calories: 0, protein: 0, fat: 0, carbs: 0 },
                confidence: 'low',
                source: 'fallback'
            };
        }

        try {
            // Convert to grams for calculation
            const grams = this.quantityToGrams(
                parsedIngredient.quantity,
                parsedIngredient.unit,
                parsedIngredient.ingredient
            );

            if (process.env.DEBUG_NUTRITION) {
                console.log(`   Quantity to grams: ${parsedIngredient.quantity} ${parsedIngredient.unit} = ${grams}g`);
            }

            // Search for the ingredient in USDA database
            const foodItem = await this.usdaApi.findBestMatch(parsedIngredient.ingredient);

            if (!foodItem) {
                if (process.env.DEBUG_NUTRITION) {
                    console.log(`   ❌ No USDA match found for "${parsedIngredient.ingredient}"`);
                }
                return this.createFallbackNutrition(parsedIngredient);
            }

            if (process.env.DEBUG_NUTRITION) {
                console.log(`   ✅ Found USDA match: "${foodItem.description}" (FDC ID: ${foodItem.fdcId})`);
            }

            // Get macros from the food item
            const macros = this.usdaApi.getMacros(foodItem.foodNutrients);

            if (process.env.DEBUG_NUTRITION) {
                console.log(`   USDA macros per 100g: ${JSON.stringify(macros)}`);
            }

            if (!macros.calories && !macros.protein && !macros.fat && !macros.carbs) {
                if (process.env.DEBUG_NUTRITION) {
                    console.log(`   ⚠️  No macro data available in USDA result`);
                }
                return this.createFallbackNutrition(parsedIngredient);
            }

            // USDA data is per 100g, so scale accordingly
            const scaleFactor = grams / 100;

            if (process.env.DEBUG_NUTRITION) {
                console.log(`   Scale factor: ${grams}g / 100g = ${scaleFactor}`);
            }

            const nutrition: NutritionalInfo = {
                calories: (macros.calories || 0) * scaleFactor,
                protein: (macros.protein || 0) * scaleFactor,
                fat: (macros.fat || 0) * scaleFactor,
                carbs: (macros.carbs || 0) * scaleFactor,
            };

            if (process.env.DEBUG_NUTRITION) {
                console.log(`   Final nutrition: ${JSON.stringify(nutrition)}`);
            }

            // Determine confidence based on search result score and data completeness
            const hasAllMacros = macros.calories && macros.protein && macros.fat && macros.carbs;
            const confidence = hasAllMacros && foodItem.score > 50 ? 'high' : 'medium';

            return {
                ingredient: parsedIngredient,
                nutrition,
                confidence,
                source: 'usda'
            };

        } catch (error) {
            if (process.env.DEBUG_NUTRITION) {
                console.log(`   ❌ Error getting nutrition: ${error}`);
            }
            console.warn(`Failed to get nutrition for "${parsedIngredient.original}": ${error}`);
            return this.createFallbackNutrition(parsedIngredient);
        }
    }

    /**
     * Create fallback nutrition data when USDA lookup fails
     */
    private createFallbackNutrition(parsedIngredient: ParsedIngredient): IngredientNutrition {
        // Provide reasonable fallback estimates based on ingredient type
        const ingredientLower = parsedIngredient.ingredient.toLowerCase();
        let fallbackNutrition: NutritionalInfo = { calories: 0, protein: 0, fat: 0, carbs: 0 };

        if (ingredientLower.includes('spinach') || ingredientLower.includes('lettuce') || ingredientLower.includes('greens')) {
            fallbackNutrition = { calories: 25, protein: 3, fat: 0, carbs: 4 };
        } else if (ingredientLower.includes('chicken') || ingredientLower.includes('beef') || ingredientLower.includes('pork')) {
            fallbackNutrition = { calories: 250, protein: 25, fat: 15, carbs: 0 };
        } else if (ingredientLower.includes('olive oil') || ingredientLower.includes('oil')) {
            fallbackNutrition = { calories: 120, protein: 0, fat: 14, carbs: 0 };
        } else if (ingredientLower.includes('egg')) {
            fallbackNutrition = { calories: 70, protein: 6, fat: 5, carbs: 0.5 };
        } else if (ingredientLower.includes('cheese')) {
            fallbackNutrition = { calories: 110, protein: 7, fat: 9, carbs: 1 };
        } else if (ingredientLower.includes('avocado')) {
            fallbackNutrition = { calories: 160, protein: 2, fat: 15, carbs: 9 };
        } else {
            // Generic fallback
            fallbackNutrition = { calories: 50, protein: 2, fat: 2, carbs: 5 };
        }

        // Scale by quantity (rough approximation)
        const scale = Math.max(0.5, Math.min(parsedIngredient.quantity, 5)); // Reasonable bounds
        fallbackNutrition = {
            calories: fallbackNutrition.calories * scale,
            protein: fallbackNutrition.protein * scale,
            fat: fallbackNutrition.fat * scale,
            carbs: fallbackNutrition.carbs * scale,
        };

        return {
            ingredient: parsedIngredient,
            nutrition: fallbackNutrition,
            confidence: 'low',
            source: 'fallback'
        };
    }

    /**
     * Calculate total nutrition for a list of ingredients
     */
    async calculateMealNutrition(ingredients: string[]): Promise<MealNutrition> {
        if (process.env.DEBUG_NUTRITION) {
            console.log(`🍽️  Calculating nutrition for meal with ${ingredients.length} ingredients:`);
            ingredients.forEach((ing, i) => console.log(`   ${i + 1}. ${ing}`));
        }

        const parsedIngredients = ingredients.map(ing => this.parseIngredient(ing));
        const ingredientNutritions: IngredientNutrition[] = [];

        // Process ingredients with some concurrency but respect rate limits
        const batchSize = 3; // Process 3 ingredients at a time
        for (let i = 0; i < parsedIngredients.length; i += batchSize) {
            const batch = parsedIngredients.slice(i, i + batchSize);
            const batchPromises = batch.map(ing => this.getIngredientNutrition(ing));
            const batchResults = await Promise.all(batchPromises);
            ingredientNutritions.push(...batchResults);
        }

        // Sum up all nutrition
        const total: NutritionalInfo = { calories: 0, protein: 0, fat: 0, carbs: 0 };

        for (const ingNutrition of ingredientNutritions) {
            total.calories += ingNutrition.nutrition.calories;
            total.protein += ingNutrition.nutrition.protein;
            total.fat += ingNutrition.nutrition.fat;
            total.carbs += ingNutrition.nutrition.carbs;
        }

        if (process.env.DEBUG_NUTRITION) {
            console.log(`📊 Meal nutrition totals: ${JSON.stringify(total)}`);
            console.log(`   Breakdown by ingredient:`);
            ingredientNutritions.forEach(ing => {
                console.log(`   - ${ing.ingredient.original}: ${ing.nutrition.calories} cal, ${ing.nutrition.protein}g protein, ${ing.nutrition.fat}g fat, ${ing.nutrition.carbs}g carbs (${ing.source})`);
            });
        }

        // Determine overall confidence
        const highConfidence = ingredientNutritions.filter(i => i.confidence === 'high').length;
        const totalIngredients = ingredientNutritions.length;

        let confidence: 'high' | 'medium' | 'low' = 'low';
        if (highConfidence / totalIngredients > 0.7) {
            confidence = 'high';
        } else if (highConfidence / totalIngredients > 0.4) {
            confidence = 'medium';
        }

        return {
            total,
            ingredients: ingredientNutritions,
            confidence
        };
    }

    /**
     * Calculate nutrition for multiple meals
     */
    async calculateMealsNutrition(meals: Array<{ name: string; ingredients?: string[] }>): Promise<Array<{
        name: string;
        nutrition: MealNutrition;
    }>> {
        const results = await Promise.all(
            meals.map(async (meal) => ({
                name: meal.name,
                nutrition: meal.ingredients
                    ? await this.calculateMealNutrition(meal.ingredients)
                    : {
                        total: { calories: 0, protein: 0, fat: 0, carbs: 0 },
                        ingredients: [],
                        confidence: 'low' as const
                    }
            }))
        );

        return results;
    }
}

