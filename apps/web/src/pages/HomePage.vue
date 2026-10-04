<template>
  <section class="hero shell">
    <p class="eyebrow">
      Một đường dẫn. Trọn câu chuyện nghề nghiệp.
    </p>
    <h1>CV của bạn<br><em>nên có sức sống.</em></h1>
    <p class="hero-copy">
      Biến kinh nghiệm, dự án và kỹ năng thành một portfolio chỉn chu—dễ cập nhật,
      đẹp trên mọi màn hình và sẵn sàng để gửi đi.
    </p>
    <div class="hero-actions">
      <RouterLink
        class="button"
        to="/register"
      >
        Tạo portfolio miễn phí
      </RouterLink>
      <a
        class="text-link"
        href="#how-it-works"
      >Xem cách hoạt động ↓</a>
    </div>
    <div
      class="hero-note"
      aria-label="Cam kết sản phẩm"
    >
      <span>Không cần biết code</span><span>Public khi bạn sẵn sàng</span><span>Một tài khoản, nhiều portfolio</span>
    </div>
  </section>

  <aside
    class="brand-meaning shell"
    aria-labelledby="brand-meaning-title"
  >
    <p class="brand-meaning-label">
      Tên gọi nói lên điều gì?
    </p>
    <div>
      <h2
        id="brand-meaning-title"
        translate="no"
      >
        Folio<span>Hub</span>
      </h2>
      <p>“Folio” là hồ sơ năng lực của bạn, còn “Hub” là nơi mọi phiên bản được tập trung. FolioHub giúp bạn tạo, cập nhật và chia sẻ câu chuyện nghề nghiệp bằng một đường dẫn duy nhất.</p>
    </div>
  </aside>

  <section
    id="how-it-works"
    class="steps shell"
  >
    <p class="section-number">
      01 — Bắt đầu
    </p>
    <div class="section-heading">
      <h2>Từ trang trắng đến link chia sẻ trong ba bước.</h2>
      <p>Bạn tập trung vào câu chuyện. FolioHub lo phần trình bày.</p>
    </div>
    <ol>
      <li><strong>Điền nội dung</strong><span>Thêm giới thiệu, kinh nghiệm, dự án và kỹ năng.</span></li>
      <li><strong>Xem trước</strong><span>Chỉnh sửa và thấy kết quả ngay trong một bố cục rõ ràng.</span></li>
      <li><strong>Xuất bản</strong><span>Bật public khi sẵn sàng, tắt đi bất cứ lúc nào.</span></li>
    </ol>
  </section>

  <section class="closing shell">
    <p class="eyebrow">
      Cơ hội tiếp theo có thể bắt đầu từ đây.
    </p>
    <h2>Đừng chỉ gửi một file.<br>Hãy gửi một ấn tượng.</h2>
    <RouterLink
      class="button button-light"
      to="/register"
    >
      Bắt đầu ngay
    </RouterLink>
  </section>
</template>
