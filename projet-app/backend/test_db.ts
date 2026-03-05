import { createConnection } from 'typeorm';

async function run() {
  const connection = await createConnection({
    type: 'sqlite',
    database: 'database.sqlite',
    entities: [__dirname + '/src/**/*.entity{.ts,.js}'],
    synchronize: false,
  });

  const sessionRepo = connection.getRepository('Session');
  const questionRepo = connection.getRepository('Question');

  // get the latest session
  const lastSession = await sessionRepo.find({
    order: { createdAt: 'DESC' },
    take: 1,
  });

  if (!lastSession.length) {
    console.log('No sessions found');
    process.exit(0);
  }

  const session = lastSession[0];
  console.log('Session ID:', session.id);
  console.log('Formation Choisie:', session.formationChoisie);
  console.log('Mise a niveau answers:', session.miseANiveauAnswers);

  const ids = Object.keys(session.miseANiveauAnswers || {})
    .map(Number)
    .filter((n) => !isNaN(n));

  if (ids.length) {
    const questions = await questionRepo
      .createQueryBuilder('q')
      .leftJoinAndSelect('q.formation', 'formation')
      .where('q.id IN (:...ids)', { ids })
      .getMany();

    console.log('Questions found:', questions.length);
    questions.forEach((q) => {
      console.log(
        `Q ${q.id}: ${q.text.substring(0, 30)}... | Formation: ${q.formation ? q.formation.label : 'NULL'} | Workflow: ${q.workflow}`,
      );
    });
  }

  await connection.close();
}

run().catch(console.error);
