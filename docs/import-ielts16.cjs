const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (!admin) { console.log("Admin yoxdur!"); return; }

  // ===== TEST 1 LISTENING =====
  console.log("Test 1 Listening...");
  const l1 = await prisma.test.create({
    data: {
      title: "IELTS 16 - Test 1 Listening",
      type: "LISTENING",
      duration: 30,
      createdById: admin.id,
      description: "Cambridge IELTS 16 Academic - Test 1 Listening. Children's Engineering Workshops, Stevenson's Site, Art Projects, Stoicism.",
    },
  });

  const l1qs = [
    // Part 1 - Note Completion
    { text: "Create a cover for an _____ so they can drop it from a height without breaking it.", type: "FILL_BLANK", answer: "egg", order: 1 },
    { text: "Take part in a competition to build the tallest _____.", type: "FILL_BLANK", answer: "tower", order: 2 },
    { text: "Make a _____ powered by a balloon.", type: "FILL_BLANK", answer: "car", order: 3 },
    { text: "Build model cars, trucks and _____ and learn how to program them so they can move.", type: "FILL_BLANK", answer: "animals", order: 4 },
    { text: "Take part in a competition to build the longest _____ using card and wood.", type: "FILL_BLANK", answer: "bridge", order: 5 },
    { text: "Create a short _____ with special software.", type: "FILL_BLANK", answer: "movie", order: 6 },
    { text: "Build, _____ and program a humanoid robot.", type: "FILL_BLANK", answer: "decorate", order: 7 },
    { text: "Held on _____ from 10 am to 11 am.", type: "FILL_BLANK", answer: "Wednesdays", order: 8 },
    { text: "Building 10A, _____ Industrial Estate, Grasford.", type: "FILL_BLANK", answer: "Fradstone", order: 9 },
    { text: "Plenty of _____ is available.", type: "FILL_BLANK", answer: "parking", order: 10 },
    // Part 2 - Multiple Choice + Matching
    { text: "Stevenson's was founded in", type: "MULTIPLE_CHOICE", options: ["1923", "1924", "1926"], answer: "1926", order: 11 },
    { text: "Originally, Stevenson's manufactured goods for", type: "MULTIPLE_CHOICE", options: ["the healthcare industry", "the automotive industry", "the machine tools industry"], answer: "the healthcare industry", order: 12 },
    { text: "What does the speaker say about the company premises?", type: "MULTIPLE_CHOICE", options: ["The company has recently moved", "The company has no plans to move", "The company is going to move shortly"], answer: "The company has no plans to move", order: 13 },
    { text: "The programme for the work experience group includes", type: "MULTIPLE_CHOICE", options: ["time to do research", "meetings with a teacher", "talks by staff"], answer: "talks by staff", order: 14 },
    // Part 2 Q15-20 Map labelling
    { text: "coffee room (Label the map A-J)", type: "FILL_BLANK", answer: "H", order: 15 },
    { text: "warehouse (Label the map A-J)", type: "FILL_BLANK", answer: "C", order: 16 },
    { text: "staff canteen (Label the map A-J)", type: "FILL_BLANK", answer: "G", order: 17 },
    { text: "meeting room (Label the map A-J)", type: "FILL_BLANK", answer: "B", order: 18 },
    { text: "human resources (Label the map A-J)", type: "FILL_BLANK", answer: "I", order: 19 },
    { text: "boardroom (Label the map A-J)", type: "FILL_BLANK", answer: "A", order: 20 },
    // Part 3 Q21-24
    { text: "Which TWO parts of the introductory stage to their art projects do Jess and Tom agree were useful? (Choose C and E)", type: "MULTIPLE_CHOICE", options: ["the Bird Park visit", "the workshop sessions", "the Natural History Museum visit", "the projects done in previous years", "the handouts with research sources"], answer: "the Natural History Museum visit", order: 21 },
    { text: "In which TWO ways do both Jess and Tom decide to change their proposals? (Choose B and E)", type: "MULTIPLE_CHOICE", options: ["by giving a rationale for their action plans", "by being less specific about the outcome", "by adding a video diary presentation", "by providing a timeline and a mind map", "by making their notes more evaluative"], answer: "by being less specific about the outcome", order: 22 },
    // Part 3 Q25-30 Matching
    { text: "Falcon (Landseer) - Personal meaning", type: "FILL_BLANK", answer: "D", order: 25 },
    { text: "Fish hawk (Audubon) - Personal meaning", type: "FILL_BLANK", answer: "C", order: 26 },
    { text: "Kingfisher (van Gogh) - Personal meaning", type: "FILL_BLANK", answer: "A", order: 27 },
    { text: "Portrait of William Wells - Personal meaning", type: "FILL_BLANK", answer: "H", order: 28 },
    { text: "Vairumati (Gauguin) - Personal meaning", type: "FILL_BLANK", answer: "F", order: 29 },
    { text: "Portrait of Giovanni de Medici - Personal meaning", type: "FILL_BLANK", answer: "G", order: 30 },
    // Part 4 Q31-40 Note Completion
    { text: "Stoicism is still relevant today because of its _____ appeal.", type: "FILL_BLANK", answer: "practical", order: 31 },
    { text: "The Stoics' ideas are surprisingly well known, despite not being intended for _____.", type: "FILL_BLANK", answer: "publication", order: 32 },
    { text: "Epictetus said that external events cannot be controlled but the _____ people make in response can be controlled.", type: "FILL_BLANK", answer: "choices", order: 33 },
    { text: "A Stoic is someone who has a different view on experiences which others would consider as _____.", type: "FILL_BLANK", answer: "negative", order: 34 },
    { text: "George Washington organised a _____ about Cato to motivate his men.", type: "FILL_BLANK", answer: "play", order: 35 },
    { text: "Adam Smith's ideas on _____ were influenced by Stoicism.", type: "FILL_BLANK", answer: "capitalism", order: 36 },
    { text: "Cognitive Behaviour Therapy - the treatment for _____ is based on ideas from Stoicism.", type: "FILL_BLANK", answer: "depression", order: 37 },
    { text: "People learn to base their thinking on _____.", type: "FILL_BLANK", answer: "logic", order: 38 },
    { text: "In business, people benefit from Stoicism by identifying obstacles as _____.", type: "FILL_BLANK", answer: "opportunity", order: 39 },
    { text: "It requires a lot of _____ but Stoicism can help people to lead a good life.", type: "FILL_BLANK", answer: "practice", order: 40 },
  ];

  for (const q of l1qs) {
    await prisma.question.create({
      data: { testId: l1.id, questionText: q.text, questionType: q.type, options: q.options || null, correctAnswer: q.answer, order: q.order, points: 1 },
    });
  }
  console.log(`  ${l1qs.length} sual`);

  // ===== TEST 1 READING =====
  console.log("Test 1 Reading...");
  const r1 = await prisma.test.create({
    data: {
      title: "IELTS 16 - Test 1 Reading",
      type: "READING",
      duration: 60,
      createdById: admin.id,
      description: `Why we need to protect polar bears

Polar bears are being increasingly threatened by the effects of climate change, but their disappearance could have far-reaching consequences. They are uniquely adapted to the extreme conditions of the Arctic Circle, where temperatures can reach -40°C. One reason for this is that they have up to 11 centimetres of fat underneath their skin. Humans with comparative levels of adipose tissue would be considered obese and would be likely to suffer from diabetes and heart disease. Yet the polar bear experiences no such consequences.

A 2014 study by Shi Ping Liu and colleagues sheds light on this mystery. They compared the genetic structure of polar bears with that of their closest relatives from a warmer climate, the brown bears. This allowed them to determine the genes that have allowed polar bears to survive in one of the toughest environments on Earth. Liu and his colleagues found the polar bears had a gene known as APoB, which reduces levels of low-density lipoproteins (LDLs) - a form of 'bad' cholesterol. In humans, mutations of this gene are associated with increased risk of heart disease. Polar bears may therefore be an important study model to understand heart disease in humans.

The genome of the polar bear may also provide the solution for another condition, one that particularly affects our older generation: osteoporosis. This is a disease where bones show reduced density, usually caused by insufficient exercise, reduced calcium intake or food starvation. Bone tissue is constantly being remodelled, meaning that bone is added or removed, depending on nutrient availability and the stress that the bone is under. Female polar bears, however, undergo extreme conditions during every pregnancy. Once autumn comes around, these females will dig maternity dens in the snow and will remain there throughout the winter, both before and after the birth of their cubs. This process results in about six months of fasting, where the female bears have to keep themselves and their cubs alive, depleting their own calcium and calorie reserves. Despite this, their bones remain strong and dense.

The medical benefits of the polar bear for humanity certainly have their importance in our conservation efforts, but these should not be the only factors taken into consideration. We tend to want to protect animals we think are intelligent and possess emotions, such as elephants and primates. Bears, on the other hand, seem to be perceived as stupid and in many cases violent. And yet anecdotal evidence from the field challenges those assumptions, suggesting for example that polar bears have good problem-solving abilities. A male bear called GoGo in Tennoji Zoo, Osaka, has even been observed making use of a tool to manipulate his environment. The bear used a tree branch on multiple occasions to dislodge a piece of meat hung out of his reach.

In other studies, such as one by Alison Ames in 2008, polar bears showed deliberate and focussed manipulation. For example, Ames observed bears putting objects in piles and then knocking them over in what appeared to be a game. The study demonstrates that bears are capable of agile and thought-out behaviours. These examples suggest bears have greater creativity and problem-solving abilities than previously thought.

As for emotions, while the evidence is once again anecdotal, many bears have been seen to hit out at ice and snow - seemingly out of frustration - when they have just missed out on a kill. Moreover, polar bears can form unusual relationships with other species, including playing with the dogs used to pull sleds in the Arctic.

If climate change were to lead to their extinction, this would mean not only the loss of potential breakthroughs in human medicine, but more importantly, the disappearance of an intelligent, majestic animal.`,
    },
  });

  const r1qs = [
    // Passage 1 Q1-7 True/False/NG
    { text: "Polar bears suffer from various health problems due to the build-up of fat under their skin.", type: "TRUE_FALSE_NG", answer: "FALSE", order: 1 },
    { text: "The study done by Liu and his colleagues compared different groups of polar bears.", type: "TRUE_FALSE_NG", answer: "FALSE", order: 2 },
    { text: "Liu and colleagues were the first researchers to compare polar bears and brown bears genetically.", type: "TRUE_FALSE_NG", answer: "NOT GIVEN", order: 3 },
    { text: "Polar bears are able to control their levels of 'bad' cholesterol by genetic means.", type: "TRUE_FALSE_NG", answer: "TRUE", order: 4 },
    { text: "Female polar bears are able to survive for about six months without food.", type: "TRUE_FALSE_NG", answer: "TRUE", order: 5 },
    { text: "It was found that the bones of female polar bears were very weak when they came out of their dens in spring.", type: "TRUE_FALSE_NG", answer: "FALSE", order: 6 },
    { text: "The polar bear's mechanism for increasing bone density could also be used by people one day.", type: "TRUE_FALSE_NG", answer: "TRUE", order: 7 },
    // Passage 1 Q8-13 Note Completion
    { text: "People think of bears as unintelligent and _____.", type: "FILL_BLANK", answer: "violent", order: 8 },
    { text: "In Tennoji Zoo, a bear has been seen using a branch as a _____.", type: "FILL_BLANK", answer: "tool", order: 9 },
    { text: "This allowed him to knock down some _____.", type: "FILL_BLANK", answer: "meat", order: 10 },
    { text: "A wild polar bear worked out a method of reaching a platform where a _____ was located.", type: "FILL_BLANK", answer: "photographer", order: 11 },
    { text: "Polar bears have displayed behaviour such as conscious manipulation of objects and activity similar to a _____.", type: "FILL_BLANK", answer: "game", order: 12 },
    { text: "They may make movements suggesting _____ if disappointed when hunting.", type: "FILL_BLANK", answer: "frustration", order: 13 },
    // Passage 2 Q14-20 Matching Headings
    { text: "Paragraph A - Choose heading (i-ix)", type: "FILL_BLANK", answer: "iv", order: 14 },
    { text: "Paragraph B - Choose heading (i-ix)", type: "FILL_BLANK", answer: "vii", order: 15 },
    { text: "Paragraph C - Choose heading (i-ix)", type: "FILL_BLANK", answer: "ii", order: 16 },
    { text: "Paragraph D - Choose heading (i-ix)", type: "FILL_BLANK", answer: "v", order: 17 },
    { text: "Paragraph E - Choose heading (i-ix)", type: "FILL_BLANK", answer: "i", order: 18 },
    { text: "Paragraph F - Choose heading (i-ix)", type: "FILL_BLANK", answer: "viii", order: 19 },
    { text: "Paragraph G - Choose heading (i-ix)", type: "FILL_BLANK", answer: "vi", order: 20 },
    // Passage 2 Q21-24 Note Completion
    { text: "The complex is considered to be as big as an Egyptian _____ of the past.", type: "FILL_BLANK", answer: "city", order: 21 },
    { text: "The area outside the pyramid included accommodation that was occupied by _____.", type: "FILL_BLANK", answer: "priests", order: 22 },
    { text: "A long _____ encircled the wall.", type: "FILL_BLANK", answer: "trench", order: 23 },
    { text: "Any visitors who had not been invited were cleverly prevented from entering unless they knew the _____ of the real entrance.", type: "FILL_BLANK", answer: "location", order: 24 },
    // Passage 2 Q25-26
    { text: "Which TWO points does the writer make about King Djoser? (B and D)", type: "MULTIPLE_CHOICE", options: ["Initially he had to be persuaded to build in stone", "There is disagreement concerning the length of his reign", "He failed to appreciate Imhotep's part in the design", "A few of his possessions were still in his tomb", "He criticised the design of other pyramids"], answer: "There is disagreement concerning the length of his reign", order: 25 },
    // Passage 3 Q27-30 Multiple Choice
    { text: "The first paragraph tells us about", type: "MULTIPLE_CHOICE", options: ["the kinds of jobs most affected by AI", "the extent to which AI will alter work", "the proportion who will have jobs in AI", "the difference between embodied and disembodied AI"], answer: "the extent to which AI will alter work", order: 27 },
    { text: "According to the second paragraph, what is Stella Pachidi's view of the 'knowledge economy'?", type: "MULTIPLE_CHOICE", options: ["It is having an influence on job numbers", "It is changing people's attitudes to occupations", "It is the main reason production sector is declining", "It is a key factor driving current developments in the workplace"], answer: "It is a key factor driving current developments in the workplace", order: 28 },
    { text: "What did Pachidi observe at the telecommunications company?", type: "MULTIPLE_CHOICE", options: ["staff disagreeing with AI recommendations", "staff feeling resentful about AI intrusion", "staff making sure AI produces results they want", "staff allowing AI to do tasks they ought to do themselves"], answer: "staff making sure AI produces results they want", order: 29 },
    { text: "In his recently published research, Ewan McGaughey", type: "MULTIPLE_CHOICE", options: ["challenges the idea that redundancy is negative", "shows the profound effect of mass unemployment", "highlights differences between past and future job losses", "illustrates how changes in the job market can be successfully handled"], answer: "illustrates how changes in the job market can be successfully handled", order: 30 },
    // Passage 3 Q31-34 Summary Completion
    { text: "Pachidi has been focusing on the 'algorithmication' of jobs which rely not on production but on _____.", type: "FILL_BLANK", answer: "G", order: 31 },
    { text: "Pachidi observed a growing _____ on the recommendations made by AI.", type: "FILL_BLANK", answer: "E", order: 32 },
    { text: "Staff are deterred from experimenting and using their own _____.", type: "FILL_BLANK", answer: "C", order: 33 },
    { text: "Researchers are trying to increase users' _____ with regard to the technology.", type: "FILL_BLANK", answer: "F", order: 34 },
    // Passage 3 Q35-40 Matching
    { text: "Greater levels of automation will not result in lower employment.", type: "FILL_BLANK", answer: "B", order: 35 },
    { text: "There are several reasons why AI is appealing to businesses.", type: "FILL_BLANK", answer: "A", order: 36 },
    { text: "AI's potential to transform people's lives has parallels with major cultural shifts which occurred in previous eras.", type: "FILL_BLANK", answer: "C", order: 37 },
    { text: "It is important to be aware of the range of problems that AI causes.", type: "FILL_BLANK", answer: "A", order: 38 },
    { text: "People are going to follow a less conventional career path than in the past.", type: "FILL_BLANK", answer: "B", order: 39 },
    { text: "Authorities should take measures to ensure that there will be adequately paid work for everyone.", type: "FILL_BLANK", answer: "C", order: 40 },
  ];

  for (const q of r1qs) {
    await prisma.question.create({
      data: { testId: r1.id, questionText: q.text, questionType: q.type, options: q.options || null, correctAnswer: q.answer, order: q.order, points: 1 },
    });
  }
  console.log(`  ${r1qs.length} sual`);

  // ===== TEST 1 WRITING =====
  console.log("Test 1 Writing...");
  const w1 = await prisma.test.create({
    data: {
      title: "IELTS 16 - Test 1 Writing",
      type: "WRITING",
      duration: 60,
      createdById: admin.id,
      description: "Cambridge IELTS 16 Academic - Test 1 Writing",
    },
  });

  await prisma.writingTask.create({
    data: {
      testId: w1.id,
      taskType: "TASK1",
      prompt: "The charts below show the changes in ownership of electrical appliances and amount of time spent doing housework in households in one country between 1920 and 2019.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.\n\nWrite at least 150 words.",
      minWords: 150,
      maxWords: 250,
    },
  });

  await prisma.writingTask.create({
    data: {
      testId: w1.id,
      taskType: "TASK2",
      prompt: "In some countries, more and more people are becoming interested in finding out about the history of the house or building they live in.\n\nWhat are the reasons for this?\n\nHow can people research this?\n\nGive reasons for your answer and include any relevant examples from your own knowledge or experience.\n\nWrite at least 250 words.",
      minWords: 250,
      maxWords: 400,
    },
  });
  console.log("  2 writing task");

  console.log("\nIELTS 16 Test 1 bazaya elave olundu:");
  console.log(`  Listening: ${l1qs.length} sual`);
  console.log(`  Reading: ${r1qs.length} sual (3 passage)`);
  console.log("  Writing: Task 1 + Task 2");

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
