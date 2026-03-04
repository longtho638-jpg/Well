---
name: Feature request
description: Suggest an idea for this project
title: "[Feature]: "
labels: ["enhancement", "triage"]
body:
  - type: markdown
    attributes:
      value: |
        Thanks for taking the time to suggest a feature!

  - type: textarea
    id: problem
    attributes:
      label: Is your feature request related to a problem?
      description: A clear and concise description of what the problem is.
      placeholder: I'm always frustrated when...
    validations:
      required: false

  - type: textarea
    id: solution
    attributes:
      label: Describe the solution you'd like
      description: A clear and concise description of what you want to happen.
    validations:
      required: true

  - type: textarea
    id: alternatives
    attributes:
      label: Describe alternatives you've considered
      description: A clear and concise description of any alternative solutions or features you've considered.
    validations:
      required: false

  - type: dropdown
    id: impact
    attributes:
      label: Impact
      description: How would you rate the impact of this feature?
      options:
        - Nice to have
        - Would improve user experience
        - Critical for my use case
    validations:
      required: true

  - type: checkboxes
    id: terms
    attributes:
      label: Code of Conduct
      description: By submitting this issue, you agree to follow our [Code of Conduct](../CODE_OF_CONDUCT.md)
      options:
        - label: I agree to follow this project's Code of Conduct
          required: true
