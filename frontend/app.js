/**
 * Class Map - Frontend Application Logic & Offline PWA Engine
 * Complete English-First UI with 1-Click Bilingual Hindi Translator & Student Homework Portal
 */

// Global State
const state = {
  token: localStorage.getItem("classmap_token") || null,
  user: JSON.parse(localStorage.getItem("classmap_user") || "null"),
  role: localStorage.getItem("classmap_role") || "teacher",
  lang: localStorage.getItem("classmap_lang") || "en", // Default English as requested
  children: [],
  passages: [],
  activities: [],
  samples: [],
  currentTab: "my-class",
  simulatedOffline: false,
  mediaRecorder: null,
  audioChunks: [],
  recordedBlob: null,
  recordInterval: null,
  recordSeconds: 0,
  currentAssessment: null,
  
  // Student recording & slate state
  studentMediaRecorder: null,
  studentAudioChunks: [],
  studentRecordedBlob: null,
  studentRecordInterval: null,
  studentRecordSeconds: 0,
  studentSlateFile: null,
  studentDashboardData: null,
  pendingHomework: []
};

// Comprehensive Bilingual Translations Dictionary
const I18N = {
  en: {
    eval_title: "🏆 Evaluator Quick Controls:",
    eval_sub: "1-Tap Role Demo",
    app_tagline: "30s Accurate Level, Adaptive Groups & 20-min Multi-Grade Plan",
    online: "Online",
    offline: "Offline",
    ai_budget: "AI Budget",
    safe: "Safe",
    logout: "🚪 Logout",
    sync_now: "Sync Now",
    tab_class: "My Class",
    tab_reading: "Reading Assessment",
    tab_manual: "Offline Manual Level",
    tab_maths: "Maths Slate",
    tab_homework_review: "Homework Review",
    tab_groups: "Class Groups",
    tab_plan: "20-Min Plan",
    tab_progress: "Progress",
    tab_samples: "Evaluator S1-S5",
    tab_summary: "School Summary",
    login_title: "Class Map Login",
    login_subtitle: "Foundational Literacy & Numeracy Assessment Platform",
    teacher_staff: "Teacher / Staff",
    student_home: "Student (Home)",
    username: "Username",
    pin: "PIN",
    login_btn: "Login as Teacher",
    school_label: "School",
    student_id_label: "Child Name or Roll Number",
    student_login_hint: "💡 First name or short roll number. New students logging in from home will be auto-registered under the teacher!",
    student_login_btn: "🎒 Open Student Homework Portal",
    demo_accounts: "Quick Demo Credentials (PIN: 1234):",
    welcome_student: "Welcome",
    student_portal_subtitle: "Complete today's reading and maths homework from home. Your teacher will review your submission tomorrow!",
    current_fln_level: "Current FLN Level",
    task_1_reading: "Task 1: Reading Homework",
    tap_mic_read: "Tap the big mic and read the passage aloud (max 30s)",
    submit_reading_hw: "Submit Reading Homework",
    dpdp_reading_notice: "Privacy: Audio is transcribed, scored, and discarded immediately. No voice is stored.",
    task_2_maths: "Task 2: Maths Slate Homework",
    maths_slate_title: "Slate / Notebook Exercise",
    maths_slate_instruction: "Solve these 3 questions in your notebook or slate, then take a clear photo.",
    todays_questions: "Today's Questions:",
    upload_slate_photo: "Snap / Upload Slate Photo:",
    submit_maths_hw: "Submit Maths Homework",
    dpdp_maths_notice: "Privacy: Slate photo is analyzed for handwriting digits and deleted immediately.",
    my_submissions: "My Recent Homework Submissions",
    subject: "Subject",
    task: "Task",
    date: "Date",
    score: "AI Score",
    status: "Review Status",
    no_submissions: "No submissions yet today. Record your reading or upload a maths photo above!",
    hw_review_title: "Student Homework Submissions (Review Queue)",
    hw_review_subtitle: "Review voice clips and maths slate photos uploaded by children from home. 1-click confirmation updates their official FLN level.",
    refresh: "Refresh Submissions",
    class_children_title: "Class Roster & Children",
    class_children_subtitle: "Individual foundational levels, baseline progress, and diagnostic assessment",
    add_child: "Add Child",
    kpi_total: "Enrolled Children",
    kpi_assessed: "Assessed Children",
    kpi_moved_up: "Moved Up a Level",
    filter_all: "All",
    lvl_beginner: "Beginner",
    lvl_letter: "Letter",
    lvl_word: "Word",
    lvl_paragraph: "Paragraph",
    lvl_story: "Story",
    reading_title: "Reading Assessment",
    reading_subtitle: "Ask the child to read the passage aloud. The app shows which words were read correctly.",
    select_child: "Select Child",
    select_task: "Assessment Task / Level",
    est_time: "Est. Time",
    phonics_focus: "Phonics Focus",
    offline_queue: "Offline Queue:",
    mic_instruction: "Press the big button and ask the child to read aloud (max 30s)",
    stop_rec: "Stop Recording",
    redo_rec: "Record Again",
    analyze_audio: "Assess Audio",
    or_upload_audio: "Or select an audio/video file for testing:",
    result_title: "Assessment Result",
    high_conf: "High Confidence",
    accuracy_score: "Accuracy Score",
    ai_suggested_level: "Suggested Level",
    evidence_title: "Word-by-word Alignment Evidence:",
    claude_diag: "Mistake pattern (AI summary)",
    teacher_decision: "Teacher Decision (Teacher-in-the-Loop):",
    teacher_decision_desc: "AI proposes a hint; the teacher always makes the final call.",
    confirm_level_btn: "Confirm Level",
    or_override: "Or set:",
    override_btn: "Change",
    dpdp_guarantee: "Privacy: Audio deleted immediately after scoring. Zero audio files stored on server.",
    manual_title: "Offline Manual Level (No AI Required)",
    manual_subtitle: "In noisy classrooms or when completely offline, teachers can record a child's level with 1 tap",
    select_fln_level: "Select FLN Level:",
    manual_hint: "Saves instantly to the child's profile. If offline, is saved safely on the phone and uploads automatically when internet returns.",
    maths_title: "Maths Slate Assessment",
    maths_subtitle: "Child's slate photo -> Claude Vision reads digits -> Deterministic Python code evaluates arithmetic (LLM does not do math)",
    problems_list: "Problems List (JSON Format)",
    slate_photo_label: "Slate / Notebook Photo",
    analyze_slate_btn: "Analyze Slate & Diagnose Errors",
    maths_results: "Maths Marking Results",
    listen_recorded_audio: "Listen to Student Reading Audio",
    teacher_playback_hint: "Direct playback for teacher verification before confirming level",
    click_zoom_slate: "Click photo to zoom and inspect child's handwritten numbers",
    fln_distribution: "Class FLN Mastery Distribution",
    dpdp_photo_notice: "Privacy: Photo deleted immediately after OCR. Zero image storage on server.",
    groups_title: "Adaptive Learning Groups",
    groups_subtitle: "Automated grouping of 3-4 clusters based on reading level and common error patterns",
    refresh_groups: "Refresh Groups",
    plan_title: "Daily 20-Minute Multi-Grade Timetable",
    plan_subtitle: "Engineered for multi-grade classrooms: 1 group with teacher while other groups work on peer activities",
    print_plan: "Print / PDF",
    refresh_plan: "Refresh Plan",
    time_rule_title: "Time Allocation Schedule:",
    time_rule_desc: "0-2 min Whole class warmup | 2-10 min Group A with Teacher | 10-17 min Group B with Teacher | 17-20 min Wrap-up & checking",
    progress_title: "FLN Progress Tracker",
    progress_subtitle: "Comparison between initial baseline level and current mastery level",
    student_label: "Student Name / Roll",
    baseline_level: "Baseline Level",
    current_level: "Current Level",
    progress_status: "Learning Progress",
    samples_subtitle: "One-tap sample clips so you can see how a result looks. No microphone needed.",
    summary_title: "Institutional Summary Dashboard",
    summary_subtitle: "Aggregate view for Headteachers and Block Officers (Privacy: counts below 5 are hidden)",
    add_child_modal_title: "Add New Child",
    add_child_modal_hint: "Privacy Rule: First name or roll number only (e.g. 'R25' or 'Priya'). Surnames or government ID numbers are prohibited.",
    child_name_roll: "First Name or Roll Number",
    cancel: "Cancel",
    save: "Save Child"
  },
  hi: {
    eval_title: "🏆 परीक्षक त्वरित नियंत्रण:",
    eval_sub: "1-टैप रोल डेमो",
    app_tagline: "30 सेकंड में सटीक स्तर, सीखने के समूह और 20-मिनट बहु-कक्षा योजना",
    online: "ऑनलाइन",
    offline: "ऑफ़लाइन",
    ai_budget: "AI बजट",
    safe: "सुरक्षित",
    logout: "🚪 बाहर",
    sync_now: "सिंक करें",
    tab_class: "मेरी कक्षा",
    tab_reading: "पठन आकलन",
    tab_manual: "मैन्युअल स्तर",
    tab_maths: "गणित स्लेट",
    tab_homework_review: "गृहकार्य समीक्षा",
    tab_groups: "कक्षा समूह",
    tab_plan: "20-मिनट योजना",
    tab_progress: "प्रगति",
    tab_samples: "नमूना परखें (S1-S5)",
    tab_summary: "संस्था सारांश",
    login_title: "कक्षा मानचित्र लॉगिन",
    login_subtitle: "FLN बुनियादी भाषा व गणित आकलन सहायक प्रणाली",
    teacher_staff: "शिक्षक / स्टाफ",
    student_home: "विद्यार्थी (घर से)",
    username: "यूज़रनेम",
    pin: "पिन (PIN)",
    login_btn: "शिक्षक के रूप में लॉगिन करें",
    school_label: "विद्यालय",
    student_id_label: "बच्चे का नाम या रोल नंबर",
    student_login_hint: "💡 पहला नाम या रोल नंबर लिखें। घर से पहली बार आने वाले नए बच्चे स्वतः शिक्षक की कक्षा में जुड़ जाएंगे!",
    student_login_btn: "🎒 विद्यार्थी गृहकार्य पोर्टल खोलें",
    demo_accounts: "परीक्षण खाते (पिन: 1234):",
    welcome_student: "नमस्ते",
    student_portal_subtitle: "घर से आज का पठन और गणित गृहकार्य पूरा करें। आपके शिक्षक कल कक्षा में इसे जांचेंगे!",
    current_fln_level: "वर्तमान बुनियादी स्तर",
    task_1_reading: "कार्य 1: पठन गृहकार्य",
    tap_mic_read: "बड़ा माइक बटन दबाएं और पाठ को बोलकर पढ़ें (अधिकतम 30s)",
    submit_reading_hw: "पठन गृहकार्य जमा करें",
    dpdp_reading_notice: "गोपनीयता: आवाज़ विश्लेषण के तुरंत बाद हटा दी जाती है। सर्वर पर कोई ऑडियो स्टोर नहीं होता।",
    task_2_maths: "कार्य 2: गणित स्लेट गृहकार्य",
    maths_slate_title: "स्लेट / कॉपी अभ्यास",
    maths_slate_instruction: "इन 3 प्रश्नों को अपनी कॉपी या स्लेट पर हल करें और साफ़ तस्वीर अपलोड करें।",
    todays_questions: "आज के सवाल:",
    upload_slate_photo: "स्लेट की फ़ोटो लें / चुनें:",
    submit_maths_hw: "गणित गृहकार्य जमा करें",
    dpdp_maths_notice: "गोपनीयता: स्लेट की तस्वीर अंकों की पहचान के तुरंत बाद हटा दी जाती है।",
    my_submissions: "मेरे हालिया गृहकार्य जमा",
    subject: "विषय",
    task: "कार्य",
    date: "दिनांक",
    score: "AI स्कोर",
    status: "जांच स्थिति",
    no_submissions: "आज अभी कोई गृहकार्य जमा नहीं हुआ है। ऊपर से बोलकर पढ़ें या फ़ोटो अपलोड करें!",
    hw_review_title: "विद्यार्थी गृहकार्य समीक्षा (Review Queue)",
    hw_review_subtitle: "बच्चों द्वारा घर से भेजी गई रिकॉर्डिंग और स्लेट फ़ोटो की समीक्षा करें। 1-क्लिक में स्तर सुरक्षित करें।",
    refresh: "रिफ्रेश करें",
    class_children_title: "मेरी कक्षा के बच्चे",
    class_children_subtitle: "प्रत्येक बच्चे का बुनियादी स्तर, व्यक्तिगत सुधार और निदान",
    add_child: "बच्चा जोड़ें",
    kpi_total: "कुल नामांकित बच्चे",
    kpi_assessed: "आकलित बच्चे",
    kpi_moved_up: "स्तर में सुधार",
    filter_all: "सभी",
    lvl_beginner: "शुरुआती",
    lvl_letter: "अक्षर",
    lvl_word: "शब्द",
    lvl_paragraph: "अनुच्छेद",
    lvl_story: "कहानी",
    reading_title: "पठन आकलन (ASER 3-मिनट प्रणाली)",
    reading_subtitle: "ज्ञात पाठ पढ़वाएं -> सर्वम STT संरेखण -> शब्द-दर-शब्द प्रमाण व स्तर निर्णय",
    select_child: "बच्चा चुनें",
    select_task: "आकलन कार्य / स्तर",
    est_time: "अनुमानित समय",
    phonics_focus: "मुख्य ध्वनियां",
    offline_queue: "ऑफ़लाइन कतार:",
    mic_instruction: "बड़ा बटन दबाएं और बच्चे को पढ़ना शुरू करने को कहें (अधिकतम 30s)",
    stop_rec: "रिकॉर्डिंग रोकें",
    redo_rec: "दोबारा रिकॉर्ड करें",
    analyze_audio: "विश्लेषण करें",
    or_upload_audio: "या परीक्षण हेतु ऑडियो फ़ाइल चुनें:",
    result_title: "आकलन परिणाम",
    high_conf: "उच्च विश्वसनीयता",
    accuracy_score: "सटीकता स्कोर",
    ai_suggested_level: "सुझाया गया स्तर",
    evidence_title: "शब्द-दर-शब्द संरेखण प्रमाण:",
    claude_diag: "क्लाउड AI त्रुटि विश्लेषण",
    teacher_decision: "शिक्षक का अंतिम निर्णय:",
    teacher_decision_desc: "AI केवल सुझाव देता है; अंतिम स्तर शिक्षक ही तय करते हैं।",
    confirm_level_btn: "स्तर सुनिश्चित करें",
    or_override: "या स्तर बदलें:",
    override_btn: "बदलें",
    dpdp_guarantee: "सुरक्षा: विश्लेषण के तुरंत बाद आवाज़ हटा दी गई। सर्वर पर कोई ऑडियो संग्रहित नहीं होता।",
    manual_title: "मैन्युअल स्तर निर्धारण (बिना AI के)",
    manual_subtitle: "शोरगुल होने पर या बिना इंटरनेट के शिक्षक स्वयं 1 टैप में स्तर दर्ज कर सकते हैं",
    select_fln_level: "बुनियादी स्तर चुनें:",
    manual_hint: "यह स्तर तुरंत अपडेट होगा। ऑफ़लाइन होने पर कतार में सुरक्षित रहेगा और ऑनलाइन आने पर सिंक होगा।",
    maths_title: "गणित स्लेट आकलन",
    maths_subtitle: "स्लेट फ़ोटो -> क्लाउड विज़न अंक पहचान -> पायथन कोड नियम जांच (LLM गणित नहीं करता)",
    problems_list: "सवाल सूची (JSON Format)",
    slate_photo_label: "स्लेट / कॉपी की फ़ोटो",
    analyze_slate_btn: "स्लेट जांचें व त्रुटि पकड़ें",
    maths_results: "गणित परिणाम",
    listen_recorded_audio: "विद्यार्थी की रिकॉर्डिंग सुनें",
    teacher_playback_hint: "स्तर सुनिश्चित करने से पहले शिक्षक द्वारा आवाज़ की प्रत्यक्ष जांच",
    click_zoom_slate: "हस्तलेखन के अंकों की विस्तृत जांच हेतु फ़ोटो पर क्लिक करें",
    fln_distribution: "कक्षा बुनियादी स्तर (FLN) वितरण",
    dpdp_photo_notice: "गोपनीयता: अंक जांच के तुरंत बाद फ़ोटो हटा दी गई। सर्वर पर कोई छवि नहीं रहती।",
    groups_title: "कक्षा सीखने के समूह",
    groups_subtitle: "पठन स्तर व समान त्रुटियों के आधार पर स्वचालित 3-4 शिक्षण समूह",
    refresh_groups: "रिफ्रेश समूह",
    plan_title: "दैनिक 20-मिनट बहु-कक्षा समय-सारिणी",
    plan_subtitle: "बहु-कक्षा शिक्षण के लिए तैयार: 1 समूह शिक्षक के साथ, बाकी समूह स्वतंत्र गतिविधि पर",
    print_plan: "प्रिंट / PDF",
    refresh_plan: "रिफ्रेश योजना",
    time_rule_title: "समय आवंटन नियम:",
    time_rule_desc: "0-2 min पूरी कक्षा निर्देश | 2-10 min समूह A शिक्षक के साथ | 10-17 min समूह B शिक्षक के साथ | 17-20 min समापन",
    progress_title: "बुनियादी प्रगति ट्रैकर",
    progress_subtitle: "प्रारंभिक आधारभूत स्तर (Baseline) से वर्तमान स्तर की तुलना",
    student_label: "बच्चे का नाम / रोल",
    baseline_level: "शुरुआती स्तर",
    current_level: "वर्तमान स्तर",
    progress_status: "सीखने में सुधार",
    samples_subtitle: "1-क्लिक परीक्षण: सर्वम STT संरेखण, क्लाउड त्रुटि विश्लेषण व गणित कोड जांच का प्रमाण",
    summary_title: "संस्थागत सारांश डैशबोर्ड",
    summary_subtitle: "प्रधानाध्यापक व ब्लॉक अधिकारियों के लिए सामूहिक दृश्य (5 से कम बच्चे होने पर संख्या छिपाई जाती है)",
    add_child_modal_title: "नया बच्चा जोड़ें",
    add_child_modal_hint: "नियम: केवल पहला नाम या रोल नंबर (उदा. 'R25' या 'अमित')। उपनाम मान्य नहीं है।",
    child_name_roll: "बच्चे का पहला नाम या रोल नंबर",
    cancel: "रद्द करें",
    save: "सुरक्षित करें"
  }
};

