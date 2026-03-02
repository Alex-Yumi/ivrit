# Duolingo — Lernstruktur & UX-Analyse

> Recherche für YAD (Yet Another Duolingo) — eine Farsi-Lernapp
> Stand: März 2026

---

## 1. Kursstruktur: Der "Path"

### Historische Entwicklung
- **Bis 2022:** "Skill Tree" — ein Baum mit Reihen von Skills, die parallel bearbeitet werden konnten
- **Ab August 2022:** Umstellung auf den **linearen "Path"** (Lernpfad) — eine einzige Abfolge von Lektionen

### Aktuelle Struktur (Path-System)
Der gesamte Kurs ist als **linearer Pfad** organisiert:

- **Sections** (Abschnitte): Große Kursabschnitte, vergleichbar mit Semestern. Duolingo sagt: "5 Sections ≈ 5 Semester Uni-Unterricht"
- **Units** (Einheiten): Innerhalb jeder Section gibt es mehrere Units, die sich auf **Kommunikationsziele** fokussieren (z.B. "Im Restaurant bestellen", "Über die Familie sprechen")
- **Lessons** (Lektionen): Jede Unit besteht aus mehreren kurzen Lektionen (ca. 3-8 Minuten)
- **Practice Lessons**: Personalisierte Wiederholungslektionen, die IN den Pfad eingebaut sind und für den Fortschritt absolviert werden müssen

### Progression im Path
- **Strikt linear**: Nur eine Lektion gleichzeitig freigeschaltet
- **Reviews sind Pflicht**: Practice-Lektionen sind in den Path eingebaut; man MUSS sie machen, um voranzukommen
- **Placement Test**: Zu Beginn kann man einen Einstufungstest machen, um bereits bekannte Units zu überspringen
- **Unit Skip**: Einzelne Units können per Test übersprungen werden (50 XP Belohnung)
- **Offline-Lektionen**: Die nächsten Lektionen werden automatisch gecacht (Vorteil des linearen Pfads)

### Warum linear?
Luis von Ahn (CEO) begründete die Umstellung:
- Duolingo weiß genau, was als nächstes kommt → besseres Caching für Offline
- Viele Nutzer wiederholten im alten System nur bekannte Inhalte, statt Neues zu lernen
- Im neuen System lernt die Mehrheit bei jeder Session tatsächlich neues Material

---

## 2. Lektionstypen & Übungsformate

Jede Lektion besteht aus mehreren **Exercises** (Übungen). Es gibt folgende Typen:

### Rezeptive Übungen (Erkennen)
| Übungstyp | Beschreibung |
|---|---|
| **Picture Flashcard** | Wort wird gezeigt, 3-4 Bilder zur Auswahl |
| **Mark the Correct Meaning** | Multiple Choice: Welcher Satz ist die richtige Übersetzung? |
| **What Do You Hear?** | Audio wird abgespielt, mehrere Transkriptionen zur Auswahl |
| **Read and Respond** | Satz mit markiertem Wort, Bedeutung auswählen |
| **Select the Missing Word** | Lückentext mit Auswahlmöglichkeiten |

### Produktive Übungen (Erzeugen)
| Übungstyp | Beschreibung |
|---|---|
| **Translation** (Tippen) | Satz übersetzen durch freies Tippen |
| **Sentence Shuffle / Word Bank** | Übersetzung aus vorgegebenen Wort-Kacheln zusammensetzen (mit ~4 Distraktoren) |
| **Complete the Translation** | Teilübersetzung gegeben, fehlendes Wort eintippen |
| **Type What You Hear** | Diktat — gehörten Satz transkribieren (mit Slow-Button 🐢) |
| **Speak This Sentence** | Satz vorlesen (Spracherkennung via Mikrofon) |
| **Arrange All Words** | Verschütteten Satz in der Zielsprache korrekt ordnen |

