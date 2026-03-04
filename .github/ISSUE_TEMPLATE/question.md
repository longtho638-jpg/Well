---
name: Câu hỏi
description: Đặt câu hỏi về cách sử dụng, tính năng, hoặc dự án
title: "[Question]: "
labels: ["question", "triage"]
body:
  - type: markdown
    attributes:
      value: |
        Cảm ơn bạn đã quan tâm đến WellNexus!

        > 💡 **Mẹo:** Kiểm tra [Discussions](https://github.com/longtho638-jpg/Well/discussions) để xem câu hỏi của bạn đã được trả lời chưa.

  - type: textarea
    id: question
    attributes:
      label: Câu hỏi của bạn
      description: Mô tả chi tiết câu hỏi bạn cần giải đáp
      placeholder: Ví dụ: Làm thế nào để cấu hình email notification? Tôi có thể tự host WellNexus trên server riêng không?...
      value: ""
    validations:
      required: true

  - type: dropdown
    id: category
    attributes:
      label: Danh mục
      description: Câu hỏi của bạn thuộc chủ đề nào?
      options:
        - Cài đặt & Cấu hình
        - Sử dụng Dashboard
        - API & Integration
        - Thanh toán & Subscription
        - MLM/Affiliate System
        - AI Agents
        - Deployment
        - Khác
    validations:
      required: true

  - type: textarea
    id: context
    attributes:
      label: Ngữ cảnh
      description: Cung cấp thêm thông tin về trường hợp sử dụng của bạn
      placeholder: Mô tả trường hợp sử dụng, mục tiêu, hoặc vấn đề bạn đang gặp phải...
    validations:
      required: false

  - type: input
    id: environment
    attributes:
      label: Môi trường (nếu áp dụng)
      description: Phiên bản, hệ điều hành, hoặc môi trường deployment
      placeholder: ex. WellNexus v3.0.0, Ubuntu 22.04, Vercel deployment
    validations:
      required: false

  - type: textarea
    id: tried
    attributes:
      label: Những gì bạn đã thử
      description: Kể cho chúng tôi biết bạn đã làm gì để tìm câu trả lời
      placeholder: Ví dụ: Đã đọc docs/README.md, đã search issues, đã hỏi Google...
    validations:
      required: false

  - type: checkboxes
    id: checklist
    attributes:
      label: Xác nhận
      options:
        - label: Tôi đã tìm kiếm trong [issues](https://github.com/longtho638-jpg/Well/issues) và [discussions](https://github.com/longtho638-jpg/Well/discussions) nhưng không tìm thấy câu trả lời
          required: true
