# Rep Note

Rep Note is a small Android app for logging gym sets. It is for Thejus and Lekshmi, and it is meant to stay out of the way during a workout: pick the exercise, enter the numbers, and move on.

The app follows an eight-day training cycle. Each session is a routine day (Day 01 through Day 08) on a calendar date. Sets are stored on the phone. Nothing is sent to a server, and there is no account.

## What a set records

Each set is one line for one person:

- the exercise, chosen from a saved list
- who did it, Thejus or Lekshmi
- weight in kilograms
- reps
- reps in reserve (RIR), including zero

The set number fills in on its own for that exercise and person.

## What you can do

- Log sets for the selected day and date.
- Review the session grouped by exercise, with Thejus listed before Lekshmi.
- Save exercise names once, then pick them from the list.
- Export the day as a plain text file and choose where to save it on the phone.

## Run it

```bash
npm start
```

Then open the Android build. A release APK can be installed directly on a phone and does not need the development server.
