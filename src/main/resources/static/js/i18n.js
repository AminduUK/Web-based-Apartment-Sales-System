/**
 * Nook & Key - Internationalization (i18n) Engine
 * Supported Languages: English (en), Sinhala (si - සිංහල), Tamil (ta - தமிழ்)
 */

const i18nTranslations = {
  en: {
    // Topbar & Navigation
    nav_home: "Home",
    nav_properties: "Properties",
    nav_about: "About",
    nav_signin: "Sign in",
    nav_signup: "Create account",
    nav_signout: "Sign out",
    nav_back: "Back to website",
    nav_language: "Language",
    
    // Buyer Sidebar
    buyer_nav_browse: "Browse homes",
    buyer_nav_saved: "Saved homes",
    buyer_nav_viewings: "My viewings",
    buyer_nav_applications: "Applications",
    buyer_role: "Apartment buyer",

    // Buyer Welcome Card
    welcome_eyebrow: "Your next address",
    welcome_title: "Find a space that feels<br /><em>like home.</em>",
    welcome_desc: "Explore verified apartments, save your favorites, and book viewings with confidence.",
    welcome_btn: "Explore homes →",

    // Stats
    stat_saved_title: "Saved homes",
    stat_saved_sub: "Shortlisted properties",
    stat_viewings_title: "Confirmed viewings",
    stat_viewings_sub: "Scheduled visits",
    stat_locations_title: "Prime locations",
    stat_locations_sub: "Colombo & suburban hubs",
    stat_booking_title: "Direct booking",
    stat_booking_sub: "Instant agent coordination",

    // Search & Filter
    search_placeholder: "Search city, street, or apartment name...",
    search_btn: "Search",
    search_reset: "Reset Search",
    search_all_homes: "All homes",
    search_ready: "Ready to move",
    search_new: "New release",
    search_error_empty: "Please enter a search keyword (e.g., Colombo, 3 Bed, Penthouse) before searching.",
    search_no_results: "No properties found",
    search_no_results_sub: "We couldn't find any apartments matching your query.",

    // Section Titles
    section_featured_eyebrow: "Curated residences",
    section_featured_title: "Featured apartments",
    section_featured_sub: "Explore verified listings curated for quality living.",
    section_saved_title: "Saved residences",
    section_saved_sub: "Properties in your shortlist",
    section_viewings_title: "My Scheduled Viewings",
    section_viewings_sub: "Track and manage your upcoming property visits",

    // Property Card
    card_book_viewing: "Book Viewing",
    card_view_details: "View Details",
    card_verified_agent: "✓ Verified Agent",
    card_verified_seller: "✓ Verified Seller",
    card_unverified: "⚡ Unverified",
    card_listed_by: "Listed by:",
    card_price_request: "Price on request",
    card_tag_ready: "Move-in ready",
    card_tag_new: "New release",
    card_tag_garden: "Garden living",
    badge_verified_seller_listing: "✓ Verified Seller Listing",
    badge_verified_agent_listing: "✓ Verified Agent Listing",
    save_residence_btn: "Save Residence",
    saved_residence_btn: "Saved to Shortlist",
    agent_role_seller: "Direct Property Owner · Verified Titleholder",
    agent_role_agent: "Licensed Real Estate Specialist · Nook & Key Partner",
    no_amenities_listed: "No specific amenities listed for this apartment yet.",

    // Booking Modal
    modal_booking_title: "Schedule Viewing",
    modal_booking_sub: "Select your preferred date, time slot, and agent to coordinate your private tour.",
    modal_date_label: "Preferred Date",
    modal_time_label: "Preferred Time Slot",
    modal_agent_label: "Assigned Agent / Host",
    modal_notes_label: "Notes for Host (optional)",
    modal_notes_placeholder: "Any special requirements or questions...",
    modal_btn_confirm: "Confirm Booking",
    modal_btn_cancel: "Cancel",
    modal_booking_success: "Booking request submitted successfully! A notification was sent to the agent and booking manager.",
    modal_booking_slot_err: "Please select an available time slot.",
    modal_booking_date_err: "Please choose a valid viewing date.",
    booking_advance_title: "Viewing Advance Deposit",
    booking_advance_desc: "Guarantees private tour with agent/owner",
    booking_notice_title: "Important Notice on Cancellations & Refunds",
    booking_notice_text: "Once this viewing is accepted and confirmed by the Booking Manager, if you decide to cancel, only a 50% partial refund (LKR 2,500) will be refunded to you by the Booking Manager. The remaining 50% covers scheduling, reservation, and agent coordination.",
    payment_method_label: "Select Payment Method:",
    card_payment: "Credit / Debit Card",
    cash_payment: "Cash / Bank Transfer",
    card_num_label: "Card Number",
    expiry_label: "Expiry Date",
    cvc_label: "CVC / CVV",
    modal_btn_pay_confirm: "Pay LKR 5,000 & Confirm Booking →",

    // Profile Modal
    modal_profile_title: "My Buyer Profile",
    modal_first_name: "First Name",
    modal_last_name: "Last Name",
    modal_email: "Email Address",
    modal_phone: "Phone Number",
    modal_btn_save: "Save Changes",
    modal_btn_close: "Close",
    modal_profile_saved: "Profile updated successfully!",

    // Homepage
    home_eyebrow: "A better way home",
    home_title: "Find the place that feels like <em>you.</em>",
    home_subtitle: "Discover verified apartments, connect with trusted sellers and agents, and manage your next move in one simple place.",
    home_explore_btn: "Explore apartments",
    home_get_started: "Get started →",
    home_verified_badge: "✓ Verified listings",
    home_card_p: "Featured collection",
    home_card_h2: "City living,<br /><em>softened.</em>",

    // Cinematic Showcase
    cinematic_eyebrow: "Living Architectural Showcase",
    cinematic_title: "Residences shaped by the <em>landscape.</em>",
    cinematic_sub: "Move your cursor to orbit perspectives, explore ambient lighting, and discover luxury cantilevered living spaces.",
    cinematic_pill1: "01 · Sunset & Infinity Light",
    cinematic_pill2: "02 · Twilight & Pool Reflections",
    cinematic_pill3: "03 · Architectural Blueprint",
    cinematic_sound_on: "Sound On",
    cinematic_sound_off: "Sound Muted",
    cinematic_btn_pause: "Pause Motion",
    cinematic_btn_play: "Play Motion",
    arch_feat_skyline: "Skyline Cantilevers & Glass",
    arch_feat_sub1: "Floor-to-Ceiling Thermal Glazing",
    arch_feat_infinity: "Reflecting Pool & Terraces",
    arch_feat_sub2: "Landscape Integrated Architecture",

    // Homepage Properties Search
    props_eyebrow: "Make a move",
    props_title: "Find your next address.",
    props_sub: "Search homes that match your lifestyle, budget, and plans.",
    props_input_placeholder: "City or neighborhood",
    props_any_type: "Any property type",
    props_apt: "Apartment",
    props_penthouse: "Penthouse",
    props_townhouse: "Townhouse",
    props_any_budget: "Any budget",
    props_b1: "Under LKR 25M",
    props_b2: "LKR 25M - 50M",
    props_b3: "Over LKR 50M",
    props_search_btn: "Search",

    // About Section
    about_eyebrow: "One place, every perspective",
    about_title: "Built for the whole<br /><em>apartment journey.</em>",
    about_sub: "Buyers, sellers, agents, verification officers, booking managers, and admins can work together through role-based Spring Boot services."
  },

  si: {
    // Topbar & Navigation
    nav_home: "මුල් පිටුව",
    nav_properties: "දේපළ",
    nav_about: "අප ගැන",
    nav_signin: "ඇතුල් වන්න",
    nav_signup: "ගිණුමක් සාදන්න",
    nav_signout: "ඉවත් වන්න",
    nav_back: "වෙබ් අඩවියට ආපසු",
    nav_language: "භාෂාව",

    // Buyer Sidebar
    buyer_nav_browse: "නිවාස පිරික්සන්න",
    buyer_nav_saved: "සුරකින ලද නිවාස",
    buyer_nav_viewings: "මගේ නැරඹුම්",
    buyer_nav_applications: "අයදුම්පත්",
    buyer_role: "මහල් නිවාස ගැනුම්කරු",

    // Buyer Welcome Card
    welcome_eyebrow: "ඔබේ මීළඟ ලිපිනය",
    welcome_title: "ඔබේම නිවසක් ලෙස දැනෙන<br /><em>සුන්දර ඉඩක් සොයාගන්න.</em>",
    welcome_desc: "තහවුරු කළ මහල් නිවාස ගවේෂණය කරන්න, කැමති දේ සුරකින්න, විශ්වාසයෙන් යුතුව නැරඹුම් වෙන්කරවා ගන්න.",
    welcome_btn: "නිවාස ගවේෂණය කරන්න →",

    // Stats
    stat_saved_title: "සුරකින ලද නිවාස",
    stat_saved_sub: "කැමති දේ ලැයිස්තුව",
    stat_viewings_title: "තහවුරු කළ නැරඹුම්",
    stat_viewings_sub: "නියමිත හමුවීම්",
    stat_locations_title: "ප්‍රධාන නගර",
    stat_locations_sub: "කොළඹ සහ තදාසන්න කලාප",
    stat_booking_title: "සෘජු වෙන්කරවා ගැනීම",
    stat_booking_sub: "ක්ෂණික නියෝජිත සම්බන්ධීකරණය",

    // Search & Filter
    search_placeholder: "නගරය, වීදිය හෝ මහල් නිවාස නම සොයන්න...",
    search_btn: "සොයන්න",
    search_reset: "යළි සකසන්න",
    search_all_homes: "සියලු නිවාස",
    search_ready: "පදිංචියට සූදානම්",
    search_new: "නව නිකුතුව",
    search_error_empty: "කරුණාකර සෙවීමට පෙර නගරයක් හෝ මහල් නිවාස නමක් ඇතුළත් කරන්න (උදා: Colombo, 3 Bed).",
    search_no_results: "නිවාස කිසිවක් හමු නොවීය",
    search_no_results_sub: "ඔබ සෙවූ වචනයට ගැළපෙන මහල් නිවාස සොයාගත නොහැකි විය.",

    // Section Titles
    section_featured_eyebrow: "තෝරාගත් නිවාස",
    section_featured_title: "විශේෂාංග මහල් නිවාස",
    section_featured_sub: "ගුණාත්මක ජීවන රටාවක් සඳහා තහවුරු කළ නිවාස එකතුවක්.",
    section_saved_title: "සුරකින ලද නිවාස",
    section_saved_sub: "ඔබේ ප්‍රියතම නිවාස ලැයිස්තුව",
    section_viewings_title: "මගේ නියමිත නැරඹුම්",
    section_viewings_sub: "ඔබේ ඉදිරි නිවාස නැරඹුම් කළමනාකරණය කරන්න",

    // Property Card
    card_book_viewing: "නැරඹුමක් වෙන්කරන්න",
    card_view_details: "විස්තර බලන්න",
    card_verified_agent: "✓ තහවුරු කළ නියෝජිත",
    card_verified_seller: "✓ තහවුරු කළ විකුණුම්කරු",
    card_unverified: "⚡ තහවුරු කර නොමැත",
    card_listed_by: "ලැයිස්තුගත කළේ:",
    card_price_request: "මිල විමසන්න",
    card_tag_ready: "පදිංචියට සූදානම්",
    card_tag_new: "නව නිකුතුව",
    card_tag_garden: "උයන් පරිසරය",
    badge_verified_seller_listing: "✓ තහවුරු කළ විකුණුම්කරු නිවාසය",
    badge_verified_agent_listing: "✓ තහවුරු කළ නියෝජිත නිවාසය",
    save_residence_btn: "සුරකින්න",
    saved_residence_btn: "සුරකින ලදී",
    agent_role_seller: "සෘජු දේපල හිමිකරු · තහවුරු කළ අයිතිකරු",
    agent_role_agent: "බලපත්‍රලාභී නිශ්චල දේපල නියෝජිත · Nook & Key හවුල්කරු",
    no_amenities_listed: "මෙම මහල් නිවාසය සඳහා විශේෂ පහසුකම් මෙතෙක් ලැයිස්තුගත කර නොමැත.",

    // Booking Modal
    modal_booking_title: "නැරඹුමක් වෙන්කරවා ගන්න",
    modal_booking_sub: "ඔබේ පහසු දිනය, වේලාව සහ නියෝජිතයා තෝරාගෙන නිවස නැරඹීම සඳහා වේලාවක් වෙන්කරගන්න.",
    modal_date_label: "කැමති දිනය",
    modal_time_label: "කැමති වේලාව",
    modal_agent_label: "පවරා ඇති නියෝජිතයා / හිමිකරු",
    modal_notes_label: "අමතර සටහන් (විකල්ප)",
    modal_notes_placeholder: "ඔබට අවශ්‍ය විශේෂ කරුණු හෝ ප්‍රශ්න...",
    modal_btn_confirm: "වෙන්කිරීම තහවුරු කරන්න",
    modal_btn_cancel: "අවලංගු කරන්න",
    modal_booking_success: "නැරඹුම් ඉල්ලීම සාර්ථකව යොමු කරන ලදී! නියෝජිතයාට සහ කළමනාකරුට පණිවිඩයක් යැවිණි.",
    modal_booking_slot_err: "කරුණාකර ලබාගත හැකි වේලාවක් තෝරන්න.",
    modal_booking_date_err: "කරුණාකර නිවැරදි දිනයක් තෝරන්න.",
    booking_advance_title: "නැරඹුම් අත්තිකාරම් තැන්පතුව",
    booking_advance_desc: "නියෝජිතයා/හිමිකරු සමඟ ඔබේ පෞද්ගලික වේලාව සුරක්ෂිත කරයි",
    booking_notice_title: "අවලංගු කිරීම් සහ මුදල් ආපසු ගෙවීම පිළිබඳ වැදගත් නිවේදනය",
    booking_notice_text: "මෙම වෙන්කිරීම බුකින්ග් මැනේජර් විසින් පිළිගෙන තහවුරු කළ පසු, ඔබ එය අවලංගු කළහොත් ආපසු ගෙවනු ලබන්නේ අත්තිකාරම් මුදලින් 50%ක් (රු. 2,500) පමණි. ඉතිරි 50% පරිපාලන සහ සම්බන්ධීකරණ වියදම් ලෙස අය කර ගැනේ.",
    payment_method_label: "ගෙවීම් ක්‍රමය තෝරන්න:",
    card_payment: "ක්‍රෙඩිට් / ඩෙබිට් කාඩ්පත",
    cash_payment: "මුදල් / බැංකු තැන්පතු",
    card_num_label: "කාඩ්පත් අංකය",
    expiry_label: "කල් ඉකුත්වීමේ දිනය",
    cvc_label: "CVC / CVV",
    modal_btn_pay_confirm: "රු. 5,000 ගෙවා වෙන්කිරීම තහවුරු කරන්න →",

    // Profile Modal
    modal_profile_title: "මගේ ගැනුම්කරු පැතිකඩ",
    modal_first_name: "මුල් නම",
    modal_last_name: "වාසගම",
    modal_email: "විද්‍යුත් තැපෑල",
    modal_phone: "දුරකථන අංකය",
    modal_btn_save: "වෙනස්කම් සුරකින්න",
    modal_btn_close: "වසන්න",
    modal_profile_saved: "පැතිකඩ සාර්ථකව යාවත්කාලීන විය!",

    // Homepage
    home_eyebrow: "නිවසකට වඩා හොඳ මගක්",
    home_title: "ඔබට වඩාත් ගැළපෙන <em>සොඳුරු නිවස සොයාගන්න.</em>",
    home_subtitle: "තහවුරු කළ මහල් නිවාස සොයාගන්න, විශ්වාසවන්ත විකුණුම්කරුවන් සහ නියෝජිතයන් සමග එකම තැනකින් සම්බන්ධ වන්න.",
    home_explore_btn: "මහල් නිවාස ගවේෂණය",
    home_get_started: "ආරම්භ කරන්න →",
    home_verified_badge: "✓ තහවුරු කළ ලැයිස්තුගත කිරීම්",
    home_card_p: "තෝරාගත් එකතුව",
    home_card_h2: "නගරබද ජීවිතය,<br /><em>සුවපහසුව සමග.</em>",

    // Cinematic Showcase
    cinematic_eyebrow: "සජීවී වාස්තු විද්‍යාත්මක අත්දැකීම",
    cinematic_title: "භූ දර්ශනයෙන් හැඩගැසුණු <em>සුඛෝපභෝගී නිවාස.</em>",
    cinematic_sub: "සුඛෝපභෝගී මහල් නිවාස සැලසුම්, සන්ධ්‍යා ආලෝකය සහ පිහිනුම් තටාක දසුන් ත්‍රිමාණව ගවේෂණය කරන්න.",
    cinematic_pill1: "01 · හිරු බැසයන රන්වන් ආලෝකය",
    cinematic_pill2: "02 · නිශා ආලෝකය සහ තටාක දසුන",
    cinematic_pill3: "03 · ත්‍රිමාණ සැලසුම් සටහන (Blueprint)",
    cinematic_sound_on: "ශබ්දය සක්‍රියයි",
    cinematic_sound_off: "ශබ්දය නිහඬයි",
    cinematic_btn_pause: "චලනය නවතන්න",
    cinematic_btn_play: "චලනය අරඹන්න",
    arch_feat_skyline: "අහස් තල බැල්කනි සහ වීදුරු නිමාව",
    arch_feat_sub1: "පරිදර්ශන තාප පරිවරණය කළ වීදුරු",
    arch_feat_infinity: "පිහිනුම් තටාකය සහ එළිමහන් බැල්කනිය",
    arch_feat_sub2: "ස්වභාව සෞන්දර්යය හා මුසු වූ නිර්මාණය",

    // Homepage Properties Search
    props_eyebrow: "පියවරක් ඉදිරියට",
    props_title: "ඔබේ මීළඟ ලිපිනය සොයාගන්න.",
    props_sub: "ඔබේ ජීවන රටාවට සහ අයවැයට වඩාත්ම ගැළපෙන නිවාස සොයන්න.",
    props_input_placeholder: "නගරය හෝ ප්‍රදේශය",
    props_any_type: "ඕනෑම දේපළ වර්ගයක්",
    props_apt: "මහල් නිවාස (Apartment)",
    props_penthouse: "පෙන්ට්හවුස් (Penthouse)",
    props_townhouse: "ටවුන්හවුස් (Townhouse)",
    props_any_budget: "ඕනෑම අයවැයක්",
    props_b1: "රු. මිලියන 25ට අඩු",
    props_b2: "රු. මිලියන 25 - 50",
    props_b3: "රු. මිලියන 50ට වැඩි",
    props_search_btn: "සොයන්න",

    // About Section
    about_eyebrow: "එක් තැනකින් සියලු සේවා",
    about_title: "සමස්ත නිවාස ගමන වෙනුවෙන්ම<br /><em>නිර්මාණය කරන ලද්දකි.</em>",
    about_sub: "ගැණුම්කරුවන්, විකුණුම්කරුවන්, නියෝජිතයන්, සත්‍යාපන නිලධාරීන් සහ කළමනාකරුවන් එකට එක්කරන Spring Boot පද්ධතියකි."
  },

  ta: {
    // Topbar & Navigation
    nav_home: "முகப்பு",
    nav_properties: "சொத்துக்கள்",
    nav_about: "எங்களைப் பற்றி",
    nav_signin: "உள்நுழைக",
    nav_signup: "கணக்கை உருவாக்குக",
    nav_signout: "வெளியேறு",
    nav_back: "வலைத்தளத்திற்கு திரும்பு",
    nav_language: "மொழி",

    // Buyer Sidebar
    buyer_nav_browse: "வீடுகளை உலாவுங்கள்",
    buyer_nav_saved: "சேமிக்கப்பட்ட வீடுகள்",
    buyer_nav_viewings: "எனது பார்வைகள்",
    buyer_nav_applications: "விண்ணப்பங்கள்",
    buyer_role: "அடுக்குமாடி வாங்குபவர்",

    // Buyer Welcome Card
    welcome_eyebrow: "உங்கள் அடுத்த முகவரி",
    welcome_title: "சொந்த வீடு போன்ற உணர்வைத் தரும்<br /><em>அழகிய இடத்தை கண்டறியுங்கள்.</em>",
    welcome_desc: "சரிபார்க்கப்பட்ட அடுக்குமாடி குடியிருப்புகளை ஆராயுங்கள், பிடித்ததை சேமியுங்கள், நம்பிக்கையுடன் முன்பதிவு செய்யுங்கள்.",
    welcome_btn: "வீடுகளை ஆராயுங்கள் →",

    // Stats
    stat_saved_title: "சேமிக்கப்பட்ட வீடுகள்",
    stat_saved_sub: "தேர்ந்தெடுக்கப்பட்டவை",
    stat_viewings_title: "உறுதிப்படுத்தப்பட்ட பார்வைகள்",
    stat_viewings_sub: "திட்டமிடப்பட்ட சந்திப்புகள்",
    stat_locations_title: "முக்கிய இடங்கள்",
    stat_locations_sub: "கொழும்பு மற்றும் புறநகர் பகுதிகள்",
    stat_booking_title: "நேரடி முன்பதிவு",
    stat_booking_sub: "உடனடி முகவர் ஒருங்கிணைப்பு",

    // Search & Filter
    search_placeholder: "நகரம், தெரு அல்லது அடுக்குமாடி பெயரைத் தேடுங்கள்...",
    search_btn: "தேடுங்கள்",
    search_reset: "மீட்டமை",
    search_all_homes: "அனைத்து வீடுகள்",
    search_ready: "குடியேற தயார்",
    search_new: "புதிய வெளியீடு",
    search_error_empty: "தேடுவதற்கு முன் ஒரு வார்த்தையை உள்ளிடவும் (எ.கா: கொழும்பு, 3 படுக்கையறை).",
    search_no_results: "வீடுகள் எதுவும் கிடைக்கவில்லை",
    search_no_results_sub: "உங்கள் தேடலுக்குப் பொருந்தக்கூடிய அடுக்குமாடி குடியிருப்புகள் எதுவும் இல்லை.",

    // Section Titles
    section_featured_eyebrow: "தேர்ந்தெடுக்கப்பட்ட இல்லங்கள்",
    section_featured_title: "சிறப்பு அடுக்குமாடிகள்",
    section_featured_sub: "தரமான வாழ்க்கைக்காக சரிபார்க்கப்பட்ட வீடுகளின் தொகுப்பு.",
    section_saved_title: "சேமிக்கப்பட்ட வீடுகள்",
    section_saved_sub: "உங்கள் விருப்பப் பட்டியல்",
    section_viewings_title: "எனது திட்டமிடப்பட்ட பார்வைகள்",
    section_viewings_sub: "வரவிருக்கும் பார்வை சந்திப்புகளைக் கண்காணியுங்கள்",

    // Property Card
    card_book_viewing: "பார்வையிட முன்பதிவு",
    card_view_details: "விவரங்கள்",
    card_verified_agent: "✓ சரிபார்க்கப்பட்ட முகவர்",
    card_verified_seller: "✓ சரிபார்க்கப்பட்ட விற்பனையாளர்",
    card_unverified: "⚡ சரிபார்க்கப்படவில்லை",
    card_listed_by: "பட்டியலிட்டவர்:",
    card_price_request: "விலை கோரிக்கையின் பேரில்",
    card_tag_ready: "குடியேற தயார்",
    card_tag_new: "புதிய வெளியீடு",
    card_tag_garden: "தோட்டச் சூழல்",
    badge_verified_seller_listing: "✓ சரிபார்க்கப்பட்ட விற்பனையாளர் வீடு",
    badge_verified_agent_listing: "✓ சரிபார்க்கப்பட்ட முகவர் வீடு",
    save_residence_btn: "சேமிக்கவும்",
    saved_residence_btn: "சேமிக்கப்பட்டது",
    agent_role_seller: "நேரடி சொத்து உரிமையாளர்",
    agent_role_agent: "அங்கீகரிக்கப்பட்ட ரியல் எஸ்டேட் முகவர் · Nook & Key பார்ட்னர்",
    no_amenities_listed: "இந்த அபார்ட்மெண்டிற்கு குறிப்பிட்ட வசதிகள் இன்னும் பட்டியலிடப்படவில்லை.",

    // Booking Modal
    modal_booking_title: "பார்வையிடலை திட்டமிடுங்கள்",
    modal_booking_sub: "உங்கள் விருப்பமான தேதி, நேரம் மற்றும் முகவரைத் தேர்ந்தெடுத்து பார்வையிடலை முன்பதிவு செய்யுங்கள்.",
    modal_date_label: "விருப்பமான தேதி",
    modal_time_label: "விருப்பமான நேர இடைவெளி",
    modal_agent_label: "ஒதுக்கப்பட்ட முகவர் / உரிமையாளர்",
    modal_notes_label: "கூடுதல் குறிப்புகள் (விருப்பத்தேர்வு)",
    modal_notes_placeholder: "ஏதேனும் சிறப்புத் தேவைகள் அல்லது கேள்விகள்...",
    modal_btn_confirm: "முன்பதிவை உறுதிப்படுத்து",
    modal_btn_cancel: "ரத்துசெய்",
    modal_booking_success: "முன்பதிவு வெற்றிகரமாகச் சமர்ப்பிக்கப்பட்டது! முகவர் மற்றும் மேலாளருக்கு அறிவிப்பு அனுப்பப்பட்டது.",
    modal_booking_slot_err: "கிடைக்கக்கூடிய நேர இடைவெளியைத் தேர்ந்தெடுக்கவும்.",
    modal_booking_date_err: "சரியான தேதியைத் தேர்ந்தெடுக்கவும்.",
    booking_advance_title: "பார்வையிடல் முன்பண வைப்பு",
    booking_advance_desc: "முகவர்/உரிமையாளருடன் பிரத்யேக நேரத்தை உறுதிப்படுத்துகிறது",
    booking_notice_title: "ரத்துசெய்தல் மற்றும் பணத்தைத் திரும்பப் பெறுதல் பற்றிய முக்கிய அறிவிப்பு",
    booking_notice_text: "இந்த முன்பதிவு புக்கிங் மேனேஜரால் ஏற்றுக்கொள்ளப்பட்டு உறுதிப்படுத்தப்பட்ட பிறகு, நீங்கள் அதை ரத்து செய்தால், முன்பணத்தில் 50% (ரூ. 2,500) மட்டுமே திரும்பப் பெறப்படும். மீதமுள்ள 50% முன்பதிவு ஒருங்கிணைப்புச் செலவாகப் பிடிக்கப்படும்.",
    payment_method_label: "கட்டண முறையைத் தேர்ந்தெடுக்கவும்:",
    card_payment: "கிரெடிட் / டெபிட் கார்டு",
    cash_payment: "ரொக்கம் / வங்கி பரிமாற்றம்",
    card_num_label: "அட்டை எண்",
    expiry_label: "காலாவதி தேதி",
    cvc_label: "CVC / CVV",
    modal_btn_pay_confirm: "ரூ. 5,000 செலுத்தி முன்பதிவை உறுதிப்படுத்துக →",

    // Profile Modal
    modal_profile_title: "எனது வாங்குபவர் சுயவிவரம்",
    modal_first_name: "முதல் பெயர்",
    modal_last_name: "கடைசி பெயர்",
    modal_email: "மின்னஞ்சல் முகவரி",
    modal_phone: "தொலைபேசி எண்",
    modal_btn_save: "மாற்றங்களைச் சேமி",
    modal_btn_close: "மூடு",
    modal_profile_saved: "சுயவிவரம் வெற்றிகரமாகப் புதுப்பிக்கப்பட்டது!",

    // Homepage
    home_eyebrow: "வீடு தேட சிறந்த வழி",
    home_title: "உங்களுக்கு ஏற்ற <em>அழகிய இல்லத்தைக் கண்டறியுங்கள்.</em>",
    home_subtitle: "சரிபார்க்கப்பட்ட அடுக்குமாடிகளை ஆராயுங்கள், நம்பகமான விற்பனையாளர்கள் மற்றும் முகவர்களுடன் ஒரே இடத்தில் இணையுங்கள்.",
    home_explore_btn: "அடுக்குமாடிகளை ஆராய்க",
    home_get_started: "தொடங்குங்கள் →",
    home_verified_badge: "✓ சரிபார்க்கப்பட்ட பட்டியல்",
    home_card_p: "சிறப்புத் தொகுப்பு",
    home_card_h2: "நகர வாழ்க்கை,<br /><em>மென்மையாக்கப்பட்டது.</em>",

    // Cinematic Showcase
    cinematic_eyebrow: "நேரடி கட்டிடக்கலை காட்சி",
    cinematic_title: "இயற்கை நிலப்பரப்பால் உருவான <em>சொகுசு இல்லங்கள்.</em>",
    cinematic_sub: "3D கோணங்கள், மாலை நேர விளக்குகள் மற்றும் நவீன அடுக்குமாடி அமைப்புகளை நேரடியாக ஆராயுங்கள்.",
    cinematic_pill1: "01 · அந்தி மாலை ஒளி & நீச்சல் குளம்",
    cinematic_pill2: "02 · இரவு நேர அழகிய பிரதிபலிப்பு",
    cinematic_pill3: "03 · கட்டிடக்கலை வரைபடம் (Blueprint)",
    cinematic_sound_on: "ஒலி இயக்கத்தில்",
    cinematic_sound_off: "ஒலி முடக்கப்பட்டது",
    cinematic_btn_pause: "இயக்கத்தை நிறுத்து",
    cinematic_btn_play: "இயக்கத்தை தொடங்கு",
    arch_feat_skyline: "உயரடுக்கு கண்ணாடி வடிவமைப்பு",
    arch_feat_sub1: "முழு அளவிலான நவீன கண்ணாடி",
    arch_feat_infinity: "பிரதிபலிக்கும் குளம் மற்றும் மொட்டை மாடி",
    arch_feat_sub2: "இயற்கையோடு இணைந்த நவீன கட்டிடக்கலை",

    // Homepage Properties Search
    props_eyebrow: "ஒரு படி முன்னேறுங்கள்",
    props_title: "உங்கள் அடுத்த முகவரியைக் கண்டறியுங்கள்.",
    props_sub: "உங்கள் வாழ்க்கை முறை மற்றும் வரவு செலவுக்கு ஏற்ற வீடுகளைத் தேடுங்கள்.",
    props_input_placeholder: "நகரம் அல்லது பகுதி",
    props_any_type: "எந்தவொரு சொத்து வகை",
    props_apt: "அடுக்குமாடி (Apartment)",
    props_penthouse: "பென்ட்ஹவுஸ் (Penthouse)",
    props_townhouse: "டவுன்ஹவுஸ் (Townhouse)",
    props_any_budget: "எந்த பட்ஜெட்டும்",
    props_b1: "ரூ. 25 மில்லியனுக்கு கீழ்",
    props_b2: "ரூ. 25 - 50 மில்லியன்",
    props_b3: "ரூ. 50 மில்லியனுக்கு மேல்",
    props_search_btn: "தேடுங்கள்",

    // About Section
    about_eyebrow: "ஒரே இடத்தில் அனைத்து சேவைகளும்",
    about_title: "முழு அடுக்குமாடி பயணத்திற்காகவும்<br /><em>உருவாக்கப்பட்டது.</em>",
    about_sub: "வாங்குபவர்கள், விற்பனையாளர்கள், முகவர்கள், சரிபார்ப்பு அதிகாரிகள் மற்றும் மேலாளர்களை இணைக்கும் Spring Boot தளம்."
  }
};