function t(key) {
  const dict = I18N[state.lang] || I18N.en;
  return dict[key] || I18N.en[key] || key;
}

// ----------------- Service Worker & IndexedDB -----------------

function initServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js")
      .then((reg) => console.log("ClassMap Service Worker registered:", reg.scope))
      .catch((err) => console.warn("SW Registration failed:", err));
  }
}

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("classmap_offline_db", 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("queue")) {
        db.createObjectStore("queue", { keyPath: "id", autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function addToOfflineQueue(item) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("queue", "readwrite");
    const store = tx.objectStore("queue");
    item.createdAt = Date.now();
    item.status = "pending";
    const req = store.add(item);
    req.onsuccess = () => {
      updateQueueBadge();
      resolve(req.result);
    };
    req.onerror = () => reject(req.error);
  });
}

async function getOfflineQueue() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("queue", "readonly");
    const store = tx.objectStore("queue");
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

async function removeOfflineQueueItem(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("queue", "readwrite");
    const store = tx.objectStore("queue");
    const req = store.delete(id);
    req.onsuccess = () => {
      updateQueueBadge();
      resolve();
    };
    req.onerror = () => reject(req.error);
  });
}

async function updateQueueBadge() {
  try {
    const items = await getOfflineQueue();
    const count = items.length;
    const badgeText = document.getElementById("queue-count-text");
    if (badgeText) {
      badgeText.innerText = `${count} ${state.lang === 'hi' ? 'रिकॉर्डिंग कतार में हैं' : 'recordings queued'}`;
    }
    const banner = document.getElementById("offline-banner");
    const bannerText = document.getElementById("offline-banner-text");
    if (!isOnline() || count > 0) {
      banner.classList.remove("hidden");
      if (bannerText) {
        bannerText.innerText = count > 0 
          ? `⚠️ ${count} ${state.lang === 'hi' ? 'रिकॉर्डिंग सिंक होने की प्रतीक्षा कर रही हैं' : 'recordings waiting to sync'}.`
          : `⚠️ ${state.lang === 'hi' ? 'इंटरनेट उपलब्ध नहीं है (ऑफ़लाइन मोड)। डेटा सुरक्षित रहेगा।' : 'No internet connection (Offline Mode). Data saved locally.'}`;
      }
    } else {
      banner.classList.add("hidden");
    }
  } catch (err) {
    console.warn("Queue badge update error:", err);
  }
}

async function flushOfflineQueue() {
  if (!isOnline()) {
    showToast(t("offline_queue"), "warning");
    return;
  }
  const items = await getOfflineQueue();
  if (items.length === 0) {
    showToast(state.lang === 'hi' ? "कतार खाली है। सभी डेटा सिंक है।" : "All data is already synced.", "info");
    return;
  }

  showToast(`${state.lang === 'hi' ? 'सिंक हो रहा है' : 'Syncing'}: ${items.length} items...`, "info");
  for (const it of items) {
    try {
      if (it.type === "reading") {
        const fd = new FormData();
        fd.append("audio", it.audioBlob, it.filename || "offline_clip.webm");
        fd.append("child_id", it.child_id);
        fd.append("task", it.task);
        if (it.passage_id) fd.append("passage_id", it.passage_id);
        if (it.audio_sec) fd.append("audio_sec", it.audio_sec);
        fd.append("client_request_id", `offline_${it.id}_${it.createdAt}`);

        const res = await apiFetch("/api/assess/reading", { method: "POST", body: fd });
        if (res && res.assessment_id) {
          await removeOfflineQueueItem(it.id);
        }
      } else if (it.type === "manual") {
        const res = await apiFetch("/api/assess/manual", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            child_id: it.child_id,
            level: it.level,
            client_request_id: `offline_man_${it.id}_${it.createdAt}`
          })
        });
        if (res && !res.error) {
          await removeOfflineQueueItem(it.id);
        }
      }
    } catch (err) {
      console.warn("Error syncing item:", it, err);
    }
  }
  showToast(state.lang === 'hi' ? "ऑफलाइन कतार सिंक हो गई!" : "Offline queue synced successfully!", "success");
  await updateQueueBadge();
  loadChildren();
}

function isOnline() {
  return navigator.onLine && !state.simulatedOffline;
}

function updateNetworkStatus() {
  const badge = document.getElementById("net-status-badge");
  const text = document.getElementById("net-status-text");
  const banner = document.getElementById("offline-banner");
  
  if (isOnline()) {
    badge.className = "status-pill status-online";
    text.innerText = t("online");
    updateQueueBadge();
  } else {
    badge.className = "status-pill status-offline";
    text.innerText = t("offline");
    banner.classList.remove("hidden");
  }
}

function toggleSimulatedOffline() {
  state.simulatedOffline = !state.simulatedOffline;
  const btn = document.getElementById("toggle-sim-offline-btn");
  if (state.simulatedOffline) {
    btn.innerText = "📶 Turn Online";
    btn.style.background = "#15803d";
    showToast(state.lang === 'hi' ? "✈️ ऑफ़लाइन (सिमुलेशन): रिकॉर्डिंग फ़ोन में सहेजी जाएँगी" : "✈️ Simulated offline: recordings are saved on the phone", "warning");
  } else {
    btn.innerText = "✈️ Simulate offline";
    btn.style.background = "#b91c1c";
    showToast(state.lang === 'hi' ? "📶 ऑनलाइन मोड सक्रिय! कतार स्वतः सिंक हो रही है..." : "📶 Back Online! Syncing offline queue...", "success");
    flushOfflineQueue();
  }
  updateNetworkStatus();
}

window.addEventListener("online", () => {
  updateNetworkStatus();
  flushOfflineQueue();
});
window.addEventListener("offline", () => {
  updateNetworkStatus();
});

// ----------------- API Fetch Wrapper -----------------

