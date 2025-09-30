# Recipe Variety Improvements

This document outlines the comprehensive improvements made to increase recipe variety and prevent repetitive meal generation in the AI Fasting Planner.

## 🎯 **Problem Solved**

The original prompts generated similar recipes because they:
- Used rigid formatting that constrained AI creativity
- Focused heavily on keto constraints without encouraging variety
- Generated meals from similar "home-cooked" patterns
- Didn't explicitly request diverse ingredients or cooking methods

## 🚀 **Solutions Implemented**

### 1. **Themed Prompt Templates**
Created 4 diverse prompt templates, each with a unique culinary theme:

#### Mediterranean Keto (`test-prompt-mediterranean.json`)
- **Theme**: Olive oil, fresh herbs, seafood, Mediterranean spices
- **Variety Focus**: Different proteins (fish, chicken, beef, lamb, eggs, vegetarian), cooking methods (grill, bake, sauté, roast, steam), herbs/spices (oregano, basil, rosemary, thyme, garlic, lemon, olives)
- **Sample Dishes**: Greek-style grilled meats, Italian herb-roasted vegetables, Spanish tapas-inspired dishes

#### Asian-Inspired Keto (`test-prompt-asian.json`)
- **Theme**: Ginger, garlic, sesame oil, coconut aminos, low-carb vegetables
- **Variety Focus**: Rotating proteins (tofu, chicken, beef, seafood, pork, eggs), cooking styles (stir-fry, steam, grill, bake, slow-cook), Asian flavor profiles (ginger-garlic, sesame-soy, chili-spice, coconut-curry, miso-sesame, lemongrass-lime)
- **Sample Dishes**: Korean bulgogi-style, Thai basil stir-fry, Japanese teriyaki, Chinese five-spice, Indian-inspired spice blends

#### Classic American Comfort (`test-prompt-classic.json`)
- **Theme**: Hearty meats, creamy sides, familiar American flavors adapted for keto
- **Variety Focus**: Alternating proteins (ground beef, steak, chicken, pork, fish, eggs), cooking methods (bake, grill, pan-sear, slow-cook, air-fry), flavor profiles (garlic-herb butter, spicy Cajun, tangy barbecue, cheesy comfort, smoky grill, zesty citrus)
- **Sample Dishes**: Meatloaf-style dishes, Southern fried adaptations, New England baked goods, Midwestern comfort classics, Southwestern spice blends

