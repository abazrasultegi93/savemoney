import { PrismaClient, type QuestionKind } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

type Q = {
  kind: QuestionKind;
  en: string;
  ru: string;
  optionsEn?: string[];
  optionsRu?: string[];
  correctIndex?: number;
  number?: number;
  tolerance?: number;
};

const lessons: { titleEn: string; titleRu: string; contentEn: string; contentRu: string; isPreview?: boolean; questions: Q[] }[] = [
  {
    titleEn: "Where your money goes",
    titleRu: "Куда уходят ваши деньги",
    isPreview: true,
    contentEn:
      "Before you can save, you need to know your numbers. Track every income and expense for 30 days.\n\nGroup expenses into needs (housing, food, transport), wants (entertainment, eating out) and savings. Use the Income & expenses tool in your cabinet.",
    contentRu:
      "Чтобы начать копить, нужно знать свои цифры. Записывайте каждый доход и расход в течение 30 дней.\n\nРазделите расходы на необходимые (жильё, еда, транспорт), желания (развлечения, кафе) и сбережения. Используйте инструмент «Доходы и расходы» в кабинете.",
    questions: [
      { kind: "HOMEWORK", en: "Your monthly income is $3,000 and expenses are $2,550. How much do you save per month, in dollars?", ru: "Ваш доход $3 000 в месяц, расходы $2 550. Сколько вы откладываете в месяц, в долларах?", number: 450 },
      { kind: "HOMEWORK", en: "Which of these is a 'need'?", ru: "Что из этого относится к «необходимым» расходам?", optionsEn: ["Streaming subscription", "Rent", "Concert tickets"], optionsRu: ["Подписка на стриминг", "Аренда жилья", "Билеты на концерт"], correctIndex: 1 },
      { kind: "TEST", en: "How long should you track expenses to see the real picture?", ru: "Сколько нужно записывать расходы, чтобы увидеть реальную картину?", optionsEn: ["1 day", "At least a month", "Only on weekends"], optionsRu: ["1 день", "Минимум месяц", "Только по выходным"], correctIndex: 1 },
      { kind: "TEST", en: "Savings rate = savings ÷ income. Income $4,000, savings $600. What is the savings rate in %?", ru: "Доля сбережений = сбережения ÷ доход. Доход $4 000, сбережения $600. Какова доля сбережений в %?", number: 15 },
    ],
  },
  {
    titleEn: "The 50/30/20 budget",
    titleRu: "Бюджет 50/30/20",
    contentEn:
      "A simple rule: 50% of after-tax income for needs, 30% for wants, 20% for savings and paying off debt.\n\nIt is a starting point. Adjust it to your situation, but always pay yourself first.",
    contentRu:
      "Простое правило: 50% дохода после налогов на необходимое, 30% на желания, 20% на сбережения и погашение долгов.\n\nЭто отправная точка. Адаптируйте под себя, но всегда сначала платите себе.",
    questions: [
      { kind: "HOMEWORK", en: "After-tax income is $5,000. How much goes to savings under 50/30/20?", ru: "Доход после налогов $5 000. Сколько идёт в сбережения по правилу 50/30/20?", number: 1000 },
      { kind: "HOMEWORK", en: "What does 'pay yourself first' mean?", ru: "Что значит «сначала заплати себе»?", optionsEn: ["Buy something nice on payday", "Move savings aside before spending", "Pay bills late"], optionsRu: ["Купить себе что-то в день зарплаты", "Отложить сбережения до трат", "Платить по счетам с опозданием"], correctIndex: 1 },
      { kind: "TEST", en: "In 50/30/20, what share is for wants?", ru: "Какая доля в 50/30/20 приходится на желания?", optionsEn: ["50%", "30%", "20%"], optionsRu: ["50%", "30%", "20%"], correctIndex: 1 },
    ],
  },
  {
    titleEn: "Emergency fund",
    titleRu: "Финансовая подушка",
    contentEn: "An emergency fund covers 3–6 months of essential expenses. Keep it in a separate, easy-to-access savings account.",
    contentRu: "Финансовая подушка покрывает 3–6 месяцев необходимых расходов. Храните её на отдельном счёте с быстрым доступом.",
    questions: [
      { kind: "HOMEWORK", en: "Essential expenses are $2,000 a month. What is a 3-month emergency fund, in dollars?", ru: "Необходимые расходы $2 000 в месяц. Сколько составит подушка на 3 месяца, в долларах?", number: 6000 },
      { kind: "TEST", en: "Where is the best place to keep an emergency fund?", ru: "Где лучше всего хранить финансовую подушку?", optionsEn: ["In stocks", "In a separate savings account", "In cash under the mattress"], optionsRu: ["В акциях", "На отдельном сберегательном счёте", "Наличными под матрасом"], correctIndex: 1 },
    ],
  },
  {
    titleEn: "Understanding loans",
    titleRu: "Как устроены кредиты",
    contentEn: "Every loan has a principal, an interest rate and a term. Use the Loan calculator to see how the term changes your total interest.",
    contentRu: "У каждого кредита есть сумма, процентная ставка и срок. Используйте кредитный калькулятор, чтобы увидеть, как срок влияет на переплату.",
    questions: [
      { kind: "HOMEWORK", en: "A longer term with the same rate usually means…", ru: "Более долгий срок при той же ставке обычно означает…", optionsEn: ["Higher monthly payment, less interest", "Lower monthly payment, more total interest", "No difference"], optionsRu: ["Больший платёж и меньшую переплату", "Меньший платёж и большую переплату", "Никакой разницы"], correctIndex: 1 },
      { kind: "TEST", en: "Which payment type keeps the monthly payment the same?", ru: "При каком типе платежа ежемесячный платёж одинаковый?", optionsEn: ["Annuity", "Differentiated"], optionsRu: ["Аннуитетный", "Дифференцированный"], correctIndex: 0 },
    ],
  },
];

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? "admin@savemoney.local").toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "admin12345";
  await db.user.upsert({
    where: { email },
    create: { email, name: "Admin", role: "ADMIN", passwordHash: await bcrypt.hash(password, 10) },
    update: { role: "ADMIN" },
  });

  if (await db.course.findUnique({ where: { slug: "personal-finance-basics" } })) return;
  await db.course.create({
    data: {
      slug: "personal-finance-basics",
      titleEn: "Personal Finance Basics",
      titleRu: "Основы личных финансов",
      descriptionEn: "Take control of your money: track spending, build a budget, create an emergency fund and understand loans.",
      descriptionRu: "Возьмите деньги под контроль: учёт расходов, бюджет, финансовая подушка и понимание кредитов.",
      priceCents: 4900,
      published: true,
      lessons: {
        create: lessons.map((l, i) => ({
          order: i + 1,
          titleEn: l.titleEn,
          titleRu: l.titleRu,
          contentEn: l.contentEn,
          contentRu: l.contentRu,
          isPreview: !!l.isPreview,
          questions: {
            create: l.questions.map((q, j) => ({
              kind: q.kind,
              order: j + 1,
              type: q.number != null ? "NUMBER" : "CHOICE",
              promptEn: q.en,
              promptRu: q.ru,
              optionsEn: q.optionsEn ?? [],
              optionsRu: q.optionsRu ?? [],
              correctIndex: q.correctIndex ?? null,
              correctNumber: q.number ?? null,
              tolerance: q.tolerance ?? 0.01,
            })),
          },
        })),
      },
    },
  });
}

main().finally(() => db.$disconnect());