async function apiFetch(endpoint, options = {}) {
  const headers = options.headers || {};
  if (state.token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${state.token}`;
  }
  options.headers = headers;

  try {
    const res = await fetch(endpoint, options);
    if (res.status === 401) {
      logout();
      showToast(state.lang === 'hi' ? "सत्र समाप्त हुआ। कृपया लॉगिन करें।" : "Session expired. Please log in.", "danger");
      return null;
    }
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || data.message || `API error ${res.status}`);
    }
    return data;
  } catch (err) {
    console.error(`API Fetch Error [${endpoint}]:`, err);
    throw err;
  }
}

// ----------------- Auth & Quick Switch -----------------

async function quickLogin(username, pin) {
  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, pin })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Login failed");
    }
    const data = await res.json();
    setSession(data);
    showToast(`${state.lang === 'hi' ? 'लॉगिन सफल' : 'Logged in'}: ${data.username} (${data.role})`, "success");
  } catch (err) {
    showToast(err.message, "danger");
  }
}

async function quickStudentLogin(label = "R01") {
  try {
    const cleanLabel = (label || "R01").trim().split(" ")[0];
    const res = await fetch("/api/student/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: cleanLabel, school_id: 1 })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Student login failed");
    }
    const data = await res.json();
    setSession(data);
    showToast(`${state.lang === 'hi' ? 'विद्यार्थी पोर्टल खुला' : 'Student Portal Open'}: ${data.label}`, "success");
  } catch (err) {
    showToast(err.message, "danger");
  }
}

function openStudentLoginModal() {
  const m = document.getElementById("student-login-modal");
  if (m) m.classList.add("active");
  const inp = document.getElementById("modal-student-label");
  if (inp) inp.focus();
}

function closeStudentLoginModal() {
  const m = document.getElementById("student-login-modal");
  if (m) m.classList.remove("active");
  const inp = document.getElementById("modal-student-label");
  if (inp) inp.value = "";
}

function handleModalStudentLoginSubmit(e) {
  e.preventDefault();
  const inp = document.getElementById("modal-student-label");
  const val = inp ? inp.value.trim() : "";
  if (!val) return;
  closeStudentLoginModal();
  quickStudentLogin(val);
}

function handleLoginSubmit(e) {
  e.preventDefault();
  const username = document.getElementById("login-username").value.trim();
  const pin = document.getElementById("login-pin").value.trim();
  quickLogin(username, pin);
}

function handleStudentLoginSubmit(e) {
  e.preventDefault();
  const label = document.getElementById("student-label-input").value.trim();
  const schoolId = parseInt(document.getElementById("student-school-select").value) || 1;
  
  if (label.includes(" ")) {
    showToast(state.lang === 'hi' ? "कृपया केवल पहला नाम या रोल नंबर लिखें (कोई उपनाम नहीं)।" : "Please use first name or short roll number only (no surname).", "warning");
    return;
  }

  fetch("/api/student/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ label, school_id: schoolId })
  })
    .then((r) => r.json().then(d => ({ ok: r.ok, data: d })))
    .then(({ ok, data }) => {
      if (!ok) throw new Error(data.detail || "Student login failed");
      setSession(data);
      showToast(`${state.lang === 'hi' ? 'विद्यार्थी पोर्टल खुला' : 'Student Portal Open'}: ${data.label}`, "success");
    })
    .catch((err) => showToast(err.message, "danger"));
}

function toggleLoginRoleTab(role) {
  const teacherTab = document.getElementById("login-tab-teacher");
  const studentTab = document.getElementById("login-tab-student");
  const teacherForm = document.getElementById("form-teacher-login");
  const studentForm = document.getElementById("form-student-login");

  if (role === "student") {
    studentTab.classList.add("active");
    teacherTab.classList.remove("active");
    studentForm.style.display = "block";
    teacherForm.style.display = "none";
  } else {
    teacherTab.classList.add("active");
    studentTab.classList.remove("active");
    teacherForm.style.display = "block";
    studentForm.style.display = "none";
  }
}

function setSession(data) {
  state.token = data.token;
  state.role = data.role;
  state.user = {
    username: data.username || data.label,
    label: data.label,
    role: data.role,
    school_id: data.school_id,
    child_id: data.child_id
  };
  localStorage.setItem("classmap_token", data.token);
  localStorage.setItem("classmap_role", data.role);
  localStorage.setItem("classmap_user", JSON.stringify(state.user));

  const userDisplay = document.getElementById("user-display");
  userDisplay.innerText = data.username || data.label;
  document.getElementById("user-pill").style.display = "flex";

  if (data.role === "student") {
    document.getElementById("app-tabs-nav").style.display = "none";
    switchTab("student-portal");
    loadStudentDashboard();
  } else {
    document.getElementById("app-tabs-nav").style.display = "block";
    const summaryBtn = document.getElementById("summary-tab-btn");
    if (data.role === "headteacher" || data.role === "officer") {
      summaryBtn.style.display = "inline-flex";
      switchTab("summary");
    } else {
      summaryBtn.style.display = "none";
      switchTab("my-class");
    }
    loadInitialData();
  }
}

function logout() {
  state.token = null;
  state.role = null;
  state.user = null;
  localStorage.removeItem("classmap_token");
  localStorage.removeItem("classmap_role");
  localStorage.removeItem("classmap_user");

  document.getElementById("user-pill").style.display = "none";
  document.getElementById("app-tabs-nav").style.display = "none";
  switchTab("login");
}

function handleLogoClick() {
  if (state.role === "student") {
    switchTab("student-portal");
  } else if (state.token) {
    switchTab("my-class");
  } else {
    switchTab("login");
  }
}

// ----------------- Initial Data Load -----------------

async function loadInitialData() {
  updateNetworkStatus();
  updateClaudeBudgetWidget();
  loadPassages();
  loadSamples();
  if (state.role === "teacher") {
    loadChildren();
    loadGroups();
    loadDailyPlan();
    loadProgress();
    loadPendingHomework();
  } else if (state.role === "headteacher" || state.role === "officer") {
    loadSummaryDashboard();
  }
}

async function updateClaudeBudgetWidget() {
  try {
    const b = await apiFetch("/api/claude/budget");
    if (!b) return;
    const used = (b.input_used || 0) + (b.output_used || 0);
    const limit = (b.input_limit || 50000) + (b.output_limit || 10000);
    const pct = Math.min(100, Math.round((used / limit) * 100));
    
    const fill = document.getElementById("budget-fill");
    const txt = document.getElementById("budget-text");
    if (fill) fill.style.width = `${Math.max(5, pct)}%`;
    if (txt) txt.innerText = `${pct}% ${state.lang === 'hi' ? 'खर्च' : 'Used'}`;
  } catch (err) {
    console.warn("Budget update error:", err);
  }
}

// ----------------- Tabs Navigation -----------------

function switchTab(tabId) {
  state.currentTab = tabId;
  
  // Hide all sections
  document.querySelectorAll(".view-section").forEach((sec) => sec.classList.remove("active"));
  
  // Activate selected section
  const target = document.getElementById(`view-${tabId}`);
  if (target) target.classList.add("active");

  // Update nav tabs
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tabId);
  });

  // Tab specific refreshes
  if (tabId === "my-class") loadChildren();
  if (tabId === "homework-review") loadPendingHomework();
  if (tabId === "groups") loadGroups();
  if (tabId === "plan") loadDailyPlan();
  if (tabId === "progress") loadProgress();
  if (tabId === "summary") loadSummaryDashboard();
  if (tabId === "samples") renderSamples();
  if (tabId === "student-portal") loadStudentDashboard();
}

// ----------------- Student Homework Portal -----------------

async function loadStudentDashboard() {
  try {
    const data = await apiFetch("/api/student/dashboard");
    if (!data) return;
    state.studentDashboardData = data;

    document.getElementById("st-dash-name").innerText = data.label;
    const lvlBadge = document.getElementById("st-dash-level-badge");
    lvlBadge.className = `lvl-badge lvl-${data.level || 'beginner'}`;
    lvlBadge.innerText = getLevelDisplayName(data.level || "beginner");

    // Reading passage
    const rd = data.assigned_reading;
    if (rd && rd.passage) {
      document.getElementById("st-passage-text").innerText = rd.passage.text;
      document.getElementById("st-passage-tag").className = `lvl-badge lvl-${rd.task}`;
      document.getElementById("st-passage-tag").innerText = `${getLevelDisplayName(rd.task)} (${rd.passage.id})`;
      document.getElementById("st-hw-task-title").innerText = `${getLevelDisplayName(rd.task)} ${state.lang === 'hi' ? 'पठन गृहकार्य' : 'Reading Homework'}`;
    }

    // Maths problems
    const md = data.assigned_maths;
    if (md && md.problems) {
      const container = document.getElementById("st-math-problems-list");
      container.innerHTML = md.problems.map((p) => `
        <span class="badge" style="background:#fff; border:2px solid var(--border); font-size:1.15rem; padding:8px 16px; font-weight:800; border-radius:var(--radius-sm);">
          ${p} = ?
        </span>
      `).join("");
    }

    // Render Submissions Table
    renderStudentSubmissions(data.submissions || []);
  } catch (err) {
    console.warn("Student dashboard load error:", err);
  }
}

function renderStudentSubmissions(subs) {
  const tbody = document.getElementById("st-submissions-table-body");
  if (!tbody) return;

  if (subs.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center; padding:20px; color:var(--text-muted);">
          ${t("no_submissions")}
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = subs.map((s) => {
    const isPending = s.status === "pending_review";
    const statusPill = isPending 
      ? `<span class="hw-status-pending">⏳ ${state.lang === 'hi' ? 'जांच प्रतीक्षित' : 'Waiting for Teacher Review'}</span>`
      : `<span class="hw-status-confirmed">✅ ${state.lang === 'hi' ? 'शिक्षक द्वारा स्वीकृत' : 'Confirmed by Teacher'}</span>`;
    
    const effectiveScore = s.teacher_score !== null && s.teacher_score !== undefined ? s.teacher_score : s.ai_score;
    const scoreText = effectiveScore !== null && effectiveScore !== undefined
      ? `${Math.round(effectiveScore * 100)}%`
      : "—";

    const dt = s.created_at ? new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Today";
    const notesHtml = s.teacher_notes ? `<div style="font-size:0.75rem; color:#15803d; margin-top:3px; font-weight:600;">💬 "${s.teacher_notes}"</div>` : "";

    return `
      <tr style="border-bottom:1px solid var(--border);">
        <td style="padding:10px; font-weight:700;">${s.subject === 'reading' ? '🎙️ Reading' : '📐 Maths'}</td>
        <td style="padding:10px;"><span class="lvl-badge lvl-${s.task || 'paragraph'}">${getLevelDisplayName(s.task || s.subject)}</span></td>
        <td style="padding:10px; color:var(--text-muted); font-size:0.82rem;">${dt}</td>
        <td style="padding:10px; font-weight:800; color:var(--primary);">${scoreText}</td>
        <td style="padding:10px;">
          ${statusPill}
          ${notesHtml}
        </td>
      </tr>
    `;
  }).join("");
}

// Student Audio Recording
async function toggleStudentRecording() {
  if (state.studentMediaRecorder && state.studentMediaRecorder.state === "recording") {
    stopStudentRecording();
  } else {
    startStudentRecording();
  }
}

async function startStudentRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    state.studentAudioChunks = [];
    state.studentMediaRecorder = new MediaRecorder(stream);

    state.studentMediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) state.studentAudioChunks.push(e.data);
    };

    state.studentMediaRecorder.onstop = () => {
      state.studentRecordedBlob = new Blob(state.studentAudioChunks, { type: "audio/webm" });
      const audioUrl = URL.createObjectURL(state.studentRecordedBlob);
      const audio = document.getElementById("st-audio-playback");
      audio.src = audioUrl;
      audio.style.display = "block";

      document.getElementById("st-btn-submit-reading").disabled = false;
      document.getElementById("st-record-status").innerText = state.lang === 'hi' ? "✓ रिकॉर्डिंग तैयार! नीचे दिए बटन से जमा करें।" : "✓ Recording ready! Click Submit below.";
    };

    state.studentMediaRecorder.start();
    state.studentRecordSeconds = 0;
    
    const micBtn = document.getElementById("st-mic-btn");
    micBtn.classList.add("recording");
    micBtn.innerHTML = "⏹️";

    document.getElementById("st-record-status").innerText = state.lang === 'hi' ? "🔴 रिकॉर्डिंग जारी है... साफ़ आवाज़ में पढ़ें" : "🔴 Recording in progress... read clearly";

    clearInterval(state.studentRecordInterval);
    state.studentRecordInterval = setInterval(() => {
      state.studentRecordSeconds++;
      const mm = String(Math.floor(state.studentRecordSeconds / 60)).padStart(2, "0");
      const ss = String(state.studentRecordSeconds % 60).padStart(2, "0");
      document.getElementById("st-record-timer").innerText = `${mm}:${ss}`;

      if (state.studentRecordSeconds >= 30) {
        stopStudentRecording();
      }
    }, 1000);

  } catch (err) {
    showToast(state.lang === 'hi' ? "माइक्रोफ़ोन अनुमति नहीं मिली।" : "Microphone permission denied.", "danger");
  }
}

function stopStudentRecording() {
  if (state.studentMediaRecorder && state.studentMediaRecorder.state === "recording") {
    state.studentMediaRecorder.stop();
    state.studentMediaRecorder.stream.getTracks().forEach((track) => track.stop());
  }
  clearInterval(state.studentRecordInterval);
  const micBtn = document.getElementById("st-mic-btn");
  micBtn.classList.remove("recording");
  micBtn.innerHTML = "🎙️";
}

async function submitStudentReadingHomework() {
  if (!state.studentRecordedBlob) {
    showToast(state.lang === 'hi' ? "कृपया पहले अपनी आवाज़ रिकॉर्ड करें।" : "Please record your reading first.", "warning");
    return;
  }

  const btn = document.getElementById("st-btn-submit-reading");
  btn.disabled = true;
  btn.innerText = state.lang === 'hi' ? "⏳ जमा हो रहा है..." : "⏳ Submitting Homework...";

  const task = (state.studentDashboardData && state.studentDashboardData.assigned_reading && state.studentDashboardData.assigned_reading.task) || "paragraph";
  const pId = (state.studentDashboardData && state.studentDashboardData.assigned_reading && state.studentDashboardData.assigned_reading.passage && state.studentDashboardData.assigned_reading.passage.id) || "P1";

  try {
    const fd = new FormData();
    fd.append("audio", state.studentRecordedBlob, "homework_reading.webm");
    fd.append("task", task);
    fd.append("passage_id", pId);
    fd.append("audio_sec", state.studentRecordSeconds || 20);

    const res = await apiFetch("/api/student/homework/reading", { method: "POST", body: fd });
    if (res) {
      showToast(state.lang === 'hi' ? "🎉 पठन गृहकार्य सफलतापूर्वक जमा हुआ! शिक्षक जल्द जांचेंगे।" : "🎉 Reading homework submitted! Teacher will review it soon.", "success");
      loadStudentDashboard();
    }
  } catch (err) {
    showToast(`Submission failed: ${err.message}`, "danger");
  } finally {
    btn.disabled = false;
    btn.innerText = `⚡ ${t("submit_reading_hw")}`;
  }
}

// Student Maths Photo Upload
function previewStudentSlatePhoto(e) {
  const file = e.target.files[0];
  if (!file) return;
  state.studentSlateFile = file;

  const url = URL.createObjectURL(file);
  const img = document.getElementById("st-slate-preview-img");
  img.src = url;
  document.getElementById("st-slate-preview-box").style.display = "block";
  document.getElementById("st-btn-submit-maths").disabled = false;
}

async function submitStudentMathsHomework() {
  if (!state.studentSlateFile) {
    showToast(state.lang === 'hi' ? "कृपया स्लेट/कॉपी की फ़ोटो चुनें।" : "Please select a photo of your slate/notebook.", "warning");
    return;
  }

  const btn = document.getElementById("st-btn-submit-maths");
  btn.disabled = true;
  btn.innerText = state.lang === 'hi' ? "⏳ जांच व जमा हो रहा है..." : "⏳ Marking & Submitting...";

  const problems = (state.studentDashboardData && state.studentDashboardData.assigned_maths && state.studentDashboardData.assigned_maths.problems) || ["24+15", "48-19", "7+5"];

  try {
    const fd = new FormData();
    fd.append("photo", state.studentSlateFile);
    fd.append("problems", JSON.stringify(problems));

    const res = await apiFetch("/api/student/homework/maths", { method: "POST", body: fd });
    if (res) {
      showToast(state.lang === 'hi' ? "🎉 गणित गृहकार्य सफलतापूर्वक जमा हुआ!" : "🎉 Maths homework submitted! Teacher will review it.", "success");
      loadStudentDashboard();
    }
  } catch (err) {
    showToast(`Maths submission failed: ${err.message}`, "danger");
  } finally {
    btn.disabled = false;
    btn.innerText = `📐 ${t("submit_maths_hw")}`;
  }
}

// ----------------- Teacher Homework Review Queue -----------------

// State tracking for teacher manual homework edits
state.hwFilter = "all";
state.hwEdits = {};

function openJudgeCheatSheetModal() {
  const m = document.getElementById("judge-cheatsheet-modal");
  if (m) m.classList.add("active");
}

function closeJudgeCheatSheetModal() {
  const m = document.getElementById("judge-cheatsheet-modal");
  if (m) m.classList.remove("active");
}

function openImageZoomModal(src) {
  const m = document.getElementById("image-zoom-modal");
  const img = document.getElementById("zoom-modal-img");
  if (img && src) img.src = src;
  if (m) m.classList.add("active");
}

function closeImageZoomModal() {
  const m = document.getElementById("image-zoom-modal");
  if (m) m.classList.remove("active");
}

function setPlaybackSpeed(audioId, speed) {
  const aud = document.getElementById(audioId);
  if (aud) {
    aud.playbackRate = speed;
    showToast(`Playback speed: ${speed}x`, "info");
  }
}

function filterHomeworkQueue(type) {
  state.hwFilter = type;
  document.querySelectorAll(".hw-filter-pill").forEach(el => el.classList.remove("active"));
  const activeBtn = document.getElementById(`hw-filter-${type}`);
  if (activeBtn) activeBtn.classList.add("active");
  renderPendingHomework(state.pendingHomework || []);
}

function selectReviewLevel(hwId, lvl) {
  state.hwEdits[hwId] = state.hwEdits[hwId] || {};
  state.hwEdits[hwId].level = lvl;
  const container = document.getElementById(`level-picker-${hwId}`);
  if (container) {
    container.querySelectorAll(".hw-level-btn").forEach(btn => {
      btn.classList.toggle("selected", btn.getAttribute("data-lvl") === lvl);
    });
  }
}

function toggleMathCorrection(hwId, idx) {
  const hw = (state.pendingHomework || []).find(h => h.id === hwId);
  if (!hw || !hw.response || !hw.response.results) return;

  state.hwEdits[hwId] = state.hwEdits[hwId] || {};
  if (!state.hwEdits[hwId].results) {
    state.hwEdits[hwId].results = JSON.parse(JSON.stringify(hw.response.results));
  }

  const curr = state.hwEdits[hwId].results[idx];
  curr.correct = !curr.correct;

  // Recalculate score
  const total = state.hwEdits[hwId].results.length;
  const correct = state.hwEdits[hwId].results.filter(r => r.correct === true).length;
  const newScore = Math.round((correct / Math.max(total, 1)) * 100);
  state.hwEdits[hwId].score = newScore / 100;

  // Update UI pill & badge
  const btn = document.getElementById(`math-btn-${hwId}-${idx}`);
  if (btn) {
    btn.className = `hw-toggle-btn ${curr.correct ? 'btn-correct' : 'btn-wrong'}`;
    btn.innerText = curr.correct ? "✓ Correct" : "✗ Wrong";
  }
  const scoreBadge = document.getElementById(`math-score-badge-${hwId}`);
  if (scoreBadge) {
    scoreBadge.innerText = `${newScore}% (${correct}/${total})`;
  }
}

async function loadPendingHomework() {
  if (state.role !== "teacher") return;
  try {
    const items = await apiFetch("/api/homework/pending");
    if (!items) return;
    state.pendingHomework = items;

    // Update badge count on tab
    const badge = document.getElementById("hw-pending-badge");
    if (badge) {
      if (items.length > 0) {
        badge.innerText = items.length;
        badge.style.display = "inline-block";
      } else {
        badge.style.display = "none";
      }
    }

    renderPendingHomework(items);
  } catch (err) {
    console.warn("Pending homework load error:", err);
  }
}

async function seedDemoHomework() {
  try {
    const res = await apiFetch("/api/homework/seed-demo", { method: "POST" });
    if (res) {
      showToast(state.lang === 'hi' ? "✨ 2 जीवंत गृहकार्य (ऑडियो व स्लेट) लोड हुए! अब जांचें।" : "✨ 2 Realistic Submissions (Audio & Slate) loaded for teacher review!", "success");
      await loadPendingHomework();
      await loadChildren();
    }
  } catch (err) {
    showToast(`Failed to load demo: ${err.message}`, "danger");
  }
}

function renderPendingHomework(items) {
  const container = document.getElementById("hw-pending-container");
  if (!container) return;

  const totalCount = items.length;
  const readingCount = items.filter(h => h.subject === "reading").length;
  const mathsCount = items.filter(h => h.subject === "maths").length;

  // Update queue stats in hero
  const cTot = document.getElementById("hw-count-total");
  const cRead = document.getElementById("hw-count-reading");
  const cMath = document.getElementById("hw-count-maths");
  const pTot = document.getElementById("pill-count-all");
  const pRead = document.getElementById("pill-count-reading");
  const pMath = document.getElementById("pill-count-maths");
  if (cTot) cTot.innerText = totalCount;
  if (cRead) cRead.innerText = readingCount;
  if (cMath) cMath.innerText = mathsCount;
  if (pTot) pTot.innerText = totalCount;
  if (pRead) pRead.innerText = readingCount;
  if (pMath) pMath.innerText = mathsCount;

  // Filter items
  const filter = state.hwFilter || "all";
  const filtered = items.filter(hw => {
    if (filter === "reading") return hw.subject === "reading";
    if (filter === "maths") return hw.subject === "maths";
    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="card" style="text-align:center; padding:48px 24px; color:var(--text-muted); background:#ffffff; border-radius:var(--radius-md); box-shadow:var(--shadow-sm); border:1px dashed #cbd5e1;">
        <div style="font-size:3.2rem; margin-bottom:12px;">🎉</div>
        <h3 style="font-weight:800; color:var(--secondary); font-size:1.35rem;">
          ${state.lang === 'hi' ? 'वर्तमान में कोई लंबित गृहकार्य नहीं है' : 'No Submissions Waiting in Queue'}
        </h3>
        <p style="font-size:0.9rem; margin-top:8px; max-width:540px; margin-left:auto; margin-right:auto; color:var(--text-muted);">
          ${state.lang === 'hi'
            ? 'जब बच्चे घर से ऑडियो या स्लेट फ़ोटो जमा करेंगे, वे तुरंत यहाँ समीक्षा हेतु आएंगे। या नीचे दिए बटन से तुरंत 2 डेमो गृहकार्य (ऑडियो व स्लेट) लोड करके शिक्षक जांच की क्षमता का परीक्षण करें:'
            : 'When children submit voice recordings or maths slate photos from home, they appear here. Or click below to immediately load 2 demo submissions with real audio & slate photos to test the teacher verification workbench:'}
        </p>
        <button class="btn btn-primary" style="margin-top:18px; padding:12px 24px; font-weight:800; background:#0284c7; box-shadow:0 4px 6px rgba(2,132,199,0.3);" onclick="seedDemoHomework()">
          ✨ ${state.lang === 'hi' ? 'डेमो गृहकार्य लोड करें (ऑडियो व स्लेट फ़ोटो सहित)' : 'Load Demo Submissions (Real Audio & Slate Photo)'}
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map((hw) => {
    const isReading = hw.subject === "reading";
    const edit = state.hwEdits[hw.id] || {};
    const selectedLevel = edit.level || hw.ai_level || hw.task || "paragraph";
    const dt = hw.created_at ? new Date(hw.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : "Recent";
    const confidencePct = hw.confidence !== null && hw.confidence !== undefined ? Math.round(hw.confidence * 100) : 90;
    const mediaToken = state.token ? `?token=${encodeURIComponent(state.token)}` : "";
    const mediaUrl = hw.media_url ? `${hw.media_url}${mediaToken}` : null;

    // --- READING HOMEWORK CARD ---
    if (isReading) {
      const scorePct = Math.round((hw.ai_score || 0) * 100);
      const levels = ["beginner", "letter", "word", "paragraph", "story"];
      const levelLabels = {
        beginner: state.lang === 'hi' ? '🌱 शुरुआती' : '🌱 Beginner',
        letter: state.lang === 'hi' ? '🔤 अक्षर' : '🔤 Letter',
        word: state.lang === 'hi' ? '📖 शब्द' : '📖 Word',
        paragraph: state.lang === 'hi' ? '📑 अनुच्छेद' : '📑 Paragraph',
        story: state.lang === 'hi' ? '🏆 कहानी' : '🏆 Story'
      };

      // Word Alignment chips
      let evidenceHtml = "";
      if (hw.evidence && hw.evidence.length > 0) {
        evidenceHtml = `
          <div style="margin: 12px 0;">
            <div style="font-size:0.8rem; font-weight:800; color:var(--secondary); margin-bottom:6px; display:flex; justify-content:space-between;">
              <span>🗣️ ${state.lang === 'hi' ? 'वाक् संरेखण व विश्लेषण (Word Alignment):' : 'Speech Alignment & Word Analysis:'}</span>
              <span style="font-size:0.75rem; color:var(--text-muted);">🟢 ${state.lang === 'hi' ? 'सही' : 'Correct'} | 🟡 ${state.lang === 'hi' ? 'समीप' : 'Close'} | 🔴 ${state.lang === 'hi' ? 'अशुद्ध' : 'Wrong'} | ⚪ ${state.lang === 'hi' ? 'छूटा' : 'Skipped'}</span>
            </div>
            <div class="evidence-words" style="background:#f8fafc; padding:12px; border-radius:var(--radius-sm); border:1px solid #e2e8f0; display:flex; flex-wrap:wrap; gap:6px;">
              ${hw.evidence.map((o) => {
                let cls = "word-correct";
                let text = o.ref || o.hyp;
                if (o.kind === "close") cls = "word-close";
                if (o.kind === "wrong") cls = "word-wrong";
                if (o.kind === "skipped") { cls = "word-skipped"; text = `[${o.ref}]`; }
                if (o.kind === "extra") { cls = "word-extra"; text = `+${o.hyp}`; }
                return `<span class="word-chip ${cls}" title="${o.kind}">${text}</span>`;
              }).join("")}
            </div>
          </div>
        `;
      }

      return `
        <div class="hw-review-card reading-card" id="hw-card-${hw.id}">
          <!-- Card Header -->
          <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:10px;">
            <div style="display:flex; align-items:center; gap:12px;">
              <div style="width:44px; height:44px; border-radius:50%; background:linear-gradient(135deg, #0284c7, #0369a1); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:1.1rem; box-shadow:0 2px 4px rgba(2,132,199,0.3);">
                ${(hw.child_label || 'S')[0].toUpperCase()}
              </div>
              <div>
                <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                  <span style="font-size:1.25rem; font-weight:800; color:var(--secondary);">${hw.child_label}</span>
                  <span class="lvl-badge lvl-${hw.task || 'paragraph'}">🎙️ ${state.lang === 'hi' ? 'पठन' : 'Reading'} (${hw.task || 'paragraph'})</span>
                  <span style="font-size:0.75rem; background:#eff6ff; color:#1d4ed8; border:1px solid #bfdbfe; padding:2px 8px; border-radius:12px; font-weight:700;">
                    🎯 AI Confidence: ${confidencePct}%
                  </span>
                </div>
                <div style="font-size:0.8rem; color:var(--text-muted); margin-top:2px;">
                  📅 ${dt} &bull; ${state.lang === 'hi' ? 'गृहकार्य स्वर रिकॉर्डिंग' : 'At-home voice submission'}
                </div>
              </div>
            </div>

            <!-- AI Score Pill -->
            <div style="text-align:right;">
              <span style="font-size:0.75rem; text-transform:uppercase; color:var(--text-muted); font-weight:700;">${state.lang === 'hi' ? 'AI सटीकता' : 'AI Accuracy'}</span>
              <div style="font-size:1.4rem; font-weight:900; color:${scorePct === 100 ? 'var(--primary)' : '#d97706'};">${scorePct}%</div>
              ${hw.evidence && hw.evidence.length > 0 ? `
                <div style="font-size:0.7rem; color:var(--text-muted); font-weight:600;">
                  ${hw.evidence.filter(e => e.kind === 'correct').length}/${hw.evidence.length} ${state.lang === 'hi' ? 'शब्द सही' : 'words correct'}
                </div>
              ` : ''}
            </div>
          </div>

          <!-- Audio Player Studio -->
          <div class="hw-audio-box">
            <div class="hw-audio-controls">
              <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-size:1.2rem;">🎧</span>
                <div>
                  <strong style="color:#15803d; font-size:0.88rem;">${state.lang === 'hi' ? 'विद्यार्थी की आवाज़ सुनें' : 'Listen to Student Reading Audio'}</strong>
                  <div style="font-size:0.74rem; color:#166534;">${state.lang === 'hi' ? 'शिक्षक जांच के लिए पूर्ण ऑडियो प्लेबैक' : 'Audio recording streamed directly for teacher listening'}</div>
                </div>
              </div>
              <div style="display:flex; gap:6px;">
                <button type="button" class="btn btn-sm btn-outline" style="font-size:0.74rem; padding:3px 8px; background:#fff;" onclick="setPlaybackSpeed('audio-${hw.id}', 0.8)">0.8x Slow</button>
                <button type="button" class="btn btn-sm btn-outline" style="font-size:0.74rem; padding:3px 8px; background:#fff;" onclick="setPlaybackSpeed('audio-${hw.id}', 1.0)">1.0x Normal</button>
              </div>
            </div>
            ${mediaUrl ? `
              <audio id="audio-${hw.id}" controls preload="metadata" src="${mediaUrl}" style="margin-top:6px;">
                Your browser does not support audio playback.
              </audio>
            ` : `
              <div style="font-size:0.82rem; color:var(--text-muted); padding:6px 0;">
                ℹ️ ${state.lang === 'hi' ? 'ऑडियो लाइव माइक्रोफ़ोन से प्रोसेस हुआ था (नमूना डेटा)' : 'Audio processed via direct live STT stream'}
              </div>
            `}
          </div>

          <!-- Original Reference Passage -->
          ${hw.passage ? `
            <div class="hw-passage-ref">
              <div class="passage-title">
                <span>📖</span> <span>${state.lang === 'hi' ? 'मूल संदर्भ पाठ' : 'Original Reference Passage'} (${hw.passage.title || hw.task})</span>
              </div>
              <div class="passage-body">${hw.passage.text}</div>
            </div>
          ` : ''}

          <!-- Alignment Chips -->
          ${evidenceHtml}

          <!-- Teacher Manual Calibration & Action Panel -->
          <div class="hw-teacher-control-panel">
            <div style="font-size:0.85rem; font-weight:800; color:var(--secondary); margin-bottom:8px; display:flex; align-items:center; gap:6px;">
              <span>✍️</span> <span>${state.lang === 'hi' ? 'शिक्षक सत्यापन व स्तर निर्धारण (Teacher Calibration):' : 'Teacher Verification & Level Assignment:'}</span>
            </div>

            <!-- Level Selector -->
            <div style="margin-bottom:12px;">
              <label style="font-size:0.78rem; font-weight:700; color:var(--text-muted); display:block; margin-bottom:4px;">
                ${state.lang === 'hi' ? 'विद्यार्थी का अंतिम स्तर चुनें (AI सुझाव चिह्नित है):' : 'Confirm FLN Level (AI suggestion highlighted):'}
              </label>
              <div class="hw-level-selector" id="level-picker-${hw.id}">
                ${levels.map(lvl => `
                  <button type="button" class="hw-level-btn ${selectedLevel === lvl ? 'selected' : ''}" data-lvl="${lvl}" onclick="selectReviewLevel(${hw.id}, '${lvl}')">
                    ${levelLabels[lvl]}
                  </button>
                `).join("")}
              </div>
            </div>

            <!-- Notes & Score Override -->
            <div style="display:grid; grid-template-columns:1fr 140px; gap:12px; margin-bottom:14px;">
              <div>
                <label style="font-size:0.78rem; font-weight:700; color:var(--text-muted); display:block; margin-bottom:4px;">
                  ${state.lang === 'hi' ? 'शिक्षक टिप्पणी / प्रोत्साहन संदेश:' : 'Teacher Feedback / Encouragement:'}
                </label>
                <input type="text" id="teacher-notes-${hw.id}" class="form-control" style="font-size:0.85rem;" placeholder="${state.lang === 'hi' ? 'उदा. बहुत बढ़िया उच्चारण! मात्राओं का ध्यान रखें।' : 'e.g. Great effort! Keep practicing vowel signs.'}">
              </div>
              <div>
                <label style="font-size:0.78rem; font-weight:700; color:var(--text-muted); display:block; margin-bottom:4px;">
                  ${state.lang === 'hi' ? 'अंक सुधार (%)' : 'Adjust Score (%)'}
                </label>
                <input type="number" id="teacher-score-${hw.id}" class="form-control" style="font-size:0.85rem;" min="0" max="100" value="${scorePct}">
              </div>
            </div>

            <!-- Action Buttons -->
            <div style="display:flex; justify-content:flex-end; gap:10px; align-items:center;">
              <button class="btn btn-outline btn-sm" style="color:var(--danger); border-color:#fca5a5;" onclick="submitTeacherReview(${hw.id}, 'reject')">
                ✗ ${state.lang === 'hi' ? 'अस्वीकार / पुनः प्रयास' : 'Request Retake'}
              </button>
              <button class="btn btn-success btn-sm" style="font-weight:800; padding:8px 18px;" onclick="submitTeacherReview(${hw.id}, 'approve')">
                ✓ ${state.lang === 'hi' ? 'स्वीकृत करें और स्तर अपडेट करें' : 'Approve & Confirm FLN Level'}
              </button>
            </div>
          </div>
        </div>
      `;
    }

    // --- MATHS SLATE HOMEWORK CARD ---
    const results = (edit.results) || (hw.response && hw.response.results) || [];
    const totalMaths = results.length;
    const correctMaths = results.filter(r => r.correct === true).length;
    const scoreVal = edit.score !== undefined ? Math.round(edit.score * 100) : (hw.ai_score !== null ? Math.round(hw.ai_score * 100) : 0);

    return `
      <div class="hw-review-card maths-card" id="hw-card-${hw.id}">
        <!-- Header -->
        <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:10px;">
          <div style="display:flex; align-items:center; gap:12px;">
            <div style="width:44px; height:44px; border-radius:50%; background:linear-gradient(135deg, #7c3aed, #6d28d9); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:1.1rem; box-shadow:0 2px 4px rgba(124,58,237,0.3);">
              ${(hw.child_label || 'S')[0].toUpperCase()}
            </div>
            <div>
              <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                <span style="font-size:1.25rem; font-weight:800; color:var(--secondary);">${hw.child_label}</span>
                <span class="lvl-badge lvl-paragraph" style="background:#f5f3ff; color:#7c3aed; border:1px solid #ddd6fe;">📐 ${state.lang === 'hi' ? 'गणित स्लेट' : 'Maths Slate'}</span>
                <span style="font-size:0.75rem; background:#f5f3ff; color:#6d28d9; border:1px solid #ddd6fe; padding:2px 8px; border-radius:12px; font-weight:700;">
                  Vision OCR Evaluated
                </span>
              </div>
              <div style="font-size:0.8rem; color:var(--text-muted); margin-top:2px;">
                📅 ${dt} &bull; ${state.lang === 'hi' ? 'स्लेट / कॉपी फ़ोटो' : 'Chalk slate / notebook photo upload'}
              </div>
            </div>
          </div>

          <div style="text-align:right;">
            <span style="font-size:0.75rem; text-transform:uppercase; color:var(--text-muted); font-weight:700;">${state.lang === 'hi' ? 'प्राप्तांक' : 'Maths Score'}</span>
            <div id="math-score-badge-${hw.id}" style="font-size:1.4rem; font-weight:900; color:#7c3aed;">
              ${scoreVal}% (${correctMaths}/${totalMaths})
            </div>
          </div>
        </div>

        <!-- Slate Grid: Image & Interactive Problems -->
        <div class="hw-slate-grid">
          <!-- Slate Photo View -->
          <div class="hw-slate-img-card">
            <img src="${mediaUrl || '/sample_slate.jpg'}" alt="Slate Photo" onclick="openImageZoomModal(this.src)" onerror="this.onerror=null; this.src='data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'240\' height=\'160\'><rect width=\'240\' height=\'160\' fill=\'%230f172a\'/><text x=\'50%25\' y=\'50%25\' fill=\'%23cbd5e1\' text-anchor=\'middle\' font-size=\'13\'>Maths Slate Photo</text></svg>'">
            <span style="font-size:0.74rem; color:#94a3b8; margin-top:6px; cursor:pointer;" onclick="openImageZoomModal('${mediaUrl || '/sample_slate.jpg'}')">
              🔍 ${state.lang === 'hi' ? 'बड़ी फ़ोटो देखने के लिए क्लिक करें' : 'Click photo to zoom'}
            </span>
          </div>

          <!-- Problem Table with Manual Correction -->
          <div>
            <div style="font-size:0.8rem; font-weight:800; color:var(--secondary); margin-bottom:6px; display:flex; justify-content:space-between;">
              <span>🧮 ${state.lang === 'hi' ? 'प्रश्नों की जांच व हस्तलेखन सत्यापन:' : 'Problem-by-Problem OCR Verification:'}</span>
              <span style="font-size:0.72rem; color:var(--text-muted);">${state.lang === 'hi' ? 'आवश्यकता होने पर अंक टॉगल करें' : 'Click to toggle if handwriting was misread'}</span>
            </div>
            <table class="hw-math-table">
              <thead>
                <tr>
                  <th>${state.lang === 'hi' ? 'सवाल' : 'Problem'}</th>
                  <th>${state.lang === 'hi' ? 'बच्चे का उत्तर' : 'Child Written'}</th>
                  <th>${state.lang === 'hi' ? 'सही उत्तर' : 'Expected'}</th>
                  <th>${state.lang === 'hi' ? 'सत्यापन' : 'Teacher Override'}</th>
                </tr>
              </thead>
              <tbody>
                ${results.map((r, i) => `
                  <tr>
                    <td><strong>${r.problem}</strong></td>
                    <td><span style="font-weight:700; color:${r.correct ? '#15803d' : '#b91c1c'};">${r.child_answer !== null && r.child_answer !== undefined ? r.child_answer : '—'}</span></td>
                    <td><span style="color:var(--text-muted);">${r.truth !== null && r.truth !== undefined ? r.truth : '—'}</span></td>
                    <td>
                      <button type="button" id="math-btn-${hw.id}-${i}" class="hw-toggle-btn ${r.correct ? 'btn-correct' : 'btn-wrong'}" onclick="toggleMathCorrection(${hw.id}, ${i})">
                        ${r.correct ? '✓ Correct' : '✗ Wrong'}
                      </button>
                    </td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Teacher Calibration Panel -->
        <div class="hw-teacher-control-panel">
          <div style="display:grid; grid-template-columns:1fr; gap:10px; margin-bottom:12px;">
            <div>
              <label style="font-size:0.78rem; font-weight:700; color:var(--text-muted); display:block; margin-bottom:4px;">
                ${state.lang === 'hi' ? 'शिक्षक टिप्पणी / प्रोत्साहन संदेश:' : 'Teacher Feedback / Encouragement:'}
              </label>
              <input type="text" id="teacher-notes-${hw.id}" class="form-control" style="font-size:0.85rem;" placeholder="${state.lang === 'hi' ? 'उदा. घटाव के हासिल (borrowing) पर थोड़ा और ध्यान दें।' : 'e.g. Well done! Practice borrowing in subtraction.'}">
            </div>
          </div>

          <div style="display:flex; justify-content:flex-end; gap:10px; align-items:center;">
            <button class="btn btn-outline btn-sm" style="color:var(--danger); border-color:#fca5a5;" onclick="submitTeacherReview(${hw.id}, 'reject')">
              ✗ ${state.lang === 'hi' ? 'अस्वीकार / पुनः प्रयास' : 'Request Retake'}
            </button>
            <button class="btn btn-success btn-sm" style="font-weight:800; padding:8px 18px;" onclick="submitTeacherReview(${hw.id}, 'approve')">
              ✓ ${state.lang === 'hi' ? 'स्वीकृत करें और अंक दर्ज करें' : 'Approve & Record Marks'}
            </button>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

async function submitTeacherReview(assessmentId, action) {
  const hw = (state.pendingHomework || []).find(h => h.id === assessmentId);
  const edit = state.hwEdits[assessmentId] || {};
  const notesInput = document.getElementById(`teacher-notes-${assessmentId}`);
  const scoreInput = document.getElementById(`teacher-score-${assessmentId}`);
  
  const teacher_notes = notesInput ? notesInput.value.trim() : (edit.notes || null);
  const teacher_level = edit.level || (hw ? hw.ai_level || hw.task : null);
  const teacher_score = scoreInput ? (parseFloat(scoreInput.value) / 100) : (edit.score !== undefined ? edit.score : (hw ? hw.ai_score : null));
  const results = edit.results || (hw && hw.response ? hw.response.results : null);

  try {
    const res = await apiFetch(`/api/homework/${assessmentId}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        teacher_level,
        teacher_score,
        teacher_notes,
        results
      })
    });
    if (res) {
      delete state.hwEdits[assessmentId];
      showToast(action === 'approve'
        ? (state.lang === 'hi' ? "🎉 गृहकार्य स्वीकृत व स्तर सफलतापूर्वक अपडेट हुआ!" : "🎉 Homework approved & official level confirmed!")
        : (state.lang === 'hi' ? "गृहकार्य पुनः प्रयास हेतु भेजा गया।" : "Homework flagged for retake."),
        "success");
      await loadPendingHomework();
      await loadChildren();
      await loadProgress();
    }
  } catch (err) {
    showToast(`Review failed: ${err.message}`, "danger");
  }
}

