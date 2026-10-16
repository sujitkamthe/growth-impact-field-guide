---
id: direct
name: Direct
order: 1
reach: **The stories and features you own** end to end
how: **Your own work**, taken from an unclear ask to production without someone steering each step
lasts: Work that **runs reliably in production** and that your teammates can change safely
reaches: Stories · features
mindset: I own my work end to end.
question: What's the right way to build this?
v1: Artisan, and the later end of Explorer
---

## Summary

Direct is the first scope. It means you are trusted and independent: you take a piece of work from an unclear ask to production without someone steering each step, and you understand enough of its context to question it.

## What changes

Direct is the first scope, and the one every other scope builds on: your impact is in **the work you own yourself**. Like every scope, it reflects the impact you show, not how long you have been at Sahaj.

## In practice

A client asks the team to add a second payment provider to its checkout. Payment changes have slipped in each of the last two releases.

- **What you did**: You took the provider integration from a loose ask to production. You asked why the client wanted a second provider, learned it was about failed payments at peak times, and spotted that refunds would break before anyone built them.
- **What changed**: The integration shipped on the date you gave, and the refund gap was fixed as planned work instead of turning into a production incident.
- **Why it's Direct**: Your impact was in work you owned end to end. Designing how everyone else's payment work fits together would be Extended.

## Client & Delivery

> I independently deliver well-built work and understand why it matters.

### Expectations

#### Technical craft

- **Write clean, tested code**: I write **clean, tested, secure code** across the stack, applying sound design principles by default
  - **Write tests alongside code**, so changes are safe to make
  - Follow **secure coding practices** without being reminded
  - Keep code **easy for the next person** to understand and change
- **Own changes in production**: I debug issues independently and **own how my changes behave in production**, including defects I introduce
  - Check that my changes **work as intended once they are released**
  - **Debug issues on my own**, and ask for help once I have narrowed the problem down
  - **Fix the defects I introduce**, and find out what let them through
- **Keep learning**: I **keep learning** what my work needs, and improve how I work from what I learn
  - Learn **what the work needs next**, such as a new framework or part of the client's domain, without waiting to be taught
  - Try a better way of working when I find one, and **share it with the team**

#### Consulting

- **Ask why**: I **ask why** behind the work, and connect my work to the feature and business context around it
  - Find out **what problem a piece of work solves** before I start it
  - Understand **how my work fits the feature** and what the client gains from it
- **Flag gaps early**: I **flag gaps**, contradictions and ambiguity early, and suggest alternatives when an ask looks wrong
  - Raise missing details, contradictions and unclear requirements **as soon as I notice them**
  - **Suggest an alternative** when an ask looks wrong, rather than building it as written

#### Delivery ownership

- **Take work from ask to production**: I **take work from an unclear ask to production on my own**, breaking it down and estimating sensibly
  - Break unclear work into **small pieces** I can estimate and deliver
  - Take each piece **all the way to production**, not only to "code complete"
  - Deliver **without a teammate guiding each step**, and ask for help once I'm genuinely stuck
- **Deliver predictably**: I **deliver predictably**, keep progress visible, raise risks early and adjust plans when reality changes
  - **Question a date or estimate** I don't believe in, including one given on my behalf, before it becomes a promise
  - **Deliver what I committed to** when I said I would, or say early that I can't
  - **Adjust my plan** when priorities, estimates or requirements change, and tell the people affected
- **Follow our delivery practices**: I follow **Sahaj's engineering and delivery practices**, such as writing tests first, pairing and releasing in small steps, and know why each one helps, so I can adapt it when the context changes
  - Keep **the board, the build and my branches** up to date, so the team sees the real state of the work
  - Keep to the team's practices **when a deadline is close**, and say so when I think one should change

### Evidence

- Work you took from a vague ask to production across the cycle, and the requirement gaps you caught on the way, before anyone built them
- Reviews of your work that discuss trade-offs and improvements, because correctness, tests and maintainability are already there
- Problems your changes caused after release that you followed up without being asked

### Self-check

- Can I explain the business problem behind my work, not just the ticket?
- When I can't deliver what I committed to, do people hear it from me first, or find out when they ask?

### Not yet

- Delivery is strong, but only when someone else has defined the work tightly
- Risks are first mentioned in stand-up on the day they become blockers
- Dates are accepted without question, then missed or met through long hours

## People & Team

