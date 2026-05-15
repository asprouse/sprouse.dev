---
category: anecdotes
title: Anecdotes
order: 6
description: Specific stories — career war stories, founder moments, customer interactions, and the legendary tales that fill in character beyond the principles
---

# Anecdotes

The earlier categories captured arc, opinions, and character in the abstract. This one is for *specific stories* — the war stories, the moments, the dinner-party tales. Things that fill in shape and texture beyond the principles.

## Childhood & Education

<!-- id: anec-1 | tags: [childhood, formative, story] -->
## 1. A childhood story that explains something about who you became professionally?

My desire to be a founder stems from my maternal grandfather. Every summer as a kid, my parents would send my brother and me to my mom's childhood home in North Dakota to spend a week with my grandparents.

My grandfather was a fount of wisdom. Over cards or at the town driving range, he'd regale me with his business stories. He started out as a textile buyer for a department store in Fargo and would visit the garment district in Manhattan. He told me about his time in the Air Force Cadets and his experiences flying planes in WWII. When he returned home, he opened the town's Ben Franklin store — the same franchise Sam Walton owned before branching out to start Walmart.

He'd share little nuggets of wisdom like *"you aren't truly in business until you hire your first employee."* After his daughter grew up and left town, he sold the store and used the money to become an investor. He introduced me to the idea of investing in markets and espoused a very careful and conservative approach. He told me you should only invest *"if you could afford to light the money on fire."*

As a child, he had a certain mystique and worldliness well beyond his humble North Dakota roots. Even though my time with him was limited, he helped shape my ambition to become a business owner. He lived to 101 and was still razor sharp until the last day. He's my real-life hero.

<!-- id: anec-2 | tags: [education, formative, teacher] -->
## 2. Tell me about a teacher who changed something for you.

I had a teacher, Ms. Wilson, who I was fortunate enough to have in both middle school and high school. She was tough — unlike other teachers at my school — and had no patience for bullshit.

I remember doing poorly on a paper and going to visit her after school to ask for another opportunity to improve my grade. She said no — *you did poorly and you need to move on and try harder going forward.* She was right. I had half-assed it, and this was the first time I'd been called out. I cried because I knew it was true. Inside my cushy private school bubble, this was my first dose of reality, and I'm grateful for it.

In high school we had a mock trial and a related writing assignment, and I knew I didn't want to do it. Instead of phoning it in, I asked her if I could write a computer program that would present evidence based on user input. It was a command-line C program that probably had as much or more words compiled into it as the required paper would have had. I had found my lane and made it something I wanted to work on.

A teacher who gave me a dose of reality and was receptive to creativity — certainly a formative experience being in her classes.

<!-- id: anec-3 | tags: [childhood, building, formative] -->
## 3. The first time you really impressed yourself with something you built?

In 6th grade I did an Egypt-themed HyperCard stack in lieu of the required poster project. This was the first time I had asked to do something different and committed to doing something I didn't really know if I could deliver.

I felt this feeling in my gut that has been present at many of my life's inflection points: the feeling that I had just taken a leap of faith, and that it was now up to me to land safely.

The project was a huge hit. I made my own 3D intro animation of a pyramid in Infini-D software. After the animation, the stack said "Welcome to Egypt" in the familiar Mac text-to-speech voice. What followed was a set of cards with images I had scanned with a flatbed scanner. I presented my stack by bringing it in on a SCSI Syquest drive to attach to the classroom computer, paired with a projector my dad borrowed from work. This was in 1996.

<!-- id: anec-4 | tags: [college, story] -->
## 4. A college memory that's stayed with you?

I went to school in Boston in the fall of 2003, just in time to be there for the Red Sox's postseason run. I grew up in Red Sox territory — my little league photos were taken in front of a faux Fenway Park backdrop — but I was only a casual fan entering college. In Boston, even the freshmen took baseball seriously, and I quickly became addicted to the energy of playoff baseball.

The Division Series against the Oakland A's was an instant classic. Down two games to none, the Sox clawed their way back to win three in a row. When Derek Lowe struck out the last batter, everyone in the room just looked at each other like *"what do we do now?"*

We were on such an emotional high when someone shouted *let's go to Fenway.* Even though the team was in Oakland, it seemed to make perfect sense. We practically ran to Fenway. When we got there, we noticed the door was ajar — maybe someone had broken in? We went into the stadium, and there it was: all the lights were on as if there was a game, but nobody was there except for a few trespassing kids. We went on the field. I stood by home plate. Other kids had the guts to run out and touch the Green Monster. We stayed in the park as long as we dared, and then back from whence we came.

<!-- id: anec-5 | tags: [education, northeastern, story] -->
## 5. The hardest CS course at Northeastern, and what it took to pass it?

The hardest CS courses at Northeastern were reputed to be Programming Languages and Software Development. Ironically, I found those two the most interesting — and when I'm interested in something, working on it becomes easy.

I was really into the Programming Languages course; I think it was my favorite. Eli Barzilay taught us how to implement Scheme with Scheme itself. It was a fascinating journey to see how it all came together. For Software Development, I had Professor William Clinger. In that course, he had us create a computer program that would play a maze game on a server, using a protocol the class mutually agreed upon. Being students of the time, we chose an XML protocol with a RelaxNG schema. Our team wrote our maze runner in Java and used self-hosted Trac (the same software I had used in co-op) to collaborate on the code. We secretly code-named it "project trashman" — a nod to Clinger's work on garbage collection algorithms.

If I had to pick an actual hardest class, I'd pick Theory of Computation. This is where we learned about the mathematical side of CS — topics like the pumping lemma and NP-completeness. Since I had been coding since an early age, I'd found most of the coursework up until this point easy. This was the first time I was really challenged. It took many trips to the CS dorm to study with other students to wrap our heads around these new concepts.

## Career War Stories

<!-- id: anec-6 | tags: [career, outage, debugging] -->
## 6. Worst production outage you've personally caused or had to fix?

The worst production outage we've ever had was when the entire us-east-1 region of AWS went down. Unfortunately, we just had to ride out the outage — our backups were also stored in the region. Despite the fact we'd covered our bases and used all three availability zones, we were caught with our pants down.

After this, our response was to replicate our data to another region and have a plan so we could fail over if necessary. Later down the line, we re-architected TakeShape's data layer to use DynamoDB global tables to support a potentially multi-region active-active approach.

<!-- id: anec-7 | tags: [career, peak] -->
## 7. Best day you've had as an engineer?

I think it was getting into Techstars. It was the day before my wedding, and Mark and I were doing groomsmen activities before the welcome dinner when we got the call. It was an amazing bonus on top of the fact that I was getting married. That was an all-time high.

<!-- id: anec-8 | tags: [demo, failure, story] -->
## 8. A demo that went catastrophically wrong?

Demos never go completely to plan. We've definitely had to talk around many broken demos. So much so that we typically have to rehearse before each critical demo, and hold any releases until after the demo.

<!-- id: anec-9 | tags: [career, hidden-wins] -->
## 9. A moment in your career when you got something *very* right that no one noticed?

I feel like there have been a few times in my career where we were on to the right idea, but the timing was off and therefore nobody noticed. For example: we were doing static site generation in 2014, we were doing HTTP 402 payment in 2015, and we were doing headless CMS in 2016.

I'm not sure it would have made much of a difference, but I do believe the reason these ideas weren't noticed is that I've historically been a poor promoter of my own work. That's one thing I continually work on throughout my career: how to sell my own ideas.
