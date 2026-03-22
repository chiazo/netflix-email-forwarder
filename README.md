sharing is caring <3 a script to forward my netflix passcode emails to my family sharing the account

This is used in Google Apps Script on a 5 min cron schedule. You need to manually add a filter to all your netflix emails under the label `Netflix`.

## Instructions

1. start a new project in [google apps script](https://script.google.com/home/projects/create)
2. paste the code from `script.js` from this repo into the new project
3. replace the profile names + emails + admin
4. save the script and give it access to the same gmail account you use on your netflix account
5. In the left hand panel of google scripts app, add a trigger so the script runs every 5 minutes.
6. in gmail, add a filter named `Netflix` to all emails related to netflix codes!
7. **NOTE**: If a netflix email doesn't contain any of the listed profile names, the labeled email will be forwarded to all recipents. To avoid this, remove the following logic:

``` javascript
  // otherwise assume it should be forwarded to everyone
  return {
    response: response,
    body: body,
    profile: "everybody",
    people: Object.keys(recipients)
      .map((k) => recipients[k])
      .flat(),
  };
```
