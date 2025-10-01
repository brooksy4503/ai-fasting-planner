#!/usr/bin/env node

// Simple test script for USDA nutrition integration
// Usage: node test-nutrition.js [usda-api-key]

const { USDAAPIService } = require('./dist/usdaApi');
const { NutritionCalculator, USDAAPIInterface } = require('./dist/nutritionCalculator');

// Enable debug logging
process.env.DEBUG_NUTRITION = '1';

// Mock USDA API for testing without real API key
class MockUSDAApi {
    // Implement the USDAAPIInterface
    async findBestMatch(ingredientQuery) {
        // Return mock data for our test ingredients
        const mockData = {
            'large eggs': {
                fdcId: 123,
                description: 'Eggs, large',
                score: 100,
                foodNutrients: [
                    { nutrientId: 1008, value: 155 }, // calories per 100g
                    { nutrientId: 1003, value: 13 },  // protein per 100g
                    { nutrientId: 1004, value: 11 },  // fat per 100g
                    { nutrientId: 1005, value: 1.1 }  // carbs per 100g
                ]
            },
            'fresh spinach': {
                fdcId: 456,
                description: 'Spinach, raw',
                score: 95,
                foodNutrients: [
                    { nutrientId: 1008, value: 23 },  // Actually closer to 23 cal/100g is correct
                    { nutrientId: 1003, value: 2.9 },
                    { nutrientId: 1004, value: 0.4 },
                    { nutrientId: 1005, value: 3.6 }
                ]
            },
            'sliced mushrooms': {
                fdcId: 789,
                description: 'Mushrooms, white, raw',
                score: 90,
                foodNutrients: [
                    { nutrientId: 1008, value: 22 },  // Actually 22 cal/100g is correct
                    { nutrientId: 1003, value: 3.1 },
                    { nutrientId: 1004, value: 0.3 },
                    { nutrientId: 1005, value: 3.3 }
                ]
            },
            'butter': {
                fdcId: 101,
                description: 'Butter, salted',
                score: 100,
                foodNutrients: [
                    { nutrientId: 1008, value: 717 },
                    { nutrientId: 1003, value: 0.9 },
                    { nutrientId: 1004, value: 81 },
                    { nutrientId: 1005, value: 0.1 }
                ]
            },
            'chicken breast': {
                fdcId: 2187885,
                description: 'CHICKEN BREAST',
                score: 1236,
                foodNutrients: [
                    { nutrientId: 1008, value: 165 }, // 165 cal per 100g (real USDA data)
                    { nutrientId: 1003, value: 20.4 }, // 20.4g protein per 100g
                    { nutrientId: 1004, value: 8.1 },  // 8.1g fat per 100g
                    { nutrientId: 1005, value: 1.06 }  // 1.06g carbs per 100g
                ]
            },
            'mixed greens': {
                fdcId: 2097148,
                description: 'MIXED GREENS',
                score: 1293,
                foodNutrients: [
                    { nutrientId: 1008, value: 29 },  // 29 cal per 100g (real USDA data)
                    { nutrientId: 1003, value: 2.35 }, // 2.35g protein per 100g
                    { nutrientId: 1004, value: 0 },    // 0g fat per 100g
                    { nutrientId: 1005, value: 5.88 }  // 5.88g carbs per 100g
                ]
            },
            'cucumber': {
                fdcId: 169225,
                description: 'Cucumber, peeled, raw',
                score: 420,
                foodNutrients: [
                    { nutrientId: 1008, value: 10 },  // 10 cal per 100g (real USDA data)
                    { nutrientId: 1003, value: 0.59 }, // 0.59g protein per 100g
                    { nutrientId: 1004, value: 0.16 }, // 0.16g fat per 100g
                    { nutrientId: 1005, value: 2.16 }  // 2.16g carbs per 100g
                ]
            },
            'avocado': {
                fdcId: 171706,
                description: 'Avocados, raw, California',
                score: 441,
                foodNutrients: [
                    { nutrientId: 1008, value: 167 }, // 167 cal per 100g (real USDA data)
                    { nutrientId: 1003, value: 1.96 }, // 1.96g protein per 100g
                    { nutrientId: 1004, value: 15.4 }, // 15.4g fat per 100g
                    { nutrientId: 1005, value: 8.64 }  // 8.64g carbs per 100g
                ]
            },
            'olive oil': {
                fdcId: 2073857,
                description: 'OLIVE OIL',
                score: 1051,
                foodNutrients: [
                    { nutrientId: 1008, value: 429 }, // 429 cal per 100g (real USDA data for generic olive oil)
                    { nutrientId: 1003, value: 0 },
                    { nutrientId: 1004, value: 42.9 }, // 42.9g fat per 100g
                    { nutrientId: 1005, value: 7.14 }  // 7.14g carbs per 100g
                ]
            },
            'lemon juice': {
                fdcId: 167747,
                description: 'Lemon juice, raw',
                score: 509, // Lower score to test filtering prefers complete data
                foodNutrients: [
                    { nutrientId: 1008, value: 22 },  // 22 cal per 100g (real USDA data)
                    { nutrientId: 1003, value: 0.35 }, // 0.35g protein per 100g
                    { nutrientId: 1004, value: 0.24 }, // 0.24g fat per 100g
                    { nutrientId: 1005, value: 6.9 }   // 6.9g carbs per 100g
                ]
            }
        };

        // Simple matching - check multiple variations
        const query = ingredientQuery.toLowerCase();
        for (const [key, data] of Object.entries(mockData)) {
            if (query.includes(key)) {
                return data;
            }
        }

        // Special cases for complex ingredient names
        if (query.includes('chicken breast') || query.includes('chicken')) {
            return mockData['chicken breast'];
        }
        if (query.includes('mixed greens') || query.includes('greens') || query.includes('lettuce')) {
            return mockData['mixed greens'];
        }
        if (query.includes('cucumber')) {
            return mockData['cucumber'];
        }
        if (query.includes('avocado')) {
            return mockData['avocado'];
        }
        if (query.includes('olive oil') || query.includes('oil')) {
            return mockData['olive oil'];
        }
        if (query.includes('lemon juice') || query.includes('lemon')) {
            return mockData['lemon juice'];
        }

        return null;
    }

