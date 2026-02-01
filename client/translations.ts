export type TranslationKey =
    | 'home'
    | 'chat'
    | 'call'
    | 'settings'
    | 'search'
    | 'notifications'
    | 'breaking_news'
    | 'latest_updates'
    | 'view_all'
    | 'profile'
    | 'logout'
    | 'language'
    | 'theme'
    | 'dark'
    | 'light'
    | 'somali'
    | 'english'
    | 'welcome_back'
    | 'business_dm'
    | 'romance_dm'
    | 'education_dm'
    | 'voice_call'
    | 'video_call'
    | 'start_conversation'
    | 'send_message'
    | 'recording'
    | 'connecting'
    | 'active'
    | 'back'
    | 'close'
    | 'copy'
    | 'copied'
    | 'admin_panel'
    | 'registered_users'
    | 'active_members'
    | 'total_earnings'
    | 'promo_codes'
    | 'app_status'
    | 'healthy'
    | 'latest_news'
    | 'community_overview'
    | 'subscription_requests'
    | 'approve'
    | 'reject'
    | 'pending'
    | 'approved'
    | 'rejected'
    | 'search_placeholder'
    | 'exit_panel'
    | 'appearance'
    | 'saved'
    | 'history_chat'
    | 'recent_calls'
    | 'version'
    | 'developed_by'
    | 'choose_language'
    | 'cancel'
    | 'security_management'
    | 'update_password'
    | 'administration'
    | 'open_admin'
    | 'support_legal'
    | 'privacy_policy'
    | 'terms_conditions'
    | 'premium'
    | 'help_support'
    | 'contact_support'
    | 'chat_whatsapp'
    | 'ai_hub_intelligence'
    | 'read_story'
    | 'no_notifications'
    | 'ai_hub'
    | 'ai_hub_desc'
    | 'business_ai_desc'
    | 'romance_ai_desc'
    | 'education_ai_desc'
    | 'team_dark_mind_desc'
    | 'voice_hub'
    | 'voice_hub_desc'
    | 'business_call_desc'
    | 'romance_call_desc'
    | 'education_call_desc'
    | 'about_app'
    | 'monetization'
    | 'monetization_desc'
    | 'monetization_how_to_earn';

