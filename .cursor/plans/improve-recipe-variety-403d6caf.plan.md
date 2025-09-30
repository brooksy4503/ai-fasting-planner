<!-- 403d6caf-4b45-48ef-933b-7b62b6264397 e8110842-44ba-4eca-b3bd-1e3a1ece3b5d -->
# Improve Recipe Variety in AI Fasting Planner

## Problem Analysis

The current prompts generate similar recipes because they:

- Use rigid formatting instructions that constrain creativity
- Don't explicitly request variety in meal types, cuisines, or preparation methods  
- Focus heavily on keto constraints without encouraging diverse ingredient combinations
- Generate meals from similar "home-cooked" patterns

## Proposed Solutions

### 1. **Prompt Diversification Strategy**

Implement multiple prompt templates that encourage different cooking approaches and cuisines within keto constraints.

**Key Changes:**

- Create prompt templates that specify different meal themes (Mediterranean, Asian-inspired, Classic American, etc.)
- Add explicit instructions to vary cooking methods, seasonings, and ingredient combinations
- Include variety requirements like "use different proteins across days" and "vary cooking techniques"

**Benefits:** Gives AI clear direction for diversity while maintaining keto compliance.

### 2. **Recipe Database Integration** 

Build a curated database of keto recipe patterns and randomly sample from them during generation.

**Key Changes:**

- Create a JSON database of keto recipe templates with different categories (proteins, veggies, cooking methods)
- Modify the prompt to randomly select from recipe pattern combinations
- Include meal rotation logic to prevent repetition across multiple generations

**Benefits:** Ensures systematic variety while maintaining nutritional balance.

### 3. **Dynamic Prompt Generation**

Implement AI-driven prompt enhancement that creates varied prompts based on user preferences and previous meal history.

**Key Changes:**

- Add a "meal history" feature that tracks previously generated meals
- Create a meta-prompt that generates varied prompts based on past meals and user preferences  
- Include explicit anti-repetition instructions like "avoid these previously used ingredients/recipes"

**Benefits:** Uses AI intelligence to create naturally diverse prompts that adapt to user history.

## Implementation Priority

1. **Prompt Diversification** - Quick win, immediate impact with minimal code changes
2. **Recipe Database** - Medium effort, provides consistent variety
3. **Dynamic Prompts** - Advanced approach, maximum flexibility but requires more development

## Next Steps

Select which approach(es) to implement and create specific prompt templates for testing.

### To-dos

- [ ] Document why current prompts lead to similar recipes (rigid structure, no variety instructions, limited creativity)
- [ ] Create 3-4 new prompt templates with different themes (Mediterranean keto, Asian-inspired, Classic comfort, etc.)
- [ ] Build JSON database of keto recipe patterns (proteins, veggies, cooking methods) for random sampling
- [ ] Add explicit variety requirements to prompts (different proteins, cooking methods, seasonings per day)
- [ ] Test new prompts with multiple generations to measure improvement in recipe diversity