> I am a dependable, constructive teammate.

### Expectations

#### Growing others

- **Help new teammates settle in**: I **help newer teammates onboard**, sharing knowledge generously and explaining the reasoning behind the answers
  - Help new teammates **find their way around** the codebase, the team and the client
  - Share what I know, and **explain why** as well as what

#### Feedback and trust

- **Review peers' work**: I **review peers' work** with specific, actionable feedback, and visibly act on feedback I receive
  - **Review my peers' code and designs**, with specific comments they can act on
  - **Act on feedback I receive**, so the person who gave it can see what changed
- **Help when asked**: I **help constructively when asked**, including when the question is basic or the timing inconvenient
  - **Help teammates who ask**, without making them feel the question was too basic
  - **Agree a better time** when the timing is bad, rather than brushing people off

#### Communication and collaboration

- **Communicate clearly**: I **communicate clearly for the audience**, in writing and in person, and share progress and blockers without being chased
  - **Adjust what I say and write** to who it is for, whether a teammate or the client
  - Share progress and blockers **before anyone has to ask**
- **Question the approach**: I **question requirements, acceptance criteria and designs** when I see a problem, and back the question with reasons
  - Ask questions that **test the requirement and its acceptance criteria**, not only how to build it
  - **Challenge an approach or design**, including a more senior teammate's, and explain what I think is wrong with it
  - Go with the team's decision once it is made, and **raise it again only with new evidence**

### Evidence

- Feedback you received, and what you have consistently done differently since
- Newer teammates who ramped up faster with your help, and teammates who come back to you to understand the reasoning behind an answer
- A question or challenge you raised that changed a requirement, an acceptance criterion or a design

### Self-check

- Do people have to ask me for status, or do they already know?
- Do teammates come to me for help without being directed to?

### Not yet

- Helps when asked, but doesn't offer help or share what they know otherwise
- Comments on peers' work point out problems but rarely help the author understand the reasoning or decide better next time
- Feedback from teammates is heard, but nothing is different by the next cycle

## Org & Community

> I contribute beyond my immediate delivery, in a way I've chosen.

### Expectations

- **Contribute beyond delivery**: I contribute beyond my immediate delivery in **a way I choose**, and keep it up through the cycle
  - **Choose a way to contribute** beyond my project work, from the ways to contribute or an idea of my own
  - **Keep it up through the cycle**, rather than doing it once at the start or the end
- **Uphold the culture**: I uphold Sahaj's culture **in everyday behaviour**, follow through on the commitments I take on, and raise constraints early
  - **Act on Sahaj's values** in everyday work, with the team and with the client
  - **Follow through** on the commitments I take on beyond my project
  - **Say early** when I can't keep a commitment, so someone else can pick it up
  - Behave in a way **newer colleagues can learn from**, such as admitting mistakes openly and giving credit

### Evidence

- The way you chose to contribute and what you did across the cycle, with rough dates
- An event, initiative or tool that exists, or works better, because you kept contributing
- What the people your contribution helped now do differently

### Self-check

- If someone asked what I contributed beyond my project this cycle, could I answer in one sentence?
- Did I keep my contribution up through the cycle, or did it happen in the fortnight before assessment?

### Not yet

- Commitments taken on beyond the project lapse without a word

### Ways to contribute

#### Culture and organisational health

- Helping new joiners settle in, beyond your own team
- Speaking up when a practice or decision doesn't fit how we work, and suggesting what would

#### Initiatives and capability

- Contributing steadily to an org initiative or capability track
- Fixing a small internal tool or process that wastes people's time

#### Community and external contribution

- Sharing what your team learned, through internal sessions, write-ups, a blog post or a talk at a meetup or conference
- Helping organise a DevDay, or speaking at one
- Contributing to a community of practice

## Examples

### Meets expectations

You picked up feature stories, broke them down yourself and delivered them with tests. Reviews came back with minor comments, and when a requirement was unclear you asked early and suggested an alternative rather than guessing. You explained your reasoning when a newer teammate asked for help, and you ran knowledge-sharing sessions on your team's testing approach through the cycle. By the end, nobody needed to check in on your work.

### Below expectations

Most of your stories needed rework after review, and when a requirement was ambiguous you built your own assumption without checking. People found out about blockers when they asked. Beyond the project you attended events but didn't contribute to any, and the reason first came up in your self-assessment rather than during the cycle.
