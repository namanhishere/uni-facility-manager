# Technical Architecture Document
Project: **University Facility Manager**

## 1. Architectural Pattern: Modular Monolith

Dự án được xây dựng dựa trên kiến trúc **Modular Monolith**. Thay vì chia nhỏ thành các Microservices ngay từ đầu (gây phức tạp về hạ tầng và deploy), hoặc một Monolith hỗn độn (Spaghetti code), Modular Monolith giúp tổ chức source code thành các Module độc lập xoay quanh các *Domain Business* cụ thể.

### Tại sao chọn Modular Monolith?
*   **High Cohesion, Low Coupling**: Các logic liên quan được gom lại trong một module.
*   **Ví dụ điển hình - Tách biệt Booking và Payment**: 
    *   Module `Booking` chỉ quan tâm đến việc giữ chỗ, kiểm tra lịch trống và quản lý trạng thái đặt phòng.
    *   Module `Payment` chịu trách nhiệm xử lý giao dịch tiền tệ, tích hợp cổng thanh toán.
    *   **Lợi ích**: Khi thay đổi logic tính tiền hoặc thay đổi cổng thanh toán (Payment Gateway), module `Booking` hoàn toàn không bị ảnh hưởng. Dễ dàng bảo trì, debug (khoanh vùng lỗi) và có thể tách thành Microservices riêng biệt trong tương lai nếu cần scale.

---

## 2. Cơ sở dữ liệu (Database): PostgreSQL

PostgreSQL được lựa chọn vì tính mạnh mẽ, tuân thủ ACID và hỗ trợ các tính năng nâng cao (Trigger, Stored Procedures, Advanced Indexing) giúp logic toàn vẹn dữ liệu được đảm bảo ngay từ tầng DB.

### Tối ưu hóa truy vấn (Performance & Indexing)
Việc đánh Index trong dự án không phải ngẫu nhiên mà tập trung vào các "điểm nóng" truy vấn:
*   **Composite Index `(check_in_time, check_out_time)`**: Đây là index quan trọng nhất. Mọi thao tác tìm kiếm phòng trống, kiểm tra lịch trùng đều phải quét qua khoảng thời gian này. Index giúp Database không phải scan toàn bộ bảng.
*   **Foreign Key Index `(user_id, facility_id)`**: Tối ưu hóa các câu lệnh `JOIN` khi lấy lịch sử đặt phòng của user hoặc danh sách booking của một phòng.
*   **Status Index**: Giúp bộ lọc (Filter) theo trạng thái (PENDING, CONFIRMED...) ở Dashboard quản lý diễn ra tức thì.

---

## 3. Tích hợp hệ thống (System Integration)

Hệ thống giao tiếp với thế giới bên ngoài và frontend thông qua các chuẩn giao thức hiện đại:

*   **RESTful API**: Giao thức chính để Frontend (Next.js) giao tiếp với Backend (NestJS). API được thiết kế theo Resource-oriented (VD: `POST /api/bookings`, `GET /api/facilities`).
*   **SSO - Single Sign-On (OAuth2)**:
    *   Tích hợp login tập trung (Centralized Authentication) giả lập hệ thống của trường đại học.
    *   Sử dụng luồng OAuth2 Authorization Code Flow để bảo mật, không lưu password người dùng trong DB của ứng dụng.
*   **Webhooks**: 
    *   Được thiết kế để xử lý **Asynchronous Payment**. Ví dụ: Khi người dùng thanh toán qua Ví điện tử/Banking, cổng thanh toán sẽ gọi lại (callback/webhook) vào hệ thống để cập nhật trạng thái đơn hàng mà không cần user phải giữ kết nối.

---

## 4. Kỹ thuật áp dụng (Implementation Techniques)

Project sử dụng các Design Pattern cổ điển để tăng tính linh hoạt (Flexibility) và dễ mở rộng (Extensibility):

### A. Strategy Pattern
*   **Áp dụng**: Module Authentication.
*   **Mục đích**: Hệ thống có thể hỗ trợ nhiều phương thức đăng nhập khác nhau (Local User, Google OAuth, University SSO) mà `AuthService` không cần sửa đổi logic chính (`Open-Closed Principle`). Ta chỉ cần switch "Strategy" tương ứng.

### B. Factory Pattern
*   **Áp dụng**: Logic khởi tạo Booking hoặc xử lý dữ liệu từ các nguồn khác nhau.
*   **Mục đích**: Đóng gói sự phức tạp khi tạo ra các đối tượng Booking phức tạp (có kèm Equipment, có Recurrence/Lặp lại).

### C. Observer Pattern (Event-Driven)
*   **Áp dụng**: Hệ thống Notification.
*   **Mục đích**: Khi một Booking được tạo thành công (`BookingCreated`), Service sẽ "bắn" ra một Event. Module Notification sẽ "lắng nghe" event này để gửi email/thông báo.
*   **Lợi ích**: Module Booking không cần biết đến sự tồn tại của Email Service. Nếu sau này muốn thêm chức năng "Gửi SMS", chỉ cần thêm một Listener mới mà không cần sửa code cũ.

---

## 5. Giải quyết bài toán Overbooking (Concurrency Control)

Một trong những vấn đề khó nhất của hệ thống đặt phòng là **Race Condition**: Hai sinh viên cùng bấm nút "Đặt phòng" tại đúng một thời điểm cho cùng một phòng.

### Giải pháp: Database Locking & Constraints
Thay vì chỉ kiểm tra ở tầng ứng dụng (Application Layer - vốn không tin cậy khi chạy nhiều instance), project áp dụng các lớp bảo vệ tại Database:

1.  **Pessimistic Locking (FOR UPDATE)**: (Tùy chọn áp dụng trong Code) Khi bắt đầu giao dịch đặt phòng, row dữ liệu của Facility hoặc Slot thời gian đó bị khóa. Các transaction khác phải chờ.
2.  **PostgreSQL EXCLUDE Constraint (Giải pháp chính)**:
    *   Sử dụng tính năng `EXCLUDE USING GIST` của PostgreSQL.
    *   Định nghĩa: *"Không cho phép 2 dòng dữ liệu có cùng `facility_id` mà khoảng thời gian `[check_in, check_out]` giao nhau (overlaps &&)"*.
    *   Đây là chốt chặn cuối cùng và mạnh mẽ nhất. Nếu code logic lọt lưới, Database sẽ throw error ngay lập tức, đảm bảo Data Integrity tuyệt đối.

---

## 6. Các công nghệ khác (Tech Stack Overview)

*   **Frontend**: Next.js 15 (App Router), TailwindCSS, Shadcn/UI, Lucide React.
*   **Backend**: NestJS (Node.js framework), TypeORM.
*   **Containerization**: Docker & Docker Compose (Giúp setup môi trường dev/prod đồng nhất).
*   **Validation**: Zod (Frontend), Class-Validator (Backend DTO).
