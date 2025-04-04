import React from "react";
import Layout from "../../components/Layout";
// import SEO from "../components/seo"

// --- Định nghĩa các Section Components với Tailwind Classes - ĐÃ ĐIỀU CHỈNH ---

const Hero = () => {
  return (
    // Giữ nguyên màu gradient cho Hero
    <section className="bg-gradient-to-r from-indigo-100 via-purple-50 to-pink-50 py-20 md:py-28 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-indigo-900 leading-tight mb-6">
          SAT Verbal Đang Kìm Hãm Điểm Số? Bứt Phá 1400+ Sau 10 Tuần!
        </h1>
        <p className="text-lg md:text-xl text-indigo-700 mb-10 max-w-2xl mx-auto">
          Khóa học SAT Online Tăng Tốc tập trung 80% Verbal, sĩ số siêu nhỏ
          &lt;10, dành riêng cho học sinh Việt Nam khá Toán, muốn tối đa hóa
          điểm số.
        </p>
        <a
          href="#register"
          className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-lg text-lg transition duration-300 ease-in-out transform hover:-translate-y-1 shadow-lg"
        >
          Tìm Hiểu Ngay
        </a>
      </div>
    </section>
  );
};

const Problem = () => {
  return (
    // Nền trắng cho section này
    <section
      id="problem"
      className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-white"
    >
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-8">
          {" "}
          {/* Đổi màu heading */}
          Điểm SAT Của Bạn Đang "Dậm Chân Tại Chỗ"?
        </h2>
        <div className="prose prose-lg text-left mx-auto prose-indigo prose-li:marker:text-orange-500">
          {" "}
          {/* Dùng prose-indigo cho màu link/strong */}
          <ul>
            <li>
              Bạn học SAT mãi vẫn không qua được mốc điểm mong muốn, dù đã thử
              nhiều phương pháp?
            </li>
            <li>
              Điểm Toán đã khá ổn, nhưng điểm Verbal cứ ì ạch, kéo tụt tổng điểm
              của bạn?
            </li>
            <li>
              Bạn cảm thấy các khóa học đại trà quá dàn trải, phí thời gian ôn
              Toán đã vững?
            </li>
            <li>
              Bạn vật lộn với từ vựng học thuật, đọc hiểu phức tạp của phần
              Verbal Digital SAT?
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
};

const Agitation = () => {
  return (
    // Nền xám rất nhạt để tạo chút khác biệt, hoặc dùng bg-white cũng được
    <section className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-8">
          Đừng Để Verbal Trở Thành Rào Cản Đến Ngôi Trường Mơ Ước!
        </h2>
        <div className="prose prose-lg text-gray-700 mx-auto text-left space-y-4 italic">
          <p>
            Thời gian ôn thi ngày càng gấp rút, nhưng bạn vẫn loay hoay không
            biết tập trung vào đâu để cải thiện điểm Verbal hiệu quả nhất?
          </p>
          <p>
            Bạn có cảm thấy lãng phí thời gian và công sức vào những phần không
            cần thiết, trong khi điểm yếu lớn nhất chưa được giải quyết triệt
            để?
          </p>
          <p>
            Bạn lo lắng không được kèm cặp sát sao, không hiểu rõ lỗi sai trong
            các lớp học đông đúc?
          </p>
          <p>
            Bạn đã sẵn sàng đối mặt với giao diện thi Digital SAT Bluebook một
            cách tự tin chưa? Mỗi điểm Verbal mất đi có thể là một cơ hội vụt
            mất...
          </p>
        </div>
      </div>
    </section>
  );
};

const SolutionIntro = () => {
  return (
    // Nền trắng trở lại, bỏ border
    <section className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-8">
          Giải Pháp Tăng Tốc SAT - Tối Ưu Cho Bạn!
        </h2>
        <div className="prose prose-lg text-gray-800 mx-auto text-left">
          <p>
            Đã đến lúc thay đổi chiến lược! Khóa học SAT Online Tăng Tốc được
            thiết kế{" "}
            <strong className="font-semibold text-indigo-700">ĐẶC BIỆT</strong>{" "}
            bởi chuyên gia có kinh nghiệm quốc tế, dành riêng cho học sinh Việt
            Nam khá Toán (mục tiêu 1250+), tập trung tối đa nguồn lực để{" "}
            <strong className="font-semibold text-indigo-700">
              bứt phá điểm Verbal
            </strong>{" "}
            và chinh phục mục tiêu điểm số cao nhất trong thời gian ngắn nhất.
          </p>
        </div>
      </div>
    </section>
  );
};

const CoreBenefits = () => {
  const BenefitCard = ({ icon: IconComponent, title, description }) => {
    return (
      // Card vẫn giữ nền trắng để nổi bật trên nền section
      <div className="bg-white p-6 rounded-lg shadow-md text-center transition duration-300 hover:shadow-lg hover:-translate-y-1">
        {IconComponent && (
          <IconComponent className="w-12 h-12 mx-auto mb-4 text-indigo-600" />
        )}
        <h3 className="text-xl font-semibold text-indigo-800 mb-2">{title}</h3>
        <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
      </div>
    );
  };

  // Dữ liệu benefits giữ nguyên
  const benefitsData = [
    {
      icon: null,
      title: "Tập Trung Chuyên Sâu 80% Verbal",
      description:
        "Nói không với học dàn trải! Dành phần lớn thời lượng mài giũa đọc hiểu, từ vựng, ngữ pháp - yếu tố quyết định điểm Verbal.",
    },
    {
      icon: null,
      title: "20% Toán Chất Lượng, Hiệu Quả",
      description:
        "Chỉ 2-3 buổi tổng ôn Toán cốt lõi, tập trung dạng bài khó, mẹo tránh sai nhảm & sử dụng Desmos thần tốc.",
    },
    {
      icon: null,
      title: "Lớp Học Siêu Nhỏ (<10)",
      description:
        "Kèm cặp sát sao từng cá nhân. Giáo viên hiểu rõ điểm mạnh yếu, đưa ra phản hồi & định hướng cá nhân hóa.",
    },
    {
      icon: null,
      title: "Feedback Chi Tiết Sau Bài Làm",
      description:
        "Nhận xét cặn kẽ lỗi sai trên hệ thống, hiểu rõ *tại sao* sai và *làm thế nào* để khắc phục hiệu quả.",
    },
    {
      icon: null,
      title: "Hỗ Trợ Ngoài Giờ Liên Tục",
      description:
        "Mọi thắc mắc được giải đáp nhanh chóng qua kênh hỗ trợ riêng (Zalo/Group). Luôn có người đồng hành.",
    },
  ];

  return (
    // Nền xám rất nhạt cho section này
    <section
      id="benefits"
      className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-gray-50"
    >
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-12">
          {" "}
          {/* Đổi màu heading */}
          Tại Sao Khóa Học Này Là Lựa Chọn Tốt Nhất Cho Bạn?
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefitsData.map((benefit, index) => (
            <BenefitCard
              key={index}
              icon={benefit.icon}
              title={benefit.title}
              description={benefit.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

const PlatformDemo = () => {
  return (
    // Nền trắng
    <section
      id="platform"
      className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-white overflow-hidden"
    >
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
        <div className="lg:w-1/2 text-left prose prose-lg max-w-none prose-indigo">
          {" "}
          {/* Đảm bảo prose phù hợp nền trắng */}
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">
            Luyện Tập Như Thi Thật!
          </h2>
          <p className="mb-4">
            Trải nghiệm làm bài trên nền tảng mô phỏng{" "}
            <strong className="font-semibold text-indigo-700">
              giống hệt giao diện thi Bluebook
            </strong>{" "}
            của College Board. Làm quen thao tác, giảm bỡ ngỡ, tăng tự tin.
          </p>
          <ul className="list-disc pl-5 space-y-2 marker:text-orange-500">
            {" "}
            {/* Tùy chỉnh marker */}
            <li>
              Truy cập{" "}
              <strong className="font-semibold text-indigo-700">
                thư viện đề thi chuẩn hóa khổng lồ
              </strong>
              , bao gồm đề thi thật (giai đoạn cuối).
            </li>
            <li>
              Tính năng{" "}
              <strong className="font-semibold text-indigo-700">
                luyện tập chuyên sâu theo từng dạng bài
              </strong>{" "}
              (Words in Context, Transitions...). Mài giũa kỹ năng yếu đến khi
              thành thạo.
            </li>
          </ul>
        </div>
        <div className="lg:w-1/2 mt-8 lg:mt-0">
          <img
            src="/images/platform-screenshot.png"
            alt="Giao diện luyện thi Bluebook"
            className="rounded-lg shadow-xl mx-auto"
          />{" "}
          {/* Thay ảnh thật */}
        </div>
      </div>
    </section>
  );
};

const InstructorBio = () => {
  return (
    // Nền xám nhạt
    <section
      id="instructor"
      className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-gray-50"
    >
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-8 md:gap-12">
        <div className="flex-shrink-0 text-center md:text-left">
          <img
            src="/images/instructor-photo.jpg"
            alt="Giảng viên"
            className="w-40 h-40 md:w-48 md:h-48 rounded-full object-cover mx-auto md:mx-0 border-4 border-white shadow-lg"
          />{" "}
          {/* Thay ảnh thật */}
        </div>
        <div className="flex-1 text-left prose prose-lg max-w-none prose-ul:list-none prose-ul:pl-0 prose-li:mb-2 prose-indigo">
          {" "}
          {/* Thêm prose-indigo */}
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6 !mt-0">
            Học Cùng Chuyên Gia Kinh Nghiệm Quốc Tế
          </h2>
          <ul>
            <li>
              🎓 Tốt nghiệp{" "}
              <strong className="font-semibold text-indigo-700">
                ĐH Quản lý Singapore (SMU)
              </strong>
              .
            </li>
            <li>
              🇸🇬{" "}
              <strong className="font-semibold text-indigo-700">7 năm</strong>{" "}
              học tập & làm việc tại Singapore.
            </li>
            <li>
              📜 Chứng chỉ giảng dạy quốc tế{" "}
              <strong className="font-semibold text-indigo-700">
                TESOL 120 giờ
              </strong>
              .
            </li>
            <li>
              🥇 Nền tảng vững chắc: Cựu HS chuyên Toán{" "}
              <strong className="font-semibold text-indigo-700">
                Trần Đại Nghĩa
              </strong>
              ,{" "}
              <strong className="font-semibold text-indigo-700">
                Giải Ba Quốc Gia Tiếng Anh
              </strong>
              .
            </li>
            <li>
              💡 Kinh nghiệm dày dặn, phương pháp bài bản, thấu hiểu HS Việt
              Nam.
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
};

const TargetAudience = () => {
  const TargetItem = ({ children }) => (
    <li className="flex items-start">
      <svg
        className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-1"
        fill="currentColor"
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        ></path>
      </svg>
      <span className="text-gray-700">{children}</span> {/* Đổi màu text */}
    </li>
  );

  return (
    // Nền trắng
    <section
      id="target-audience"
      className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-white"
    >
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-10">
          Khóa Học Này Dành Cho Ai?
        </h2>
        <ul className="space-y-4">
          <TargetItem>Học sinh lớp 10, 11, 12 đang ôn thi SAT.</TargetItem>
          <TargetItem>
            Có điểm thi thử hoặc SAT chính thức{" "}
            <strong className="font-semibold">từ 1250 trở lên</strong>.
          </TargetItem>
          <TargetItem>
            Nền tảng Toán khá tốt, muốn{" "}
            <strong className="font-semibold">
              tập trung bứt phá điểm Verbal
            </strong>
            .
          </TargetItem>
          <TargetItem>
            Mong muốn lộ trình học{" "}
            <strong className="font-semibold">
              tập trung, hiệu quả, tiết kiệm thời gian
            </strong>
            .
          </TargetItem>
          <TargetItem>
            Cần sự{" "}
            <strong className="font-semibold">
              kèm cặp sát sao và phản hồi chi tiết
            </strong>
            .
          </TargetItem>
          <TargetItem>
            Nghiêm túc, quyết tâm đạt điểm SAT cao (mục tiêu 1400+).
          </TargetItem>
        </ul>
      </div>
    </section>
  );
};

const CourseDetails = () => {
  return (
    // Nền xám nhạt
    <section
      id="course-details"
      className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-gray-50"
    >
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-12">
          Thông Tin Chi Tiết Khóa Học
        </h2>
        {/* Card thông tin vẫn nền trắng */}
        <div className="bg-white p-6 md:p-8 rounded-lg shadow-md grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 text-lg text-gray-800">
          <div>
            <strong className="font-semibold text-gray-900">Thời lượng:</strong>{" "}
            10 Tuần Tăng Tốc
          </div>
          <div>
            <strong className="font-semibold text-gray-900">Tần suất:</strong> 2
            buổi/tuần
          </div>
          <div>
            <strong className="font-semibold text-gray-900">Hình thức:</strong>{" "}
            Học Online qua Zoom/Meet
          </div>
          <div>
            <strong className="font-semibold text-gray-900">Luyện tập:</strong>{" "}
            Hệ thống Bluebook độc quyền
          </div>
          <div>
            <strong className="font-semibold text-gray-900">
              Sĩ số Tối đa:
            </strong>{" "}
            <span className="text-orange-600 font-bold">10 học viên/lớp</span>
          </div>
          <div>
            <strong className="font-semibold text-gray-900">Yêu cầu:</strong>{" "}
            Test đầu vào đạt 1250+
          </div>
          <div className="md:col-span-2 mt-2">
            <strong className="font-semibold text-gray-900">Học phí:</strong>{" "}
            [Liên hệ] / [Ghi rõ]{" "}
            <span className="text-sm text-red-600 font-medium ml-2">
              Ưu đãi Khai giảng!
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

const CallToAction = () => {
  return (
    // Giữ nền tối cho CTA để tạo điểm nhấn cuối cùng
    <section
      id="register"
      className="bg-indigo-800 py-20 px-4 sm:px-6 lg:px-8 text-center text-white"
    >
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
          Chỉ &lt;10 Suất/Lớp - Giữ Chỗ Ngay!
        </h2>
        <p className="text-lg text-indigo-100 mb-10">
          Đừng bỏ lỡ cơ hội bứt phá điểm SAT với lộ trình tối ưu và sự kèm cặp
          sát sao. Đăng ký ngay để nhận ưu đãi khai giảng!
        </p>

        {/* Form giữ nguyên styling */}
        <form
          name="sat-registration"
          method="POST"
          data-netlify="true"
          data-netlify-honeypot="bot-field"
          className="max-w-lg mx-auto bg-white p-6 sm:p-8 rounded-lg shadow-xl text-left text-gray-900"
        >
          <input type="hidden" name="form-name" value="sat-registration" />
          <p className="hidden">
            <label>
              Don’t fill this out: <input name="bot-field" />
            </label>
          </p>
          <div className="mb-4">
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Họ và Tên *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Số điện thoại *
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="mb-6">
            <label
              htmlFor="current_score"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Điểm SAT gần nhất (Nếu có)
            </label>
            <input
              type="text"
              id="current_score"
              name="current_score"
              placeholder="Ví dụ: 1300 hoặc Chưa thi"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg text-lg transition duration-300 ease-in-out transform hover:-translate-y-1 shadow-md"
          >
            Đăng Ký Giữ Chỗ Ngay!
          </button>
        </form>
        <p className="mt-8 text-indigo-200 text-sm">
          Hoặc{" "}
          <a
            href="/link-to-test"
            className="font-semibold hover:text-white underline transition duration-300"
          >
            Làm Bài Test Đầu Vào Miễn Phí
          </a>
          <span className="mx-2">|</span>
          <a
            href="tel:YOUR_PHONE_NUMBER"
            className="font-semibold hover:text-white underline transition duration-300"
          >
            Gọi Tư Vấn: [Số điện thoại]
          </a>
        </p>
      </div>
    </section>
  );
};

// Component Footer giữ nguyên hoặc đặt riêng
const Footer = () => {
  return (
    <footer className="bg-gray-800 text-gray-400 py-10 px-4 sm:px-6 lg:px-8">
      {/* Nội dung Footer giữ nguyên như trước */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center text-center md:text-left gap-6">
        <div>
          <h4 className="text-lg font-semibold text-white mb-2">Liên Hệ</h4>
          <p>
            ĐT:{" "}
            <a href="tel:YOUR_PHONE_NUMBER" className="hover:text-white">
              [Số điện thoại]
            </a>
          </p>
          <p>
            Email:{" "}
            <a href="mailto:YOUR_EMAIL" className="hover:text-white">
              [Email]
            </a>
          </p>
          <div className="mt-2">
            <a
              href="[Link Fanpage]"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white mr-4"
            >
              Fanpage
            </a>
            <a
              href="[Link Group]"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white"
            >
              Group Hỗ Trợ
            </a>
          </div>
        </div>
        <div className="text-sm mt-6 md:mt-0">
          © {new Date().getFullYear()} [Tên Lớp học/Trung tâm]. All Rights
          Reserved.
        </div>
      </div>
    </footer>
  );
};

// --- Component Trang Chính (IndexPage) ---
const SatClassPage = () => (
  <Layout>
    {/* <SEO title="Khóa Học SAT Online Tăng Tốc - Bứt Phá Verbal" description="Khóa học SAT tập trung 80% Verbal, lớp nhỏ <10, dành cho HS khá Toán muốn bứt phá điểm số." /> */}
    <Hero />
    <Problem />
    <Agitation />
    <SolutionIntro />
    <CoreBenefits />
    <PlatformDemo />
    <InstructorBio />
    <TargetAudience />
    <CourseDetails />
    <CallToAction />
    {/* Footer sẽ được render bởi Layout */}
  </Layout>
);

export default SatClassPage;
