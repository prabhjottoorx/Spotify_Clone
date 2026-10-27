// BeatBox help centre: articles + a small keyword search used by support.html
(function () {
  // A(id, category, title, summary, steps[], note, related[], keywords)
  const A = (id, cat, title, summary, steps, note, related, kw) => ({ id, cat, title, summary, steps, note: note || "", related: related || [], kw: kw || "" });

  const articles = [
    // ---------------- Payments & billing ----------------
    A("failed-payment", "payments", "Failed payment help", "A payment can fail if the card details are wrong, the card has expired or there isn’t enough balance.",
      ["Check the card number, expiry date and CVV for typing mistakes.", "Make sure the card hasn’t expired and has enough balance.", "Try a different card or pay with UPI.", "Go back to [Premium](premium.html), choose your plan and try again."],
      "Still failing? [Contact us](support.html?contact=1) with the time of the attempt.", ["accepted-payment", "charged-twice", "change-payment"], "payment declined error card failed not working checkout"),
    A("accepted-payment", "payments", "Accepted payment methods", "You can pay for Premium with a card or with UPI.",
      ["Cards: Visa, Mastercard, RuPay and American Express.", "UPI: any valid UPI ID, for example name@bank.", "Student plans also need a student email ending in .edu, .edu.in or .ac.in."],
      "BeatBox only keeps the last 4 digits of your card.", ["failed-payment", "change-payment"], "card upi visa mastercard rupay amex pay methods"),
    A("change-payment", "payments", "How to change your payment details", "To pay with a different card or UPI ID, start a new payment for your plan.",
      ["Log in and open your avatar menu, then choose **Account**.", "Under **Your plan**, press **Cancel plan** (you can subscribe again right away).", "Open [Premium](premium.html), pick your plan and enter the new payment details."],
      "Your payment history stays in your account.", ["cancel-premium", "accepted-payment"], "update card change upi edit billing details payment method"),
    A("cancel-premium", "payments", "How to cancel Premium plans", "You can cancel your plan any time from your account page.",
      ["Log in, open the avatar menu and choose **Account**.", "Scroll to **Your plan** and press **Cancel plan**.", "Confirm. Your account goes back to BeatBox Free."],
      "Your playlists and liked songs are kept.", ["change-plan", "canceled-still-charged", "free-plan"], "cancel stop subscription unsubscribe end membership"),
    A("charged-too-much", "payments", "Charged too much", "The first payment can be different from later ones because of introductory offers.",
      ["Open **Account** and look at **Payment history** to see each amount.", "Compare it with your plan: Standard is ₹139 for the first 2 months, Platinum is ₹299 a month, Student is ₹69 for the first 2 months.", "If the amount still looks wrong, [contact us](support.html?contact=1) with your receipt number."],
      "", ["receipts", "charged-twice", "refund-policy"], "overcharged wrong amount price too high expensive bill"),
    A("charged-twice", "payments", "Charged twice", "Check your payment history first. Two entries with different receipt numbers mean two payments.",
      ["Open **Account** and read **Payment history**.", "Note the receipt numbers and dates of both payments.", "[Contact us](support.html?contact=1) and include both receipt numbers."],
      "", ["receipts", "refund-policy"], "double charge duplicate payment twice"),
    A("refund-policy", "payments", "Refund policy", "If you were charged by mistake, tell us and we’ll look at your payment.",
      ["Find your receipt number under **Account > Payment history**.", "[Contact us](support.html?contact=1), choose **Payments & billing**, and describe what happened."],
      "One-time yearly payments don’t renew, so there is nothing to cancel.", ["charged-twice", "charged-too-much"], "refund money back return"),
    A("receipts", "payments", "Check your receipts", "Every payment gets a receipt number you can see in your account.",
      ["Log in and open **Account**.", "Scroll to **Payment history**.", "Each row shows the date, plan, amount and receipt number."],
      "", ["charged-too-much", "billing-date"], "receipt invoice history statement"),
    A("billing-date", "payments", "Your billing date", "Your next billing date is shown under your plan.",
      ["Open **Account**.", "In **Your plan**, look at **Next billing**. For one-time payments it says **Plan ends** instead."],
      "", ["cancel-premium", "receipts"], "renew renewal date when charged next payment"),
    A("canceled-still-charged", "payments", "Canceled but still charged", "A payment made before you cancelled can still appear in your history.",
      ["Open **Account** and check that your plan says **BeatBox Free**.", "Check the date of the payment in **Payment history**.", "If it’s after you cancelled, [contact us](support.html?contact=1) with the receipt number."],
      "", ["cancel-premium", "refund-policy"], "still charged after cancel unexpected charge"),

    // ---------------- Manage your account ----------------
    A("cant-login", "account", "Can’t log in to BeatBox", "Most login problems come from a mistyped email or password.",
      ["Check that the email is spelled correctly.", "Use **Show password** (the eye icon) to check what you typed.", "Forgot it? Choose [Forgot your password?](forgot-password.html) and set a new one.", "After 5 wrong tries, wait 30 seconds before trying again."],
      "If you signed up with Google, Facebook, Apple or a phone number, log in the same way.", ["reset-password", "social-login"], "login log in sign in locked incorrect password username cannot access"),
    A("reset-password", "account", "How to reset or change your BeatBox password", "You can reset a forgotten password or change it from your account.",
      ["Forgot it: open [Reset your password](forgot-password.html), enter your email and choose a new password.", "Know it: open **Account**, go to **Change password**, then enter the old and new password."],
      "A good password has 8+ characters, a letter and a number or symbol.", ["cant-login", "protect-account"], "forgot password reset change new password"),
    A("change-profile", "account", "Change your name, date of birth or gender", "Update these details on your account page.",
      ["Log in and open **Account**.", "Edit the fields under **Edit profile**.", "Press **Save profile**."],
      "", ["change-email"], "edit profile name birthday dob gender username"),
    A("log-out", "account", "How to log out of BeatBox", "Log out from the avatar menu.",
      ["Press your avatar (the letter circle) at the top right.", "Choose **Log out** and confirm."],
      "", ["cant-login"], "logout sign out"),
    A("delete-account", "account", "Closing your account and deleting your data", "Deleting your account removes it, your playlists and liked songs for good.",
      ["Open **Account**.", "Scroll to the bottom and press **Delete account**.", "Type DELETE to confirm."],
      "This can’t be undone. Cancel any paid plan first if you want to stop renewals.", ["cancel-premium", "privacy-data"], "close remove erase delete account data"),
    A("sign-up", "account", "How to sign up for BeatBox", "Signing up takes three short steps.",
      ["Open [Sign up](signup.html) and enter your email.", "Create a password with at least 8 characters, a letter and a number or symbol.", "Add your name, date of birth and gender, accept the terms, and press **Sign up**."],
      "You must be at least 13 years old.", ["social-login", "cant-login"], "register create account join new"),
    A("social-login", "account", "Logging in with Google, Facebook, Apple or phone", "You can continue with a social account or a phone number from the login and signup pages.",
      ["Open [Log in](login.html) or [Sign up](signup.html).", "Choose **Continue with Google**, **Facebook**, **Apple** or **phone number**.", "Follow the pop-up steps."],
      "Use the same method each time. An email that already has a password can’t be used with a social login.", ["cant-login", "sign-up"], "google facebook apple phone otp"),
    A("change-email", "account", "Change your email address", "Email addresses can’t be changed yet.",
      ["Sign up again with the new email address.", "Your old account stays separate. You can [delete it](support.html?a=delete-account) if you no longer need it."],
      "", ["change-profile", "delete-account"], "email address update change mail"),

    // ---------------- Premium plans ----------------
    A("plans-overview", "premium", "BeatBox Premium plans", "There are three paid plans and a free plan.",
      ["**Standard** – ₹139 for the first 2 months, then ₹139 a month. One account, ad-free, downloads and very high quality audio.", "**Platinum** – ₹299 a month. Lossless audio, AI DJ and AI playlists.", "**Student** – ₹69 for the first 2 months, then ₹69 a month, for verified students.", "**Free** – ad-supported music with shuffle play."],
      "See all plans on the [Premium page](premium.html).", ["change-plan", "student-plan"], "premium plans price cost standard platinum student compare"),
    A("student-plan", "premium", "Premium Student", "Students at an eligible college can get a lower price.",
      ["Open [Premium](premium.html) and choose **Student**.", "Enter your college name and a student email that ends in .edu, .edu.in or .ac.in.", "Complete the payment."],
      "", ["plans-overview", "accepted-payment"], "student discount college university verify"),
    A("change-plan", "premium", "How to change Premium plans", "Cancel your current plan, then start the plan you want.",
      ["Open **Account** and press **Cancel plan**.", "Go to [Premium](premium.html) and pick the new plan.", "Complete the payment."],
      "", ["cancel-premium", "plans-overview"], "switch upgrade downgrade plan change"),
    A("free-plan", "premium", "BeatBox Free", "The free plan is ad-supported and costs nothing.",
      ["Sign up with just an email.", "Listen with shuffle play and basic audio quality.", "Upgrade any time from [Premium](premium.html)."],
      "", ["plans-overview"], "free plan ads"),
    A("family-plan", "premium", "Family plans", "BeatBox doesn’t offer Family or Duo plans yet.",
      ["For one person, choose Standard or Platinum.", "For students, choose Student."],
      "Platinum can be used on up to 3 accounts in the same home.", ["plans-overview"], "family duo invite remove members share"),
    A("premium-not-working", "premium", "Premium not working", "If your plan doesn’t show up, check your account first.",
      ["Open **Account** and check **Your plan**.", "Check **Payment history** to see that the payment went through.", "Log out and log in again.", "Still nothing? [Contact us](support.html?contact=1)."],
      "", ["failed-payment", "plans-overview"], "premium missing not active did not upgrade paid but free"),

    // ---------------- In-app features ----------------
    A("getting-started", "features", "Getting started on BeatBox", "Play a song by pressing the album picture or its play button.",
      ["Press a cover on the home page to play it.", "Use the player bar at the bottom to pause, skip and move through the song.", "Open **Your Library** to see playlists you create."],
      "", ["create-playlist", "queue"], "start begin how to use play music basics"),
    A("create-playlist", "features", "Create and edit playlists", "Make your own playlists once you’re logged in.",
      ["Press **Create** in Your Library and choose **Playlist**.", "Click the playlist title to rename it.", "Add songs with the **+** button on any song, or use the search box at the bottom of the playlist.", "Press the bin icon to delete it."],
      "", ["add-to-playlist", "folders"], "new playlist make rename delete edit"),
    A("add-to-playlist", "features", "Add songs to a playlist", "Every song row has a + button.",
      ["Find a song in search results, an artist page or a chart.", "Press **+** and choose a playlist, or **New playlist**.", "Press the playlist again in the menu to remove the song."],
      "", ["create-playlist"], "add song put track playlist remove"),
    A("folders", "features", "Organize playlists in folders", "Folders keep related playlists together.",
      ["Press **Create** and choose **Folder**, then type a name.", "Open the folder and press **New playlist here**.", "Or open a playlist and use **Move to folder**."],
      "Deleting a folder keeps its playlists.", ["create-playlist", "library-tools"], "folder organize group move"),
    A("blend", "features", "Blend", "A Blend mixes songs into one playlist for you and a friend.",
      ["Press **Create** and choose **Blend**.", "Type your friend’s name.", "BeatBox creates a playlist with a mix of songs."],
      "Blend isn’t connected to real friends yet.", ["create-playlist"], "blend friend mix together"),
    A("liked-songs", "features", "Liked Songs", "Press the heart in the player bar to save a song.",
      ["Play a song and press the **heart** at the bottom left.", "Open **Liked Songs** in Your Library to see them all.", "Press the heart again, or the **x** on that page, to remove a song."],
      "You need to be logged in.", ["create-playlist"], "like heart favourite favorite save"),
    A("search-help", "features", "Search", "Search finds songs and artists.",
      ["Type in the search box at the top.", "Use the **All**, **Songs** and **Artists** buttons to narrow results.", "Press the box icon next to the search bar to browse all categories."],
      "", ["getting-started"], "find search songs artists browse"),
    A("queue", "features", "Play queue", "The queue shows what’s playing and what comes next.",
      ["Press the **list** icon at the bottom right of the player bar.", "Press any song in the queue to play it."],
      "", ["shuffle-repeat"], "queue next up playing order"),
    A("shuffle-repeat", "features", "Shuffle and repeat", "Mix up the order or loop what you’re hearing.",
      ["Press the **shuffle** icon to play in random order.", "Press **repeat** once to repeat the list, twice to repeat one song, three times to turn it off.", "The player remembers these settings next time you visit."],
      "", ["queue"], "shuffle repeat loop random order"),
    A("library-tools", "features", "Filter, search and sort Your Library", "Find playlists and folders faster.",
      ["Use **Playlists** and **Folders** to filter.", "Press the magnifier to search by name.", "Press **Recents** to switch to alphabetical order.", "Press the book icon to collapse Your Library, or drag its edge to resize."],
      "The filters show up once you have a playlist or folder.", ["folders"], "library filter sort search collapse resize"),
    A("keyboard-shortcuts", "features", "Keyboard shortcuts", "A few keys save time.",
      ["**Space** plays or pauses.", "**Esc** closes menus and clears search."],
      "", ["queue"], "keyboard keys shortcuts hotkeys spacebar"),

    // ---------------- Devices & troubleshooting ----------------
    A("song-not-playing", "devices", "BeatBox not playing", "If a song won’t play, try these steps.",
      ["Refresh the page and press the song again.", "Try a different song to see if the problem is just one track.", "Check your internet connection.", "If you see “Couldn’t play this song”, that track’s audio file may be missing."],
      "", ["no-sound", "clear-data"], "not playing error stuck loading music wont play cant play doesnt play song wont play"),
    A("no-sound", "devices", "Can’t hear any sound on BeatBox", "Check the volume in BeatBox and on your device.",
      ["Look at the volume slider in the player bar. A crossed speaker icon means it’s muted. Press it to unmute.", "Raise your device volume and check that headphones or speakers are connected.", "Make sure the browser tab isn’t muted."],
      "", ["song-not-playing"], "no sound volume mute silent audio cant hear"),
    A("clear-data", "devices", "Clear saved data", "BeatBox saves your login, playlists and player settings in your browser.",
      ["Clearing your browser’s site data removes all of it.", "Only do this if something is badly broken. You will need to log in again."],
      "", ["privacy-data", "song-not-playing"], "reset clear cache cookies storage broken fix"),
    A("browsers", "devices", "Supported devices and browsers", "BeatBox works in current versions of Chrome, Edge, Firefox and Safari.",
      ["Use an up-to-date browser.", "Turn on JavaScript and allow site storage."],
      "", ["phone-layout"], "browser chrome firefox safari edge supported"),
    A("phone-layout", "devices", "Use BeatBox on your phone", "On small screens you get tabs at the bottom.",
      ["Use **Home**, **Search** and **Your Library** at the bottom.", "Open the menu (three lines) for Account and Log out."],
      "", ["browsers"], "phone mobile android iphone small screen"),
    A("install-app", "devices", "Install the BeatBox app", "Apps for Windows, Mac, Android and iPhone aren’t available yet.",
      ["Use the web player in your browser.", "See the [Download page](download.html) for updates."],
      "", ["browsers"], "install download app windows mac android ios"),

    // ---------------- Safety & privacy ----------------
    A("protect-account", "safety", "Protect your BeatBox account", "A strong, unique password keeps your account safe.",
      ["Use 8+ characters with a letter and a number or symbol.", "Don’t reuse a password from another site.", "Change it under **Account > Change password**.", "Log out on shared computers."],
      "", ["hacked", "reset-password"], "security safe password protect strong"),
    A("privacy-data", "safety", "Data rights and privacy choices", "Your account details, playlists and liked songs are saved in your browser.",
      ["See what we store in the [Privacy Policy](info.html?page=privacy).", "Delete everything by [deleting your account](support.html?a=delete-account)."],
      "", ["delete-account", "clear-data"], "privacy data rights personal information gdpr"),
    A("hacked", "safety", "Think your account’s been hacked?", "Act quickly to secure your account.",
      ["Change your password from **Account > Change password**.", "Check **Payment history** for payments you don’t recognise.", "[Contact us](support.html?contact=1) if anything looks wrong."],
      "", ["protect-account", "reset-password"], "hacked stolen compromised suspicious unauthorized"),
  ];

  const byId = {};
  articles.forEach((a) => (byId[a.id] = a));

  const cats = [
    { id: "payments", title: "Payments & billing", sections: [["Recommended topics", ["failed-payment", "accepted-payment", "change-payment", "cancel-premium", "charged-too-much"]], ["Manage payments", ["receipts", "billing-date", "cancel-premium"]], ["Charge help", ["charged-twice", "refund-policy", "canceled-still-charged"]]] },
    { id: "account", title: "Manage your account", sections: [["Logging in", ["cant-login", "reset-password", "social-login", "log-out"]], ["Sign up and profile", ["sign-up", "change-profile", "change-email"]], ["Close account", ["delete-account"]]] },
    { id: "premium", title: "Premium plans", sections: [["Plans", ["plans-overview", "student-plan", "free-plan", "family-plan"]], ["Manage your plan", ["change-plan", "cancel-premium", "premium-not-working"]]] },
    { id: "features", title: "In-app features", sections: [["Getting started", ["getting-started", "search-help", "keyboard-shortcuts"]], ["Playlists and library", ["create-playlist", "add-to-playlist", "folders", "blend", "liked-songs", "library-tools"]], ["Playback", ["queue", "shuffle-repeat"]]] },
    { id: "devices", title: "Devices & troubleshooting", sections: [["Fix a problem", ["song-not-playing", "no-sound", "clear-data"]], ["Devices", ["browsers", "phone-layout", "install-app"]]] },
    { id: "safety", title: "Safety & privacy", sections: [["Stay safe", ["protect-account", "hacked", "privacy-data"]]] },
  ];

  const QUICK = ["cant-login", "failed-payment", "charged-too-much", "family-plan", "change-payment"];
  const STOP = new Set("a an the i my me to of for in on is it how do can what why not and or with when where my your you are am be this that".split(" "));

  function tokens(s) {
    return String(s).toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w && !STOP.has(w));
  }

  // Returns articles best matching the query, best first
  function search(q) {
    const words = tokens(q);
    if (!words.length) return [];
    const phrase = String(q).toLowerCase().trim();
    return articles
      .map((a) => {
        const title = a.title.toLowerCase(), sum = a.summary.toLowerCase();
        const body = (a.steps.join(" ") + " " + a.note).toLowerCase(), kw = a.kw.toLowerCase();
        let score = 0;
        if (title.includes(phrase)) score += 8;
        words.forEach((w) => {
          if (title.includes(w)) score += 5;
          if (kw.split(" ").includes(w)) score += 4;
          else if (kw.includes(w)) score += 2;
          if (sum.includes(w)) score += 2;
          if (body.includes(w)) score += 1;
        });
        return { a, score };
      })
      .filter((x) => x.score > 0)
      .sort((x, y) => y.score - x.score);
  }

  window.HELP = { articles, byId, cats, QUICK, search, catOf: (id) => cats.find((c) => c.id === id) };
})();