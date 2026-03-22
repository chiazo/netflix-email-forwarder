const RECIPIENTS = {
  "Profile 1": ["profile_1@gmail.com"],
  "Profile 2": ["profile_2@gmail.com"],
  "Profile 3": ["profile_3@gmail.com", "profile_3+extra-person@gmail.com"],
  "Profile 4": ["profile_4@gmail.com", "profile_4@gmail.com"],
};

const ADMIN = "person-with-netflix-account@gmail.com";
const EMAIL_FETCH_LIMIT = 5;

// THIS IS THE FUNCTION THAT STARTS EVERYTHING ELSE
const findNetflixEmails = () => {
  const labels = getNetflixLabels();
  const messageIds = getNetflixEmailsByLabel(labels);
  const messages = messageIds.map((m) => getIndividualEmailContent(m));
  const messagesWithPeople = messages.map((e) => mapEmailsToRecipients(e));
  messagesWithPeople
    .filter((m) => !!m)
    .forEach((m) => {
      logResults(m);
      forwardEmail(m);
    });
};

// Finds any label named `Netflix` in your inbox
const getNetflixLabels = () => {
  try {
    const response = Gmail.Users.Labels.list("me");
    if (!response || !response.labels || response.labels.length === 0) {
      console.log("No labels found.");
      return [];
    }
    const filtered = response.labels
      .filter((l) => l.name == "Netflix" && l.type == "user")
      .map((l) => l.id);

    console.log("Here are the labels found:", filtered);
    return filtered;
  } catch (err) {
    console.log("Labels.list() API failed with error %s", err.toString());
    return [];
  }
};

// Finds any unread emails labeled `Netflix` in your inbox
const getNetflixEmailsByLabel = (labels) => {
  try {
    const response = Gmail.Users.Messages.list("me", {
      labelIds: labels,
      maxResults: EMAIL_FETCH_LIMIT,
      q: "is:unread", // only fetch unread messaged
    });
    if (!response || !response.messages || response.messages.length === 0) {
      console.log("No messages found.");
      return [];
    }

    console.log(
      "Here are the found messages:",
      response.messages.map((m) => m.id),
    );
    return response.messages;
  } catch (err) {
    console.log("Messages.list() API failed with error %s", err.toString());
    return [];
  }
};

// Grabs the actual email contents of unread emails labeled `Netflix`
// and marks the processed email as unread
const getIndividualEmailContent = ({ id }) => {
  try {
    const response = Gmail.Users.Messages.get("me", id);
    if (!response || !response.payload) {
      console.log(`Message ${id} not found`);
      return;
    }

    const markAsRead = Gmail.Users.Messages.modify(
      {
        removeLabelIds: ["UNREAD"],
      },
      "me",
      id,
    );
    console.log(
      `Message ${id} has the following labels: ${markAsRead.labelIds}`,
    );

    const { body } = response.payload.parts[0];
    const decoded = Utilities.newBlob(body.data).getDataAsString();

    return { response: response, body: decoded };
  } catch (err) {
    console.log("Messages.get() API failed with error %s", err.toString());
    return;
  }
};

// Determines which profile + its users will be forwarded the email
const mapEmailsToRecipients = ({ response, body }) => {
  for (const profile in RECIPIENTS) {
    const people = RECIPIENTS[profile];

    if (body.includes(profile)) {
      console.log(
        `Email is related to ${profile}'s profile and should be forwarded to`,
        people,
      );
      return {
        response: response,
        body: body,
        profile: profile,
        people: people,
      };
    }
  }

  // otherwise assume it should be forwarded to everyone
  return {
    response: response,
    body: body,
    profile: "everybody",
    people: Object.keys(RECIPIENTS)
      .map((k) => RECIPIENTS[k])
      .flat(),
  };
};

// Actually forwards the netflix email to each receipient and sends the admin a
// summary of who received it
const forwardEmail = (info) => {
  let emailsSent = 0;
  try {
    info.people.forEach((emailAddress) => {
      const subject = `Here's the netflix code for ${info.profile} folks!!!`;
      GmailApp.sendEmail(emailAddress, subject, info.body);
      emailsSent += 1;
    });

    const adminEmailBody = `
    - netflix email was forwarded to: ${info.people.join(",")}
    - # of emails sent: ${emailsSent}
    - email snippets: ${info.response.snippet || "not found"}
    `;
    GmailApp.sendEmail(ADMIN, "Netflix Email Stats", adminEmailBody);
  } catch (err) {
    console.log("Messages.send() API failed with error %s", err.toString());
    return;
  }
};

// method for logging the date + id of the email as well as the people receiving it
const logResults = ({ people, profile, response }) => {
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(response.internalDate * 1000));
  console.log({
    people: people,
    profile: profile,
    id: response.id,
    d: formattedDate,
    snippet: response.snippet,
  });
};
