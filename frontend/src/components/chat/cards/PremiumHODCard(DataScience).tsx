import React from 'react';
import PremiumHODCard from './PremiumHODCard';
import { useLanguage } from '../../../context/LanguageContext';

export default function PremiumHODCardDataScience() {
  const { language } = useLanguage();

  const data = {
    name: "Dr. Nagashree N",
    title: "Associate Professor & HOD (CSE - Data Science)",
    bio: {
      English: "Dr. Nagashree N is an academician with over 12 years of teaching, research and administrative experience. She has completed her PhD in Biomedical Image Processing and Deep Learning and is currently a Postdoctoral Fellow at the University of Radom, Poland.",
      Kannada: "ಡಾ. ನಾಗಶ್ರೀ ಎನ್ ಅವರು 12 ವರ್ಷಕ್ಕಿಂತ ಹೆಚ್ಚು ಬೋಧನೆ, ಸಂಶೋಧನೆ ಮತ್ತು ಆಡಳಿತ ಅನುಭವ ಹೊಂದಿರುವ ಅಕಾಡೆಮಿಷಿಯನ್. ಅವರು ಬಯೋಮೆಡಿಕಲ್ ಇಮೇಜ್ ಪ್ರೊಸೆಸಿಂಗ್ ಮತ್ತು ಡೀಪ್ ಲರ್ನಿಂಗ್ನಲ್ಲಿ ಪಿಎಚ್ಡಿ ಪಡೆದಿದ್ದು, ಪ್ರಸ್ತುತ ಪೋಲಂಡ್ನ ರಾಡೋಮ್ ವಿಶ್ವವಿದ್ಯಾಲಯದಲ್ಲಿ ಪೋಸ್ಟ್ ಡಾಕ್ಟರಲ್ ಫೆಲೋ ಆಗಿದ್ದಾರೆ.",
      Tamil: "டாக்டர் நாகஸ்ரீ என் அவர்கள் 12 ஆண்டுகளுக்கும் மேற்பட்ட கற்பித்தல், ஆராய்ச்சி மற்றும் நிர்வாக அனுபவம் கொண்டவர். உயிரி மருத்துவப் படச் செயலாக்கம் மற்றும் ஆழ்ந்த கற்றல் துறையில் முனைவர் பட்டம் பெற்றவர்.",
      Telugu: "డా. నాగశ్రీ ఎన్ గారు 12 సంవత్సరాలకు పైగా బోధన మరియు పరిశోధన అనుభవం కలిగినవారు. బయోమెడికల్ ఇమేజ్ ప్రాసెసింగ్ మరియు డీప్ లెర్నింగ్‌లో ఆమె పీహెచ్‌డీ పూర్తి చేశారు.",
      Malayalam: "ഡോ. നാഗശ്രീ എൻ 12 വർഷത്തിലേറെ അധ്യാപനവും ഗവേഷണവും നടത്തിയ വ്യക്തിയാണ്. ബയോമെഡിക്കൽ ഇമേജ് പ്രോസസിംഗിലും ഡീപ് ലേണിംഗിലും പിഎച്ച്ഡി നേടിയിട്ടുണ്ട്.",
      Hindi: "डॉ. नागಶ್ರೀ एन के पास 12 वर्षों से अधिक का शिक्षण और शोध अनुभव है। उन्होंने बायोमेडिकल इमेज प्रोसेसिंग और डीप लर्निंग में पीएचडी पूरी की है।"
    },
    portrait: "/assets/hod/hod_nagashree.jpg"
  };

  // Select localized bio with English fallback
  const selectedBio = data.bio[language] || data.bio.English;

  return (
    <PremiumHODCard
      name={data.name}
      title={data.title}
      bio={selectedBio}
      portrait={data.portrait}
    />
  );
}
