What was built:

Watches page — Accordion list of all 8 watches. Active watch auto-expands on load. Each card shows description, key scripture, and meditation prompt in the watch's brand color. User's Divine Time gets a star badge.

Seed Edge Function — Run once with your service role key to populate all 366 day/verse entries. Handles every chapter's verse count limit so every generated reference is a real Bible verse. Run it with:

Bible ID resolution — KJV/NIV/NLT/ESV use known stable IDs. NKJV/AMP/MSG are resolved at runtime by fetching your account's available Bible list and matching by name — so it works regardless of which specific ID your API key has access to. Falls back to KJV if a version isn't available on your account.

366 verses seeded. The Moed Meditation engine is live.

Where things stand:

Layer	Status
Supabase DB + migrations	✓ Live
verse_map (366 entries)	✓ Seeded
Edge Functions	✓ Deployed
PWA build	✓ Clean
To open the app:


cd /Users/user/Documents/Workspace/mytcreative-devtools/8hope && npm run dev
What's working end-to-end:

Auth (magic link sign in)
Onboarding → Divine Time selection
Dashboard → active prayer watch based on current time
The Moed Meditation → today's 3 verses from the seeded map → AI deep study
Journal, Favorites, Settings, Watches page
What do you want to work on next? A few natural next steps:

Test the live flow — sign in, onboard, open The Moed, tap Study Deeper
Screensaver image picker (Settings placeholder)
Watches page navigation — add it to the bottom nav
Deploy — push to Vercel/Netlify for a live URL



# 8Hope

## **Application Definition Statement**

> #### Introducing `8Hope`, your gateway to divine timing. Explore prayer watches effortlessly, enrich your spiritual journey, and find consistency in your daily devotion. Join us and discover the power of faith and time.

## **Target Market**

**Primary Research Findings:**

> Through two distinct focus groups, I gained valuable insights into potential users and their needs for the prayer watch application.

> - **Focus Group 1 \- Women's Retreat**  
> - **Focus Group 2 \- Siblings Seeking Purposeful Prayer**

**Secondar Research Findings:**

> I explored various online sources to gain insights into the concept of the 8 prayer watches. These sources provided valuable information about the significance of each watch, their historical context, and their relevance in modern spiritual practices.

