---
trigger: branch_push
conditions: ["branch != main", "branch != develop"]
---

# PR Generation Hook

Automatically triggered when pushing to feature branches.

## Actions:
1. Analyze all changes with Kiro AI
2. Generate PR title and description
3. Suggest reviewers based on code areas
4. Add appropriate labels
5. Create draft PR automatically

## Kiro AI Integration:
- Analyze commit history and changes
- Generate comprehensive PR descriptions
- Suggest appropriate reviewers
- Detect related issues and link them
- Recommend labels based on change type

## Smart Features:
- Multi-commit analysis for comprehensive descriptions
- Code area analysis for reviewer suggestions
- Impact assessment for change categorization
- Automatic issue linking