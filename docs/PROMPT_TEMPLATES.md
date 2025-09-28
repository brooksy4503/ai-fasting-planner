# Prompt Templates for Development Testing

This document explains how to use custom prompt templates for testing different AI prompt variations during development.

## How It Works

You can include a `promptTemplate` field in your test configuration files to override the default prompt. The template supports variable substitution using `${finalAnswers.fieldName}` syntax.

When you use a custom template, the system will:
1. Load your template from the config file
2. Substitute all `${finalAnswers.fieldName}` variables with actual values
3. Display debug information showing the transformation
4. Send the final prompt to the AI model

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

Create a JSON file with your custom prompt template. **Important**: Include all required fields to avoid interactive prompts:

```json
{
    "promptTemplate": "Your custom prompt here with ${finalAnswers.sex} and ${finalAnswers.age} variables...",
    "fastingStart": "Friday 8pm",
    "fastingEnd": "Sunday 8am", 
    "diet": "Keto",
    "currentWeight": "180 lbs",
    "targetWeight": "160 lbs",
    "sex": "Male",
    "age": "35",
    "height": "5'10\"",
    "timeframe": "6 months",
    "activityLevel": "Moderately Active (moderate exercise, 3-5 days/week, 5-10k steps)"
}
```

### Required Fields

To avoid interactive prompts, your template config should include:
- `fastingStart` and `fastingEnd` - Fasting window
- `diet` - Diet type (Keto/Low-Carb/Custom)
- `currentWeight` and `targetWeight` - Weight goals
- `sex`, `age`, `height` - Personal details
- `timeframe` - Goal timeframe
- `activityLevel` - Activity level

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

## Debug Logging

When using custom prompt templates, debug information is automatically displayed to help you understand what's happening:

```
🧪 Using custom prompt template from config
📋 Final answers: {
  fastingStart: 'Friday 8pm',
  fastingEnd: 'Sunday 8am',
  diet: 'Keto',
  currentWeight: '180 lbs',
  targetWeight: '160 lbs',
  sex: 'Male',
  age: '35',
  height: '5\'10"',
  timeframe: '6 months',
  activityLevel: 'Moderately Active (moderate exercise, 3-5 days/week, 5-10k steps)'
}
📝 Raw template: Your custom prompt with ${finalAnswers.sex} and ${finalAnswers.age}...
🔄 Evaluated prompt: Your custom prompt with Male and 35...
```

### Debug Default Prompts

For default prompts (when no template is used), enable debug logging:

```bash
DEBUG_PROMPT=1 fast-plan generate
```

This will show:
```
📝 Using default prompt
🔄 Prompt: Generate 6 keto meals for a week...
```

## Tips

1. **Variable Substitution**: Always use the exact format `${finalAnswers.fieldName}` for variables
2. **Complete Configs**: Include all required fields to avoid interactive prompts during testing
3. **Debug Output**: Use the automatic debug logging to verify variable substitution is working
4. **Fallback Safety**: If no `promptTemplate` is provided, the default prompt is used
5. **Testing Workflow**: Combine prompt templates with different user profiles for comprehensive testing
6. **Version Control**: Save successful prompt variations in your repository for future reference

## Development Workflow

1. **Create Template**: Create a new prompt template config file with all required fields
2. **Test Quickly**: Test with `fast-plan generate -c your-template.json`
3. **Review Debug Output**: Check the debug logs to verify variable substitution
4. **Iterate**: Modify the `promptTemplate` field and test again
5. **Compare Results**: Run different templates to compare AI outputs
6. **Version Control**: Save successful prompt variations in your repository

### Example Workflow

```bash
# 1. Create a new template
echo '{
  "promptTemplate": "Create ${finalAnswers.diet} meals for ${finalAnswers.sex}, age ${finalAnswers.age}...",
  "fastingStart": "Friday 8pm",
  "fastingEnd": "Sunday 8am",
  "diet": "Keto",
  "sex": "Male",
  "age": "35",
  "currentWeight": "180 lbs",
  "targetWeight": "160 lbs",
  "height": "5'\''10\"",
  "timeframe": "6 months",
  "activityLevel": "Moderately Active (moderate exercise, 3-5 days/week, 5-10k steps)"
}' > my-test-template.json

# 2. Test it
fast-plan generate -c my-test-template.json

# 3. Review the debug output to see:
# 🧪 Using custom prompt template from config
# 📝 Raw template: Create ${finalAnswers.diet} meals for ${finalAnswers.sex}...
# 🔄 Evaluated prompt: Create Keto meals for Male, age 35...

# 4. Iterate by editing the promptTemplate field
# 5. Test again to compare results
```

## Troubleshooting

### Variables Not Substituting
- **Problem**: Variables like `${finalAnswers.sex}` appear literally in output
- **Solution**: Ensure exact syntax `${finalAnswers.fieldName}` and check debug logs

### Still Getting Prompts
- **Problem**: CLI still asks for user input despite config file
- **Solution**: Include all required fields in your config (see Required Fields section)

### Template Not Loading
- **Problem**: Default prompt used instead of custom template
- **Solution**: Verify file path and JSON syntax. Check for "📁 Loaded test configuration" message
