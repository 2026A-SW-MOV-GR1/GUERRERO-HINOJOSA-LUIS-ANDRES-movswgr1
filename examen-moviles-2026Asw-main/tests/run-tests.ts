import { Note, NoteInput, NotesRepository } from '../app/persistence/types';

type TestResult = { name: string; passed: boolean; detail?: string };

class MemoryNotesRepository implements NotesRepository {
  private lastId = 0;
  private items: Note[] = [];

  async init(): Promise<void> {
    return;
  }

  async list(): Promise<Note[]> {
    return this.items.slice();
  }

  async upsert(input: NoteInput): Promise<Note> {
    const nowIso = new Date().toISOString();
    if (input.id) {
      const index = this.items.findIndex((item) => item.id === input.id);
      if (index >= 0) {
        this.items[index] = { ...this.items[index], title: input.title, body: input.body, updatedAt: nowIso };
        return this.items[index];
      }
    }

    const created: Note = {
      id: ++this.lastId,
      title: input.title,
      body: input.body,
      updatedAt: nowIso,
    };
    this.items.push(created);
    return created;
  }

  async remove(id: number): Promise<void> {
    this.items = this.items.filter((item) => item.id !== id);
  }

  async clear(): Promise<void> {
    this.items = [];
    this.lastId = 0;
  }
}

function assertCondition(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

async function testWriteAndRead(repo: NotesRepository): Promise<TestResult> {
  const name = 'write-and-read';
  try {
    await repo.clear();
    const created = await repo.upsert({ title: 'T1', body: 'B1' });
    const items = await repo.list();
    assertCondition(items.length === 1, 'Expected 1 item after insert');
    assertCondition(items[0].id === created.id, 'Expected same ID after read');
    return { name, passed: true };
  } catch (error) {
    return { name, passed: false, detail: String(error) };
  }
}

async function testSwitchingIsolation(): Promise<TestResult> {
  const name = 'switching-isolation';
  const sqlRepo = new MemoryNotesRepository();
  const nosqlRepo = new MemoryNotesRepository();

  try {
    await sqlRepo.clear();
    await nosqlRepo.clear();

    await sqlRepo.upsert({ title: 'SQL', body: 'Row' });
    const sqlItems = await sqlRepo.list();
    const nosqlItems = await nosqlRepo.list();
    assertCondition(sqlItems.length === 1, 'SQL should have 1 item');
    assertCondition(nosqlItems.length === 0, 'NoSQL should start empty');

    await nosqlRepo.upsert({ title: 'NoSQL', body: 'Doc' });
    const sqlAfter = await sqlRepo.list();
    const nosqlAfter = await nosqlRepo.list();
    assertCondition(sqlAfter.length === 1, 'SQL should be unchanged');
    assertCondition(nosqlAfter.length === 1, 'NoSQL should have 1 item');

    return { name, passed: true };
  } catch (error) {
    return { name, passed: false, detail: String(error) };
  }
}

async function run() {
  const repo = new MemoryNotesRepository();
  const results: TestResult[] = [];

  results.push(await testWriteAndRead(repo));
  results.push(await testSwitchingIsolation());

  const failed = results.filter((result) => !result.passed);
  results.forEach((result) => {
    if (result.passed) {
      console.log(`[PASS] ${result.name}`);
    } else {
      console.log(`[FAIL] ${result.name} -> ${result.detail}`);
    }
  });

  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

run();
