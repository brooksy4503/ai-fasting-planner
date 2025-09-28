# Prompt Templates for Development Testing

This document explains how to use custom prompt templates for testing different AI prompt variations during development.

## How It Works

You can now include a `promptTemplate` field in your test configuration files to override the default prompt. The template supports variable substitution using `${finalAnswers.fieldName}` syntax.

## Available Variables

- `${finalAnswers.sex}` - Male/Female/Other
- `${finalAnswers.age}` - Age in years
- `${finalAnswers.height}` - Height (e.g., "5'10\"" or "178 cm")
- `${finalAnswers.currentWeight}` - Current weight (e.g., "180 lbs")
- `${finalAnswers.targetWeight}` - Target weight (e.g., "160 lbs")
- `${finalAnswers.timeframe}` - Time to reach goal (e.g., "6 months")
- `${finalAnswers.activityLevel}` - Activity level description
- `${finalAnswers.fastingStart}` - Fasting start time (e.g., "Friday 8pm")
- `${finalAnswers.fastingEnd}` - Fasting end time (e.g., "Sunday 8am")
- `${finalAnswers.diet}` - Diet type (Keto/Low-Carb/Custom)

## Example Usage

```bash
# Test with detailed prompt template
fast-plan generate -c test-prompt-detailed.json

# Test with simple prompt template  
fast-plan generate -c test-prompt-simple.json

# Test with budget-focused prompt template
fast-plan generate -c test-prompt-budget.json
```

## Creating Custom Templates

Create a JSON file with your custom prompt template:

```json
{
    "promptTemplate": "Your custom prompt here with ${finalAnswers.sex} and ${finalAnswers.age} variables...",
    "currentWeight": "180 lbs",
    "targetWeight": "160 lbs",
    "sex": "Male",
    "age": "35"
}
```

## Included Templates

### test-prompt-detailed.json
- Comprehensive meal plans with cooking instructions
- Includes nutritional information and macros
- Detailed ingredient lists and cooking steps

### test-prompt-simple.json  
- Quick and basic meal names only
- Under 20 minute prep focus
- Minimal output format

### test-prompt-budget.json
- Budget-friendly ingredient focus
- Cost estimates per meal
- Meal prep optimization tips

## Tips

1. **Variable Substitution**: Always use the exact format `${finalAnswers.fieldName}` for variables
2. **Debugging**: When using a custom template, you'll see "🧪 Using custom prompt template from config" in the output
3. **Fallback**: If no `promptTemplate` is provided, the default prompt is used
4. **Testing**: Combine prompt templates with different user profiles for comprehensive testing

## Development Workflow

1. Create a new prompt template config file
2. Test with: `fast-plan generate -c your-template.json`
3. Iterate on the prompt template
4. Compare results across different templates
5. Version control your successful prompt variations