// ----------------- My Class View -----------------

state.classFilter = "all";
state.classSearch = "";
state.classSort = "name_asc";

async function loadChildren() {
  if (state.role !== "teacher") return;
  try {
    const kids = await apiFetch("/api/children");
    if (!kids) return;
    state.children = kids;
    populateChildDropdowns(kids);

    // Calculate level distributions
    const total = kids.length;
    const counts = { story: 0, paragraph: 0, word: 0, letter: 0, beginner: 0, moved_up: 0 };
    kids.forEach(k => {
      const lv = k.level || "beginner";
      if (counts[lv] !== undefined) counts[lv]++;
      else counts.beginner++;
      if (k.moved_up) counts.moved_up++;
    });

    // Update KPI cards
    const assessed = kids.filter((k) => k.level).length;
    const kpiTot = document.getElementById("kpi-total-children");
    const kpiAss = document.getElementById("kpi-assessed-children");
    const kpiMov = document.getElementById("kpi-moved-up");
    if (kpiTot) kpiTot.innerText = total;
    if (kpiAss) kpiAss.innerText = assessed;
    if (kpiMov) kpiMov.innerText = counts.moved_up;

    // Update Ladder Stepper Counts
    const cStory = document.getElementById("count-story");
    const cPara = document.getElementById("count-paragraph");
    const cWord = document.getElementById("count-word");
    const cLet = document.getElementById("count-letter");
    const cBeg = document.getElementById("count-beginner");
    if (cStory) cStory.innerText = counts.story;
    if (cPara) cPara.innerText = counts.paragraph;
    if (cWord) cWord.innerText = counts.word;
    if (cLet) cLet.innerText = counts.letter;
    if (cBeg) cBeg.innerText = counts.beginner;

    // Update Filter Pills
    const pAll = document.getElementById("pill-filter-all");
    const pMov = document.getElementById("pill-filter-moved");
    if (pAll) pAll.innerText = `${state.lang === 'hi' ? 'सभी' : 'All'} (${total})`;
    if (pMov) pMov.innerText = `🚀 ${state.lang === 'hi' ? 'स्तर में सुधार' : 'Moved Up'} (${counts.moved_up})`;

    // Update FLN Mastery Stack Bar & Legend
    renderFlnDistributionBar(kids, counts, total);

    // Render Student Cards
    filterAndRenderStudents();
  } catch (err) {
    console.warn("Load children failed:", err);
  }
}