export const translations: Record<'en' | 'so', Record<string, string>> = {
    en: {
        home: 'Home',
        chat: 'Chat',
        call: 'Call',
        settings: 'Settings',
        search: 'Search',
        notifications: 'Notifications',
        breaking_news: 'Breaking News',
        latest_updates: 'Latest Updates',
        view_all: 'View All',
        profile: 'Profile',
        logout: 'Logout',
        language: 'Language',
        theme: 'Theme',
        dark: 'Dark',
        light: 'Light',
        somali: 'Somali',
        english: 'English',
        welcome_back: 'Welcome Back',
        business_dm: 'Business DM',
        romance_dm: 'Romance DM',
        education_dm: 'Education DM',
        voice_call: 'Voice Call',
        video_call: 'Video Call',
        start_conversation: 'Start a conversation',
        send_message: 'Type a message...',
        recording: 'Recording...',
        connecting: 'Connecting...',
        active: 'Active',
        back: 'Back',
        close: 'Close',
        copy: 'Copy',
        copied: 'Copied!',
        admin_panel: 'Admin Panel',
        registered_users: 'Registered Users',
        active_members: 'Active Members',
        total_earnings: 'Total Earnings',
        promo_codes: 'Promo Codes',
        app_status: 'App Status',
        healthy: 'Healthy',
        latest_news: 'Latest News',
        community_overview: 'Community Overview',
        subscription_requests: 'Subscription Requests',
        approve: 'Approve',
        reject: 'Reject',
        pending: 'Pending',
        approved: 'Approved',
        rejected: 'Rejected',
        search_placeholder: 'Search by name, email or phone...',
        exit_panel: 'Exit Panel',
        appearance: 'Appearance',
        saved: 'Saved Items',
        history_chat: 'Chat History',
        recent_calls: 'Recent Calls',
        version: 'Version',
        developed_by: 'Developed by DeepMind Team',
        choose_language: 'Choose Language',
        cancel: 'Cancel',
        security_management: 'Security & Management',
        update_password: 'Update Password',
        administration: 'Administration',
        open_admin: 'Open Admin Dashboard',
        support_legal: 'Support & Legal',
        privacy_policy: 'Privacy Policy',
        terms_conditions: 'Terms & Conditions',
        premium: 'DeepMind Premium',
        help_support: 'Help & Support',
        contact_support: 'Contact Support',
        chat_whatsapp: 'Chat on WhatsApp',
        ai_hub_intelligence: 'AI Hub Intelligence',
        read_story: 'Read Story',
        no_notifications: 'No notifications available.',
        ai_hub: 'AI Hub',
        ai_hub_desc: 'Choose the specialty you need today',
        business_ai_desc: 'DeepMind: Strategies for future success. Build your business with a mind smarter than the competition.',
        romance_ai_desc: 'DeepMind: Meet your soulmate before you even meet. Deeper understanding than words.',
        education_ai_desc: 'DeepMind: Your personal teacher who never tires. World knowledge in one place.',
        team_dark_mind_desc: 'Latest news and official information from Team DeepMind.',
        voice_hub: 'Voice Hub',
        voice_hub_desc: 'Select who you want to talk to',
        business_call_desc: 'Talk with the DeepMind Business Expert for instant advice.',
        romance_call_desc: 'A kind voice that helps you speak and romance better.',
        education_call_desc: 'An AI teacher explaining subjects directly via voice.',
        about_app: 'About DeepMind',
        monetization: 'Monetization Hub',
        monetization_desc: 'Earn money with DeepMind',
        monetization_how_to_earn: 'How to Earn'
    },
    so: {
        home: 'Hoyga',
        chat: 'Sheeko',
        call: 'Wicitaan',
        settings: 'Settings',
        search: 'Raadi',
        notifications: 'Ogeysiisyo',
        breaking_news: 'Wararkii Ugu Dambeeyay',
        latest_updates: 'Wararkii Cusbaa',
        view_all: 'Eeg Dhammaan',
        profile: 'Profile',
        logout: 'Ka Bax',
        language: 'Luuqadda',
        theme: 'Muuqaalka',
        dark: 'Madow',
        light: 'Caddaan',
        somali: 'Soomaali',
        english: 'Ingiriis',
        welcome_back: 'Soo Dhawaaw',
        business_dm: 'Ganacsi DM',
        romance_dm: 'Shukaansi DM',
        education_dm: 'Waxbarasho DM',
        voice_call: 'Cod Labo-geesood ah',
        video_call: 'Muuqaal Wicitaan',
        start_conversation: 'Bilaw sheeko',
        send_message: 'Qor fariin...',
        recording: 'Duubaya...',
        connecting: 'Isku xiraaya...',
        active: 'Shaqaynaya',
        back: 'Dib u noqo',
        close: 'Xir',
        copy: 'Koobi',
        copied: 'Waa la koobiyeeyey!',
        admin_panel: 'Maamulka',
        registered_users: 'Isticmaalayaasha',
        active_members: 'Xubnaha Firfircoon',
        total_earnings: 'Lacagta Guud',
        promo_codes: 'Promo Codes',
        app_status: 'App-ka',
        healthy: 'Wuu fiicanyahay',
        latest_news: 'Wararkii u dambeeyay',
        community_overview: 'Guud ahaan Bulshada',
        subscription_requests: 'Codsiyada Lacagta',
        approve: 'Oggolow',
        reject: 'Diid',
        pending: 'Sugaya',
        approved: 'La oggolaaday',
        rejected: 'La diiday',
        search_placeholder: 'Raadi magac, email ama phone...',
        exit_panel: 'Ka Bax Maamulka',
        appearance: 'Muuqaalka',
        saved: 'Xogaha Kaydsan',
        history_chat: 'Wada-hadalladii Hore',
        recent_calls: 'Wicitaanadii dhacay',
        version: 'Nooca',
        developed_by: 'Waxaa dhisay Team DeepMind',
        choose_language: 'Dooro Luuqadda',
        cancel: 'Iska daa',
        security_management: 'Amniga & Maamulka',
        update_password: 'Beddel Password-ka',
        administration: 'Maamulka Sare',
        open_admin: 'Fur Dashboard-ka Maamulka',
        support_legal: 'Caawimo & Shuruuc',
        privacy_policy: 'Shuruucda Amniga',
        terms_conditions: 'Shuruudaha Isticmaalka',
        premium: 'DeepMind Premium',
        help_support: 'Caawimo & Support',
        contact_support: 'Nala soo xiriir',
        chat_whatsapp: 'WhatsApp nagala soo xiriir',
        ai_hub_intelligence: 'Xogta Caqliga AI',
        read_story: 'Akhri Qisada',
        no_notifications: 'Ma jiro wax fariin ah.',
        ai_hub: 'AI Hub',
        ai_hub_desc: 'Dooro takhasuska aad maanta u baahan tahay',
        business_ai_desc: 'DeepMind: Xeeladaha guusha ee mustaqbalka. Ganacsigaaga ku dhis maskax ka xariifsan tartanka.',
        romance_ai_desc: 'DeepMind: Baro qofka qalbigaaga dega, ka hor intaadan la kulmin. Isfaham ka qoto dheer hadalka.',
        education_ai_desc: 'DeepMind: Macalinkaaga gaarka ah ee aan waligii daalin. Aqoonta adduunka, hal meel ku baro.',
        team_dark_mind_desc: 'Wararkii ugu dambeeyey iyo macluumaadka rasmiga ah ee Team DeepMind.',
        voice_hub: 'Voice Hub',
        voice_hub_desc: 'Cidda aad rabto inaad la hadasho dooro',
        business_call_desc: 'Hadda cod ahaan kula hadal Khabiirka Ganacsiga ee DeepMind si aad u hesho talooyin degdeg ah.',
        romance_call_desc: 'Cod naxariis leh oo kugu caawinaya inaad si fiican u shukaansato ood u hadasho.',
        education_call_desc: 'Macalin AI ah oo maaddooyinka si toos ah cod ahaan kuugu sharaxaya.',
        about_app: 'Ku saabsan DeepMind',
        monetization: 'Monetization Hub',
        monetization_desc: 'Lacag ka samee DeepMind',
        monetization_how_to_earn: 'Sida Lacagta loo Sameeyo'
    }
};