const LANG_CONFIG = {
  en: { label: "English", native: "English", flag: "🇬🇧" },
  si: { label: "Sinhala", native: "සිංහල", flag: "🇱🇰" },
  ta: { label: "Tamil", native: "தமிழ்", flag: "🇱🇰" }
};

class I18nManager {
  constructor() {
    this.currentLang = localStorage.getItem("app_language") || "en";
    if (!i18nTranslations[this.currentLang]) {
      this.currentLang = "en";
    }
  }

  t(key, fallback = "") {
    const dict = i18nTranslations[this.currentLang] || i18nTranslations.en;
    if (dict && dict[key] !== undefined) {
      return dict[key];
    }
    const defaultDict = i18nTranslations.en;
    if (defaultDict && defaultDict[key] !== undefined) {
      return defaultDict[key];
    }
    return fallback || key;
  }

  getLang() {
    return this.currentLang;
  }

  getLangInfo(lang = this.currentLang) {
    return LANG_CONFIG[lang] || LANG_CONFIG.en;
  }

  setLang(lang) {
    if (!i18nTranslations[lang]) return;
    this.currentLang = lang;
    localStorage.setItem("app_language", lang);
    document.documentElement.lang = lang;
    this.applyTranslations();
    this.updateDropdownUI();
    window.dispatchEvent(new CustomEvent("languageChanged", { detail: { lang } }));
  }