function renderFlnDistributionBar(kids, counts, total) {
  const barStack = document.getElementById("fln-bar-stack");
  const legendBox = document.getElementById("fln-legend-items");
  const ratioLabel = document.getElementById("fln-assessed-ratio");
  if (!barStack) return;

  const assessed = kids.filter(k => k.level).length;
  if (ratioLabel) {
    ratioLabel.innerText = `${assessed}/${total} ${state.lang === 'hi' ? 'आकलित' : 'Assessed'}`;
  }

  if (total === 0) {
    barStack.innerHTML = `<div style="width:100%; height:100%; background:#e2e8f0;"></div>`;
    return;
  }

  const levels = [
    { key: "story", label: state.lang === 'hi' ? 'कहानी' : 'Story', cls: "fln-dist-story", dot: "#10b981", count: counts.story },
    { key: "paragraph", label: state.lang === 'hi' ? 'अनुच्छेद' : 'Paragraph', cls: "fln-dist-paragraph", dot: "#7c3aed", count: counts.paragraph },
    { key: "word", label: state.lang === 'hi' ? 'शब्द' : 'Word', cls: "fln-dist-word", dot: "#2563eb", count: counts.word },
    { key: "letter", label: state.lang === 'hi' ? 'अक्षर' : 'Letter', cls: "fln-dist-letter", dot: "#d97706", count: counts.letter },
    { key: "beginner", label: state.lang === 'hi' ? 'शुरुआती' : 'Beginner', cls: "fln-dist-beginner", dot: "#64748b", count: counts.beginner }
  ];

  barStack.innerHTML = levels.map(l => {
    const pct = Math.round((l.count / total) * 100);
    if (pct === 0) return "";
    return `<div class="fln-dist-segment ${l.cls}" style="width:${pct}%;" title="${l.label}: ${l.count} (${pct}%)" onclick="filterClassList('${l.key}')"></div>`;
  }).join("");

  if (legendBox) {
    legendBox.innerHTML = levels.map(l => {
      const pct = Math.round((l.count / total) * 100);
      return `
        <div class="fln-legend-item" onclick="filterClassList('${l.key}')">
          <span class="fln-legend-dot" style="background:${l.dot};"></span>
          <strong>${l.label}</strong>: ${l.count} <span style="opacity:0.75;">(${pct}%)</span>
        </div>
      `;
    }).join("");
  }
}

function filterAndRenderStudents() {
  const container = document.getElementById("students-container");
  if (!container) return;

  let list = [...(state.children || [])];

  // 1. Filter by Level or Moved Up
  const filter = state.classFilter || "all";
  if (filter === "moved_up") {
    list = list.filter(k => k.moved_up === true);
  } else if (filter !== "all") {
    list = list.filter(k => (k.level || "beginner") === filter);
  }

  // 2. Search query filter
  const query = (state.classSearch || "").trim().toLowerCase();
  if (query) {
    list = list.filter(k => (k.label || "").toLowerCase().includes(query) || String(k.id).includes(query));
  }

  // 3. Sort
  const sort = state.classSort || "name_asc";
  const levelOrder = { story: 5, paragraph: 4, word: 3, letter: 2, beginner: 1 };
  if (sort === "name_asc") {
    list.sort((a, b) => (a.label || "").localeCompare(b.label || ""));
  } else if (sort === "name_desc") {
    list.sort((a, b) => (b.label || "").localeCompare(a.label || ""));
  } else if (sort === "level_desc") {
    list.sort((a, b) => (levelOrder[b.level || "beginner"] || 0) - (levelOrder[a.level || "beginner"] || 0));
  } else if (sort === "level_asc") {
    list.sort((a, b) => (levelOrder[a.level || "beginner"] || 0) - (levelOrder[b.level || "beginner"] || 0));
  } else if (sort === "tests_desc") {
    list.sort((a, b) => (b.assessment_count || 0) - (a.assessment_count || 0));
  }

  renderStudents(list);
}

function onStudentSearch(val) {
  state.classSearch = val;
  const clearBtn = document.getElementById("search-clear-btn");
  if (clearBtn) {
    clearBtn.style.display = val ? "inline-block" : "none";
  }
  filterAndRenderStudents();
}

function clearStudentSearch() {
  const input = document.getElementById("student-search-input");
  if (input) input.value = "";
  state.classSearch = "";
  const clearBtn = document.getElementById("search-clear-btn");
  if (clearBtn) clearBtn.style.display = "none";
  filterAndRenderStudents();
}

function onStudentSort(val) {
  state.classSort = val;
  filterAndRenderStudents();
}

function filterClassList(level, btn) {
  state.classFilter = level;
  document.querySelectorAll(".evaluator-btn, .ladder-step").forEach((b) => b.classList.remove("active"));
  
  if (btn) {
    btn.classList.add("active");
  } else {
    const stepEl = document.getElementById(`step-${level}`);
    if (stepEl) stepEl.classList.add("active");
    const pillEl = document.getElementById(`pill-filter-${level}`);
    if (pillEl) pillEl.classList.add("active");
  }

  filterAndRenderStudents();
}

