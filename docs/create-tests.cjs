const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (!admin) { console.log("Admin yoxdur!"); return; }

  // ===== READING TEST =====
  console.log("Reading test yaradilir...");
  const readingTest = await prisma.test.create({
    data: {
      title: "IELTS Reading - Academic",
      type: "READING",
      duration: 60,
      createdById: admin.id,
      description: `The Rise of Vertical Farming

Vertical farming is a revolutionary approach to producing food in vertically stacked layers, typically in controlled indoor environments. This method uses significantly less water than traditional farming, often up to 95% less, because water is recycled within the system. The concept was popularized by Dickson Despommier, a professor at Columbia University, who published his ideas in 2010.

Unlike conventional agriculture, vertical farms can operate year-round regardless of weather conditions. They eliminate the need for pesticides since the controlled environment prevents pest infestations. LED lighting technology has made it economically feasible to grow crops indoors by providing the specific light wavelengths that plants need for photosynthesis.

Critics argue that vertical farming is energy-intensive and currently limited to leafy greens and herbs rather than staple crops like wheat or rice. The initial capital investment can be substantial, with some facilities costing over $30 million to build. However, supporters point out that as technology improves and energy costs decrease, vertical farming could play a crucial role in feeding the world's growing urban population.

Several companies have already demonstrated commercial success. AeroFarms in New Jersey operates one of the world's largest vertical farms, producing over 2 million pounds of greens annually. In Japan, Spread Co. runs a fully automated vertical farm where robots handle everything from seeding to harvesting. Singapore, with limited agricultural land, has embraced vertical farming as part of its goal to produce 30% of its nutritional needs locally by 2030.`,
    },
  });

  // Reading questions
  const readingQs = [
    { text: "Vertical farming uses up to ___% less water than traditional farming.", type: "FILL_BLANK", answer: "95", order: 1 },
    { text: "Who popularized the concept of vertical farming?", type: "MULTIPLE_CHOICE", options: ["Albert Einstein", "Dickson Despommier", "Elon Musk", "Bill Gates"], answer: "Dickson Despommier", order: 2 },
    { text: "Vertical farms can operate year-round.", type: "TRUE_FALSE_NG", answer: "TRUE", order: 3 },
    { text: "Vertical farms require large amounts of pesticides.", type: "TRUE_FALSE_NG", answer: "FALSE", order: 4 },
    { text: "LED lighting provides specific light _____ that plants need.", type: "FILL_BLANK", answer: "wavelengths", order: 5 },
    { text: "Vertical farming is currently suitable for growing wheat and rice.", type: "TRUE_FALSE_NG", answer: "FALSE", order: 6 },
    { text: "Some vertical farm facilities cost over $_____ million to build.", type: "FILL_BLANK", answer: "30", order: 7 },
    { text: "Where is AeroFarms located?", type: "MULTIPLE_CHOICE", options: ["California", "New Jersey", "New York", "Texas"], answer: "New Jersey", order: 8 },
    { text: "AeroFarms produces over 2 million pounds of greens annually.", type: "TRUE_FALSE_NG", answer: "TRUE", order: 9 },
    { text: "In Japan, Spread Co. uses _____ to handle seeding and harvesting.", type: "FILL_BLANK", answer: "robots", order: 10 },
    { text: "Singapore aims to produce _____% of its nutritional needs locally by 2030.", type: "FILL_BLANK", answer: "30", order: 11 },
    { text: "The passage mentions that vertical farming has no disadvantages.", type: "TRUE_FALSE_NG", answer: "FALSE", order: 12 },
  ];

  for (const q of readingQs) {
    await prisma.question.create({
      data: {
        testId: readingTest.id,
        questionText: q.text,
        questionType: q.type,
        options: q.options || null,
        correctAnswer: q.answer,
        order: q.order,
        points: 1,
      },
    });
  }
  console.log(`  ${readingQs.length} sual yaradildi`);

  // ===== LISTENING TEST =====
  console.log("Listening test yaradilir...");
  const listeningTest = await prisma.test.create({
    data: {
      title: "IELTS Listening - Practice",
      type: "LISTENING",
      duration: 30,
      createdById: admin.id,
      description: "IELTS Listening practice test with various question types.",
    },
  });

  const listeningQs = [
    { text: "The student wants to join the _____ club.", type: "FILL_BLANK", answer: "photography", order: 1 },
    { text: "The meeting is held every _____.", type: "FILL_BLANK", answer: "Wednesday", order: 2 },
    { text: "The annual membership fee is $_____.", type: "FILL_BLANK", answer: "45", order: 3 },
    { text: "New members receive a free _____.", type: "FILL_BLANK", answer: "handbook", order: 4 },
    { text: "The club was founded in _____.", type: "MULTIPLE_CHOICE", options: ["1985", "1990", "1995", "2000"], answer: "1995", order: 5 },
    { text: "The club currently has _____ members.", type: "FILL_BLANK", answer: "120", order: 6 },
    { text: "The next exhibition will be held at the _____ Gallery.", type: "FILL_BLANK", answer: "Central", order: 7 },
    { text: "Members can borrow equipment for free.", type: "TRUE_FALSE_NG", answer: "TRUE", order: 8 },
    { text: "The club organizes field trips every month.", type: "TRUE_FALSE_NG", answer: "FALSE", order: 9 },
    { text: "The advanced course starts in _____.", type: "MULTIPLE_CHOICE", options: ["January", "March", "September", "November"], answer: "September", order: 10 },
  ];

  for (const q of listeningQs) {
    await prisma.question.create({
      data: {
        testId: listeningTest.id,
        questionText: q.text,
        questionType: q.type,
        options: q.options || null,
        correctAnswer: q.answer,
        order: q.order,
        points: 1,
      },
    });
  }
  console.log(`  ${listeningQs.length} sual yaradildi`);

  // ===== WRITING TEST =====
  console.log("Writing test yaradilir...");
  const writingTest = await prisma.test.create({
    data: {
      title: "IELTS Writing - Academic",
      type: "WRITING",
      duration: 60,
      createdById: admin.id,
      description: "IELTS Academic Writing Test - Task 1 and Task 2",
    },
  });

  await prisma.writingTask.create({
    data: {
      testId: writingTest.id,
      taskType: "TASK1",
      prompt: "The bar chart below shows the number of students enrolled in three different faculties (Engineering, Medicine, and Arts) at a university from 2015 to 2020.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.\n\nWrite at least 150 words.",
      minWords: 150,
      maxWords: 250,
    },
  });

  await prisma.writingTask.create({
    data: {
      testId: writingTest.id,
      taskType: "TASK2",
      prompt: "Some people believe that the best way to reduce crime is to give longer prison sentences. Others, however, believe there are better alternative ways of reducing crime.\n\nDiscuss both views and give your own opinion.\n\nWrite at least 250 words.",
      minWords: 250,
      maxWords: 400,
    },
  });
  console.log("  2 writing task yaradildi");

  console.log("\nHamisi hazir:");
  console.log(`  Reading: ${readingQs.length} sual`);
  console.log(`  Listening: ${listeningQs.length} sual`);
  console.log(`  Writing: 2 task (Task1 + Task2)`);

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
