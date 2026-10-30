// 로그인 세션과 함께 모든 페이지에서 내장 문구로 화면을 전환합니다.
// 외부 번역 프록시로 이동하거나 환자 정보를 외부로 보내지 않습니다.
// 저장하는 값은 언어 코드뿐이며 환자 정보는 저장하거나 전송하지 않습니다.
(function () {
  'use strict';
  var dictionary = {};
  function add(ko, en, zh) { dictionary[ko] = { en: en, 'zh-CN': zh }; }
  [
    ['AA안과', 'AA Eye Clinic', 'AA眼科'],
    ['다크모드로 변경', 'Switch to dark mode', '切换深色模式'],
    ['라이트모드로 변경', 'Switch to light mode', '切换浅色模式'],
    ['링크 공유', 'Share link', '分享链接'],
    ['공유할 메인 페이지 링크', 'Home page link to share', '要分享的首页链接'],
    ['메인 페이지 링크를 복사했습니다.', 'Home page link copied.', '首页链接已复制。'],
    ['아래 링크를 길게 누르거나 선택하여 복사해 주세요.', 'Select or press and hold the link below to copy it.', '请选择或长按下方链接进行复制。'],
    ['공유 링크를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.', 'Unable to load the share link. Please try again shortly.', '无法加载分享链接，请稍后重试。'],
    ['본문으로 바로가기', 'Skip to content', '跳转到正文'],
    ['홈으로', 'Back to home', '返回首页'], ['홈', 'Home', '首页'],
    ['마이페이지', 'My page', '个人中心'], ['시력교정', 'Vision correction', '视力矫正'],
    ['내정보', 'My information', '我的信息'],
    ['로그인하면 최근 진료일과 증상을 확인할 수 있습니다.', 'Log in to view your most recent visit and condition.', '登录后可查看最近就诊日期和症状。'],
    ['로그인하고 확인하기', 'Log in to view', '登录查看'],
    ['로그인하고 내정보 확인', 'Log in to view my information', '登录查看我的信息'],
    ['백내장', 'Cataract', '白内障'], ['녹내장', 'Glaucoma', '青光眼'],
    ['망막', 'Retina', '视网膜'], ['소아근시', 'Childhood myopia', '儿童近视'],
    ['병원소개', 'About the clinic', '医院介绍'], ['CATEGORY', 'CATEGORY', 'CATEGORY'],
    ['최선의 시력으로 만나는 더 선명한 세상', 'Lifelong care for your eyes', '守护您一生的眼健康'],
    ['최선의 시력으로 만나는 더 선명한 세상 AA안과', 'AA Eye Clinic · Lifelong eye care', 'AA眼科 · 一生的眼健康伙伴'],
    ['최선의 시력으로 만나는 더 선명한 세상 · 진료 전후 정보 안내', 'Lifelong eye care · Before and after your visit', '一生的眼健康伙伴 · 就诊前后指南'],
    ['진료 전후에 필요한 눈 건강 정보를 확인하세요.', 'Eye care information, before and after your visit.', '了解就诊前后所需的眼健康信息。'],
    ['어떤 눈 건강 정보가 필요하세요?', 'What would you like to know?', '您想了解哪些眼健康信息？'],
    ['궁금한 분야를 선택해 주세요.', 'Choose a topic to explore.', '请选择您关心的领域。'],
    ['선명한 일상을 위한 안내', 'A guide to clearer vision', '清晰视力指南'],
    ['자세히', 'View details', '查看详情'], ['바로가기', 'Open', '前往'], ['진료부터 수술 전후까지', 'From your visit to surgery care', '从就诊到手术前后'],
    ['차근차근 이해하는 눈 건강', 'Understand your eye health', '逐步了解眼健康'],
    ['궁금했던 망막 분야 안내', 'Your guide to retina care', '视网膜领域指南'],
    ['우리 아이 눈 건강 안내', 'Eye care for your child', '儿童眼健康指南'],
    ['진료시간 · 원장 · 장비 안내', 'Hours · Doctors · Equipment', '门诊时间 · 医生 · 设备'],
    ['질환의 기본 정보부터 외래 안내, 수술 전후 정보까지 확인할 수 있습니다.', 'Explore condition information, outpatient guidance, and care before and after surgery.', '了解疾病基础知识、门诊指南以及手术前后信息。'],
    ['원장별 일정표', 'Doctor schedule', '医生排班'], ['샘플 일정', 'Sample schedule', '示例排班'],
    ['날짜 아래의 A·B·C·D로 원장별 진료 일정을 확인하세요. 원장명과 근무 일정은 화면 확인용 예시입니다.', 'Letters A–D show each doctor’s schedule. Doctor names and schedules are examples for this preview.', '日期下方的A、B、C、D表示各位医生的排班。医生姓名和排班均为预览示例。'],
    ['일정 달력', 'Schedule calendar', '排班日历'], ['원장 선택', 'Select doctor', '选择医生'],
    ['오늘', 'Today', '今天'],
    ['전체 원장', 'All doctors', '全部医生'], ['전체', 'All doctors', '全部医生'], ['원장별 일정 필터', 'Filter by doctor', '按医生筛选'], ['종일 진료', 'Full day', '全天门诊'],
    ['원장 일정을 불러오는 중입니다.', 'Loading doctor schedules.', '正在加载医生排班。'],
    ['원장 일정을 불러오지 못했습니다. 잠시 후 새로고침해 주세요.', 'Unable to load doctor schedules. Please refresh shortly.', '无法加载医生排班，请稍后刷新。'],
    ['등록된 원장 정보가 없습니다.', 'No doctors have been registered.', '暂无已登记的医生信息。'],
    ['휴진', 'Closed', '停诊'],
    ['관리자 메뉴', 'Administration', '管理菜单'],
    ['관리자 권한을 확인하고 있습니다.', 'Checking administrator access.', '正在确认管理员权限。'],
    ['관리자 권한을 확인하지 못했습니다. 잠시 후 다시 확인해 주세요.', 'Unable to verify administrator access. Please try again shortly.', '无法确认管理员权限，请稍后重试。'],
    ['다시 확인', 'Check again', '重新确认'],
    ['선택한 날짜에는 휴진 일정이 없습니다.', 'No closures on the selected date.', '所选日期没有停诊安排。'],
    ['최근 3개월의 공지사항입니다. 공지사항이 없으면 표시되지 않습니다.', 'Notices from the last 3 months. Nothing is displayed if there are no notices.', '显示最近三个月的公告，没有公告时不显示。'],
    ['공지사항을 불러오는 중입니다.', 'Loading notices.', '正在加载公告。'],
    ['최근 3개월 내 등록된 공지사항이 없습니다.', 'No notices have been posted in the last 3 months.', '最近三个月暂无公告。'],
    ['공지사항을 불러오지 못했습니다. 잠시 후 새로고침해 주세요.', 'Unable to load notices. Please refresh shortly.', '无法加载公告，请稍后刷新。'],
    ['이미지를 불러올 수 없습니다.', 'Unable to load the image.', '无法加载图片。'],
    ['오전 진료만', 'Morning only', '仅上午门诊'], ['오전', 'Morning', '上午'], ['종일', 'Full day', '全天'],
    ['일', 'Sun', '日'], ['월', 'Mon', '一'], ['화', 'Tue', '二'], ['수', 'Wed', '三'],
    ['목', 'Thu', '四'], ['금', 'Fri', '五'], ['토', 'Sat', '六'],
    ['선택한 날짜의 일정', 'Schedule for the selected day', '所选日期的排班'],
    ['날짜를 선택해 주세요.', 'Select a date.', '请选择日期。'], ['일정을 준비 중입니다.', 'Schedule coming soon.', '排班准备中。'],
    ['원장 정보 확인 중', 'Doctor details pending', '医生信息待确认'],
    ['등록된 일정이 없습니다. 일정 미등록은 휴진을 의미하지 않습니다.', 'No schedule is listed. This does not necessarily mean the clinic is closed.', '暂无排班记录，不代表停诊。'],
    ['※ 공휴일은 2026~2027년 확인 자료 기준입니다. 원장 근무는 예시이며 실제 휴진 여부는 별도 확인이 필요합니다.', '※ Holidays use the checked 2026–2027 data. Doctor schedules are examples; actual closures must be confirmed.', '※ 节假日依据已核对的2026至2027年资料。医生排班为示例，实际停诊情况需另行确认。'],
    ['※ 해당 연도의 공휴일 정보는 준비 중입니다. 원장 근무는 예시입니다.', '※ Holiday information for this year is not yet available. Doctor schedules are examples.', '※ 该年份的节假日信息准备中。医生排班为示例。'],
    ['공지사항', 'Notices', '公告'], ['샘플 공지', 'Sample notices', '示例公告'],
    ['AA안과의 새로운 안내를 날짜별로 확인하세요. 제목을 누르면 내용을 볼 수 있습니다.', 'Read the latest dated updates from AA Eye Clinic. Select a title to read more.', '按日期查看AA眼科的最新公告，点击标题查看内容。'],
    ['공지사항을 준비 중입니다.', 'Notices coming soon.', '公告准备中。'],
    ['등록된 공지사항이 없습니다.', 'No notices yet.', '暂无公告。'],
    ['기본 정보', 'Overview', '基本信息'], ['외래 안내', 'Outpatient guide', '门诊指南'],
    ['수술 전', 'Before surgery', '术前'], ['수술 후', 'After surgery', '术后'],
    ['해당 안내는 준비 중입니다.', 'This information is coming soon.', '相关指南准备中。'],
    ['해당 분야의 수술 안내는 준비 중입니다.', 'Surgery information for this topic is coming soon.', '该领域的手术指南准备中。'],
    ['안내 정보를 불러올 수 없습니다.', 'Unable to load this information.', '无法加载相关信息。'],
    ['홈에서 원하시는 분야를 다시 선택해 주세요.', 'Please choose a topic again from the home page.', '请返回首页重新选择相关领域。'],
    ['화면 확인용 샘플 안내입니다. 실제 안내는 AA안과 검토 후 반영됩니다.', 'Preview content only. Actual guidance will be added after AA Eye Clinic review.', '本内容仅供界面预览，实际指南经AA眼科审核后发布。'],
    ['카카오상담', 'Kakao consultation', 'Kakao咨询'], ['네이버예약', 'Naver booking', 'Naver预约'],
    ['연결 준비 중', 'Link coming soon', '链接准备中'], ['새 탭으로 연결', 'Opens in a new tab', '在新标签页打开'],
    ['카카오톡 채널 연결 준비 중', 'Kakao channel coming soon', 'Kakao频道准备中'],
    ['영어·중국어로 화면을 전환할 수 있습니다.', 'Choose English or Chinese.', '可切换为英文或中文。'],
    ['환자 정보는 외부로 보내지 않고 화면 문구를 번역합니다.', 'Interface labels are translated locally. Patient data is not sent externally.', '界面文字在本地翻译，不向外部发送患者信息。'],
    ['Google Translate로 전체 페이지를 번역합니다.', 'Translate this page with Google Translate.', '使用Google翻译此页面。'],
    ['언어를 선택하면 현재 화면이 바뀝니다.', 'Choose a language to update this page.', '选择语言即可切换当前页面。'],
    ['진료시간', 'Clinic hours', '门诊时间'], ['원장소개', 'Our doctors', '医生介绍'],
    ['월 ~ 금요일', 'Monday–Friday', '周一至周五'], ['공휴일', 'Public holidays', '节假日'],
    ['오전진료', 'Morning hours', '上午门诊'],
    ['오전 8:30 ~ 오후 7:00', '8:30 AM–7:00 PM', '上午8:30至下午7:00'],
    ['오전 8:30 ~ 오후 5:00', '8:30 AM–5:00 PM', '上午8:30至下午5:00'],
    ['오전 8:30 ~ 오후 1:00', '8:30 AM–1:00 PM', '上午8:30至下午1:00'],
    ['오후 12:30 ~ 오후 2:00', '12:30 PM–2:00 PM', '中午12:30至下午2:00'],
    ['장비소개', 'Our equipment', '设备介绍'], ['평일', 'Weekdays', '工作日'],
    ['토요일', 'Saturday', '周六'], ['점심시간', 'Lunch break', '午休时间'],
    ['일요일 · 공휴일', 'Sundays and holidays', '周日及节假日'], ['확인 후 안내', 'To be confirmed', '确认后公布'],
    ['진료 여부 확인 후 안내', 'Opening status to be confirmed', '确认是否接诊后公布'],
    ['AA안과의 진료시간과 의료진, 진료 장비를 안내합니다.', 'Learn about our clinic hours, doctors, and equipment.', '了解AA眼科的门诊时间、医生和设备。'],
    ['화면 확인용 샘플 안내입니다. 실제 진료시간, 원장 및 장비 정보는 AA안과 확인 후 반영됩니다.', 'Preview only. Actual hours, doctor profiles, and equipment information will be added after clinic confirmation.', '仅供界面预览。实际门诊时间、医生和设备信息经医院确认后发布。'],
    ['진료시간은 병원에서 제공한 안내를 반영했습니다. 원장 및 장비 소개는 화면 확인용 샘플입니다.', 'Clinic hours follow the information provided by the clinic. Doctor and equipment profiles are preview samples.', '门诊时间依据医院提供的信息。医生及设备介绍为界面预览示例。'],
    ['원장 인사말', 'A message from the doctor', '医生寄语'],
    ['주요 약력 및 진료 분야', 'Profile and areas of care', '主要履历与诊疗领域'],
    ['진료 장비 안내 준비 중', 'Equipment information coming soon', '诊疗设备信息准备中'],
    ['원장 이름과 인사말을 소개할 영역입니다. AA안과에서 확인한 내용을 반영할 예정입니다.', 'This area will introduce the doctor and a welcome message after clinic confirmation.', '此处将介绍医生姓名及寄语，内容经医院确认后发布。'],
    ['원장의 주요 약력과 진료 분야를 안내할 영역입니다. 실제 경력과 자격 정보는 확인 후 등록합니다.', 'This area will show the doctor’s background and areas of care. Credentials will be added after verification.', '此处将介绍医生的主要履历与诊疗领域，实际经历和资质经确认后发布。'],
    ['장비명과 용도를 소개할 영역입니다. AA안과의 실제 보유 장비를 확인한 뒤 설명을 반영합니다.', 'This area will introduce equipment names and purposes after confirming the clinic’s equipment.', '此处将介绍设备名称及用途，确认医院实际设备后补充说明。'],
    ['화면 확인용 샘플', 'Preview only', '界面预览'], ['샘플 정보', 'Sample data', '示例信息'],
    ['로그인·EMR 연동 전 미리보기입니다. 모든 환자 정보와 약 정보는 가상 예시입니다.', 'Preview before login and EMR integration. All patient and medication data are fictional.', '此为登录和EMR对接前的预览。患者及药物信息均为虚构示例。'],
    ['확인 예정', 'To be confirmed', '待确认'], ['환자 정보', 'Patient information', '患者信息'],
    ['환자명', 'Patient name', '患者姓名'], ['차트번호', 'Chart number', '病历号'],
    ['생년월일', 'Date of birth', '出生日期'], ['주소 (시·군·구)', 'Address (city / district)', '地址（市区县）'],
    ['전화번호 뒷자리', 'Last four phone digits', '电话号码后四位'], ['증상', 'Condition / symptoms', '症状'],
    ['최근 진료일', 'Most recent visit', '最近就诊日期'], ['담당의', 'Doctor', '主治医生'],
    ['이전 진료 내역', 'Previous visits', '既往就诊记录'],
    ['이전 진료일과 담당의를 확인하세요.', 'Review previous visit dates and doctors.', '查看以往就诊日期和主治医生。'],
    ['이전 진료 내역이 없습니다.', 'No previous visits.', '暂无既往就诊记录。'],
    ['최근 처방된 약', 'Recent prescriptions', '最近处方药'], ['복약순서 예시', 'Example order', '用药顺序示例'],
    ['아래 약명과 순서는 화면 확인용입니다. 실제 약명과 복약순서는 병원이 확인한 처방에 따라 표시할 예정입니다.', 'The names and order below are examples. Actual prescriptions will be shown after clinic confirmation.', '以下药名及顺序仅供预览，实际内容将依据医院确认的处方显示。'],
    ['복용방법', 'How to use', '用法'], ['약 설명', 'About this medication', '药物简介'],
    ['복용방법 안내를 준비 중입니다.', 'Instructions are not yet available.', '用法说明准备中。'],
    ['약 설명을 준비 중입니다.', 'Medication information is coming soon.', '药物简介准备中。'],
    ['최근 처방된 약 정보가 없습니다.', 'No recent prescription information.', '暂无最近处方药信息。'],
    ['다음 진료예정일', 'Next suggested visit', '下次建议就诊时间'],
    ['확정된 진료일이 아닙니다. 예약하거나 해당일에 당일 접수 바랍니다.', 'This is not a confirmed appointment. Please book a visit or register on the day.', '此时间并非已确认预约，请提前预约或于当天挂号。'],
    ['환자 정보를 불러올 수 없습니다.', 'Unable to load patient information.', '无法加载患者信息。'],
    ['카테고리 메뉴 열기', 'Open category menu', '打开分类菜单'], ['메뉴 닫기', 'Close menu', '关闭菜单'],
    ['언어 선택', 'Choose language', '选择语言'], ['이전 달', 'Previous month', '上个月'],
    ['다음 달', 'Next month', '下个月'], ['상담 및 예약 메뉴 열기', 'Open consultation and booking', '打开咨询与预约'],
    ['상담 및 예약 메뉴 닫기', 'Close consultation and booking', '关闭咨询与预约'],
    ['신정', 'New Year’s Day', '元旦'], ['설날', 'Lunar New Year', '春节'], ['설날 연휴', 'Lunar New Year holiday', '春节假期'],
    ['삼일절', 'Independence Movement Day', '三一节'], ['노동절', 'Labor Day', '劳动节'],
    ['어린이날', 'Children’s Day', '儿童节'], ['부처님오신날', 'Buddha’s Birthday', '佛诞日'],
    ['현충일', 'Memorial Day', '显忠日'], ['제헌절', 'Constitution Day', '制宪节'],
    ['광복절', 'Liberation Day', '光复节'], ['추석', 'Chuseok', '中秋节'], ['추석 연휴', 'Chuseok holiday', '中秋假期'],
    ['개천절', 'National Foundation Day', '开天节'], ['한글날', 'Hangeul Day', '韩文日'],
    ['성탄절', 'Christmas', '圣诞节'], ['대체공휴일', 'Substitute holiday', '补休日'], ['지방선거', 'Local elections', '地方选举']
  ].forEach(function (row) { add(row[0], row[1], row[2]); });

  [
    ['로그인', 'Log in', '登录'], ['로그아웃', 'Log out', '退出登录'], ['회원가입', 'Sign up', '注册'],
    ['이메일', 'Email', '电子邮箱'], ['비밀번호', 'Password', '密码'],
    ['이메일과 비밀번호로 계정을 만들어 주세요.', 'Create an account with your email and password.', '使用电子邮箱和密码创建账号。'],
    ['이메일과 비밀번호로 로그인해 주세요.', 'Log in with your email and password.', '使用电子邮箱和密码登录。'],
    ['비밀번호는 6자 이상 입력해 주세요.', 'Enter a password with at least 6 characters.', '密码至少需要6个字符。'],
    ['가입할 때 설정한 비밀번호를 입력해 주세요.', 'Enter the password you used to sign up.', '请输入注册时设置的密码。'],
    ['이미 계정이 있으신가요?', 'Already have an account?', '已有账号？'],
    ['아직 계정이 없으신가요?', 'New here?', '还没有账号？'],
    ['계정 가입만으로 EMR 환자 기록이 연결되지는 않습니다.', 'Creating an account does not link your EMR patient record.', '创建账号不会自动关联EMR患者记录。'],
    ['로그인이 필요합니다.', 'Please log in.', '请先登录。'],
    ['로그인 후 마이페이지를 확인할 수 있습니다.', 'Log in to view your page.', '登录后可查看个人中心。'],
    ['로그인하기', 'Log in', '前往登录'],
    ['이메일 또는 비밀번호를 확인해 주세요.', 'Please check your email and password.', '请检查邮箱和密码。'],
    ['올바른 이메일 주소를 입력해 주세요.', 'Enter a valid email address.', '请输入有效的电子邮箱。'],
    ['비밀번호를 입력해 주세요.', 'Enter your password.', '请输入密码。'],
    ['이메일 인증이 필요합니다. 가입할 때 받은 인증메일을 확인한 후 로그인해 주세요.', 'Please confirm your email using the signup email before logging in.', '请先通过注册邮件验证邮箱，再登录。'],
    ['이미 가입된 이메일입니다. 로그인 화면을 이용해 주세요.', 'This email is already registered. Please log in.', '该邮箱已注册，请登录。'],
    ['가입 요청을 접수했습니다. 인증메일이 도착하면 이메일 인증 후 로그인해 주세요. 이미 가입한 이메일이라면 로그인해 주세요.', 'Your signup request was received. If a confirmation email arrives, verify your email before logging in. If you already have an account, please log in.', '注册申请已收到。如收到验证邮件，请先验证邮箱再登录；已有账号请直接登录。'],
    ['로그인 서비스를 불러오지 못했습니다. 인터넷 연결을 확인한 후 새로고침해 주세요.', 'Unable to load the login service. Check your connection and refresh.', '无法加载登录服务，请检查网络并刷新。'],
    ['로그인 서버에 연결하지 못했습니다. 인터넷 연결을 확인한 후 다시 시도해 주세요.', 'Unable to connect to the login server. Check your connection and try again.', '无法连接登录服务器，请检查网络后重试。'],
    ['로그아웃하지 못했습니다. 인터넷 연결을 확인한 후 다시 시도해 주세요.', 'Unable to log out. Check your connection and try again.', '无法退出登录，请检查网络后重试。'],
    ['로그인 상태를 확인하지 못했습니다. 다시 로그인해 주세요.', 'Unable to check your session. Please log in again.', '无法确认登录状态，请重新登录。']
  ].forEach(function (row) { add(row[0], row[1], row[2]); });

  // Mock Data의 안내 문구를 각 화면의 같은 위치에 맞춰 현지화합니다.
  var topics = {
    vision: ['Vision correction', '视力矫正'], cataract: ['Cataract', '白内障'],
    glaucoma: ['Glaucoma', '青光眼'], retina: ['Retina', '视网膜'], myopia: ['Childhood myopia', '儿童近视']
  };
  var sections = {
    overview: ['Overview and symptoms', '基本信息与症状'], outpatient: ['Outpatient guidance', '门诊指南'],
    beforeSurgery: ['Preparation before surgery', '术前准备'], afterSurgery: ['Care after surgery', '术后护理']
  };
  Object.keys(topics).forEach(function (key) {
    var data = (window.diseaseData || {})[key];
    if (!data) return;
    var topic = topics[key];
    add(data.summary, 'Find ' + topic[0].toLowerCase() + ' information and guidance before and after your visit.', '了解' + topic[1] + '相关信息及就诊前后指南。');
    Object.keys(sections).forEach(function (section) {
      (data[section] || []).forEach(function (item, index) {
        var enTitle = section === 'overview' ? (index === 0 ? 'About ' + topic[0].toLowerCase() : 'Understanding related symptoms') :
          section === 'outpatient' ? (index === 0 ? 'Before your visit' : 'After your visit') : sections[section][0];
        var zhTitle = section === 'overview' ? (index === 0 ? '了解' + topic[1] : '相关症状说明') :
          section === 'outpatient' ? (index === 0 ? '就诊前指南' : '就诊后指南') : sections[section][1];
        add(item.title, enTitle, zhTitle);
        add(item.text, 'Preview area for ' + topic[0].toLowerCase() + ': ' + enTitle.toLowerCase() + '. Actual information will be added after AA Eye Clinic review.',
          topic[1] + '的' + zhTitle + '预览区域。实际信息将在AA眼科审核后发布。');
      });
    });
  });
  var notices = (window.homeData || {}).notices || [];
  var noticeTexts = [
    ['Clinic information coming soon (sample)', '医院信息准备中（示例）', 'This is a sample notice for preview. Actual clinic notices will be posted after confirmation.', '此为公告区域的预览示例，实际医院公告将在确认后发布。'],
    ['How to use the doctor schedule (sample)', '医生排班使用指南（示例）', 'Choose a date in the calendar to view schedules. All displayed doctor names and schedules are examples.', '选择日历中的日期查看排班。当前显示的医生姓名和排班均为示例。'],
    ['Before and after your visit (sample)', '就诊前后指南（示例）', 'Each category contains an information page. Actual patient guidance will be added after clinic review.', '各分类提供相关信息页面，实际患者指南将在医院审核后发布。']
  ];
  notices.forEach(function (notice, index) {
    if (!noticeTexts[index]) return;
    add(notice.title, noticeTexts[index][0], noticeTexts[index][1]);
    add(notice.content, noticeTexts[index][2], noticeTexts[index][3]);
  });
  ((window.patientMockData || {}).medications || []).forEach(function (med, index) {
    add(med.name, 'Sample prescription ' + (index + 1), '处方药示例 ' + (index + 1));
    add(med.usage, 'This preview area will contain instructions verified by the clinic. No dosage or timing is provided in this sample.', '此预览区域将显示医院确认的用法。本示例不提供剂量或用药间隔。');
    add(med.description, 'This preview area will provide a brief explanation after clinic review.', '此预览区域将在医院审核后提供简要药物说明。');
  });

  var originals = new WeakMap();
  var attributes = new WeakMap();
  var current = 'ko';
  var originalTitle = document.title;
  var monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  function translate(text) {
    if (current === 'ko') return text;
    var trimmed = text.trim().replace(/\s+/g, ' ');
    var entry = dictionary[trimmed];
    var value = entry && entry[current];
    if (!value) {
      value = trimmed.replace(/([A-Z]{3})원장/g, current === 'en' ? 'Doctor $1' : '$1医生')
        .replace(/(\d+)번 원장/g, current === 'en' ? 'Doctor $1' : '$1号医生')
        .replace(/(\d+)년\s*(\d+)월\s*(\d+)일/g, current === 'en' ? '$1-$2-$3' : '$1年$2月$3日')
        .replace(/(\d+)년\s*(\d+)월/g, function (_, y, m) { return current === 'en' ? monthNames[Number(m) - 1] + ' ' + y : y + '年' + m + '月'; })
        .replace(/(\d+)월\s*(\d+)일\s*\(([일월화수목금토])\)/g, function (_, m, d, weekday) { return current === 'en' ? monthNames[Number(m) - 1] + ' ' + d + ' (' + dictionary[weekday].en + ')' : m + '月' + d + '日（周' + dictionary[weekday]['zh-CN'] + '）'; });
      // 탭 제목과 동적으로 생성되는 짧은 안내에 쓰이는 공통 항목입니다.
      ['마이페이지', '병원소개', '시력교정', '백내장', '녹내장', '소아근시', '망막', '담당의', 'AA안과'].forEach(function (key) {
        value = value.split(key).join(dictionary[key][current]);
      });
      value = value.replace(/안내/g, current === 'en' ? 'Guide' : '指南');
      ['오늘', '오전 진료만', '종일 진료', '대체공휴일', '휴진'].forEach(function (key) {
        value = value.split(key).join(dictionary[key][current]);
      });
    }
    return text.replace(text.trim(), value);
  }
  function protectedNode(element) {
    return element.closest('script, style, noscript, svg, [translate="no"], .notranslate, [data-patient-field], [data-patient-label]');
  }
  function refresh() {
    // 환자 정보는 외부 번역 대신 필드별 표시 형식과 확인된 언어별 표기를 사용합니다.
    if (window.renderPatientLanguage) window.renderPatientLanguage(current);
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    var node;
    while ((node = walker.nextNode())) {
      if (!node.textContent.trim() || protectedNode(node.parentElement)) continue;
      if (!originals.has(node)) originals.set(node, node.textContent);
      var translated = translate(originals.get(node));
      if (node.textContent !== translated) node.textContent = translated;
    }
    document.querySelectorAll('[aria-label], [title], [placeholder]').forEach(function (element) {
      if (protectedNode(element) || element.hasAttribute('data-language-toggle')) return;
      if (!attributes.has(element)) attributes.set(element, {});
      var saved = attributes.get(element);
      ['aria-label', 'title', 'placeholder'].forEach(function (key) {
        if (!element.hasAttribute(key)) return;
        var actual = element.getAttribute(key);
        if (!saved[key] || (actual !== saved[key].translated && actual !== saved[key].original)) saved[key] = { original: actual };
        var translated = translate(saved[key].original);
        saved[key].translated = translated;
        if (actual !== translated) element.setAttribute(key, translated);
      });
    });
    var title = translate(originalTitle);
    if (document.title !== title) document.title = title;
    document.documentElement.lang = current === 'ko' ? 'ko' : current;
    var languageButton = document.querySelector('[data-language-toggle]');
    var languageIcon = document.querySelector('[data-language-icon]');
    var languageInfo = {
      ko: ['kr', '언어 선택: 한국어'],
      en: ['us', 'Choose language: English'],
      'zh-CN': ['cn', '选择语言：中文']
    }[current];
    if (languageIcon) {
      var iconPath = 'assets/flags/' + languageInfo[0] + '.svg';
      if (languageIcon.getAttribute('src') !== iconPath) languageIcon.setAttribute('src', iconPath);
    }
    if (languageButton && languageButton.getAttribute('aria-label') !== languageInfo[1]) {
      languageButton.setAttribute('aria-label', languageInfo[1]);
    }
    document.querySelectorAll('[data-language]').forEach(function (link) {
      if (link.getAttribute('data-language') === current) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  }
  function retainLanguageInLinks() {
    document.querySelectorAll('a[href]').forEach(function (link) {
      var href = link.getAttribute('href');
      if (link.hasAttribute('data-language') || !href || href.startsWith('#')) return;
      if (!/^[a-z-]+\.html(?:[?#]|$)/.test(href)) return;
      var url = new URL(href, window.location.href);
      url.searchParams.set('lang', current);
      link.setAttribute('href', url.pathname.split('/').pop() + url.search + url.hash);
    });
  }
  window.applyUILanguage = function (language) {
    current = ['en', 'zh-CN'].includes(language) ? language : 'ko';
    window.aaUILanguage = current;
    try { localStorage.setItem('aa-ui-language', current); } catch (error) { /* 파일 모드의 저장 차단 시에도 현재 화면은 전환합니다. */ }
    try {
      var currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('lang', current);
      window.history.replaceState(null, '', currentUrl.href);
    } catch (error) { /* file://에서 주소 변경이 제한되어도 전환과 저장은 유지합니다. */ }
    refresh();
    retainLanguageInLinks();
  };
  var selected = 'ko';
  var queryLanguage = new URLSearchParams(window.location.search).get('lang');
  if (['ko', 'en', 'zh-CN'].includes(queryLanguage)) selected = queryLanguage;
  else {
    try { selected = localStorage.getItem('aa-ui-language') || 'ko'; } catch (error) { /* 저장소 미지원 */ }
  }
  if (!window.location.hostname.endsWith('.translate.goog')) window.applyUILanguage(selected);
  var pending = false;
  new MutationObserver(function () {
    if (pending || current === 'ko') return;
    pending = true;
    queueMicrotask(function () { pending = false; refresh(); });
  }).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['aria-label', 'title'] });
}());