### Zuordnungsübungen
| Übungstyp | Beschreibung |
|---|---|
| **Tap the Pairs** | Wort-Paare (Quellsprache ↔ Zielsprache) zuordnen |

### Spezielle Formate (größere Kurse)
| Format | Beschreibung |
|---|---|
| **Stories** | Kurze interaktive Dialoge zum Lesen & Hören (Buch-Icon) |
| **DuoRadio** | Audio-Episoden mit Duolingo-Charakteren (Kopfhörer-Icon) |
| **Adventures** | Immersive Erlebnisse |
| **Video Call with Lily** | GPT-4-basierter Chatbot für Konversation (nur Max-Abo) |
| **Roleplay** | Konversationsübungen mit KI-Charakteren (nur Max-Abo) |

### Progression der Schwierigkeit innerhalb einer Unit
Die Übungen werden **innerhalb einer Unit progressiv schwieriger**:
1. Erst: Neues Wort **erkennen** (Bild-Zuordnung, Multiple Choice)
2. Dann: Wort in Kontext **verstehen** (Lückentext, Zuordnung)
3. Zuletzt: Wort **selbst produzieren** (Tippen, Sprechen)

---

## 3. Progressionssystem

### XP (Experience Points)
- **Lektion abgeschlossen**: 20 XP
- **Combo Bonus**: Bis zu 5 zusätzliche XP für Serien korrekter Antworten
- **Practice-Lektion**: 10 XP + Combo Bonus
- **Review einer abgeschlossenen Lektion**: 5 XP
- **Unit-Skip-Test**: 50 XP
- **Story abgeschlossen**: 14-28 XP (je nach Set)
- **2x XP Boost**: 15-Minuten-Verdoppelung nach Abschluss einer Unit

### Duolingo Score
- Trackt den **Gesamtfortschritt** im Kurs
- Wird nach Abschluss von Unit 1 angezeigt (neben dem Flaggen-Icon)
- Ermöglicht Vergleich mit Freunden und zwischen verschiedenen Sprachen

### Crowns (historisch, teilweise noch aktiv)
- Jeder Skill hatte **6 Crown Levels** (0-5 + Legendary)
- Level 0 = Grau → Level 1 = Blau → Level 2 = Grün → Level 3 = Rot → Level 4 = Orange → Level 5 = Gold
- Ab Crown Level 5: Skill konnte "cracken" (spaced repetition)
- **Legendary Level**: 4-8 Challenges ohne Fehlertoleranz (max. 3 Fehler), für Free-User 100 Gems pro Challenge

### Aktuelles System (Path)
- Das Crown-System wurde mit dem Path größtenteils abgelöst
- Stattdessen: **Linearer Fortschritt** durch Sections und Units
- Practice/Review ist in den Pfad integriert statt optional

---

## 4. Gamification — Das Herzstück von Duolingo

### Hearts / Energy (Fehlerlimit)
- **5 Hearts** zu Beginn
- **1 Heart verloren** pro Fehler in einer Lektion
- **0 Hearts = Session unterbrochen**, keine neuen Lektionen möglich
- **Heart zurückgewinnen**: 
  - 6 Stunden warten (automatische Regeneration)
  - Practice-Lektion absolvieren
  - Werbung anschauen
  - 650 Gems für komplette Auffüllung
- **Super Duolingo**: Unbegrenzte Hearts (Hauptverkaufsargument!)
- **Ab Mai 2025**: Hearts durch "Energy"-System ersetzt (gleiche Mechanik, neuer Name)

**Design-Absicht**: Hearts verhindern, dass Nutzer zu schnell und zu unachtsam durch den Kurs rasen. Sie erzwingen Aufmerksamkeit und belohnen das Wiederholen.