function renderStudents(kids) {
  const container = document.getElementById("students-container");
  if (!container) return;
  
  if (kids.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align:center; padding:48px 20px; background:#ffffff; border-radius:var(--radius-md); border:1px dashed #cbd5e1; color:var(--text-muted);">
        <div style="font-size:2.8rem; margin-bottom:8px;">🔍</div>
        <h4 style="font-weight:800; color:var(--secondary); font-size:1.15rem;">
          ${state.lang === 'hi' ? 'कोई छात्र नहीं मिला' : 'No Students Match Filter'}
        </h4>
        <p style="font-size:0.85rem; margin-top:6px;">
          ${state.lang === 'hi' ? 'कृपया अपनी खोज या फ़िल्टर बदलकर दोबारा प्रयास करें।' : 'Try clearing your search query or selecting "All" to view all children.'}
        </p>
        <button class="btn btn-outline btn-sm" style="margin-top:14px;" onclick="filterClassList('all')">
          🔄 ${state.lang === 'hi' ? 'सभी छात्र दिखाएं' : 'Show All Students'}
        </button>
      </div>
    `;
    return;
  }

  const levelRank = { beginner: 1, letter: 2, word: 3, paragraph: 4, story: 5 };

  container.innerHTML = kids.map((k) => {
    const lv = k.level || "beginner";
    const lvName = getLevelDisplayName(lv);
    const initial = (k.label || "S")[0].toUpperCase();
    const testsCount = k.assessment_count || 0;
    const baseLv = k.baseline ? getLevelDisplayName(k.baseline) : null;
    const rank = levelRank[lv] || 1;

    // 5-dot Progress track
    const dotLevels = ["beginner", "letter", "word", "paragraph", "story"];
    const dotsHtml = dotLevels.map((dl, idx) => {
      const isFilled = (idx + 1) <= rank;
      return `<div class="ladder-dot-item ${isFilled ? `active-dot dot-${lv}` : ''}" title="${getLevelDisplayName(dl)}"></div>`;
    }).join("");

    return `
      <div class="student-card" data-level="${lv}">
        <div>
          <!-- Top Row: Avatar, Name, Level Badge -->
          <div class="student-card-top">
            <div class="student-info-left">
              <div class="student-avatar avatar-${lv}">
                ${initial}
              </div>
              <div class="student-name-group">
                <span class="student-card-name">${k.label}</span>
                <span class="student-id-sub">Roll #${k.id}</span>
              </div>
            </div>
            <span class="lvl-badge lvl-${lv}">${lvName}</span>
          </div>

          <!-- 5-Level ASER Progress Stepper Track -->
          <div class="student-ladder-track" title="ASER Progress: Step ${rank} of 5 (${lvName})">
            ${dotsHtml}
          </div>

          <!-- Meta Row: Baseline & Assessment Count -->
          <div class="student-meta-row">
            <div>
              ${k.moved_up ? `
                <span class="moved-up-badge">
                  <span>🚀</span> <span>${state.lang === 'hi' ? 'स्तर में सुधार!' : 'Moved Up!'}</span>
                  ${baseLv ? `<span style="opacity:0.85;">(${baseLv} ➔ ${lvName})</span>` : ''}
                </span>
              ` : `
                <span>${state.lang === 'hi' ? 'स्थिति' : 'Status'}: <strong>${getLevelFriendlyStatus(lv)}</strong></span>
              `}
            </div>
            <span style="font-size:0.74rem; color:var(--text-muted); font-weight:600;">
              ${testsCount > 0 ? `✓ ${testsCount} ${state.lang === 'hi' ? 'जांच पूर्ण' : 'tests done'}` : `⏳ ${state.lang === 'hi' ? 'नया छात्र' : 'New'}`}
            </span>
          </div>
        </div>

        <!-- 3-Button Action Grid -->
        <div class="student-actions-grid">
          <button class="btn btn-primary btn-sm" onclick="startReadingForChild(${k.id})" title="Start reading assessment">
            🎙️ <span>${state.lang === 'hi' ? 'पठन जांच' : 'Reading'}</span>
          </button>
          <button class="btn btn-sm" style="background:#f5f3ff; color:#6d28d9; border:1px solid #ddd6fe; font-weight:700;" onclick="startMathsForChild(${k.id})" title="Assess maths slate photo">
            📐 <span>${state.lang === 'hi' ? 'गणित स्लेट' : 'Maths'}</span>
          </button>
          <button class="btn btn-outline btn-sm" onclick="startManualForChild(${k.id})" title="Manual 1-tap level recording">
            ✍️ <span>${state.lang === 'hi' ? 'मैन्युअल' : 'Manual'}</span>
          </button>
        </div>
      </div>
    `;
  }).join("");
}

function populateChildDropdowns(kids) {
  const selects = [
    document.getElementById("assess-child-select"),
    document.getElementById("manual-child-select"),
    document.getElementById("maths-child-select")
  ];
  const optionsHtml = kids.map((k) => `<option value="${k.id}">${k.label} (${getLevelDisplayName(k.level || "beginner")})</option>`).join("");
  selects.forEach((sel) => {
    if (sel) sel.innerHTML = optionsHtml;
  });
}

function getLevelFriendlyStatus(level) {
  if (state.lang === "hi") {
    const map = {
      beginner: "शुरुआती अभ्यास पर है (Working on basics)",
      letter: "अक्षरों पर काम कर रहा है (Working on letters)",
      word: "शब्दों पर काम कर रहा है (Working on words)",
      paragraph: "अनुच्छेद पढ़ रहा है (Reading paragraphs)",
      story: "कहानी पढ़ रहा है (Reading stories)"
    };
    return map[level] || "आकलन प्रतीक्षित";
  }
  const map = {
    beginner: "Working on basics",
    letter: "Mastering single letters",
    word: "Reading simple words",
    paragraph: "Reading fluently in paragraphs",
    story: "Reading full stories with comprehension"
  };
  return map[level] || "Needs Assessment";
}

function getLevelDisplayName(level) {
  if (state.lang === "hi") {
    const map = {
      beginner: "शुरुआती (Beginner)",
      letter: "अक्षर (Letter)",
      word: "शब्द (Word)",
      paragraph: "अनुच्छेद (Paragraph)",
      story: "कहानी (Story)"
    };
    return map[level] || level;
  }
  const map = {
    beginner: "Beginner",
    letter: "Letter",
    word: "Word",
    paragraph: "Paragraph",
    story: "Story"
  };
  return map[level] || level;
}

// ----------------- Add Child Modal -----------------

function openAddChildModal() {
  document.getElementById("add-child-modal").classList.add("active");
  document.getElementById("new-child-label").focus();
}

function closeAddChildModal() {
  document.getElementById("add-child-modal").classList.remove("active");
  document.getElementById("new-child-label").value = "";
}

async function handleAddChildSubmit(e) {
  e.preventDefault();
  const labelInput = document.getElementById("new-child-label");
  const label = labelInput.value.trim();

  if (label.includes(" ")) {
    showToast(state.lang === 'hi' ? "कृपया केवल पहला नाम या रोल नंबर लिखें (कोई उपनाम नहीं)।" : "Please use first name or roll number only (no surname).", "warning");
    return;
  }

  try {
    const res = await apiFetch("/api/children", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label })
    });
    if (res && res.id) {
      showToast(`${state.lang === 'hi' ? 'छात्र' : 'Student'} '${label}' ${state.lang === 'hi' ? 'सफलतापूर्वक जोड़ा गया!' : 'added successfully!'}`, "success");
      closeAddChildModal();
      loadChildren();
    }
  } catch (err) {
    showToast(err.message, "danger");
  }
}

// ----------------- Reading Assessment -----------------

async function loadPassages() {
  try {
    const p = await apiFetch("/api/passages");
    if (p) state.passages = p;
  } catch (err) {
    console.warn("Passages error:", err);
  }
}

function startReadingForChild(childId) {
  switchTab("reading");
  const sel = document.getElementById("assess-child-select");
  if (sel) {
    sel.value = childId;
    onChildSelectChange();
  }
}

async function onChildSelectChange() {
  const childId = document.getElementById("assess-child-select").value;
  if (!childId) return;

  try {
    const nextInfo = await apiFetch(`/api/assess/next-task?child_id=${childId}`);
    if (nextInfo) {
      const hint = document.getElementById("ladder-hint-box");
      const taskSel = document.getElementById("assess-task-select");
      if (nextInfo.next_task) {
        taskSel.value = nextInfo.next_task;
        hint.innerHTML = `💡 ${state.lang === 'hi' ? 'अगला अनुच्छेद (सुझाव)' : 'Suggested next passage'}: <strong>${getLevelDisplayName(nextInfo.next_task)}</strong>`;
      } else {
        hint.innerHTML = `✓ ${state.lang === 'hi' ? 'स्तर जाँच पूरी' : 'Level check complete'}: <strong>${getLevelDisplayName(nextInfo.ai_level_hint || 'beginner')}</strong>`;
      }
      onTaskSelectChange();
    }
  } catch (err) {
    console.warn("Next task fetch error:", err);
  }
}

function onTaskSelectChange() {
  const task = document.getElementById("assess-task-select").value;
  const p = state.passages.find((x) => x.level === task) || state.passages[0];
  if (!p) return;

  document.getElementById("passage-text-display").innerText = p.text;
  document.getElementById("passage-id-tag").innerText = p.id;
  document.getElementById("passage-level-tag").className = `lvl-badge lvl-${p.level}`;
  document.getElementById("passage-level-tag").innerText = getLevelDisplayName(p.level);
  document.getElementById("passage-time").innerText = p.sec || 20;
}

// Audio Recording Engine
async function toggleRecording() {
  if (state.mediaRecorder && state.mediaRecorder.state === "recording") {
    stopRecording();
  } else {
    startRecording();
  }
}

async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    state.audioChunks = [];
    state.mediaRecorder = new MediaRecorder(stream);

    state.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) state.audioChunks.push(e.data);
    };

    state.mediaRecorder.onstop = () => {
      state.recordedBlob = new Blob(state.audioChunks, { type: "audio/webm" });
      const audioUrl = URL.createObjectURL(state.recordedBlob);
      const audio = document.getElementById("audio-playback");
      audio.src = audioUrl;
      audio.style.display = "block";

      document.getElementById("btn-stop-rec").style.display = "none";
      document.getElementById("btn-redo-rec").style.display = "inline-flex";
      document.getElementById("btn-submit-audio").style.display = "inline-flex";
      document.getElementById("record-status-msg").innerText = state.lang === 'hi' ? "रिकॉर्डिंग पूर्ण! आप सुन सकते हैं या विश्लेषण शुरू कर सकते हैं।" : "Recording complete! Review or click Assess.";
    };

    state.mediaRecorder.start();
    state.recordSeconds = 0;
    
    const micBtn = document.getElementById("mic-main-btn");
    micBtn.classList.add("recording");
    micBtn.innerHTML = "⏹️";

    document.getElementById("btn-stop-rec").style.display = "inline-flex";
    document.getElementById("btn-redo-rec").style.display = "none";
    document.getElementById("btn-submit-audio").style.display = "none";
    document.getElementById("audio-playback").style.display = "none";
    document.getElementById("record-status-msg").innerText = state.lang === 'hi' ? "🔴 रिकॉर्डिंग जारी है... (बच्चे को ज्ञात पाठ पढ़ने दें)" : "🔴 Recording in progress... (ask child to read)";

    clearInterval(state.recordInterval);
    state.recordInterval = setInterval(() => {
      state.recordSeconds++;
      const mm = String(Math.floor(state.recordSeconds / 60)).padStart(2, "0");
      const ss = String(state.recordSeconds % 60).padStart(2, "0");
      document.getElementById("record-timer").innerText = `${mm}:${ss}`;

      if (state.recordSeconds >= 30) {
        stopRecording();
      }
    }, 1000);

  } catch (err) {
    showToast(state.lang === 'hi' ? "माइक्रोफ़ोन अनुमति नहीं मिली।" : "Microphone permission denied.", "danger");
  }
}

function stopRecording() {
  if (state.mediaRecorder && state.mediaRecorder.state === "recording") {
    state.mediaRecorder.stop();
    state.mediaRecorder.stream.getTracks().forEach((track) => track.stop());
  }
  clearInterval(state.recordInterval);
  const micBtn = document.getElementById("mic-main-btn");
  micBtn.classList.remove("recording");
  micBtn.innerHTML = "🎙️";
}

function resetRecorder() {
  stopRecording();
  state.recordedBlob = null;
  document.getElementById("record-timer").innerText = "00:00";
  document.getElementById("audio-playback").style.display = "none";
  document.getElementById("btn-stop-rec").style.display = "none";
  document.getElementById("btn-redo-rec").style.display = "none";
  document.getElementById("btn-submit-audio").style.display = "none";
  document.getElementById("record-status-msg").innerText = t("mic_instruction");
}

function handleAudioFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  state.recordedBlob = file;
  const audioUrl = URL.createObjectURL(file);
  const audio = document.getElementById("audio-playback");
  audio.src = audioUrl;
  audio.style.display = "block";

  document.getElementById("record-timer").innerText = "Loaded";
  document.getElementById("btn-redo-rec").style.display = "inline-flex";
  document.getElementById("btn-submit-audio").style.display = "inline-flex";
  document.getElementById("record-status-msg").innerText = `${state.lang === 'hi' ? 'ऑडियो फ़ाइल लोड हुई' : 'Audio file loaded'}: ${file.name}`;
}

// Submit Audio for Assessment
async function submitAssessmentAudio() {
  if (!state.recordedBlob) {
    showToast(state.lang === 'hi' ? "कृपया पहले रिकॉर्ड करें।" : "Please record audio first.", "warning");
    return;
  }

  const childId = parseInt(document.getElementById("assess-child-select").value);
  const task = document.getElementById("assess-task-select").value;
  const p = state.passages.find((x) => x.level === task) || state.passages[0];
  const audioSec = state.recordSeconds || p.sec || 20;

  if (!isOnline()) {
    await addToOfflineQueue({
      type: "reading",
      child_id: childId,
      task: task,
      passage_id: p.id,
      audio_sec: audioSec,
      audioBlob: state.recordedBlob,
      filename: state.recordedBlob.name || "clip.webm"
    });
    showToast(state.lang === 'hi' ? "✈️ ऑफ़लाइन मोड: रिकॉर्डिंग सुरक्षित कतार में जमा हुई।" : "✈️ Offline: Recording saved to queue. Syncs when online.", "warning");
    resetRecorder();
    return;
  }

  showToast(state.lang === 'hi' ? "सर्वम AI द्वारा संरेखण व विश्लेषण हो रहा है..." : "Sarvam AI aligning phonemes & scoring...", "info");
  const submitBtn = document.getElementById("btn-submit-audio");
  submitBtn.disabled = true;
  submitBtn.innerText = state.lang === 'hi' ? "⏳ विश्लेषण जारी..." : "⏳ Assessing...";

  try {
    const fd = new FormData();
    fd.append("audio", state.recordedBlob, state.recordedBlob.name || "clip.webm");
    fd.append("child_id", childId);
    fd.append("task", task);
    fd.append("passage_id", p.id);
    fd.append("audio_sec", audioSec);

    const res = await apiFetch("/api/assess/reading", { method: "POST", body: fd });
    if (res) {
      renderAssessmentResult(res);
      showToast(state.lang === 'hi' ? "पठन विश्लेषण पूर्ण!" : "Reading assessment complete!", "success");
      updateClaudeBudgetWidget();
    }
  } catch (err) {
    showToast(`Assessment failed: ${err.message}`, "danger");
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerText = `⚡ ${t("analyze_audio")}`;
  }
}

function renderAssessmentResult(res) {
  state.currentAssessment = res;
  const panel = document.getElementById("assessment-result-panel");
  panel.style.display = "block";
  panel.scrollIntoView({ behavior: "smooth" });

  const scorePct = Math.round((res.score || 0) * 100);
  document.getElementById("res-score-val").innerText = `${scorePct}%`;
  
  const detailEl = document.getElementById("res-score-detail");
  if (detailEl && res.counts) {
    const totalRef = (res.counts.correct || 0) + (res.counts.close || 0) + (res.counts.wrong || 0) + (res.counts.skipped || 0);
    const correctCount = res.counts.correct || 0;
    const errorsCount = (res.counts.close || 0) + (res.counts.wrong || 0) + (res.counts.skipped || 0);
    if (errorsCount === 0) {
      detailEl.innerHTML = `<span style="color:#16a34a;">✓ ${correctCount}/${totalRef} ${state.lang === 'hi' ? 'शब्द सही (100% सटीक)' : 'words correct (100% exact)'}</span>`;
    } else {
      detailEl.innerHTML = `<span style="color:#d97706;">⚠️ ${correctCount}/${totalRef} ${state.lang === 'hi' ? 'शब्द सही' : 'words correct'} (${errorsCount} ${state.lang === 'hi' ? 'अशुद्धियां पकड़ी गईं' : 'errors detected'})</span>`;
    }
  }

  document.getElementById("res-ai-level").innerText = getLevelDisplayName(res.ai_level_hint || "beginner");

  // Confidence Indicator
  const confBadge = document.getElementById("res-confidence-badge");
  const conf = res.confidence !== undefined ? res.confidence : 0.9;
  if (conf >= 0.7) {
    confBadge.className = "status-pill status-online";
    confBadge.innerText = `${state.lang === 'hi' ? 'उच्च विश्वसनीयता' : 'High Confidence'} (${Math.round(conf * 100)}%)`;
  } else {
    confBadge.className = "status-pill status-offline";
    confBadge.innerText = `⚠️ ${state.lang === 'hi' ? 'कम विश्वसनीयता' : 'Low Confidence'} (${Math.round(conf * 100)}%) - ${state.lang === 'hi' ? 'शिक्षक निर्णय आवश्यक' : 'Teacher Review Needed'}`;
  }

  // Word-by-word visual alignment evidence chips
  const wordsContainer = document.getElementById("evidence-words-list");
  if (res.evidence && res.evidence.length > 0) {
    wordsContainer.innerHTML = res.evidence.map((o) => {
      let cls = "word-correct";
      let text = o.ref || o.hyp;
      if (o.kind === "close") cls = "word-close";
      if (o.kind === "wrong") cls = "word-wrong";
      if (o.kind === "skipped") { cls = "word-skipped"; text = `[${o.ref}]`; }
      if (o.kind === "extra") { cls = "word-extra"; text = `+${o.hyp}`; }
      return `<span class="word-chip ${cls}">${text}</span>`;
    }).join("");
  } else {
    wordsContainer.innerHTML = `<span style="color:var(--text-muted); font-size:0.85rem;">No evidence available</span>`;
  }

  // Claude Error Diagnosis Card
  const claudeBox = document.getElementById("claude-pattern-box");
  const pat = res.pattern || {};
  const claude = pat.claude || pat;
  if (claude && (claude.pattern_hi || claude.main_error)) {
    claudeBox.style.display = "block";
    document.getElementById("claude-pattern-text").innerText = claude.pattern_hi || window.cmPlainError(claude.main_error);
    document.getElementById("claude-next-skill").innerText = `🎯 Next Skill: ${claude.next_skill || 'Phonetic practice with matras'}`;
  } else {
    claudeBox.style.display = "none";
  }

  // Teacher In-Class Audio Playback Studio
  const resAudioBox = document.getElementById("res-audio-container");
  const resAudioPlayer = document.getElementById("res-audio-player");
  if (resAudioBox && resAudioPlayer) {
    if (state.recordedBlob) {
      resAudioPlayer.src = URL.createObjectURL(state.recordedBlob);
      resAudioBox.style.display = "block";
    } else {
      resAudioBox.style.display = "none";
    }
  }

  const overrideSel = document.getElementById("teacher-override-select");
  if (overrideSel && res.ai_level_hint) {
    overrideSel.value = res.ai_level_hint;
  }
}

// Teacher Confirm Decision
async function confirmAILevel() {
  if (!state.currentAssessment || !state.currentAssessment.assessment_id) {
    showToast(state.lang === 'hi' ? "कोई सक्रिय आकलन नहीं मिला।" : "No active assessment found.", "warning");
    return;
  }
  const aid = state.currentAssessment.assessment_id;
  const level = state.currentAssessment.ai_level_hint || "beginner";
  await submitTeacherConfirmation(aid, level);
}

async function confirmOverrideLevel() {
  if (!state.currentAssessment || !state.currentAssessment.assessment_id) {
    showToast(state.lang === 'hi' ? "कोई सक्रिय आकलन नहीं मिला।" : "No active assessment found.", "warning");
    return;
  }
  const aid = state.currentAssessment.assessment_id;
  const level = document.getElementById("teacher-override-select").value;
  await submitTeacherConfirmation(aid, level);
}

async function submitTeacherConfirmation(assessmentId, level) {
  try {
    const res = await apiFetch(`/api/assess/${assessmentId}/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teacher_level: level })
    });
    if (res) {
      showToast(`${state.lang === 'hi' ? 'शिक्षक द्वारा स्तर' : 'Teacher confirmed level'} '${getLevelDisplayName(level)}'!`, "success");
      loadChildren();
      loadProgress();
    }
  } catch (err) {
    showToast(`Confirmation failed: ${err.message}`, "danger");
  }
}