> - Dutch Sheets Ministries: Dutch Sheets, a prominent figure in Christian ministry, has authored books and conducted teachings on the subject of prayer watches. His work delves into the importance of aligning prayer with specific times and seasons, drawing from biblical references.  
> - Dutch Sheets Ministries Website: [https://dutchsheets.org/](https://dutchsheets.org/)  
> - **Book:** Watchman Prayer.

  ## **User Profile / Persona**

**User Persona: EMILY \- Focus Group 1 Participant**

> Emily is a user who, like others in Focus Group 1, experiences disrupted sleep patterns and is motivated to use these moments for spiritual growth. She represents someone with a moderate level of tech proficiency but a strong desire to deepen her connection with her faith through the exploration of prayer watches.

- **Name**: Emily  
- **Age**: 34  
- **Location**: North Carolina  
- **Occupation**: Registered Nurse  
- **Spiritual Beliefs**: Christian faith  
- **Sleep Pattern**: Often experiences disrupted sleep, frequently waking up at 4 am  
- **Tech Proficiency**: Comfortable with basic technology but not a tech expert  
- **Interest in Prayer**: Regularly attends church services and is active in her church community  
- **Goal**: Seeks a deeper connection with her faith and wants to find meaning in her nighttime awakenings  
- **Motivation**: Intrigued by the concept of the 8 prayer watches discussed during the mountain retreat, eager to explore them for spiritual growth  
- **Expectations from the App**: Hopes that the app will help her understand and engage with the prayer watches, offering guidance and reminders for nighttime prayer.

**User Profile: SARAH \- Focus Group 2 Participant**

> Sarah represents a motivated and tech-savvy user who resonates with the concept of prayer watches and seeks to integrate them into her spiritual journey, especially during her recurring nighttime awakenings at 3 am.

- **Name:** Sarah  
- **Age:** 28  
- **Occupation:** Front-end Web Developer  
- **Location:** North Carolina  
- **Spiritual Beliefs:** Strong Christian faith  
- **Hobbies:** Volunteering for the American Red Cross, attending church services  
- **Tech Savvy-ness:** Proficient in using digital tools  
- **Goals:** Strengthen her connection with her faith, find spiritual consistency. Use her wakeful moments at 3 am for purposeful prayer and spiritual growth  
- **Motivation:** Inspired by the concept of the 8 prayer watches and eager to explore and understand them better  
- **Expectations from 8Hope:** Expects the app to help her learn about and track prayer watches, provide reminders, and deepen her connection with her faith through purposeful nighttime prayers.

  ## **Use Cases**

### **\*Use Case \#1**

1. **Brief Description:** Introduce Emily to the 8Hope web app and provide her with a smooth onboarding experience, that will walk her through the purpose and customer her journey  
2. **Actor:**  Emily is a 34 year-old registered nurse with an interest in deepening her connection with her faith, who experiences frequent sleep disruptions and often wakes up at 4 am.  
3. **Precondition:** Emily is connected to the internet and has accessed the 8Hope web app on her phone.  
4. **Basic flow:**  
   - Emily launches the web app and is greeted by the welcome screen.  
   - Welcome screen display's the logo, app name, and tagline: "Discover a Divine Time to Pray".  
   - Next she taps "Get Started" which takes Emily through introduction to the purpose of the app.  
   - The introduction is a series of screens that briefly describe the 8 prayer watches and how 8Hope can help her make the most of her 4 am awakenings.  
   - Next Emily can "Explore Features" and setup her User Profile  
   - Customize app experience by selecting her preferred prayer watch and setting her notifications.  
   - After completing her onboarding experience Emily is welcomed to the 8Hope community and is ready to begin her spiritual journey with the app.  
5. **Alternate flow:**  If Emily encounters any difficulties during onboarding, she can access a "Help" section or reach out to in-app support for assistance.  
6. **Expectation flow:** As Emily begins to visit the app regularly, she will be able to  
   - Customize Prayer Watches  
   - Read through educational content that provides detailed information about the 8 prayer watches  
   - Use Push notifications to reminder her of prayer watch times called "Divine Time"  
7. **Post Conditions:**  
   - Emily's user profile is set up with her preferences.  
   - Emily is now familiar with the app's features and purpose.

   ## **Problem Statement**

> Many individuals, like Emily and Sarah, experience recurring sleep disruptions, waking up at unusual times during the night. These moments of wakefulness often leave them wondering about their purpose and seeking meaning in the early hours. Additionally, both focus groups have expressed a desire to explore and understand the 8 prayer watches, recognizing an opportunity for purposeful prayer during these sleepless nights. However, the lack of accessible and user-friendly tools that provide educational resources, reminders, and a sense of community around the concept of prayer watches is a significant challenge.

## **Pain Points**

Both Emily and Sarah share pain points related to sleep disruptions, a desire for purposeful nighttime prayer, and the need for a user-friendly app that helps them understand and engage with the concept of prayer watches effectively.

### **Based on the Primary Research with Focus Group 1**

**Pain Points for Emily:**

1. **Sleep Disruptions**: Emily experiences frequent sleep disruptions, particularly waking up at 4 am. This disrupts her rest and leaves her feeling fatigued.

2. **Lack of Purpose**: She often wonders why she wakes up at 4 am and struggles to find purpose in these moments of wakefulness.

3. **Limited Knowledge**: Emily is intrigued by the concept of the 8 prayer watches but lacks comprehensive knowledge about them. She finds it challenging to explore and understand this spiritual practice.

4. **Tech Challenges**: While not entirely tech-averse, Emily is not a tech expert. She may face challenges in using complicated or poorly designed apps.

### **Based on the Primary Research with Focus Group 2**

**Pain Points for Sarah:**

1. **Recurring Nighttime Awakenings**: Sarah frequently wakes up at 3 am, which can be frustrating and disrupt her sleep cycle.

2. **Desire for Purposeful Prayer**: She desires to use her wakeful moments for purposeful prayer and spiritual growth but lacks guidance on how to do so effectively.

3. **Tech Expectations**: As a web developer, Sarah likely has high expectations for user-friendly and well-designed apps. She may be frustrated with apps that don't meet these standards.

4. **Limited Understanding**: Sarah is eager to explore the 8 prayer watches, but her limited understanding of them may lead to confusion or uncertainty about how to engage with them.

   ## **Solution Statement**

This app introduces customized preferences and notification reminders to help address this problem, there is a clear need for the development of the 8Hope app. This app will serve as a user-friendly and informative platform that empowers individuals like Emily and Sarah to find purpose in their nighttime awakenings by providing educational resources about the 8 prayer watches, customizable prayer schedules, push notifications for prayer times, and a community where users can share their experiences and spiritual growth journeys. Although there are a number of competitors and/or resources that explain the 8 prayer watches, the 8Hope app creates a customized experience for the user to utilize on demand is quickly accessible not only online but from their phone as well.

## **Competition**

### **Direct Competition**

- Every Home for Christ  
> - [Pray without Ceasing](https://everyhome.org/prayer/)  
> - [Prayer Watch Live Web](https://prayerwatchlive.org/)  
> - [Prayer Watch Live Mobile](https://play.google.com/store/apps/details?id=org.ehc.prayerwatchlive)  
- First 5 [Web](https://first5.org/about/#downloadappcta) and [App](https://play.google.com/store/apps/details?id=com.crowdhub.first5)  
- Prayer App [Focus with our Prayer App](https://createdisciples.com/prayer-app/?gad=1&gclid=Cj0KCQjwmICoBhDxARIsABXkXlIp8L-tOhoHF0BAbV7wVfss3w6UOtF-XqBnthdawzqBbZQN0egjpokaAsP9EALw_wcB)  
- Prayer Watch [Prayer Times & Qibla w/ Widget](https://apps.apple.com/us/app/pray-watch/id989923828)  
- Watch \+ Pray [Website](https://watchandprayapp.com/) and [App](https://play.google.com/store/apps/details?id=com.watch.mobile&hl=en_US&gl=US)

### **Indirect Competition**

- Active Christians: The 8 Prayer Watches [activechristians.org.uk](https://www.activechristians.org.uk/prayer-watches1/8-prayer-watches)  
- Royal Girlz: The 8 Prayer Watches [royalgirlz.com](https://royalgirlz.com/category/the-8-prayer-watches/)

  ## **Features & Functionality**

**Key Features:**

`User friendly Onboarding`

> In order joint the app I need to create a smooth onboarding process that explains the purpose of the app and how it can help the user.

`Customizable Prayer Watches`

> In order to allow users to align their prayer routines with their specific sleep patterns, I need to allow users to set their preferred prayer watches and times.

`Educational Content`

> Include a dedicated section with comprehensive information about the 8 prayer watches, in order to address the users' limited understanding.

`Push Notifications`

> Implement customizable push notifications to remind users of prayer watch times. These reminders can help them make the most of their nighttime awakenings for purposeful prayer.

`Feedback Mechanism`

> Include a feedback option within the app, so the user can provide input on their experience and suggest improvements.

## **Integrations**

API that are planned to be used with this project:

- API.Bible: [Documentation](https://docs.api.bible/)  
> - to display the verse of the day  
> - to search the scriptures that go with 1 of the 8 prayer watches

Compliance with [Terms of Service](https://scripture.api.bible/): This project is in compliance with the FUMSv3.

# Figma Prototype

[8 HOPE PROTOTYPE](https://www.figma.com/file/6gMMjwYUALqI9pTyBa6cvG/StyleTile?type=design&node-id=0%3A1&mode=design&t=JGLOxvhZdRNpccdb-1)

# \*\*\* Change Order

* The proposal document summarizes the project scope.

* Work that is need to reach completion:  
  - implement and create features  
  - develop features functionality  
  - implement UI design and color scheme  
  - integration API

* List and describe any proposed changes to the original project scope  
  * Implement customizable push notifications to remind users of prayer watch times. These reminders can help them make the most of their nighttime awakenings for purposeful prayer.  
  * Use scripture.api.bible to fetch verses of the day.

* **MILESTONE 4 Update**  
  - dropping the setting feature for (customizable push notifications)

---

Keep in mind, approval is needed for proposed work and may include peer or instructor review(s). If you are unsure about your proposed ideas feel free to reach out to us for guidance.
