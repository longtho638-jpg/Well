-- BẬT REPLICATION CHO REALTIME (MỤC TIÊU 1)
-- Cho phép bảng users gửi sự kiện realtime
alter table "users" replica identity full;

-- Đảm bảo publication 'supabase_realtime' tồn tại và thêm bảng users vào
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime for table users;
commit;

-- HÀM ĐỆ QUY LẤY CÂY HỆ THỐNG (MỤC TIÊU 2)
-- Input: root_user_id (UUID)
-- Output: Danh sách tất cả cấp dưới kèm theo level (độ sâu)
create or replace function get_downline_tree(root_user_id uuid)
returns table (
  id uuid,
  name text,
  email text,
  sponsor_id uuid,
  rank text,
  avatar_url text,
  created_at timestamptz,
  total_sales numeric,
  level integer,
  path text[]
) language sql stable as $$
  with recursive downline as (
    -- Anchor member: Lấy chính user gốc (level 0) hoặc bắt đầu từ F1 (level 1)
    -- Ở đây ta bắt đầu tìm các F1 của root_user_id
    select 
      u.id, 
      u.name, 
      u.email, 
      u.sponsor_id, 
      u.rank, 
      u.avatar_url, 
      u.created_at, 
      u.total_sales, 
      1 as level,
      array[u.name] as path
    from users u
    where u.sponsor_id = root_user_id

    union all

    -- Recursive member: Tìm con của các member tìm được ở bước trên
    select 
      u.id, 
      u.name, 
      u.email, 
      u.sponsor_id, 
      u.rank, 
      u.avatar_url, 
      u.created_at, 
      u.total_sales, 
      d.level + 1,
      d.path || u.name
    from users u
    join downline d on u.sponsor_id = d.id
    where d.level < 7 -- Giới hạn tới F7 để tránh loop vô hạn hoặc quá tải
  )
  select * from downline;
$$;
