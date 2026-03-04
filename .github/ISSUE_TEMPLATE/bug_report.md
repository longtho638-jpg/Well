---
name: Bug Report
description: File a bug report
title: "[Bug]: "
labels: ["bug", "triage"]
assignees:
  - octocat
body:
  - type: markdown
    attributes:
      value: |
        Thanks for taking the time to fill out this bug report!

  - type: input
    id: contact
    attributes:
      label: Contact Details (optional)
      description: How can we get in touch with you if we need more info?
      placeholder: ex. email@example.com
    validations:
      required: false

  - type: textarea
    id: what-happened
    attributes:
      label: What happened?
      description: Also tell us, what did you expect to happen?
      placeholder: Tell us what you see!
      value: "A bug happened!"
    validations:
      required: true

  - type: dropdown
    id: version
    attributes:
      label: Version
      description: What version of our software are you running?
      options:
        - 2.4.0 (Latest)
        - 2.3.0
        - 2.2.0
        - Other (specify in description)
    validations:
      required: true

  - type: dropdown
    id: browsers
    attributes:
      label: What browsers are you seeing the problem on?
      multiple: true
      options:
        - Firefox
        - Chrome
        - Safari
        - Microsoft Edge
        - Mobile (iOS)
        - Mobile (Android)
    validations:
      required: false

  - type: textarea
    id: logs
    attributes:
      label: Relevant log output
      description: Please copy and paste any relevant log output. This will be automatically formatted into code, so no need for backticks.
      render: shell
    validations:
      required: false

  - type: textarea
    id: screens
    attributes:
      label: Screenshots
      description: If applicable, add screenshots to help explain your problem.
      placeholder: Drag and drop screenshots here
    validations:
      required: false

  - type: input
    id: url
    attributes:
      label: Page URL
      description: On which page did you encounter this bug?
      placeholder: ex. https://wellnexus.vn/dashboard
    validations:
      required: false
