import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Get admin user
  const admin = await prisma.user.findUnique({ where: { email: "admin@ielts.az" } });
  if (!admin) throw new Error("Admin user not found. Run seed first.");

  console.log("Seeding IELTS 16 Test 1...");

  // ============================================
  // 1. LISTENING TEST
  // ============================================
  const listeningTest = await prisma.test.upsert({
    where: { id: "ielts16-listening-test1" },
    update: {},
    create: {
      id: "ielts16-listening-test1",
      title: "IELTS 16 - Test 1 Listening",
      type: "LISTENING",
      description: "Cambridge IELTS 16 Academic - Test 1 Listening. 4 parts, 40 questions.",
      createdById: admin.id,
      isActive: true,
      duration: 30,
    },
  });

  // Audio files
  await prisma.audioFile.deleteMany({ where: { testId: listeningTest.id } });
  await prisma.audioFile.createMany({
    data: [
      { testId: listeningTest.id, filePath: "/uploads/ielts16-test1-part1.mp3", section: 1, order: 1 },
      { testId: listeningTest.id, filePath: "/uploads/ielts16-test1-part2.mp3", section: 2, order: 2 },
      { testId: listeningTest.id, filePath: "/uploads/ielts16-test1-part3.mp3", section: 3, order: 3 },
      { testId: listeningTest.id, filePath: "/uploads/ielts16-test1-part4.mp3", section: 4, order: 4 },
    ],
  });

  // Delete old questions
  await prisma.question.deleteMany({ where: { testId: listeningTest.id } });

  // PART 1: Questions 1-10 (Note Completion)
  const listeningPart1 = [
    { q: "Create a cover for an _______ so they can drop it from a height without breaking it.", a: "egg" },
    { q: "Take part in a competition to build the tallest _______ .", a: "tower" },
    { q: "Make a _______ powered by a balloon.", a: "car" },
    { q: "Build model cars, trucks and _______ and learn how to program them so they can move.", a: "animals" },
    { q: "Take part in a competition to build the longest _______ using card and wood.", a: "bridge" },
    { q: "Create a short _______ with special software.", a: "movie" },
    { q: "Build, _______ and program a humanoid robot.", a: "decorate" },
    { q: "Held on _______ from 10 am to 11 am", a: "Wednesdays" },
    { q: "Building 10A, _______ Industrial Estate, Grasford", a: "Fradstone" },
    { q: "Plenty of _______ is available.", a: "parking" },
  ];

  for (let i = 0; i < listeningPart1.length; i++) {
    await prisma.question.create({
      data: {
        testId: listeningTest.id,
        questionText: listeningPart1[i].q,
        questionType: "NOTE_COMPLETION",
        correctAnswer: listeningPart1[i].a,
        section: 1,
        order: i + 1,
        points: 1,
      },
    });
  }

  // PART 2: Questions 11-14 (Multiple Choice)
  const listeningPart2MC = [
    {
      q: "Stevenson's was founded in",
      opts: ["1923", "1924", "1926"],
      a: "C",
    },
    {
      q: "Originally, Stevenson's manufactured goods for",
      opts: ["the healthcare industry", "the automotive industry", "the machine tools industry"],
      a: "A",
    },
    {
      q: "What does the speaker say about the company premises?",
      opts: ["The company has recently moved.", "The company has no plans to move.", "The company is going to move shortly."],
      a: "B",
    },
    {
      q: "The programme for the work experience group includes",
      opts: ["time to do research.", "meetings with a teacher.", "talks by staff."],
      a: "C",
    },
  ];

  for (let i = 0; i < listeningPart2MC.length; i++) {
    await prisma.question.create({
      data: {
        testId: listeningTest.id,
        questionText: listeningPart2MC[i].q,
        questionType: "MULTIPLE_CHOICE",
        options: listeningPart2MC[i].opts,
        correctAnswer: listeningPart2MC[i].a,
        section: 2,
        order: 11 + i,
        points: 1,
      },
    });
  }

  // PART 2: Questions 15-20 (Matching - Map labeling)
  const listeningPart2Map = [
    { q: "coffee room", a: "H" },
    { q: "warehouse", a: "C" },
    { q: "staff canteen", a: "G" },
    { q: "meeting room", a: "B" },
    { q: "human resources", a: "I" },
    { q: "boardroom", a: "A" },
  ];

  for (let i = 0; i < listeningPart2Map.length; i++) {
    await prisma.question.create({
      data: {
        testId: listeningTest.id,
        questionText: listeningPart2Map[i].q,
        questionType: "MATCHING",
        options: ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"],
        correctAnswer: listeningPart2Map[i].a,
        section: 2,
        order: 15 + i,
        points: 1,
        imageUrl: "/uploads/ielts16-t1-stevenson-map.png",
      },
    });
  }

  // PART 3: Questions 21-22 (Multiple Choice - choose TWO)
  await prisma.question.create({
    data: {
      testId: listeningTest.id,
      questionText: "Which TWO parts of the introductory stage to their art projects do Jess and Tom agree were useful?",
      questionType: "MULTIPLE_CHOICE",
      options: ["the Bird Park visit", "the workshop sessions", "the Natural History Museum visit", "the projects done in previous years", "the handouts with research sources"],
      correctAnswer: "C,E",
      section: 3,
      order: 21,
      points: 2,
    },
  });

  // PART 3: Questions 23-24 (Multiple Choice - choose TWO)
  await prisma.question.create({
    data: {
      testId: listeningTest.id,
      questionText: "In which TWO ways do both Jess and Tom decide to change their proposals?",
      questionType: "MULTIPLE_CHOICE",
      options: ["by giving a rationale for their action plans", "by being less specific about the outcome", "by adding a video diary presentation", "by providing a timeline and a mind map", "by making their notes more evaluative"],
      correctAnswer: "B,E",
      section: 3,
      order: 23,
      points: 2,
    },
  });

  // PART 3: Questions 25-30 (Matching)
  const listeningPart3Match = [
    { q: "Falcon (Landseer)", a: "D" },
    { q: "Fish hawk (Audubon)", a: "C" },
    { q: "Kingfisher (van Gogh)", a: "A" },
    { q: "Portrait of William Wells", a: "H" },
    { q: "Vairumati (Gauguin)", a: "F" },
    { q: "Portrait of Giovanni de Medici", a: "G" },
  ];

  for (let i = 0; i < listeningPart3Match.length; i++) {
    await prisma.question.create({
      data: {
        testId: listeningTest.id,
        questionText: listeningPart3Match[i].q,
        questionType: "MATCHING",
        options: ["a childhood memory", "hope for the future", "fast movement", "a potential threat", "the power of colour", "the continuity of life", "protection of nature", "a confused attitude to nature"],
        correctAnswer: listeningPart3Match[i].a,
        section: 3,
        order: 25 + i,
        points: 1,
      },
    });
  }

  // PART 4: Questions 31-40 (Note Completion)
  const listeningPart4 = [
    { q: "Stoicism is still relevant today because of its _______ appeal.", a: "practical" },
    { q: "The Stoics' ideas are surprisingly well known, despite not being intended for _______ .", a: "publication" },
    { q: "Epictetus said that external events cannot be controlled but the _______ people make in response can be controlled.", a: "choices" },
    { q: "A Stoic is someone who has a different view on experiences which others would consider as _______ .", a: "negative" },
    { q: "George Washington organised a _______ about Cato to motivate his men.", a: "play" },
    { q: "Adam Smith's ideas on _______ were influenced by Stoicism.", a: "capitalism" },
    { q: "Cognitive Behaviour Therapy (CBT) – the treatment for _______ is based on ideas from Stoicism", a: "depression" },
    { q: "people learn to base their thinking on _______ .", a: "logic" },
    { q: "In business, people benefit from Stoicism by identifying obstacles as _______ .", a: "opportunity" },
    { q: "It requires a lot of _______ but Stoicism can help people to lead a good life.", a: "practice" },
  ];

  for (let i = 0; i < listeningPart4.length; i++) {
    await prisma.question.create({
      data: {
        testId: listeningTest.id,
        questionText: listeningPart4[i].q,
        questionType: "NOTE_COMPLETION",
        correctAnswer: listeningPart4[i].a,
        section: 4,
        order: 31 + i,
        points: 1,
      },
    });
  }

  console.log("  Listening test created with 40 questions + 4 audio files");

  // ============================================
  // 2. READING TEST
  // ============================================
  const readingTest = await prisma.test.upsert({
    where: { id: "ielts16-reading-test1" },
    update: {},
    create: {
      id: "ielts16-reading-test1",
      title: "IELTS 16 - Test 1 Reading",
      type: "READING",
      description: "Cambridge IELTS 16 Academic - Test 1 Reading. 3 passages, 40 questions.",
      createdById: admin.id,
      isActive: true,
      duration: 60,
    },
  });

  await prisma.question.deleteMany({ where: { testId: readingTest.id } });

  // --- PASSAGE 1: "Why we need to protect polar bears" ---
  const passage1Text = `Polar bears are being increasingly threatened by the effects of climate change, but their disappearance could have far-reaching consequences. They are uniquely adapted to the extreme conditions of the Arctic Circle, where temperatures can reach −40°C. One reason for this is that they have up to 11 centimetres of fat underneath their skin. Humans with comparative levels of adipose tissue would be considered obese and would be likely to suffer from diabetes and heart disease. Yet the polar bear experiences no such consequences.

A 2014 study by Shi Ping Liu and colleagues sheds light on this mystery. They compared the genetic structure of polar bears with that of their closest relatives from a warmer climate, the brown bears. This allowed them to determine the genes that have allowed polar bears to survive in one of the toughest environments on Earth. Liu and his colleagues found the polar bears had a gene known as APoB, which reduces levels of low-density lipoproteins (LDLs) – a form of 'bad' cholesterol. In humans, mutations of this gene are associated with increased risk of heart disease. Polar bears may therefore be an important study model to understand heart disease in humans.

The genome of the polar bear may also provide the solution for another condition, one that particularly affects our older generation: osteoporosis. This is a disease where bones show reduced density, usually caused by insufficient exercise, reduced calcium intake or food starvation. Bone tissue is constantly being remodelled, meaning that bone is added or removed, depending on nutrient availability and the stress that the bone is under. Female polar bears, however, undergo extreme conditions during every pregnancy. Once autumn comes around, these females will dig maternity dens in the snow and will remain there throughout the winter, both before and after the birth of their cubs. This process results in about six months of fasting, where the female bears have to keep themselves and their cubs alive, depleting their own calcium and calorie reserves. Despite this, their bones remain strong and dense.

Physiologists Alanda Lennox and Allen Goodship found an explanation for this paradox in 2008. They discovered that pregnant bears were able to increase the density of their bones before they started to build their dens. In addition, six months later, when they finally emerged from the den with their cubs, there was no evidence of significant loss of bone density. Hibernating brown bears do not have this capacity and must therefore resort to major bone reformation in the following spring. If the mechanism of bone remodelling in polar bears can be understood, many bedridden humans, and even astronauts, could potentially benefit.

The medical benefits of the polar bear for humanity certainly have their importance in our conservation efforts, but these should not be the only factors taken into consideration. We tend to want to protect animals we think are intelligent and possess emotions, such as elephants and primates. Bears, on the other hand, seem to be perceived as stupid and in many cases violent. And yet anecdotal evidence from the field challenges those assumptions, suggesting for example that polar bears have good problem-solving abilities. A male bear called GoGo in Tennoji Zoo, Osaka, has even been observed making use of a tool to manipulate his environment. The bear used a tree branch on multiple occasions to dislodge a piece of meat hung out of his reach. Problem-solving ability has also been witnessed in wild polar bears, although not as obviously as with GoGo. A calculated move by a male bear involved running and jumping onto barrels in an attempt to get to a photographer standing on a platform four metres high.

In other studies, such as one by Alison Ames in 2008, polar bears showed deliberate and focussed manipulation. For example, Ames observed bears putting objects in piles and then knocking them over in what appeared to be a game. The study demonstrates that bears are capable of agile and thought-out behaviours. These examples suggest bears have greater creativity and problem-solving abilities than previously thought.

As for emotions, while the evidence is once again anecdotal, many bears have been seen to hit out at ice and snow – seemingly out of frustration – when they have just missed out on a kill. Moreover, polar bears can form unusual relationships with other species, including playing with the dogs used to pull sleds in the Arctic. Remarkably, one hand-raised polar bear called Agee has formed a close relationship with her owner Mark Dumas to the point where they even swim together. This is even more astonishing since polar bears are known to actively hunt humans in the wild.

If climate change were to lead to their extinction, this would mean not only the loss of potential breakthroughs in human medicine, but more importantly, the disappearance of an intelligent, majestic animal.`;

  // Passage 1 Questions 1-7: TRUE/FALSE/NOT GIVEN
  const p1TF = [
    { q: "Polar bears suffer from various health problems due to the build-up of fat under their skin.", a: "FALSE" },
    { q: "The study done by Liu and his colleagues compared different groups of polar bears.", a: "FALSE" },
    { q: "Liu and colleagues were the first researchers to compare polar bears and brown bears genetically.", a: "NOT GIVEN" },
    { q: "Polar bears are able to control their levels of 'bad' cholesterol by genetic means.", a: "TRUE" },
    { q: "Female polar bears are able to survive for about six months without food.", a: "TRUE" },
    { q: "It was found that the bones of female polar bears were very weak when they came out of their dens in spring.", a: "FALSE" },
    { q: "The polar bear's mechanism for increasing bone density could also be used by people one day.", a: "TRUE" },
  ];

  for (let i = 0; i < p1TF.length; i++) {
    await prisma.question.create({
      data: {
        testId: readingTest.id,
        questionText: p1TF[i].q,
        questionType: "TRUE_FALSE_NG",
        options: ["TRUE", "FALSE", "NOT GIVEN"],
        correctAnswer: p1TF[i].a,
        section: 1,
        passageText: i === 0 ? passage1Text : null,
        passageTitle: i === 0 ? "Why we need to protect polar bears" : null,
        order: i + 1,
        points: 1,
      },
    });
  }

  // Passage 1 Questions 8-13: Note completion
  const p1NC = [
    { q: "People think of bears as unintelligent and _______ .", a: "violent" },
    { q: "In Tennoji Zoo, a bear has been seen using a branch as a _______ .", a: "tool" },
    { q: "This allowed him to knock down some _______ .", a: "meat" },
    { q: "A wild polar bear worked out a method of reaching a platform where a _______ was located.", a: "photographer" },
    { q: "Polar bears have displayed behaviour such as conscious manipulation of objects and activity similar to a _______ .", a: "game" },
    { q: "They may make movements suggesting _______ if disappointed when hunting.", a: "frustration" },
  ];

  for (let i = 0; i < p1NC.length; i++) {
    await prisma.question.create({
      data: {
        testId: readingTest.id,
        questionText: p1NC[i].q,
        questionType: "NOTE_COMPLETION",
        correctAnswer: p1NC[i].a,
        section: 1,
        order: 8 + i,
        points: 1,
      },
    });
  }

  // --- PASSAGE 2: "The Step Pyramid of Djoser" ---
  const passage2Text = `A The pyramids are the most famous monuments of ancient Egypt and still hold enormous interest for people in the present day. These grand, impressive tributes to the memory of the Egyptian kings have become linked with the country even though other cultures, such as the Chinese and Mayan, also built pyramids. The evolution of the pyramid form has been written and argued about for centuries. However, there is no question that, as far as Egypt is concerned, it began with one monument to one king designed by one brilliant architect: the Step Pyramid of Djoser at Saqqara.

B Djoser was the first king of the Third Dynasty of Egypt and the first to build in stone. Prior to Djoser's reign, tombs were rectangular monuments made of dried clay brick, which covered underground passages where the deceased person was buried. For reasons which remain unclear, Djoser's main official, whose name was Imhotep, conceived of building a taller, more impressive tomb for his king by stacking stone slabs on top of one another, progressively making them smaller, to form the shape now known as the Step Pyramid. Djoser is thought to have reigned for 19 years, but some historians and scholars attribute a much longer time for his rule, owing to the number and size of the monuments he built.

C The Step Pyramid has been thoroughly examined and investigated over the last century, and it is now known that the building process went through many different stages. Historian Marc Van de Mieroop comments on this, writing 'Much experimentation was involved, which is especially clear in the construction of the pyramid in the center of the complex. It had several plans … before it became the first Step Pyramid in history, piling six levels on top of one another … The weight of the enormous mass was a challenge for the builders, who placed the stones at an inward incline in order to prevent the monument breaking up.'

D When finally completed, the Step Pyramid rose 62 meters high and was the tallest structure of its time. The complex in which it was built was the size of a city in ancient Egypt and included a temple, courtyards, shrines, and living quarters for the priests. It covered a region of 16 hectares and was surrounded by a wall 10.5 meters high. The wall had 13 false doors cut into it with only one true entrance cut into the south-east corner; the entire wall was then ringed by a trench 750 meters long and 40 meters wide. The false doors and the trench were incorporated into the complex to discourage unwanted visitors. If someone wished to enter, he or she would have needed to know in advance how to find the location of the true opening in the wall. Djoser was so proud of his accomplishment that he broke the tradition of having only his own name on the monument and had Imhotep's name carved on it as well.

E The burial chamber of the tomb, where the king's body was laid to rest, was dug beneath the base of the pyramid, surrounded by a vast maze of long tunnels that had rooms off them to discourage robbers. One of the most mysterious discoveries found inside the pyramid was a large number of stone vessels. Over 40,000 of these vessels, of various forms and shapes, were discovered in storerooms off the pyramid's underground passages. They are inscribed with the names of rulers from the First and Second Dynasties of Egypt and made from different kinds of stone. There is no agreement among scholars and archaeologists on why the vessels were placed in the tomb of Djoser or what they were supposed to represent. The archaeologist Jean-Philippe Lauer, who excavated most of the pyramid and complex, believes they were originally stored and then given a 'proper burial' by Djoser in his pyramid to honor his predecessors. There are other historians, however, who claim the vessels were dumped into the shafts as yet another attempt to prevent grave robbers from getting to the king's burial chamber.

F Unfortunately, all of the precautions and intricate design of the underground network did not prevent ancient robbers from finding a way in. Djoser's grave goods, and even his body, were stolen at some point in the past and all archaeologists found were a small number of his valuables overlooked by the thieves. There was enough left throughout the pyramid and its complex, however, to astonish and amaze the archaeologists who excavated it.

G Egyptologist Miroslav Verner writes, 'Few monuments hold a place in human history as significant as that of the Step Pyramid in Saqqara … It can be said without exaggeration that this pyramid complex constitutes a milestone in the evolution of monumental stone architecture in Egypt and in the world as a whole.' The Step Pyramid was a revolutionary advance in architecture and became the archetype which all the other great pyramid builders of Egypt would follow.`;

  // Passage 2 Questions 14-20: Matching headings
  const p2Headings = [
    { q: "Paragraph A", a: "iv" },
    { q: "Paragraph B", a: "vii" },
    { q: "Paragraph C", a: "ii" },
    { q: "Paragraph D", a: "v" },
    { q: "Paragraph E", a: "i" },
    { q: "Paragraph F", a: "viii" },
    { q: "Paragraph G", a: "vi" },
  ];

  for (let i = 0; i < p2Headings.length; i++) {
    await prisma.question.create({
      data: {
        testId: readingTest.id,
        questionText: p2Headings[i].q,
        questionType: "MATCHING",
        options: [
          "i - The areas and artefacts within the pyramid itself",
          "ii - A difficult task for those involved",
          "iii - A king who saved his people",
          "iv - A single certainty among other less definite facts",
          "v - An overview of the external buildings and areas",
          "vi - A pyramid design that others copied",
          "vii - An idea for changing the design of burial structures",
          "viii - An incredible experience despite the few remains",
          "ix - The answers to some unexpected questions",
        ],
        correctAnswer: p2Headings[i].a,
        section: 2,
        passageText: i === 0 ? passage2Text : null,
        passageTitle: i === 0 ? "The Step Pyramid of Djoser" : null,
        order: 14 + i,
        points: 1,
      },
    });
  }

  // Passage 2 Questions 21-24: Sentence completion
  const p2SC = [
    { q: "The complex that includes the Step Pyramid and its surroundings is considered to be as big as an Egyptian _______ of the past.", a: "city" },
    { q: "The area outside the pyramid included accommodation that was occupied by _______ , along with many other buildings and features.", a: "priests" },
    { q: "A wall ran around the outside of the complex and a number of false entrances were built into this. In addition, a long _______ encircled the wall.", a: "trench" },
    { q: "any visitors who had not been invited were cleverly prevented from entering the pyramid grounds unless they knew the _______ of the real entrance.", a: "location" },
  ];

  for (let i = 0; i < p2SC.length; i++) {
    await prisma.question.create({
      data: {
        testId: readingTest.id,
        questionText: p2SC[i].q,
        questionType: "SENTENCE_COMPLETION",
        correctAnswer: p2SC[i].a,
        section: 2,
        order: 21 + i,
        points: 1,
      },
    });
  }

  // Passage 2 Questions 25-26: Multiple choice (choose TWO)
  await prisma.question.create({
    data: {
      testId: readingTest.id,
      questionText: "Which TWO of the following points does the writer make about King Djoser?",
      questionType: "MULTIPLE_CHOICE",
      options: [
        "Initially he had to be persuaded to build in stone rather than clay.",
        "There is disagreement concerning the length of his reign.",
        "He failed to appreciate Imhotep's part in the design of the Step Pyramid.",
        "A few of his possessions were still in his tomb when archaeologists found it.",
        "He criticised the design and construction of other pyramids in Egypt.",
      ],
      correctAnswer: "B,D",
      section: 2,
      order: 25,
      points: 2,
    },
  });

  // --- PASSAGE 3: "The future of work" ---
  const passage3Text = `According to a leading business consultancy, 3–14% of the global workforce will need to switch to a different occupation within the next 10–15 years, and all workers will need to adapt as their occupations evolve alongside increasingly capable machines. Automation – or 'embodied artificial intelligence' (AI) – is one aspect of the disruptive effects of technology on the labour market. 'Disembodied AI', like the algorithms running in our smartphones, is another.

Dr Stella Pachidi from Cambridge Judge Business School believes that some of the most fundamental changes are happening as a result of the 'algorithmication' of jobs that are dependent on data rather than on production – the so-called knowledge economy. Algorithms are capable of learning from data to undertake tasks that previously needed human judgement, such as reading legal contracts, analysing medical scans and gathering market intelligence.

'In many cases, they can outperform humans,' says Pachidi. 'Organisations are attracted to using algorithms because they want to make choices based on what they consider is "perfect information", as well as to reduce costs and enhance productivity.'

'But these enhancements are not without consequences,' says Pachidi. 'If routine cognitive tasks are taken over by AI, how do professions develop their future experts?' she asks. 'One way of learning about a job is "legitimate peripheral participation" – a novice stands next to experts and learns by observation. If this isn't happening, then you need to find new ways to learn.'

Another issue is the extent to which the technology influences or even controls the workforce. For over two years, Pachidi monitored a telecommunications company. 'The way telecoms salespeople work is through personal and frequent contact with clients, using the benefit of experience to assess a situation and reach a decision. However, the company had started using a[n] … algorithm that defined when account managers should contact certain customers about which kinds of campaigns and what to offer them.'

The algorithm – usually built by external designers – often becomes the keeper of knowledge, she explains. In cases like this, Pachidi believes, a short-sighted view begins to creep into working practices whereby workers learn through the 'algorithm's eyes' and become dependent on its instructions. Alternative explorations – where experimentation and human instinct lead to progress and new ideas – are effectively discouraged.

Pachidi and colleagues even observed people developing strategies to make the algorithm work to their own advantage. 'We are seeing cases where workers feed the algorithm with false data to reach their targets,' she reports.

It's scenarios like these that many researchers are working to avoid. Their objective is to make AI technologies more trustworthy and transparent, so that organisations and individuals understand how AI decisions are made. In the meantime, says Pachidi, 'We need to make sure we fully understand the dilemmas that this new world raises regarding expertise, occupational boundaries and control.'

Economist Professor Hamish Low believes that the future of work will involve major transitions across the whole life course for everyone: 'The traditional trajectory of full-time education followed by full-time work followed by a pensioned retirement is a thing of the past,' says Low. Instead, he envisages a multistage employment life: one where retraining happens across the life course, and where multiple jobs and no job happen by choice at different stages.

On the subject of job losses, Low believes the predictions are founded on a fallacy: 'It assumes that the number of jobs is fixed. If in 30 years, half of 100 jobs are being carried out by robots, that doesn't mean we are left with just 50 jobs for humans. The number of jobs will increase: we would expect there to be 150 jobs.'

Dr Ewan McGaughey, at Cambridge's Centre for Business Research and King's College London, agrees that 'apocalyptic' views about the future of work are misguided. 'It's the laws that restrict the supply of capital to the job market, not the advent of new technologies that causes unemployment.'

His recently published research answers the question of whether automation, AI and robotics will mean a 'jobless future' by looking at the causes of unemployment. 'History is clear that change can mean redundancies. But social policies can tackle this through retraining and redeployment.'

He adds: 'If there is going to be change to jobs as a result of AI and robotics then I'd like to see governments seizing the opportunity to improve policy to enforce good job security. We can "reprogramme" the law to prepare for a fairer future of work and leisure.' McGaughey's findings are a call to arms to leaders of organisations, governments and banks to pre-empt the coming changes with bold new policies that guarantee full employment, fair incomes and a thriving economic democracy.

'The promises of these new technologies are astounding. They deliver humankind the capacity to live in a way that nobody could have once imagined,' he adds. 'Just as the industrial revolution brought people past subsistence agriculture, and the corporate revolution enabled mass production, a third revolution has been pronounced. But it will not only be one of technology. The next revolution will be social.'`;

  // Passage 3 Questions 27-30: Multiple Choice
  const p3MC = [
    {
      q: "The first paragraph tells us about",
      opts: [
        "the kinds of jobs that will be most affected by the growth of AI.",
        "the extent to which AI will alter the nature of the work that people do.",
        "the proportion of the world's labour force who will have jobs in AI in the future.",
        "the difference between ways that embodied and disembodied AI will impact on workers.",
      ],
      a: "B",
    },
    {
      q: "According to the second paragraph, what is Stella Pachidi's view of the 'knowledge economy'?",
      opts: [
        "It is having an influence on the number of jobs available.",
        "It is changing people's attitudes towards their occupations.",
        "It is the main reason why the production sector is declining.",
        "It is a key factor driving current developments in the workplace.",
      ],
      a: "D",
    },
    {
      q: "What did Pachidi observe at the telecommunications company?",
      opts: [
        "staff disagreeing with the recommendations of AI",
        "staff feeling resentful about the intrusion of AI in their work",
        "staff making sure that AI produces the results that they want",
        "staff allowing AI to carry out tasks they ought to do themselves",
      ],
      a: "C",
    },
    {
      q: "In his recently published research, Ewan McGaughey",
      opts: [
        "challenges the idea that redundancy is a negative thing.",
        "shows the profound effect of mass unemployment on society.",
        "highlights some differences between past and future job losses.",
        "illustrates how changes in the job market can be successfully handled.",
      ],
      a: "D",
    },
  ];

  for (let i = 0; i < p3MC.length; i++) {
    await prisma.question.create({
      data: {
        testId: readingTest.id,
        questionText: p3MC[i].q,
        questionType: "MULTIPLE_CHOICE",
        options: p3MC[i].opts,
        correctAnswer: p3MC[i].a,
        section: 3,
        passageText: i === 0 ? passage3Text : null,
        passageTitle: i === 0 ? "The future of work" : null,
        order: 27 + i,
        points: 1,
      },
    });
  }

  // Passage 3 Questions 31-34: Summary completion with word list
  const p3Summary = [
    { q: "Stella Pachidi of Cambridge Judge Business School has been focusing on the 'algorithmication' of jobs which rely not on production but on _______ .", a: "G" },
    { q: "While monitoring a telecommunications company, Pachidi observed a growing _______ on the recommendations made by AI.", a: "E" },
    { q: "Meanwhile, staff are deterred from experimenting and using their own _______ , and are therefore prevented from achieving innovation.", a: "C" },
    { q: "To avoid the kind of situations which Pachidi observed, researchers are trying to make AI's decision-making process easier to comprehend, and to increase users' _______ with regard to the technology.", a: "F" },
  ];

  for (let i = 0; i < p3Summary.length; i++) {
    await prisma.question.create({
      data: {
        testId: readingTest.id,
        questionText: p3Summary[i].q,
        questionType: "SENTENCE_COMPLETION",
        options: ["pressure", "satisfaction", "intuition", "promotion", "reliance", "confidence", "information"],
        correctAnswer: p3Summary[i].a,
        section: 3,
        order: 31 + i,
        points: 1,
      },
    });
  }

  // Passage 3 Questions 35-40: Matching people
  const p3People = [
    { q: "Greater levels of automation will not result in lower employment.", a: "B" },
    { q: "There are several reasons why AI is appealing to businesses.", a: "A" },
    { q: "AI's potential to transform people's lives has parallels with major cultural shifts which occurred in previous eras.", a: "C" },
    { q: "It is important to be aware of the range of problems that AI causes.", a: "A" },
    { q: "People are going to follow a less conventional career path than in the past.", a: "B" },
    { q: "Authorities should take measures to ensure that there will be adequately paid work for everyone.", a: "C" },
  ];

  for (let i = 0; i < p3People.length; i++) {
    await prisma.question.create({
      data: {
        testId: readingTest.id,
        questionText: p3People[i].q,
        questionType: "MATCHING",
        options: ["Stella Pachidi", "Hamish Low", "Ewan McGaughey"],
        correctAnswer: p3People[i].a,
        section: 3,
        order: 35 + i,
        points: 1,
      },
    });
  }

  console.log("  Reading test created with 40 questions + 3 passages");

  // ============================================
  // 3. WRITING TEST
  // ============================================
  const writingTest = await prisma.test.upsert({
    where: { id: "ielts16-writing-test1" },
    update: {},
    create: {
      id: "ielts16-writing-test1",
      title: "IELTS 16 - Test 1 Writing",
      type: "WRITING",
      description: "Cambridge IELTS 16 Academic - Test 1 Writing. Task 1 + Task 2.",
      createdById: admin.id,
      isActive: true,
      duration: 60,
    },
  });

  await prisma.writingTask.deleteMany({ where: { testId: writingTest.id } });

  await prisma.writingTask.create({
    data: {
      testId: writingTest.id,
      taskType: "TASK1",
      prompt: "The charts below show the changes in ownership of electrical appliances and amount of time spent doing housework in households in one country between 1920 and 2019.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.",
      minWords: 150,
      maxWords: 300,
    },
  });

  await prisma.writingTask.create({
    data: {
      testId: writingTest.id,
      taskType: "TASK2",
      prompt: "In some countries, more and more people are becoming interested in finding out about the history of the house or building they live in.\n\nWhat are the reasons for this?\n\nHow can people research this?",
      minWords: 250,
      maxWords: 500,
    },
  });

  console.log("  Writing test created with 2 tasks");

  console.log("\nSeed completed successfully!");
  console.log("Tests created:");
  console.log("  - IELTS 16 Test 1 Listening (40 questions, 4 audio files)");
  console.log("  - IELTS 16 Test 1 Reading (40 questions, 3 passages)");
  console.log("  - IELTS 16 Test 1 Writing (Task 1 + Task 2)");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
