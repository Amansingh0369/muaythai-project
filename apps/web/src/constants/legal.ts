const BRAND = "This Is Muay Thai";
const BRAND_EMAIL = "Info@thisismuaythai.fit";
const EFFECTIVE_DATE = "1 June 2025";

export const TERMS = {
  title: "Terms & Conditions",
  effectiveDate: EFFECTIVE_DATE,
  intro: `These Terms & Conditions govern your use of the ${BRAND} website and the purchase of training camp packages. By accessing our website or making a booking, you agree to these terms in full.`,
  sections: [
    {
      heading: "1. About Us",
      body: `${BRAND} organises authentic Muay Thai training camps in Thailand — including Phuket, Bangkok, Chiang Mai, Krabi, and Koh Samui. We act as the organiser and booking agent for all camps listed on this platform.`,
    },
    {
      heading: "2. Eligibility",
      body: `You must be at least 18 years of age to make a booking. Participants under 18 require written consent from a parent or guardian. By completing a booking you confirm that you are physically fit to participate in intensive physical training, or that you have obtained medical clearance to do so.`,
    },
    {
      heading: "3. Camp Packages",
      body: `We offer three structured packages: the Beginner Experience (7 days), the Intermediate Training Camp (14 days), and the Fighter Camp (3–4 weeks). Package details — including daily training schedules, inclusions, and expected outcomes — are described on the Camps & Locations page and may be updated from time to time. The description in force at the time of booking applies.`,
    },
    {
      heading: "4. Booking & Payment",
      body: `All bookings are processed through Razorpay, a PCI-DSS compliant payment gateway. Payments are accepted via credit/debit card, UPI, net banking, and supported wallets. Your booking is confirmed only upon successful payment and receipt of a confirmation email. ${BRAND} does not store card details on its servers.`,
    },
    {
      heading: "5. Pricing",
      body: `All prices are displayed in Indian Rupees (INR) and are inclusive of applicable taxes unless stated otherwise. Prices are subject to change without notice; however, the price confirmed at checkout is the price you will be charged.`,
    },
    {
      heading: "6. Health & Safety",
      body: `Muay Thai is a combat sport involving physical contact and conditioning exercises. Participants engage in all activities at their own risk. ${BRAND} and its partner gyms take reasonable precautions to ensure a safe training environment, but accept no liability for injuries arising from normal training activities. You are responsible for disclosing pre-existing medical conditions before camp commencement.`,
    },
    {
      heading: "7. Travel & Accommodation",
      body: `Unless explicitly stated in a package, airfare, travel insurance, and accommodation outside the camp are not included. You are responsible for arranging your own travel documents, including a valid passport and any required visas for Thailand.`,
    },
    {
      heading: "8. Intellectual Property",
      body: `All content on this website — including text, images, videos, and design — is the property of ${BRAND} or its licensors. You may not reproduce, distribute, or use any content without prior written permission.`,
    },
    {
      heading: "9. Limitation of Liability",
      body: `To the maximum extent permitted by law, ${BRAND} shall not be liable for any indirect, incidental, special, or consequential damages arising from your participation in any camp or use of this website. Our total liability shall not exceed the amount paid by you for the relevant booking.`,
    },
    {
      heading: "10. Governing Law",
      body: `These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in New Delhi, India.`,
    },
    {
      heading: "11. Changes to These Terms",
      body: `We reserve the right to update these Terms at any time. Changes take effect immediately upon publication on this page. Continued use of the website after changes constitutes acceptance.`,
    },
    {
      heading: "12. Contact",
      body: `For any questions about these Terms, write to us at ${BRAND_EMAIL}.`,
    },
  ],
};

