import fetch from 'node-fetch';

export interface USDANutrient {
    nutrientId: number;
    nutrientName: string;
    nutrientNumber: string;
    unitName: string;
    derivationCode: string;
    derivationDescription: string;
    derivationId: number;
    value: number;
    foodNutrientSourceId: number;
    foodNutrientSourceCode: string;
    foodNutrientSourceDescription: string;
    rank: number;
    indentLevel: number;
    foodNutrientId: number;
    dataPoints?: number;
}

export interface USDAFoodItem {
    fdcId: number;
    description: string;
    lowercaseDescription: string;
    dataType: string;
    gtinUpc: string;
    publishedDate: string;
    brandOwner: string;
    brandName: string;
    ingredients: string;
    marketCountry: string;
    foodCategory: string;
    modifiedDate: string;
    dataSource: string;
    packageWeight: string;
    servingSizeUnit: string;
    servingSize: number;
    householdServingFullText: string;
    tradeChannels: string[];
    allHighlightFields: string;
    score: number;
    microbes: any[];
    foodNutrients: USDANutrient[];
    finalFoodInputFoods: any[];
    foodMeasures: any[];
    foodAttributes: any[];
    foodAttributeTypes: any[];
    foodVersionIds: any[];
}

export interface USDASearchResponse {
    totalHits: number;
    currentPage: number;
    totalPages: number;
    pageList: number[];
    foodSearchCriteria: {
        query: string;
        generalSearchInput: string;
        pageNumber: number;
        numberOfResultsPerPage: number;
        pageSize: number;
        requireAllWords: boolean;
    };
    foods: USDAFoodItem[];
    aggregations: {
        dataType: { [key: string]: number };
        nutrients: any;
    };
}

export interface USDAFoodDetails {
    fdcId: number;
    description: string;
    dataType: string;
    publicationDate: string;
    foodCode: string;
    foodNutrients: USDANutrient[];
    foodPortions: any[];
    inputFoods: any[];
    wweiaFoodCategory: any;
    foodCategory: any;
}

export class USDAAPIError extends Error {
    constructor(message: string, public statusCode?: number, public response?: any) {
        super(message);
        this.name = 'USDAAPIError';
    }
}

export class USDAAPIService {
    private readonly baseUrl = 'https://api.nal.usda.gov/fdc/v1';
    private readonly rateLimitDelayMs = 100; // 100ms between requests (safe for 1000/hour limit)
    private lastRequestTime = 0;

    constructor(private apiKey: string) {
        if (!apiKey) {
            throw new Error('USDA API key is required');
        }
    }

    private async enforceRateLimit(): Promise<void> {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        if (timeSinceLastRequest < this.rateLimitDelayMs) {
            await new Promise(resolve => setTimeout(resolve, this.rateLimitDelayMs - timeSinceLastRequest));
        }
        this.lastRequestTime = Date.now();
    }

    private async makeRequest<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
        await this.enforceRateLimit();

        const urlParams = new URLSearchParams({
            api_key: this.apiKey,
            ...params
        });

        const url = `${this.baseUrl}${endpoint}?${urlParams.toString()}`;

        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'AI-Fasting-Planner/1.0',
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                let errorMessage = `USDA API request failed: ${response.status} ${response.statusText}`;

                if (response.status === 429) {
                    errorMessage = 'USDA API rate limit exceeded. Please wait before retrying.';
                } else if (response.status === 401) {
                    errorMessage = 'Invalid USDA API key. Please check your configuration.';
                } else if (response.status === 404) {
                    errorMessage = 'Food item not found in USDA database.';
                }

                let responseData;
                try {
                    responseData = await response.json();
                } catch {
                    // Ignore JSON parsing errors for error responses
                }