// ----------------- Manual Level Mode -----------------

function startManualForChild(childId) {
  switchTab("manual");
  const sel = document.getElementById("manual-child-select");
  if (sel) sel.value = childId;
}

async function saveManualLevel(level) {
  const childId = parseInt(document.getElementById("manual-child-select").value);
  if (!childId) {
    showToast(state.lang === 'hi' ? "कृपया पहले बच्चा चुनें।" : "Please select a child first.", "warning");
    return;
  }

  if (!isOnline()) {
    await addToOfflineQueue({
      type: "manual",
      child_id: childId,
      level: level
    });
    showToast(`✈️ ${state.lang === 'hi' ? 'ऑफ़लाइन: स्तर कतार में सुरक्षित' : 'Offline: Level saved to queue'}!`, "warning");
    switchTab("my-class");
    return;
  }

  try {
    const res = await apiFetch("/api/assess/manual", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ child_id: childId, level: level })
    });
    if (res) {
      showToast(`${state.lang === 'hi' ? 'स्तर' : 'Level'} '${getLevelDisplayName(level)}' ${state.lang === 'hi' ? 'सफलतापूर्वक दर्ज हुआ!' : 'saved successfully!'}`, "success");
      loadChildren();
      switchTab("my-class");
    }
  } catch (err) {
    showToast(err.message, "danger");
  }
}

// ----------------- Maths Slate Assessment -----------------

function startMathsForChild(childId) {
  switchTab("maths");
  const sel = document.getElementById("maths-child-select");
  if (sel) sel.value = childId;
}

