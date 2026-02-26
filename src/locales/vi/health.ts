export const health = {
healthCoach: {
    title: "Health Coach AI",
    subtitle: "Trợ lý sức khỏe thông minh - Tư vấn sản phẩm cá nhân hóa",
    greeting: "Xin chào! Tôi là **WellNexus Health Coach** 🌿\n\nHãy chia sẻ với tôi về tình trạng sức khỏe hoặc triệu chứng bạn đang gặp phải. Tôi sẽ tư vấn combo sản phẩm phù hợp nhất cho bạn.\n\n**Ví dụ:** \"Tôi hay bị mất ngủ và đau đầu\" hoặc \"Tôi thường xuyên cảm thấy mệt mỏi\".",
    greetingResponse: "Xin chào! Tôi là **WellNexus Health Coach** - trợ lý sức khỏe AI của bạn. 🌿\n\nHãy mô tả các triệu chứng hoặc vấn đề sức khỏe bạn đang gặp, tôi sẽ tư vấn sản phẩm phù hợp nhất.\n\n**Ví dụ:** \"Tôi hay bị mất ngủ, đau đầu\" hoặc \"Tôi cảm thấy mệt mỏi, hay bị ốm\".",
    fallbackResponse: "Cảm ơn bạn đã chia sẻ. Để tư vấn chính xác hơn, bạn có thể mô tả cụ thể hơn các triệu chứng không?\n\n**Gợi ý:** Hãy cho tôi biết bạn đang gặp vấn đề gì (ví dụ: mất ngủ, đau đầu, mệt mỏi, hay bị ốm...)",
    sleepStressResponse: "Dựa trên các triệu chứng bạn mô tả (mất ngủ, đau đầu, căng thẳng), tôi khuyên dùng **Combo ANIMA Thư Giãn**. Combo này được thiết kế đặc biệt để cải thiện giấc ngủ và giảm căng thẳng thần kinh.",
    fatigueResponse: "Triệu chứng mệt mỏi và sức đề kháng kém có thể do cơ thể thiếu dinh dưỡng. Tôi gợi ý **Combo Năng Lượng & Miễn Dịch** để phục hồi sức khỏe.",
    comboRelaxation: "Combo ANIMA Thư Giấc",
    comboEnergy: "Combo Năng Lượng & Miễn Dịch",
    reasonRelaxation: "ANIMA 119 giúp ổn định hệ thần kinh, cải thiện giấc ngủ. Immune Boost bổ sung năng lượng và tăng sức đề kháng.",
    reasonEnergy: "Starter Kit cung cấp dinh dưỡng toàn diện, Immune Boost tăng cường miễn dịch và giảm mệt mỏi.",
    totalLabel: "Tổng cộng:",
    orderNow: "Tạo đơn ngay",
    orderSuccess: "✅ Đã tạo đơn hàng thành công!\n\n**{comboName}** ({totalPrice}) đã được thêm vào lịch sử giao dịch của bạn.\n\nBạn có thể kiểm tra tại trang **Ví Hoa Hồng**. Cảm ơn bạn đã tin dùng ANIMA! 🎉",
    placeholder: "Mô tả triệu chứng của bạn... (VD: Tôi hay bị mất ngủ, đau đầu)",
    send: "Gửi",
    quickSuggestionsLabel: "Gợi ý câu hỏi:",
    suggestions: {
      sleep: "Tôi hay bị mất ngủ",
      fatigue: "Tôi cảm thấy mệt mỏi",
      immunity: "Tăng cường miễn dịch"
    },
    disclaimerTech: "💡 Health Coach AI sử dụng công nghệ phân tích triệu chứng để đề xuất sản phẩm phù hợp.",
    disclaimerMedical: "Lưu ý: Đây là công cụ hỗ trợ, không thay thế tư vấn y tế chuyên nghiệp.",
    analyzing: "Đang phân tích..."
  },
healthCheck: {
    dimensions: {
      sleep: "Giấc ngủ",
      stress: "Căng thẳng",
      energy: "Năng lượng",
      exercise: "Vận động",
      goal: "Mục tiêu"
    },
    questions: {
      sleep: {
        question: "Bạn thường ngủ bao nhiêu tiếng mỗi đêm?",
        options: {
          under5: "Dưới 5 tiếng",
          _5to6: "5-6 tiếng",
          _6to7: "6-7 tiếng",
          _7to8: "7-8 tiếng",
          over8: "Trên 8 tiếng"
        }
      },
      stress: {
        question: "Bạn có hay bị stress hoặc lo âu không?",
        options: {
          veryOften: "Rất thường xuyên",
          often: "Thường xuyên",
          sometimes: "Thỉnh thoảng",
          rarely: "Hiếm khi",
          never: "Không bao giờ"
        }
      },
      energy: {
        question: "Mức năng lượng của bạn trong ngày như thế nào?",
        options: {
          veryTired: "Rất mệt mỏi",
          tired: "Thường xuyên mệt",
          normal: "Bình thường",
          energetic: "Tràn đầy năng lượng",
          veryEnergetic: "Luôn năng động"
        }
      },
      exercise: {
        question: "Bạn tập thể dục bao nhiêu lần mỗi tuần?",
        options: {
          never: "Không bao giờ",
          _1to2: "1-2 lần/tuần",
          _3to4: "3-4 lần/tuần",
          _5plus: "5+ lần/tuần"
        }
      },
      goal: {
        question: "Mục tiêu sức khỏe chính của bạn là gì?",
        options: {
          betterSleep: "Cải thiện giấc ngủ",
          reduceStress: "Giảm stress",
          increaseEnergy: "Tăng năng lượng",
          boostImmunity: "Tăng cường miễn dịch",
          overallHealth: "Sức khỏe tổng thể"
        }
      }
    },
    questionProgress: "Câu hỏi {current} / {total}",
    back: "Quay lại",
    next: "Tiếp theo",
    viewResults: "Xem kết quả",
    timeInfo: "⏱️ Chỉ mất 2 phút để hoàn thành • 🔒 Thông tin của bạn được bảo mật",
    resultsTitle: "Kết Quả Đánh Giá",
    yourHealthScore: "Điểm sức khỏe của bạn",
    scoreLabels: {
      excellent: "Xuất sắc",
      good: "Tốt",
      average: "Trung bình",
      needsImprovement: "Cần cải thiện"
    },
    scoreDescriptions: {
      excellent: "Tuyệt vời! Bạn đang duy trì lối sống rất khỏe mạnh. Hãy tiếp tục!",
      good: "Sức khỏe của bạn ở mức tốt, nhưng vẫn có thể cải thiện thêm.",
      average: "Sức khỏe của bạn cần được quan tâm nhiều hơn. Hãy bắt đầu thay đổi ngay!",
      poor: "Sức khỏe của bạn đang cần được cải thiện khẩn cấp. Hãy tham khảo các giải pháp dưới đây!"
    },
    radarTitle: "Điểm Sức Khỏe",
    recommendationsTitle: "Gợi ý sản phẩm phù hợp",
    priceLabel: "Giá",
    orderNow: "Đặt ngay",
    products: {
      anima119: {
        name: "Combo ANIMA Thư Giãn",
        reason: "Hỗ trợ ổn định hệ thần kinh, cải thiện giấc ngủ và giảm căng thẳng",
        benefits: {
          sleep: "Giúp ngủ sâu, ngủ ngon hơn",
          stress: "Giảm lo âu, stress",
          emotion: "Cân bằng cảm xúc",
          memory: "Tăng cường trí nhớ"
        }
      },
      immuneBoost: {
        name: "Combo Năng Lượng & Miễn Dịch",
        reason: "Tăng cường hệ miễn dịch và năng lượng cho cơ thể",
        benefits: {
          immunity: "Tăng sức đề kháng",
          fatigue: "Giảm mệt mỏi",
          antioxidant: "Chống oxy hóa",
          recovery: "Phục hồi sức khỏe nhanh"
        }
      },
      starterKit: {
        name: "Starter Kit",
        reason: "Combo dinh dưỡng toàn diện cho sức khỏe tổng thể",
        benefits: {
          nutrition: "Bổ sung dinh dưỡng đầy đủ",
          balance: "Cân bằng cơ thể",
          health: "Tăng cường sức khỏe",
          allAges: "Phù hợp mọi lứa tuổi"
        }
      }
    },
    consultationTitle: "Cần tư vấn chuyên sâu hơn?",
    consultationDescription: "Kết nối ngay với Partner của bạn qua Zalo để được tư vấn miễn phí 1-1",
    chatNow: "Nhắn tin Zalo ngay",
    restartQuiz: "Làm lại bài đánh giá →",
    add_product: "Add Product",
    bonus_revenue_dttt_represent: "Bonus Revenue DTTT Represents",
    commit: "Commit",
    dttt_basis: "DTTT Basis",
    dttt_commission_logic: "DTTT Commission Logic",
    edit_config: "Edit Config",
    esc: "ESC",
    global_catalog: "Global Catalog",
    in_stock: "In Stock",
    inventory_management_dttt_st: "Inventory Management DTTT Stock",
    low_stock: "Low Stock",
    member_21_startup_25: "Member 21% / Startup 25%",
    member_comm: "Member Comm",
    out_of_stock: "Out of Stock",
    partner_comm: "Partner Comm",
    retail_msrp: "Retail (MSRP)",
    sku: "SKU"
  },
healthcheck: {
    "100": "100%",
    i_m_s_t_ng_kh_a_c_nh_s_c_kh: "Điểm số từng khía cạnh sức khỏe",
    l_i_ch_kh_c: "Lợi ích khác",
    ph_n_t_ch_chi_ti_t: "Phân tích chi tiết",
    s_n_ph_m_c_ai_xu_t_d_nh: "Sản phẩm được AI đề xuất dành cho bạn",
    u_ti_n: "Ưu tiên"
  }
};