                throw new USDAAPIError(errorMessage, response.status, responseData);
            }

            return await response.json() as T;
        } catch (error) {
            if (error instanceof USDAAPIError) {
                throw error;
            }

            // Network or other errors
            throw new USDAAPIError(`Network error accessing USDA API: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Search for foods in the USDA database
     */
    async searchFoods(query: string, options: {
        dataType?: string[];
        brandOwner?: string;
        pageSize?: number;
        pageNumber?: number;
    } = {}): Promise<USDASearchResponse> {
        const params: Record<string, string> = {
            query: query.trim(),
            sortBy: 'score',
            sortOrder: 'desc'
        };

        if (options.dataType && options.dataType.length > 0) {
            params.dataType = options.dataType.join(',');
        }

        if (options.brandOwner) {
            params.brandOwner = options.brandOwner;
        }

        if (options.pageSize) {
            params.pageSize = Math.min(options.pageSize, 200).toString(); // Max 200 per page
        }

        if (options.pageNumber) {
            params.pageNumber = options.pageNumber.toString();
        }

        return this.makeRequest<USDASearchResponse>('/foods/search', params);
    }

    /**
     * Get detailed information for a specific food item by FDC ID
     */
    async getFoodDetails(fdcId: number): Promise<USDAFoodDetails> {
        return this.makeRequest<USDAFoodDetails>(`/food/${fdcId}`);
    }

    /**
     * Get multiple food details by FDC IDs
     */
    async getFoodsDetails(fdcIds: number[]): Promise<USDAFoodDetails[]> {
        if (fdcIds.length === 0) return [];

        const fdcIdsParam = fdcIds.join(',');
        return this.makeRequest<USDAFoodDetails[]>(`/foods`, { fdcIds: fdcIdsParam });
    }

    /**
     * Get nutrient value for a specific nutrient ID from a food item
     */
    getNutrientValue(foodNutrients: USDANutrient[], nutrientId: number): number | null {
        const nutrient = foodNutrients.find(n => n.nutrientId === nutrientId);
        return nutrient ? nutrient.value : null;
    }

    /**
     * Get standard macro nutrients (calories, protein, fat, carbs) from a food item
     */
    getMacros(foodNutrients: USDANutrient[]): {
        calories: number | null;
        protein: number | null;
        fat: number | null;
        carbs: number | null;
    } {
        return {
            calories: this.getNutrientValue(foodNutrients, 1008), // Energy (kcal)
            protein: this.getNutrientValue(foodNutrients, 1003),  // Protein
            fat: this.getNutrientValue(foodNutrients, 1004),      // Total lipid (fat)
            carbs: this.getNutrientValue(foodNutrients, 1005),    // Carbohydrate, by difference
        };
    }

    /**
     * Search for the best matching food item for an ingredient
     */
    async findBestMatch(ingredientQuery: string, options: {
        dataType?: string[];
        requireGeneric?: boolean;
    } = {}): Promise<USDAFoodItem | null> {
        try {
            const searchResults = await this.searchFoods(ingredientQuery, {
                dataType: options.dataType || ['Foundation', 'SR Legacy', 'Branded'],
                pageSize: 10
            });

            if (process.env.DEBUG_NUTRITION) {
                console.log(`   🔎 USDA search for "${ingredientQuery}": ${searchResults.totalHits} results`);
                if (searchResults.foods.length > 0) {
                    console.log(`      Top result: "${searchResults.foods[0].description}" (score: ${searchResults.foods[0].score})`);
                }
            }

            if (searchResults.totalHits === 0) {
                return null;
            }

            // Filter and rank results to prefer appropriate matches
            const filteredFoods = this.filterAndRankFoods(searchResults.foods, ingredientQuery);

            if (process.env.DEBUG_NUTRITION && filteredFoods[0] !== searchResults.foods[0]) {
                console.log(`      After filtering: "${filteredFoods[0].description}" (was: "${searchResults.foods[0].description}")`);
            }

            // Return the best filtered result
            return filteredFoods[0] || null;
        } catch (error) {
            if (process.env.DEBUG_NUTRITION) {
                console.log(`   ❌ USDA search error for "${ingredientQuery}": ${error}`);
            }
            if (error instanceof USDAAPIError) {
                console.warn(`USDA API search failed for "${ingredientQuery}": ${error.message}`);
            } else {
                console.warn(`Unexpected error searching for "${ingredientQuery}": ${error}`);
            }
            return null;
        }
    }

    /**
     * Filter and rank food results to prefer appropriate matches
     */
    private filterAndRankFoods(foods: USDAFoodItem[], ingredientQuery: string): USDAFoodItem[] {
        const query = ingredientQuery.toLowerCase();

        // Score each food item based on appropriateness
        const scoredFoods = foods.map(food => {
            let score = food.score || 0;
            const description = food.description.toLowerCase();

            // Boost score for raw/fresh items when searching for produce
            if ((query.includes('avocado') || query.includes('fruit') || query.includes('vegetable')) &&
                description.includes('raw') && !description.includes('oil')) {
                score += 50;
            }

            // Penalize oils when searching for fruits/vegetables
            if ((query.includes('avocado') || query.includes('olive') || query.includes('coconut')) &&
                description.includes('oil') && !query.includes('oil')) {
                score -= 100;
            }

            // Penalize processed/prepared items that might not be what we want
            if (description.includes('dressing') || description.includes('spread') ||
                description.includes('dip') || description.includes('sauce')) {
                score -= 30;
            }

            // Strongly prefer items with complete nutritional data
            const macros = this.getMacros(food.foodNutrients);
            const hasCompleteData = macros.calories && macros.protein && macros.fat && macros.carbs;
            if (hasCompleteData) {
                score += 50; // Increased from 10 to 50
            } else if (!macros.calories && !macros.protein && !macros.fat && !macros.carbs) {
                // Strongly penalize items with no nutritional data at all
                score -= 1000; // Increased from 200 to 1000
            }

            return { ...food, adjustedScore: score };
        });

        // Sort by adjusted score (highest first)
        scoredFoods.sort((a, b) => b.adjustedScore - a.adjustedScore);

        // Return foods with their original structure (remove adjustedScore)
        return scoredFoods.map(({ adjustedScore, ...food }) => food);
    }
}