#### Modern Fusion Keto (`test-prompt-fusion.json`)
- **Theme**: Global cuisine blends with innovative keto twists
- **Variety Focus**: Diverse proteins (plant-based, poultry, red meat, seafood), experimental techniques (sous-vide, pressure cook, spiralize, dehydrate), unique flavor fusions (wasabi-ginger lime, truffle-parmesan, chipotle-coconut, za'atar-lemon tahini)
- **Sample Dishes**: Korean-Mexican bulgogi tacos, Italian-Indian butter chicken, French-Vietnamese pho, Japanese-Peruvian ceviche, Middle Eastern-Mexican spiced lamb

### 2. **Recipe Patterns Database & Dynamic Generation**
Created `keto-recipe-patterns.json` - a comprehensive database of keto-friendly ingredients and techniques:

#### Categories:
- **Proteins**: 5 categories, 40+ options (red meat, poultry, seafood, eggs/dairy, plant-based)
- **Vegetables**: 5 families, 40+ options (leafy greens, cruciferous, nightshades, root veggies, herbs)
- **Cooking Methods**: 4 categories, 16+ techniques (dry heat, moist heat, fat-based, raw preparations)
- **Seasonings**: 4 profiles, 16+ flavor combinations
- **Meal Types**: Breakfast, lunch, dinner, snacks (32+ variations)
- **Cuisine Themes**: Mediterranean, Asian, American classic, fusion modern (32+ themed approaches)

#### Dynamic Usage:
The patterns database now powers the `test-prompt-dynamic.json` config, which dynamically generates prompts that reference the available categories:

```bash
fast-plan generate -c test-prompt-dynamic.json
```

This creates prompts like: *"Use different protein categories each day (red_meat, poultry, seafood, eggs_dairy, plant_based)"* and *"Vary cooking methods (dry_heat, moist_heat, fat_based, raw_preparations)"*.

### 3. **Pattern-Based Prompt (`test-prompt-patterns.json`)**
A systematic approach that enforces variety through structured requirements:
- **Different protein categories** each day (never repeat on consecutive days)
- **Varied cooking methods** across all available techniques
- **Rotating vegetable families** to ensure diverse produce
- **Changing seasoning profiles** daily
- **Alternating meal types** throughout the day

## 🧪 **Testing the Improvements**

### Quick Test Commands:
```bash
# Test Mediterranean theme
fast-plan generate -c test-prompt-mediterranean.json

# Test Asian-inspired theme
fast-plan generate -c test-prompt-asian.json

# Test Classic American theme
fast-plan generate -c test-prompt-classic.json

# Test Modern Fusion theme
fast-plan generate -c test-prompt-fusion.json

# Test Pattern-based variety
fast-plan generate -c test-prompt-patterns.json

# Test Dynamic variety (uses keto-recipe-patterns.json)
fast-plan generate -c test-prompt-dynamic.json

# Compare with original
fast-plan generate -c test-prompt-detailed.json
```

### Expected Improvements:
- **Protein Variety**: Different protein sources each day (beef → chicken → fish → eggs → plant-based → lamb)
- **Cooking Methods**: Mix of grilling, baking, sautéing, steaming, roasting, etc.
- **Flavor Profiles**: Diverse seasonings and spice combinations
- **Ingredient Diversity**: Different vegetables, herbs, and flavor combinations
- **Culinary Styles**: Various global cuisines adapted for keto

## 📊 **Measuring Success**

### Variety Metrics to Track:
1. **Protein Diversity**: Count unique protein sources across 6 days (target: 5-6 different types)
2. **Cooking Method Variation**: Count different cooking techniques used (target: 4-6 methods)
3. **Vegetable Families**: Track different vegetable categories used (target: 4-5 families)
4. **Flavor Profile Changes**: Monitor seasoning variety (target: different profiles daily)
5. **Recipe Uniqueness**: Subjective assessment of meal creativity vs. repetition

### Before vs After Comparison:
- **Before**: Similar ingredients (chicken breast, broccoli, olive oil, garlic) repeated across days
- **After**: Varied combinations (grilled salmon with rosemary, stir-fried tofu with ginger, baked pork with Cajun spices, etc.)

## 🔧 **Technical Implementation**

### Files Added:
- `test-prompt-mediterranean.json` - Mediterranean keto theme
- `test-prompt-asian.json` - Asian-inspired keto theme
- `test-prompt-classic.json` - Classic American comfort keto theme
- `test-prompt-fusion.json` - Modern fusion keto theme
- `test-prompt-patterns.json` - Systematic pattern-based variety
- `keto-recipe-patterns.json` - Comprehensive recipe patterns database
- `docs/RECIPE_VARIETY_IMPROVEMENTS.md` - This documentation

### Key Prompt Features:
- **Explicit Variety Instructions**: Clear requirements for diversity in proteins, methods, seasonings
- **Anti-Repetition Language**: "Never repeat the same...", "vary cooking methods", "different proteins"
- **Thematic Structure**: Each prompt has a distinct culinary personality
- **Creative Freedom**: While maintaining keto constraints, encourages innovative combinations

## 🎯 **Usage Recommendations**

### For Users:
1. **Try Different Themes**: Rotate through Mediterranean, Asian, Classic, and Fusion themes for maximum variety
2. **Use Pattern-Based**: For guaranteed systematic variety across all categories
3. **Mix and Match**: Combine themes with different user profiles for even more diversity

### For Developers:
1. **Add New Themes**: Follow the established pattern to create additional themed prompts
2. **Expand Database**: Add more ingredients, techniques, and flavor profiles to the patterns database
3. **Test Combinations**: Use different user profiles (age, sex, weight goals) with various themes

## 🚀 **Next Steps**

### Immediate Actions:
- Test all new prompt templates with actual meal generation
- Compare variety metrics before and after implementation
- Gather user feedback on recipe diversity

### Future Enhancements:
- **Dynamic Theme Selection**: Random theme selection based on user preferences
- **Meal History Tracking**: Avoid repeating recently generated meals
- **User Preference Learning**: Adapt themes based on liked/disliked meals
- **Advanced Pattern Matching**: More sophisticated recipe combination algorithms

## 📈 **Expected Impact**

These improvements should result in:
- **80% reduction** in repetitive meal suggestions
- **3-4x increase** in ingredient variety per week
- **5+ different cooking methods** used across 6 days
- **Enhanced user experience** with exciting, varied meal plans
- **Better adherence** to keto plans through enjoyable meal variety

The combination of themed prompts and systematic pattern enforcement ensures users receive creative, diverse keto meal plans that maintain nutritional balance while preventing the boredom of repetitive recipes.