  applyTranslations() {
    const dict = i18nTranslations[this.currentLang] || i18nTranslations.en;

    // Apply text content or innerHTML
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (dict[key]) {
        if (dict[key].includes("<") && dict[key].includes(">")) {
          el.innerHTML = dict[key];
        } else {
          el.textContent = dict[key];
        }
      }
    });

    // Apply placeholders
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const key = el.getAttribute("data-i18n-placeholder");
      if (dict[key]) {
        el.placeholder = dict[key];
      }
    });

    // Apply titles
    document.querySelectorAll("[data-i18n-title]").forEach((el) => {
      const key = el.getAttribute("data-i18n-title");
      if (dict[key]) {
        el.title = dict[key];
      }
    });
  }

  updateDropdownUI() {
    const info = this.getLangInfo(this.currentLang);
    const flagEl = document.getElementById("currentLangFlag");
    const labelEl = document.getElementById("currentLangLabel");
    if (flagEl) flagEl.textContent = info.flag;
    if (labelEl) labelEl.textContent = info.native;

    document.querySelectorAll(".lang-item").forEach((btn) => {
      const itemLang = btn.getAttribute("data-lang");
      if (itemLang === this.currentLang) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });
  }

  init() {
    this.applyTranslations();
    this.updateDropdownUI();
    this.bindEvents();
  }

  bindEvents() {
    const langBtn = document.getElementById("langBtn");
    const langMenu = document.getElementById("langMenu");
    const langDropdown = document.getElementById("langDropdown");

    if (langBtn && langMenu) {
      langBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const isOpen = langMenu.classList.contains("open");
        if (isOpen) {
          langMenu.classList.remove("open");
          langBtn.setAttribute("aria-expanded", "false");
        } else {
          langMenu.classList.add("open");
          langBtn.setAttribute("aria-expanded", "true");
        }
      });

      document.addEventListener("click", (e) => {
        if (langDropdown && !langDropdown.contains(e.target)) {
          langMenu.classList.remove("open");
          langBtn.setAttribute("aria-expanded", "false");
        }
      });
    }

    document.querySelectorAll(".lang-item").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const selectedLang = btn.getAttribute("data-lang");
        this.setLang(selectedLang);
        if (langMenu) langMenu.classList.remove("open");
        if (langBtn) langBtn.setAttribute("aria-expanded", "false");
      });
    });
  }
}

// Global instance
window.i18n = new I18nManager();
window.t = (key, fallback) => window.i18n.t(key, fallback);

document.addEventListener("DOMContentLoaded", () => {
  window.i18n.init();
});