export const PRIVACY = {
  title: "Privacy Policy",
  effectiveDate: EFFECTIVE_DATE,
  intro: `${BRAND} ("we", "us", "our") is committed to protecting your personal information. This Privacy Policy explains what data we collect, how we use it, and your rights in relation to it.`,
  sections: [
    {
      heading: "1. Data We Collect",
      body: `When you browse our website or make a booking, we may collect: (a) Identity data — your full name, date of birth, and emergency contact details; (b) Contact data — email address and phone number; (c) Payment data — transaction reference numbers processed via Razorpay (we do not store card numbers or CVVs); (d) Usage data — pages visited, referral sources, and device/browser information collected via cookies and analytics tools.`,
    },
    {
      heading: "2. How We Use Your Data",
      body: `We use your data to: process and confirm bookings; send pre-camp information and updates; communicate operational changes; improve our website and services; comply with legal obligations. We do not sell your personal data to third parties.`,
    },
    {
      heading: "3. Payment Processing",
      body: `Payments are handled entirely by Razorpay Software Private Limited. ${BRAND} does not receive or store sensitive payment credentials. Razorpay's own privacy policy governs how your payment data is processed. Please review it at razorpay.com/privacy.`,
    },
    {
      heading: "4. Cookies",
      body: `We use cookies to maintain session state and analyse website traffic. Essential cookies are required for the website to function. Analytics cookies help us understand how visitors use our site. You can disable non-essential cookies in your browser settings; however, some features may be affected.`,
    },
    {
      heading: "5. Data Sharing",
      body: `We share your personal data only with: (a) partner gyms in Thailand to facilitate your camp placement; (b) Razorpay for payment processing; (c) service providers (email delivery, cloud hosting) who are bound by confidentiality obligations. We may disclose data if required by law or to protect the rights of ${BRAND}.`,
    },
    {
      heading: "6. Data Retention",
      body: `We retain your personal data for as long as necessary to fulfil the purposes for which it was collected and to comply with legal requirements — typically a period of three years after your last interaction with us.`,
    },
    {
      heading: "7. Your Rights",
      body: `You have the right to: access the personal data we hold about you; request correction of inaccurate data; request deletion of your data (subject to legal obligations); withdraw consent where processing is consent-based. To exercise any of these rights, email us at ${BRAND_EMAIL}.`,
    },
    {
      heading: "8. Security",
      body: `We implement industry-standard technical and organisational measures to protect your data. However, no internet transmission is completely secure; you share data at your own risk.`,
    },
    {
      heading: "9. Third-Party Links",
      body: `Our website may link to third-party sites. We are not responsible for their privacy practices and encourage you to review their policies independently.`,
    },
    {
      heading: "10. Changes to This Policy",
      body: `We may update this Privacy Policy periodically. The "Effective Date" at the top of this page reflects the latest revision. Continued use of the website after changes constitutes acceptance.`,
    },
    {
      heading: "11. Contact",
      body: `For privacy-related queries, contact us at ${BRAND_EMAIL}.`,
    },
  ],
};

export const REFUND = {
  title: "Cancellation & Refund Policy",
  effectiveDate: EFFECTIVE_DATE,
  intro: `${BRAND} understands that plans change. This policy sets out the conditions under which cancellations are accepted and refunds are issued for Muay Thai camp bookings.`,
  sections: [
    {
      heading: "1. Cancellation by the Participant",
      body: null,
      table: [
        { condition: "More than 30 days before camp start", refund: "100% refund (less payment gateway fees)" },
        { condition: "15–30 days before camp start", refund: "50% refund" },
        { condition: "7–14 days before camp start", refund: "25% refund" },
        { condition: "Less than 7 days before camp start", refund: "No refund" },
        { condition: "No-show / early departure", refund: "No refund" },
      ],
    },
    {
      heading: "2. How to Cancel",
      body: `To cancel a booking, email ${BRAND_EMAIL} with your booking reference number and the reason for cancellation. Cancellations are effective on the date we receive your email. We will acknowledge receipt within 2 business days.`,
    },
    {
      heading: "3. Refund Processing",
      body: `Approved refunds are credited to the original payment method via Razorpay. Processing typically takes 7–10 business days after we approve the refund. Payment gateway fees (if any) are non-refundable.`,
    },
    {
      heading: "4. Rescheduling",
      body: `If you need to move your camp to a different batch or location, contact us at least 21 days before the original camp start date. One rescheduling request is allowed at no charge; subsequent changes are subject to a rescheduling fee of ₹2,000 per request. Rescheduling is subject to availability.`,
    },
    {
      heading: "5. Cancellation by ${BRAND}",
      body: `In the unlikely event that ${BRAND} cancels a camp due to circumstances within our control (e.g., insufficient enrolment, gym closure), you will receive a full refund or the option to transfer to another batch at no extra cost. We are not liable for costs incurred such as flight or accommodation bookings.`,
    },
    {
      heading: "6. Force Majeure",
      body: `${BRAND} is not liable for cancellations caused by events beyond our reasonable control, including but not limited to natural disasters, government orders, political unrest, or pandemics. In such cases we will make best efforts to offer a credit or rescheduling option, but refunds are not guaranteed.`,
    },
    {
      heading: "7. Medical Cancellations",
      body: `If you are unable to attend due to a documented medical condition, contact us as early as possible. On submission of a valid medical certificate, we will consider a credit note or partial refund on a case-by-case basis, irrespective of the standard cancellation window.`,
    },
    {
      heading: "8. Contact",
      body: `For any cancellation or refund enquiries, reach us at ${BRAND_EMAIL}.`,
    },
  ],
};