### Streaks (Tägliche Serien)
- **Zähler**: Anzahl aufeinanderfolgender Tage mit mind. 1 abgeschlossener Lektion
- **Streak Freeze**: Kann im Shop gekauft werden, schützt 1 Tag Inaktivität
- **Perfect Weeks**: 7 Tage am Stück → Spezielle Markierung im Kalender
- **Friend Streaks**: Gemeinsamer Streak mit Freunden (bis zu 5)
- **Streak Restoration**: Bei Verlust hat man 3 Tage, um durch spezielle Lektionen den Streak wiederherzustellen
- **Streak Society**: Exklusiver Club, freigeschaltet ab 7 Tagen, weitere Belohnungen bei 30, 100, 365 Tagen
- **Streak Milestones**: Bei bestimmten Meilensteinen (z.B. 100 Tage) → 3 Tage gratis Super Duolingo
- **Ab 800+ Tagen**: Milestone alle 25 Tage

**Warum es funktioniert**: Der Streak nutzt **Loss Aversion** — Menschen hassen es mehr, einen Streak zu verlieren, als sie sich über den Gewinn eines neuen Tages freuen. Das erzeugt tägliche Gewohnheiten.

### Gems (In-App-Währung)
- Verdient durch Lektionen, Achievements, Challenges
- Verwendung im **Shop**: Streak Freezes, Heart Refills, Timer Boosts, kosmetische Items
- Ersetzten die früheren "Lingots"

### Leagues / Leaderboards
- **10 Ligen**: Bronze → Silber → Gold → Saphir → Rubin → Smaragd → Amethyst → Perle → Obsidian → **Diamant**
- **Wöchentliche Wettbewerbe**: Jeden Sonntag beginnt eine neue Runde
- **Matching**: Nutzer mit ähnlichen Lerngewohnheiten und Zeitzonen werden zusammengeworfen
- **Aufstieg**: Top-Performer steigen auf, Bottom-Performer steigen ab
- **Diamond Tournament**: Top 10 der Diamant-Liga qualifizieren sich (Viertelfinale → Halbfinale → Finale)
- **Cross-Language**: Man konkurriert mit Lernern ALLER Sprachen, nicht nur der eigenen
- **Opt-out möglich**: In den Einstellungen deaktivierbar

### Achievements / Badges
- Freigeschaltet durch bestimmte Meilensteine (XP-Summen, Streak-Länge, Kursfortschritt)
- Sichtbar auf dem Profil

### Weitere Social Features
- **Friends Quest**: Kooperative Aufgaben mit Freunden
- **Feed**: News-Feed mit Updates von Freunden und Duolingo
- **Nudges**: Freunde zum Lernen ermutigen
- **Double or Nothing**: Wette auf 7/14/30 Tage Streak

---

## 5. Spaced Repetition

### Wie es funktioniert
Duolingo nutzt Spaced Repetition auf mehreren Ebenen:

1. **Innerhalb einer Lektion**: Fehler werden am Ende der Lektion nochmal abgefragt (kurzer Abstand)
2. **Personalized Practice Lessons**: Algorithmus wählt Wörter/Grammatik aus, die bald vergessen werden könnten, basierend auf:
   - **Zeitpunkt der letzten Übung** (länger her → höhere Priorität)
   - **Fehlerhistorie** (oft falsch → häufiger wiederholen)
   - **Schwierigkeit** (schwieriges Material → engere Intervalle)
3. **In den Pfad integriert**: Practice Lessons erscheinen als reguläre Stationen im Lernpfad

### Historisch: Cracked Skills
- Im alten Tree-System konnten Skills auf Level 5 (Gold) **"cracken"** — visuelle Risse erschienen
- Bedeutung: Es ist Zeit, diesen Skill zu wiederholen
- Basierte auf der Ebbinghaus'schen Vergessenskurve
- Im neuen Path-System: Reviews sind direkt eingebaut statt visuell angezeigt

### Practice Hub
Der Practice Hub bietet gezielte Übungsmöglichkeiten:
- **Mistakes**: Frühere Fehler gezielt wiederholen
- **Words**: Empfohlene Vokabeln zum Festigen
- **Speak**: Sprechübungen
- **Listen**: Hörübungen
- Seit 2025 **kostenlos für alle** (vorher nur Super-Nutzer)

