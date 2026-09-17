# Security

thesis-os reads markdown from your own repository and writes markdown back. It
makes no network requests, runs no code from your documents, and has one runtime
dependency (`yaml`).

If you find a vulnerability — for example a path that lets a crafted
`strategy/*.md` file cause writes outside the project directory — please report
it privately via GitHub's "Report a vulnerability" button on the Security tab
rather than opening a public issue.

Include the smallest document that reproduces the behaviour. You will get a
reply within a week.
