---
name: Yêu cầu Tài liệu
description: Đề xuất cải thiện, bổ sung hoặc sửa đổi tài liệu
title: "[Docs]: "
labels: ["documentation", "triage"]
body:
  - type: markdown
    attributes:
      value: |
        Cảm ơn bạn đã đóng góp ý kiến để cải thiện tài liệu của WellNexus!

  - type: input
    id: affected-docs
    attributes:
      label: Tài liệu bị ảnh hưởng
      description: Tài liệu nào cần được cập nhật? (để trống nếu đề xuất tài liệu mới)
      placeholder: ex. docs/README.md, CONTRIBUTING.md, https://wellnexus.vn/docs/...
    validations:
      required: false

  - type: textarea
    id: problem
    attributes:
      label: Mô tả vấn đề
      description: Tài liệu hiện tại thiếu gì, sai gì, hoặc cần cải thiện điều gì?
      placeholder: Ví dụ: Hướng dẫn cài đặt thiếu bước cấu hình Supabase...
      value: ""
    validations:
      required: true

  - type: textarea
    id: proposed-solution
    attributes:
      label: Giải pháp đề xuất
      description: Bạn đề xuất nội dung mới như thế nào?
      placeholder: Mô tả nội dung bạn muốn thêm/sửa...
    validations:
      required: true

  - type: dropdown
    id: urgency
    attributes:
      label: Mức độ ưu tiên
      description: Tài liệu này quan trọng như thế nào?
      options:
        - 🔴 Cao (người dùng không thể tiếp tục)
        - 🟡 Trung bình (gây khó khăn nhưng vẫn dùng được)
        - 🟢 Thấp (cải thiện nhỏ)
    validations:
      required: true

  - type: input
    id: related-issues
    attributes:
      label: Issue liên quan (nếu có)
      description: Link đến các issue/PR liên quan
      placeholder: ex. #123, #456
    validations:
      required: false

  - type: checkboxes
    id: contribution
    attributes:
      label: Bạn có muốn đóng góp không?
      options:
        - label: Tôi muốn tự cập nhật tài liệu này (gửi PR)
          required: false