---

## 6. Fehler-Handling

### Sofortiges Feedback
1. **Richtige Antwort**: Grüner Balken, kurze Bestätigung, weiter
2. **Falsche Antwort**: Roter Balken, korrekte Antwort wird angezeigt
3. **Heart-Verlust**: 1 Heart wird abgezogen (bei 0 → Session-Ende)

### Wiederholung von Fehlern
- **End-of-Lesson Review**: Alle in der Lektion falsch beantworteten Fragen werden am Ende nochmal gestellt
- **Spaced Repetition**: Fehlerhaftes Material taucht in zukünftigen Practice-Lektionen häufiger auf
- **Practice Hub "Mistakes"**: Dedizierter Bereich zum gezielten Üben früherer Fehler

### "Explain My Answer" (neu, kostenlos seit 2025)
- GPT-basierte Erklärung, WARUM eine Antwort falsch/richtig war
- War früher nur für Max-Abonnenten, jetzt für alle
- Erklärt Grammatikregeln im Kontext der spezifischen Übung

### Toleranz
- Tippfehler werden teilweise akzeptiert (leichte Abweichungen)
- Bei Übersetzungen werden oft mehrere korrekte Varianten akzeptiert
- Kommentarfunktion war früher möglich (Sentence Discussions), wurde inzwischen geschlossen

---

## 7. Besonderheiten — Was macht Duolingo einzigartig?

### Erfolgsfaktoren

1. **Kostenlos & Zugänglich**: Vollständiger Kurs gratis nutzbar, Monetarisierung über Premium-Features
2. **Gamification First**: Sprachen lernen fühlt sich an wie ein Mobile Game, nicht wie Schulunterricht
3. **Bite-Sized Lessons**: 3-8 Minuten pro Lektion — perfekt für Leerzeit (Pendeln, Pause, vor dem Schlafen)
4. **Character-driven**: Duo (die Eule) + Cast von Charakteren (Lily, Zari, etc.) schaffen emotionale Bindung
5. **Social Pressure**: Streaks, Leagues, Friend Quests — Peer Pressure als Motivator
6. **Aggressives Marketing**: Push-Notifications sind berühmt-berüchtigt ("These notifications will stop when you start your lesson" 😈)
7. **Data-Driven**: Massives A/B-Testing (113M+ monatlich aktive Nutzer als Datenbasis)
8. **Personalisierung**: Algorithmus passt Schwierigkeit und Wiederholung individuell an
9. **Multi-Plattform**: iOS, Android, Web — Fortschritt überall synchronisiert

