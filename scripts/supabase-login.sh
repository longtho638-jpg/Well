#!/bin/bash

# Script tự động login Supabase CLI

echo "🔐 SUPABASE CLI LOGIN"
echo "===================="
echo ""

# Kiểm tra đã cài Supabase CLI chưa
if ! command -v supabase &> /dev/null; then
    echo "❌ Chưa cài Supabase CLI"
    echo "Chạy: brew install supabase/tap/supabase"
    exit 1
fi

echo "✅ Supabase CLI: $(supabase --version)"
echo ""

# Hướng dẫn
echo "📋 HƯỚNG DẪN:"
echo "1. Script này sẽ mở trình duyệt"
echo "2. Anh đăng nhập Supabase"
echo "3. Token sẽ tự động lưu"
echo ""
read -p "Nhấn Enter để tiếp tục..."

# Chạy login
echo ""
echo "🚀 Đang mở trình duyệt..."
supabase login

# Kiểm tra kết quả
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ ĐĂNG NHẬP THÀNH CÔNG!"
    echo ""
    echo "Tiếp theo, link project:"
    echo "supabase link --project-ref dbwzwgvsxiyzddflggoe"
else
    echo ""
    echo "❌ Đăng nhập thất bại"
    echo ""
    echo "Thử cách thủ công:"
    echo "1. Lấy token: https://supabase.com/dashboard/account/tokens"
    echo "2. Lưu vào: ~/.supabase/access-token"
fi