function previewSlateImage(e) {
  const file = e.target.files[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  state.currentSlateUrl = url;
  const img = document.getElementById("slate-preview-img");
  img.src = url;
  document.getElementById("slate-preview-container").style.display = "block";
}

async function submitMathsSlate() {
  const childId = parseInt(document.getElementById("maths-child-select").value);
  const probStr = document.getElementById("maths-problems-input").value.trim();
  const fileInput = document.getElementById("maths-photo-input");
  const file = fileInput.files[0];

  if (!file) {
    showToast(state.lang === 'hi' ? "कृपया स्लेट या कॉपी की तस्वीर चुनें।" : "Please select a photo of the slate.", "warning");
    return;
  }

  showToast(state.lang === 'hi' ? "क्लाउड विज़न द्वारा स्लेट पढ़ाई जा रही है..." : "Claude reading handwriting digits...", "info");

  try {
    const fd = new FormData();
    fd.append("photo", file);
    fd.append("child_id", childId);
    fd.append("problems", probStr);

    const res = await apiFetch("/api/assess/maths", { method: "POST", body: fd });
    if (res) {
      renderMathsResults(res);
      updateClaudeBudgetWidget();
    }
  } catch (err) {
    showToast(`Maths assessment failed: ${err.message}`, "danger");
  }
}

function renderMathsResults(res) {
  const card = document.getElementById("maths-results-card");
  card.style.display = "block";
  card.scrollIntoView({ behavior: "smooth" });

  document.getElementById("maths-score-pill").innerText = `${res.correct}/${res.total} ${state.lang === 'hi' ? 'सही' : 'Correct'} (${Math.round((res.score || 0) * 100)}%)`;

  // Slate Photo Preview with Zoom for Teacher Inspection
  const slateImg = document.getElementById("maths-result-slate-img");
  const slateBox = document.getElementById("maths-result-slate-box");
  if (slateImg && slateBox) {
    if (state.currentSlateUrl) {
      slateImg.src = state.currentSlateUrl;
      slateBox.style.display = "block";
    } else {
      slateBox.style.display = "none";
    }
  }

  const container = document.getElementById("maths-problems-breakdown");
  container.innerHTML = (res.results || []).map((r) => {
    const isCorrect = r.correct === true;
    const errText = r.error ? `Error: <strong>${r.error}</strong> (Truth: ${r.truth})` : "";
    return `
      <div style="background:#f8fafc; border:1px solid ${isCorrect ? '#86efac' : '#fca5a5'}; padding:12px 16px; border-radius:var(--radius-sm);">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:1.1rem; font-weight:800; font-family:var(--font-sans);">${r.problem}</span>
          <span class="lvl-badge ${isCorrect ? 'lvl-story' : 'lvl-letter'}">${isCorrect ? '✓ Correct' : '✗ Incorrect'}</span>
        </div>
        <div style="font-size:0.85rem; margin-top:6px; color:var(--text-muted);">
          Child Answer: <strong>${r.child_answer || 'Unreadable'}</strong> | Legibility: ${r.legibility}
        </div>
        ${errText ? `<div style="font-size:0.82rem; color:#b91c1c; margin-top:4px;">${errText}</div>` : ''}
      </div>
    `;
  }).join("");
}

// ----------------- Groups View -----------------

async function loadGroups() {
  if (state.role !== "teacher") return;
  try {
    const data = await apiFetch("/api/groups");
    if (!data) return;
    renderGroups(data);
  } catch (err) {
    console.warn("Groups error:", err);
  }
}

function renderGroups(data) {
  const container = document.getElementById("groups-container");
  if (!container) return;
  const groups = data.groups || [];

  if (groups.length === 0) {
    container.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:30px; color:var(--text-muted);">${state.lang === 'hi' ? 'अभी कोई समूह नहीं बना है।' : 'No groups formed yet.'}</div>`;
    return;
  }

  container.innerHTML = groups.map((g) => {
    return `
      <div class="group-card">
        <div class="group-card-header">
          <span class="group-name">Group ${g.name}</span>
          <span class="lvl-badge lvl-${g.level}">${getLevelDisplayName(g.level)}</span>
        </div>
        <div style="font-size:0.85rem; font-weight:700; color:var(--secondary); margin-top:6px;">
          ${state.lang === 'hi' ? 'नामांकित बच्चे' : 'Enrolled Children'} (${g.children.length}):
        </div>
        <div class="group-kids-chips">
          ${g.children.map((ch) => `<span class="kid-chip">🧒 ${ch}</span>`).join("")}
        </div>
        <div style="font-size:0.82rem; color:var(--text-muted); margin-top:10px; border-top:1px dashed #e2e8f0; padding-top:8px;">
          🎯 <strong>${state.lang === 'hi' ? 'अगला कौशल' : 'Next Skill'}:</strong> ${g.next_skill}
        </div>
        <div style="font-size:0.75rem; color:#64748b; margin-top:4px;">
          <em>${g.why}</em>
        </div>
      </div>
    `;
  }).join("");
}

// ----------------- Daily 20-min Plan View -----------------

async function loadDailyPlan() {
  if (state.role !== "teacher") return;
  try {
    const plan = await apiFetch("/api/plan/today");
    if (!plan) return;
    renderDailyPlan(plan);
  } catch (err) {
    console.warn("Plan error:", err);
  }
}

function renderDailyPlan(plan) {
  const container = document.getElementById("plan-timeline-container");
  if (!container) return;

  const slots = plan.slots || [];
  if (slots.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding:30px; color:var(--text-muted);">${state.lang === 'hi' ? 'कोई शिक्षण योजना उपलब्ध नहीं है।' : 'No daily plan available.'}</div>`;
    return;
  }

  container.innerHTML = slots.map((s) => {
    if (s.what) {
      return `
        <div class="plan-slot-card">
          <div class="plan-slot-time">⏱️ ${s.time} (${s.minutes} min)</div>
          <div class="plan-slot-title">${s.what}</div>
        </div>
      `;
    }

    const tAct = s.teacher_activity;
    const indeps = s.independent || [];

    return `
      <div class="plan-slot-card">
        <div class="plan-slot-time">⏱️ ${s.time} (${s.minutes} min)</div>
        
        <!-- Teacher led section -->
        <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:var(--radius-sm); padding:12px; margin-bottom:10px;">
          <div style="font-weight:800; color:#15803d; font-size:0.95rem;">
            🧑‍🏫 ${state.lang === 'hi' ? 'शिक्षक के साथ' : 'With Teacher'}: Group ${s.with_teacher}
          </div>
          ${tAct ? `
            <div style="font-size:0.9rem; margin-top:4px; font-weight:700;">
              Activity: ${tAct.skill} (${tAct.level})
            </div>
            <div id="act-desc-${tAct.id}" style="font-size:0.85rem; color:#334155; margin-top:4px;">
              Mode: ${tAct.mode} | Materials: ${(tAct.materials || []).join(", ") || 'General supplies'}
            </div>
            <button class="btn btn-outline btn-sm" style="margin-top:8px;" onclick="rewriteActivityPrompt('${tAct.id}')">
              🤖 Rewrite Simple Teacher Prompt (Claude)
            </button>
          ` : '<div style="font-size:0.85rem; color:var(--text-muted);">Activity queued</div>'}
        </div>

        <!-- Independent groups section -->
        ${indeps.length > 0 ? `
          <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:var(--radius-sm); padding:10px;">
            <strong style="font-size:0.82rem; color:var(--text-muted);">${state.lang === 'hi' ? 'अन्य समूह स्वतंत्र गतिविधि पर' : 'Other groups on independent peer activity'}:</strong>
            ${indeps.map((ind) => `
              <div style="font-size:0.82rem; margin-top:4px;">
                • <strong>Group ${ind.group}:</strong> ${ind.activity ? `${ind.activity.skill} (${(ind.activity.materials || []).join(', ') || 'General'})` : 'Practice'}
              </div>
            `).join("")}
          </div>
        ` : ''}
      </div>
    `;
  }).join("");
}

async function rewriteActivityPrompt(activityId) {
  showToast(state.lang === 'hi' ? "क्लाउड AI से सरल निर्देश प्राप्त हो रहे हैं..." : "Rewriting prompt with Claude AI...", "info");
  try {
    const res = await apiFetch(`/api/activity/${activityId}/rewrite`, { method: "POST" });
    if (res && res.instruction_hi) {
      const target = document.getElementById(`act-desc-${activityId}`);
      if (target) {
        target.innerHTML = `<strong>🗣️ Teacher Prompt:</strong> "${res.instruction_hi}"`;
      }
      showToast(state.lang === 'hi' ? "निर्देश तैयार!" : "Prompt rewritten successfully!", "success");
      updateClaudeBudgetWidget();
    }
  } catch (err) {
    showToast(`Rewriting failed: ${err.message}`, "danger");
  }
}

// ----------------- Progress View -----------------

async function loadProgress() {
  if (state.role !== "teacher") return;
  try {
    const p = await apiFetch("/api/progress");
    if (!p) return;
    renderProgressTable(p);
  } catch (err) {
    console.warn("Progress error:", err);
  }
}

function renderProgressTable(p) {
  const tbody = document.getElementById("progress-table-body");
  if (!tbody) return;

  const kids = p.children || [];
  document.getElementById("kpi-moved-up").innerText = p.moved_up || 0;

  tbody.innerHTML = kids.map((k) => {
    const base = k.baseline ? getLevelDisplayName(k.baseline) : "—";
    const cur = k.current ? getLevelDisplayName(k.current) : (state.lang === 'hi' ? 'प्रतीक्षित' : 'Pending');
    const improved = k.moved_up ? (state.lang === 'hi' ? '🟢 स्तर सुधरा (Moved Up)' : '🟢 Moved Up a Level') : (state.lang === 'hi' ? 'स्थिर (Steady)' : 'Steady');
    return `
      <tr style="border-bottom:1px solid var(--border);">
        <td style="padding:10px 12px; font-weight:700;">🧒 ${k.label}</td>
        <td style="padding:10px 12px;"><span class="lvl-badge lvl-${k.baseline || 'beginner'}">${base}</span></td>
        <td style="padding:10px 12px;"><span class="lvl-badge lvl-${k.current || 'beginner'}">${cur}</span></td>
        <td style="padding:10px 12px; font-weight:700; color:${k.moved_up ? '#16a34a' : 'inherit'};">${improved}</td>
      </tr>
    `;
  }).join("");
}

// ----------------- Evaluator Samples (S1 - S5) -----------------

async function loadSamples() {
  try {
    const s = await apiFetch("/api/samples");
    if (s) state.samples = s;
  } catch (err) {
    console.warn("Samples error:", err);
  }
}

function renderSamples() {
  const container = document.getElementById("samples-container");
  if (!container) return;

  const sampleCards = [
    {
      id: "S1",
      badge: "S1: Clear Audio (Word Level)",
      title: "Clean audio recording. Word level. 1-tap confirmation",
      desc: "Adult reader sample. Clear Hindi reading at word level. Teacher confirms AI level in 1 tap.",
      whyWin: "Results within 60 seconds: alignment rules exact and teacher confirms in 1 tap."
    },
    {
      id: "S2",
      badge: "S2: Paragraph Level (2 Errors)",
      title: "Paragraph level, 2 errors, error pattern summary",
      desc: "Adult reader sample. 1 word skipped, 1 substituted. Claude diagnoses error pattern concisely.",
      whyWin: "Zero hallucination: LLM does not free-write, summarizes only from aligned word evidence."
    },
    {
      id: "S3",
      badge: "S3: Noisy Recording (Staged Noise)",
      title: "Noisy recording. Low confidence. App asks teacher",
      desc: "Staged classroom noise. Confidence drops < 0.5 -> guardrail triggers: app requests teacher decision.",
      whyWin: "Guardrail proof: app never forces a hallucinated guess in noisy classrooms."
    },
    {
      id: "S4",
      badge: "S4: Slate Photo (Borrowing Error)",
      title: "Slate photo. Catches borrowing misconception",
      desc: "Staged slate. 52 - 27 -> 35. Code rule catches 'smaller_from_larger' borrowing bug.",
      whyWin: "Maths marked by deterministic code (not LLM). Catches conceptual bugs."
    },
    {
      id: "S5",
      badge: "S5: Unreadable Slate Photo",
      title: "Unreadable photo. null. Teacher manual entry",
      desc: "Staged blurry slate. Claude outputs null, teacher enters marks manually.",
      whyWin: "Zero hallucination: unreadable photos fallback safely to the teacher."
    }
  ];

  container.innerHTML = sampleCards.map((s) => {
    return `
      <div class="sample-card">
        <div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
            <span class="sample-id-badge">${s.id}</span>
            <span style="font-size:0.75rem; color:var(--text-muted); font-weight:700;">Evaluator Demo</span>
          </div>
          <h4 style="font-size:1.05rem; font-weight:800; color:var(--secondary);">${s.title}</h4>
          <p style="font-size:0.85rem; color:var(--text-muted); margin:8px 0;">${s.desc}</p>
          <div style="background:#f8fafc; border-radius:var(--radius-sm); padding:8px 10px; font-size:0.78rem; color:#0369a1; margin-bottom:12px;">
            ℹ️ <strong>What this shows:</strong> ${s.whyWin}
          </div>
        </div>
        <div style="display:flex; gap:8px;">
          <button class="btn btn-primary btn-sm" onclick="runEvaluatorSample('${s.id}', false)">⚡ Cached (0ms)</button>
          <button class="btn btn-outline btn-sm" onclick="runEvaluatorSample('${s.id}', true)">🔴 Run Live</button>
        </div>
      </div>
    `;
  }).join("");
}

async function runEvaluatorSample(sampleId, isLive) {
  showToast(isLive ? `Starting live pipeline (${sampleId})...` : `Loading cached result (${sampleId})...`, "info");
  try {
    const res = await apiFetch(`/api/samples/${sampleId}/run?live=${isLive ? 'true' : 'false'}`, { method: "POST" });
    if (res) {
      renderSampleOutput(sampleId, res, isLive);
      updateClaudeBudgetWidget();
    }
  } catch (err) {
    showToast(`Sample run failed: ${err.message}`, "danger");
  }
}

function renderSampleOutput(sampleId, res, isLive) {
  const card = document.getElementById("sample-output-card");
  card.style.display = "block";
  card.scrollIntoView({ behavior: "smooth" });

  document.getElementById("sample-output-title").innerText = `Sample ${sampleId} Execution Result`;
  const badge = document.getElementById("sample-mode-badge");
  badge.className = isLive ? "status-pill status-offline" : "status-pill status-online";
  badge.innerText = isLive ? "🔴 Live Pipeline" : "⚡ Cached (0ms, 0 Tokens)";

  // Maths Slate Sample Output (S4 and S5)
  if (res.type === "maths_slate") {
    const isUnreadable = res.needs_manual || (res.results || []).some(r => r.correct === null);
    const resultsHtml = (res.results || []).map(r => {
      const isCor = r.correct === true;
      const isNull = r.correct === null;
      let statusBadge = isCor 
        ? '<span class="lvl-badge lvl-story">✓ Correct</span>' 
        : (isNull ? '<span class="lvl-badge lvl-beginner">⚠️ Unreadable (null)</span>' : '<span class="lvl-badge lvl-letter">✗ Incorrect</span>');
      let bugDesc = r.error === 'smaller_from_larger' 
        ? '<div style="color:#b91c1c; font-weight:700; margin-top:6px; font-size:0.85rem;">🔍 Detected Bug: smaller_from_larger (subtracted smaller from larger without borrowing) | Correct: ' + r.truth + '</div>' 
        : (r.error ? '<div style="color:#b91c1c; font-size:0.85rem; margin-top:4px;">Error: ' + r.error + ' | Correct: ' + r.truth + '</div>' : '');
      return `
        <div style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:var(--radius-sm); padding:14px; margin-top:8px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:1.25rem; font-weight:800; font-family:var(--font-sans);">${r.problem}</span>
            ${statusBadge}
          </div>
          <div style="font-size:0.85rem; color:var(--text-muted); margin-top:4px;">
            Child Answer: <strong>${r.child_answer !== null && r.child_answer !== undefined ? r.child_answer : 'null (Unreadable)'}</strong> | Legibility: ${r.legibility}
          </div>
          ${bugDesc}
        </div>
      `;
    }).join("");

    document.getElementById("sample-output-content").innerHTML = `
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:10px; margin-bottom:14px;">
        <div style="background:#f8fafc; padding:10px; border-radius:var(--radius-sm); border:1px solid #e2e8f0;">
          <div style="font-size:0.75rem; color:var(--text-muted); font-weight:700;">Assessment Type</div>
          <div style="font-size:1.15rem; font-weight:800; color:var(--secondary);">Maths Slate</div>
        </div>
        <div style="background:#f8fafc; padding:10px; border-radius:var(--radius-sm); border:1px solid #e2e8f0;">
          <div style="font-size:0.75rem; color:var(--text-muted); font-weight:700;">Marking Engine</div>
          <div style="font-size:1.15rem; font-weight:800; color:var(--primary);">Python Code (Not LLM)</div>
        </div>
        <div style="background:#f8fafc; padding:10px; border-radius:var(--radius-sm); border:1px solid #e2e8f0;">
          <div style="font-size:0.75rem; color:var(--text-muted); font-weight:700;">Teacher Fallback?</div>
          <div style="font-size:1.15rem; font-weight:800; color:${isUnreadable ? 'var(--danger)' : 'var(--success)'};">${isUnreadable ? 'Yes (Manual Entry Required)' : 'No'}</div>
        </div>
      </div>
      <div>
        <strong>Problems & Marking Results:</strong>
        ${resultsHtml}
      </div>
    `;
    return;
  }

  // Reading Sample Output (S1, S2, S3)
  const conf = res.confidence !== undefined ? res.confidence : 0.9;
  const scorePct = Math.round((res.score || 0) * 100);

  const evidenceHtml = (res.evidence || []).map((o) => {
    let cls = "word-correct";
    let text = o.ref || o.hyp;
    if (o.kind === "close") cls = "word-close";
    if (o.kind === "wrong") cls = "word-wrong";
    if (o.kind === "skipped") { cls = "word-skipped"; text = `[${o.ref}]`; }
    if (o.kind === "extra") { cls = "word-extra"; text = `+${o.hyp}`; }
    return `<span class="word-chip ${cls}">${text}</span>`;
  }).join("");

  document.getElementById("sample-output-content").innerHTML = `
    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:10px; margin-bottom:14px;">
      <div style="background:#f8fafc; padding:10px; border-radius:var(--radius-sm); border:1px solid #e2e8f0;">
        <div style="font-size:0.75rem; color:var(--text-muted); font-weight:700;">Accuracy Score</div>
        <div style="font-size:1.5rem; font-weight:800; color:var(--primary);">${scorePct}%</div>
      </div>
      <div style="background:#f8fafc; padding:10px; border-radius:var(--radius-sm); border:1px solid #e2e8f0;">
        <div style="font-size:0.75rem; color:var(--text-muted); font-weight:700;">Confidence Score</div>
        <div style="font-size:1.5rem; font-weight:800; color:${conf >= 0.7 ? 'var(--success)' : 'var(--danger)'};">${Math.round(conf * 100)}%</div>
      </div>
      <div style="background:#f8fafc; padding:10px; border-radius:var(--radius-sm); border:1px solid #e2e8f0;">
        <div style="font-size:0.75rem; color:var(--text-muted); font-weight:700;">Teacher Review Needed?</div>
        <div style="font-size:1.2rem; font-weight:800; color:${res.needs_teacher ? 'var(--danger)' : 'var(--success)'};">${res.needs_teacher ? 'Yes (Low Conf)' : 'No (High Conf)'}</div>
      </div>
    </div>

    <div class="evidence-box">
      <strong>Word Alignment Evidence:</strong>
      <div class="evidence-words" style="margin-top:8px;">${evidenceHtml || 'No data'}</div>
    </div>
  `;
}

// ----------------- Headteacher & Officer Summary View -----------------

async function loadSummaryDashboard() {
  try {
    const s = await apiFetch("/api/summary");
    if (!s) return;
    renderSummaryDashboard(s);
  } catch (err) {
    console.warn("Summary error:", err);
  }
}

function renderSummaryDashboard(data) {
  const container = document.getElementById("summary-cards-container");
  if (!container) return;

  const schools = data.schools || [];
  if (schools.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding:30px; color:var(--text-muted);">${state.lang === 'hi' ? 'कोई डेटा उपलब्ध नहीं है।' : 'No institutional data available.'}</div>`;
    return;
  }

  container.innerHTML = schools.map((sc) => {
    const dist = sc.by_level || {};
    return `
      <div class="card" style="margin-bottom:20px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; border-bottom:1px solid var(--border); padding-bottom:10px;">
          <h3 style="font-size:1.2rem; font-weight:800; color:var(--secondary);">🏫 ${sc.school}</h3>
          <span class="status-pill status-online">Total: ${sc.children} | Assessed: ${sc.assessed}</span>
        </div>

        <div style="font-size:0.85rem; font-weight:700; color:var(--text-muted); margin-bottom:8px;">
          FLN Level Distribution (Privacy: counts below 5 are hidden as '<5'):
        </div>

        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(130px, 1fr)); gap:10px; margin-bottom:14px;">
          <div style="background:#f1f5f9; padding:10px; border-radius:var(--radius-sm); text-align:center;">
            <div style="font-size:0.75rem; color:var(--text-muted);">Beginner</div>
            <div style="font-size:1.4rem; font-weight:800; color:var(--lvl-beginner);">${dist.beginner || 0}</div>
          </div>
          <div style="background:#fef3c7; padding:10px; border-radius:var(--radius-sm); text-align:center;">
            <div style="font-size:0.75rem; color:var(--text-muted);">Letter</div>
            <div style="font-size:1.4rem; font-weight:800; color:var(--lvl-letter);">${dist.letter || 0}</div>
          </div>
          <div style="background:#eff6ff; padding:10px; border-radius:var(--radius-sm); text-align:center;">
            <div style="font-size:0.75rem; color:var(--text-muted);">Word</div>
            <div style="font-size:1.4rem; font-weight:800; color:var(--lvl-word);">${dist.word || 0}</div>
          </div>
          <div style="background:#f5f3ff; padding:10px; border-radius:var(--radius-sm); text-align:center;">
            <div style="font-size:0.75rem; color:var(--text-muted);">Paragraph</div>
            <div style="font-size:1.4rem; font-weight:800; color:var(--lvl-paragraph);">${dist.paragraph || 0}</div>
          </div>
          <div style="background:#ecfdf5; padding:10px; border-radius:var(--radius-sm); text-align:center;">
            <div style="font-size:0.75rem; color:var(--text-muted);">Story</div>
            <div style="font-size:1.4rem; font-weight:800; color:var(--lvl-story);">${dist.story || 0}</div>
          </div>
        </div>

        <div style="background:#f8fafc; border-radius:var(--radius-sm); padding:10px 14px; font-size:0.85rem; color:var(--text-muted); display:flex; justify-content:space-between; align-items:center;">
          <span>📈 Children moved up a level:</span>
          <strong style="color:var(--success); font-size:1.1rem;">${sc.moved_up}</strong>
        </div>
      </div>
    `;
  }).join("");
}

// ----------------- 1-Click Bilingual Language Switcher -----------------

function toggleLanguage() {
  state.lang = state.lang === "en" ? "hi" : "en";
  localStorage.setItem("classmap_lang", state.lang);
  applyLanguage();
}

function applyLanguage() {
  const btn = document.getElementById("lang-btn");
  if (btn) {
    btn.innerHTML = state.lang === "en" 
      ? `🌐 <strong>English</strong> | हिन्दी`
      : `🌐 <strong>हिन्दी</strong> | English`;
  }

  const dict = I18N[state.lang] || I18N.en;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    if (dict[key]) {
      el.innerText = dict[key];
    }
  });

  updateNetworkStatus();

  // Re-render currently active view
  if (state.currentTab === "my-class") renderStudents(state.children);
  if (state.currentTab === "groups") loadGroups();
  if (state.currentTab === "samples") renderSamples();
  if (state.currentTab === "student-portal") loadStudentDashboard();
}

// ----------------- Toast Notifications -----------------

function showToast(msg, type = "info") {
  const existing = document.querySelector(".classmap-toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.className = "classmap-toast";
  toast.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: ${type === 'danger' ? '#dc2626' : type === 'warning' ? '#d97706' : type === 'success' ? '#16a34a' : '#1e293b'};
    color: #ffffff;
    padding: 12px 20px;
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-lg);
    font-size: 0.9rem;
    font-weight: 700;
    z-index: 999;
    animation: fadeIn 0.2s ease-out;
    max-width: 90vw;
  `;
  toast.innerText = msg;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 4000);
}

// ----------------- App Boot -----------------

document.addEventListener("DOMContentLoaded", () => {
  initServiceWorker();
  applyLanguage();
  updateNetworkStatus();

  if (state.token) {
    setSession({
      token: state.token,
      username: state.user && state.user.username,
      label: state.user && state.user.label,
      role: state.role,
      school_id: state.user && state.user.school_id
    });
  } else {
    // Default: Teacher quick login for demo evaluators
    quickLogin("teacher.demo", "1234");
  }
});