### Wissenschaftliche Basis
- Eigenes Research-Team
- Studien zeigen: 5 Sections Duolingo ≈ 5 Semester Uni-Sprachunterricht (laut Duolingo's eigener Forschung)
- Basiert auf Spaced Repetition, Active Recall, Comprehensible Input

### Skalierung
- 40+ Sprachen
- 100+ Kurse
- Expandiert in Music, Math, Chess
- 113M+ monatlich aktive Nutzer (Q3 2024)

---

## 8. Schwächen & Kritik

### Gamification > Lernen?
- **XP-Farming**: Nutzer optimieren für XP statt für Lernen (einfache Lektionen wiederholen, Leaderboard-Gaming)
- **Streak-Obsession**: Tägliches Minimum für Streak ≠ effektives Lernen; viele machen nur das absolute Minimum
- **League-Druck**: Kann zu Burnout führen oder zum Fokus auf Quantität statt Qualität

### Fehlende Grammatik-Erklärungen
- **Implizites Lernen**: Duolingo setzt auf "Learning by Doing" statt explizite Grammatik-Erklärungen
- Früher gab es "Tips & Notes" vor jeder Lektion — wurden entfernt
- "Explain My Answer" (GPT-basiert) ist ein Kompromiss, aber reaktiv statt proaktiv
- Für analytische Lerner frustrierend — man versteht die REGELN nicht, sondern nur die Beispiele

### Begrenzte Sprachkompetenz
- **Stark**: Lesen, Hören, Vokabeln erkennen
- **Schwach**: Freies Sprechen, Schreiben, reale Konversation
- Geübte Patterns ≠ flexible Sprachproduktion
- Satz-Übersetzung ≠ freie Kommunikation

### Heart-System (kontrovers)
- Free-User werden durch Hearts stark eingeschränkt
- Fühlt sich wie "Pay-to-Learn" an für viele Nutzer
- Wird als manipulativ empfunden: "Duolingo bestraft dich für Fehler beim Lernen"

### Path-Umstellung (2022)
- **Massiver Backlash**: Reddit, Twitter, YouTube — fast durchweg negativ
- Verlust von Flexibilität: Kann nicht mehr frei zwischen Skills wählen
- Fortschrittsverlust: Vielen Nutzern wurde der Kursfortschritt beim Update zurückgesetzt
- Duolingo-Aktie fiel 23% im Monat nach der Umstellung
- Luis von Ahn: "Die alte Version kommt nie zurück" (zu teuer, zwei Systeme zu pflegen)

### Kursqualität variiert stark
- Top-Kurse (Spanisch, Französisch): Stories, DuoRadio, Podcasts, tiefe Kurse
- Kleinere Kurse: Weniger Inhalte, weniger Übungstypen, kein Audio in nativer Qualität
- Kein Farsi-Kurs verfügbar!

### Weitere Kritikpunkte
- Übersetzungs-basiertes Lernen fördert mentale Übersetzung statt direktes Denken in der Zielsprache
- Kontextlose Sätze ("The elephant drinks coffee") — nicht alltagstauglich
- Keine kulturelle Tiefe
- Community-Features wurden reduziert (Foren geschlossen, Sentence Discussions geschlossen)

---

## 9. Duolingo für Schrift-basierte Sprachen

### Welche Schriftsysteme werden unterstützt?
Duolingo hat spezielle Tools für 10 Sprachen mit nicht-lateinischen Schriften:
- **Alphabetisch**: Russisch, Ukrainisch, Griechisch (Kyrillisch/Griechisch)
- **Silbenbasiert**: Koreanisch (Hangeul)
- **Rechts-nach-Links**: Arabisch, Hebräisch, Jiddisch
- **Mischsysteme**: Japanisch (Hiragana, Katakana, Kanji), Hindi (Devanagari)

### Wie werden Schriftsysteme gelehrt?

#### Arabisch (am relevantesten für Farsi)
1. **Referenz-Chart**: Übersicht aller Buchstaben und ihrer Formen
2. **Spezielle Schrift-Lektionen**: Dedicated Lessons für die Buchstabenformen
3. **Tracing-Übungen**: Mit dem Finger die Buchstabenform nachzeichnen (!) — haptisches Lernen
4. **Positionsformen**: Buchstabe am Anfang/Mitte/Ende eines Wortes (da sich die Form ändert)
5. **Rechts-nach-Links**: Die gesamte UI passt sich an
6. **Reading Tab**: Separater Tab für Leseübungen

#### Probleme bei Arabisch (relevant für Farsi)
- **Kurze Vokale nicht geschrieben**: Arabisch schreibt normalerweise keine kurzen Vokale — Anfänger müssen raten
- **Kontextuelle Buchstabenformen**: Jeder Buchstabe hat 4 Formen (isoliert, Anfang, Mitte, Ende)
- **Grammatik ist komplex**: Gender-Formen bei Verben, die kontextabhängig sind
- Duolingo löst das Kontextproblem durch **eingeführte Namen**: "Wo wohnst du, Rania?" (= weiblich) vs. "Hast du eine Katze, Omar?" (= männlich)

#### Koreanisch
- Spezielle Lektionen für **Silbenblöcke** (Hangeul)
- Verschiedene Block-Muster (horizontal, vertikal, gemischt)
- Chart + Übungen zum Erkennen von Lauten und Silben

#### Japanisch
- Separate Lessons für Hiragana, Katakana
- Kanji werden progressiv eingeführt
- Reading Tab für dedizierte Leseübung

#### Hindi
- Devanagari-Buchstaben lernen
- Besonderer Fokus auf ähnliche Laute (verschiedene "t" und "d" Sounds)
- Konsonant-Vokal-Kombinationen als Einheiten

### Generelles Pattern
1. **Dedicated Introduction**: Schrift wird SEPARAT eingeführt, bevor Sprache gelehrt wird
2. **Reference Chart**: Immer verfügbar
3. **Reading Tab**: Separater Bereich für Leseübungen
4. **Progressive Integration**: Nach Schrift-Einführung wird die Schrift in regulären Lektionen verwendet
5. **Transliteration als Brücke**: Viele Kurse zeigen anfangs lateinische Umschrift parallel

### Implikationen für Farsi-App (YAD)
- **Farsi nutzt das persische Alphabet** (modifiziertes Arabisch) — Duolingos Arabisch-Ansatz ist direkt übertragbar
- **Rechts-nach-Links** muss in der gesamten UI unterstützt werden
- **Tracing/Handwriting** ist ein starkes Feature für Schrift-Lernende
- **Buchstabenformen** (isoliert, Anfang, Mitte, Ende) müssen explizit gelehrt werden
- **Vokalisierung** (Harakat/Diakritika) sollte für Anfänger angezeigt werden
- **Persisch-spezifische Buchstaben** (پ, چ, ژ, گ) — nicht im Arabischen enthalten — müssen extra eingeführt werden
- **Ezafe-Konstruktion** ist eine persisch-spezifische Grammatik-Herausforderung, die Duolingo nicht abdeckt

---

## 10. Zusammenfassung: Lessons Learned für YAD

### Von Duolingo übernehmen ✅
- **Bite-Sized Lessons** (3-8 Minuten)
- **Spaced Repetition** algorithmisch eingebaut
- **Progressive Schwierigkeit** innerhalb einer Unit (erkennen → verstehen → produzieren)
- **Sofortiges Feedback** bei jeder Übung
- **Fehler am Ende der Lektion wiederholen**
- **Vielfältige Übungstypen** (nicht nur Übersetzen)
- **Schrift-Einführung** als dedizierte Phase mit Tracing
- **Streak als Habit-Builder** (aber nicht als Hauptmotivator)

### Besser machen 🎯
- **Explizite Grammatik-Erklärungen** VOR der Übung, nicht nur bei Fehlern
- **Kontextuelle Sätze** statt absurder Beispiele
- **Kulturelle Einbettung** — Persische Literatur, Poesie, Alltagskultur
- **Keine Hearts/Energy** — Fehler sind Lernchancen, kein Bestrafungssystem
- **Freies Sprechen** als Kernfeature, nicht nur Nachsprechen
- **Flexiblere Progression** — Path als Default, aber Möglichkeit, Themen frei zu wählen
- **Schrift-spezifisch**: Ezafe, persische Extra-Buchstaben, Kolloquial vs. Formell
- **Kein XP-Gaming** — Fortschritt an tatsächlichem Können messen, nicht an Punkte-Sammlung

### Duolingo hat KEIN Farsi 🚀
- Das ist die Marktlücke! Duolingo bietet keinen Farsi-Kurs
- Die ~110M Farsi-Sprecher weltweit (+ Diaspora) sind unterversorgt
- Persisch hat einzigartige Aspekte (Ezafe, Taarof, Poesie-Tradition), die eine spezialisierte App besser bedienen kann