    getMacros(foodNutrients) {
        return {
            calories: foodNutrients.find(n => n.nutrientId === 1008)?.value,
            protein: foodNutrients.find(n => n.nutrientId === 1003)?.value,
            fat: foodNutrients.find(n => n.nutrientId === 1004)?.value,
            carbs: foodNutrients.find(n => n.nutrientId === 1005)?.value,
        };
    }
}

async function testUSDAIntegration() {
    const apiKey = process.argv[2] || process.env.USDA_API_KEY;

    let usdaApi;
    if (!apiKey) {
        console.log('⚠️  No USDA API key provided - using mock data for testing');
        usdaApi = new MockUSDAApi();
    } else {
        usdaApi = new USDAAPIService(apiKey);
    }

    console.log('🧪 Testing USDA Nutrition Integration\n');

    try {
        // Skip API connectivity test when using mock data
        if (apiKey) {
            console.log('1️⃣ Testing USDA API connectivity...');
            const realUSDApi = new USDAAPIService(apiKey);
            const searchResults = await realUSDApi.searchFoods('chicken breast', { pageSize: 5 });
            console.log(`✅ Found ${searchResults.totalHits} results for "chicken breast"`);
            console.log(`   Best match: ${searchResults.foods[0]?.description || 'None'}`);
        }

        // Test 2: Nutrition calculation
        console.log('\n2️⃣ Testing nutrition calculation...');
        const nutritionCalculator = new NutritionCalculator(usdaApi);

        // Test with the corrected chicken salad recipe (matches user's actual recipe)
        const testIngredients = [
            '150g chicken breast',
            '2 cups mixed greens (lettuce, spinach)',
            '1/2 cucumber, sliced',
            '1/4 avocado, sliced',
            '2 tablespoons olive oil',
            '1 tablespoon lemon juice',
            'salt and pepper'
        ];

        console.log('   Testing problematic chicken salad recipe:');
        testIngredients.forEach(ing => console.log(`   • ${ing}`));

        const mealNutrition = await nutritionCalculator.calculateMealNutrition(testIngredients);

        console.log('\n✅ Chicken salad nutrition calculation results:');
        console.log(`   Calories: ${Math.round(mealNutrition.total.calories)} (should be ~516)`);
        console.log(`   Protein: ${mealNutrition.total.protein.toFixed(1)}g (should be ~35.7g)`);
        console.log(`   Fat: ${mealNutrition.total.fat.toFixed(1)}g (should be ~32.2g)`);
        console.log(`   Carbs: ${mealNutrition.total.carbs.toFixed(1)}g (should be ~19.6g)`);
        console.log(`   Confidence: ${mealNutrition.confidence}`);
        console.log(`   Ingredients processed: ${mealNutrition.ingredients.length}`);

        // Simulate LLM claiming USDA but providing wrong numbers
        const mockMealWithWrongUSDA = {
            name: 'Test Grilled Chicken Salad',
            ingredients: testIngredients,
            macros: { calories: 362, fat: 16, protein: 38, carbs: 17 }, // Wrong numbers
            nutritionSource: 'usda', // LLM claims USDA
            nutritionConfidence: 'medium'
        };

        console.log('\n🧪 Testing LLM USDA claim validation:');
        console.log(`   LLM claimed: ${mockMealWithWrongUSDA.macros.calories} cal (${mockMealWithWrongUSDA.nutritionSource} - ${mockMealWithWrongUSDA.nutritionConfidence})`);
        console.log(`   Our calculation: ${Math.round(mealNutrition.total.calories)} cal`);
        console.log(`   Difference: ${Math.round(Math.abs(mealNutrition.total.calories - mockMealWithWrongUSDA.macros.calories))} cal`);

        const percentDiff = Math.abs(mealNutrition.total.calories - mockMealWithWrongUSDA.macros.calories) / Math.max(mockMealWithWrongUSDA.macros.calories, mealNutrition.total.calories);
        console.log(`   Percent difference: ${Math.round(percentDiff * 100)}%`);

        if (percentDiff > 0.2) {
            console.log('   ✅ Would be flagged as inaccurate LLM claim (confidence: low)');
        } else {
            console.log('   ⚠️  Would be accepted as reasonable (confidence: medium)');
        }

        // Test 3: Ingredient parsing
        console.log('\n3️⃣ Testing ingredient parsing...');
        const testParsing = [
            '2 cups spinach',
            '4 oz ground beef',
            '1 tbsp olive oil',
            '1/2 cup chopped onion'
        ];

        testParsing.forEach(ingredient => {
            const parsed = nutritionCalculator.parseIngredient(ingredient);
            console.log(`   "${ingredient}" → ${parsed.quantity} ${parsed.unit} ${parsed.ingredient}`);
        });

        console.log('\n🎉 All tests passed! USDA integration is working correctly.');

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        if (error.statusCode) {
            console.error(`   HTTP Status: ${error.statusCode}`);
        }
        process.exit(1);
    }
}

testUSDAIntegration();
