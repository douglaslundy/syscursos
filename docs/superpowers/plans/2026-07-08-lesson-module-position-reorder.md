# Lesson/Module Position Reorder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a module, lesson, or lesson material is edited (or created) with a `position` that collides with a sibling, automatically shift the affected siblings so the whole parent's children keep a contiguous, unique position sequence — instead of hitting the database's unique-constraint error.

**Architecture:** All position logic lives in `src/server/repositories/admin-repository.ts`. Each of `upsertModule`, `upsertLesson`, `upsertLessonMaterial` runs inside a `prisma.$transaction(async (tx) => { ... })` interactive transaction. On edit: fetch the current record's position/parent, clamp the requested position to `[1, total]`, compute which siblings must shift by ±1, and apply the shift via a two-phase update (temporary negative positions, then final positions) before writing the record's other fields. On create: same idea, but the range is `[1, total + 1]` and only siblings shift (the new row is created after the shift, already at the right position).

**Tech Stack:** TypeScript, Prisma 5 (Postgres), Vitest (mocked Prisma client in integration tests).

## Global Constraints

- No Prisma schema/migration changes — the unique constraints `(courseId, position)`, `(moduleId, position)`, `(lessonId, position)` stay as-is (spec: "Fora de escopo").
- No changes to the frontend forms or Zod validators — `position: z.coerce.number().int().min(1)` already guarantees `position >= 1`; the upper-bound clamp happens in the repository layer, which has the DB access needed to know the total count.
- Moving an item between parents (different module/course) is out of scope — the existing forms don't expose that, and this plan doesn't add it.
- Follow the spec at `docs/superpowers/specs/2026-07-08-lesson-module-position-reorder-design.md` for the exact algorithm.

---

### Task 1: Shared position-shift helpers + module reorder

**Files:**
- Modify: `src/server/repositories/admin-repository.ts:271-304` (replace `upsertModule`, add helper functions above it)
- Modify: `src/tests/integration/admin-repository.test.ts` (extend mocks, add module reorder tests)

**Interfaces:**
- Produces (used by Task 2 and Task 3):
  - `type PositionEntry = { id: string; position: number }`
  - `function positionRangeFilter(oldPosition: number, newPosition: number): Prisma.IntFilter`
  - `function shiftedSiblingPosition(position: number, oldPosition: number, newPosition: number): number`
  - `function clampPosition(position: number, maxPosition: number): number`
- Produces (used only within this task): `function shiftModulePositions(tx: Prisma.TransactionClient, entries: PositionEntry[]): Promise<void>`

- [ ] **Step 1: Write the failing tests (including mock scaffolding)**

Open `src/tests/integration/admin-repository.test.ts`. Add these hoisted mocks right after the existing `const createUserMock = vi.hoisted(() => vi.fn());` line (line 15):

```ts
const moduleFindFirstOrThrowMock = vi.hoisted(() => vi.fn());
const moduleCountMock = vi.hoisted(() => vi.fn());
const moduleFindManyMock = vi.hoisted(() => vi.fn());
const moduleUpdateMock = vi.hoisted(() => vi.fn());
const moduleCreateMock = vi.hoisted(() => vi.fn());
const transactionMock = vi.hoisted(() => vi.fn());
```

Add `module: { ... }` and `$transaction: transactionMock` to the mocked `prisma` object inside `vi.mock("@/lib/db/prisma", () => ({ prisma: { ... } }))` (the object currently has `enrollment`, `course`, `studentProfile`, `producerStudent`, `user` keys — add these two more keys at the same level):

```ts
    module: {
      findFirstOrThrow: moduleFindFirstOrThrowMock,
      count: moduleCountMock,
      findMany: moduleFindManyMock,
      update: moduleUpdateMock,
      create: moduleCreateMock,
    },
    $transaction: transactionMock,
```

Add an import for the mocked `prisma` object at the top of the file, right after the `vi.mock("@/lib/supabase/admin", ...)` block and before `describe("admin repository", ...)`:

```ts
import { prisma } from "@/lib/db/prisma";
```

In the `beforeEach` block, add resets for the new mocks alongside the existing `.mockReset()` calls:

```ts
    moduleFindFirstOrThrowMock.mockReset();
    moduleCountMock.mockReset();
    moduleFindManyMock.mockReset();
    moduleUpdateMock.mockReset();
    moduleCreateMock.mockReset();
    transactionMock.mockReset();
```

And add default resolved values alongside the existing ones at the end of `beforeEach` (after `producerStudentDeleteManyMock.mockResolvedValue({ count: 1 });`):

```ts
    moduleFindManyMock.mockResolvedValue([]);
    transactionMock.mockImplementation(async (callback: (tx: typeof prisma) => unknown) => callback(prisma));
```

Now add the test cases. Append this new `describe` block at the end of the file (after the existing closing `});` of `describe("admin repository", ...)`, i.e. after line 196):

```ts
describe("upsertModule position reordering", () => {
  const baseInput = {
    id: "module-being-edited",
    courseId: "course-id",
    title: "Modulo",
    description: null,
    status: "ACTIVE" as const,
  };

  it("moving a module to an earlier position shifts the in-between siblings forward", async () => {
    const { upsertModule } = await import("@/server/repositories/admin-repository");

    moduleFindFirstOrThrowMock.mockResolvedValue({ position: 5, courseId: "course-id" });
    moduleCountMock.mockResolvedValue(5);
    moduleFindManyMock.mockResolvedValue([
      { id: "module-1", position: 1 },
      { id: "module-2", position: 2 },
      { id: "module-3", position: 3 },
      { id: "module-4", position: 4 },
    ]);

    await upsertModule("org-id", "admin-id", "ADMIN", { ...baseInput, position: 1 });

    expect(moduleFindFirstOrThrowMock).toHaveBeenCalledWith({
      where: { id: "module-being-edited", course: { organizationId: "org-id" } },
      select: { position: true, courseId: true },
    });
    expect(moduleCountMock).toHaveBeenCalledWith({ where: { courseId: "course-id" } });
    expect(moduleFindManyMock).toHaveBeenCalledWith({
      where: {
        courseId: "course-id",
        id: { not: "module-being-edited" },
        position: { gte: 1, lt: 5 },
      },
      select: { id: true, position: true },
    });

    expect(moduleUpdateMock.mock.calls).toEqual([
      [{ where: { id: "module-1" }, data: { position: -1 } }],
      [{ where: { id: "module-2" }, data: { position: -2 } }],
      [{ where: { id: "module-3" }, data: { position: -3 } }],
      [{ where: { id: "module-4" }, data: { position: -4 } }],
      [{ where: { id: "module-being-edited" }, data: { position: -5 } }],
      [{ where: { id: "module-1" }, data: { position: 2 } }],
      [{ where: { id: "module-2" }, data: { position: 3 } }],
      [{ where: { id: "module-3" }, data: { position: 4 } }],
      [{ where: { id: "module-4" }, data: { position: 5 } }],
      [{ where: { id: "module-being-edited" }, data: { position: 1 } }],
      [
        {
          where: { id: "module-being-edited" },
          data: { title: "Modulo", description: null, position: 1, status: "ACTIVE" },
        },
      ],
    ]);
  });

  it("moving a module to a position beyond the total clamps it to the last position", async () => {
    const { upsertModule } = await import("@/server/repositories/admin-repository");

    moduleFindFirstOrThrowMock.mockResolvedValue({ position: 3, courseId: "course-id" });
    moduleCountMock.mockResolvedValue(4);
    moduleFindManyMock.mockResolvedValue([{ id: "module-4", position: 4 }]);

    await upsertModule("org-id", "admin-id", "ADMIN", { ...baseInput, position: 99 });

    expect(moduleFindManyMock).toHaveBeenCalledWith({
      where: {
        courseId: "course-id",
        id: { not: "module-being-edited" },
        position: { gt: 3, lte: 4 },
      },
      select: { id: true, position: true },
    });

    expect(moduleUpdateMock.mock.calls).toEqual([
      [{ where: { id: "module-4" }, data: { position: -1 } }],
      [{ where: { id: "module-being-edited" }, data: { position: -2 } }],
      [{ where: { id: "module-4" }, data: { position: 3 } }],
      [{ where: { id: "module-being-edited" }, data: { position: 4 } }],
      [
        {
          where: { id: "module-being-edited" },
          data: { title: "Modulo", description: null, position: 4, status: "ACTIVE" },
        },
      ],
    ]);
  });

  it("does not shift any sibling when the position does not change", async () => {
    const { upsertModule } = await import("@/server/repositories/admin-repository");

    moduleFindFirstOrThrowMock.mockResolvedValue({ position: 2, courseId: "course-id" });
    moduleCountMock.mockResolvedValue(5);

    await upsertModule("org-id", "admin-id", "ADMIN", { ...baseInput, position: 2 });

    expect(moduleFindManyMock).not.toHaveBeenCalled();
    expect(moduleUpdateMock).toHaveBeenCalledTimes(1);
    expect(moduleUpdateMock).toHaveBeenCalledWith({
      where: { id: "module-being-edited" },
      data: { title: "Modulo", description: null, position: 2, status: "ACTIVE" },
    });
  });

  it("throws when editing a module that does not exist or is out of scope", async () => {
    const { upsertModule } = await import("@/server/repositories/admin-repository");

    moduleFindFirstOrThrowMock.mockRejectedValue(new Error("not found"));

    await expect(upsertModule("org-id", "admin-id", "ADMIN", { ...baseInput, position: 1 })).rejects.toThrow(
      "not found",
    );
    expect(moduleUpdateMock).not.toHaveBeenCalled();
  });

  it("creating a module in the middle of the list shifts the following siblings forward", async () => {
    const { upsertModule } = await import("@/server/repositories/admin-repository");

    findCourseMock.mockResolvedValue({ id: "course-id" });
    moduleCountMock.mockResolvedValue(3);
    moduleFindManyMock.mockResolvedValue([
      { id: "module-2", position: 2 },
      { id: "module-3", position: 3 },
    ]);
    moduleCreateMock.mockResolvedValue({ id: "new-module-id" });

    await upsertModule("org-id", "admin-id", "ADMIN", {
      courseId: "course-id",
      title: "Novo modulo",
      description: null,
      position: 2,
      status: "ACTIVE" as const,
    });

    expect(moduleCountMock).toHaveBeenCalledWith({ where: { courseId: "course-id" } });
    expect(moduleFindManyMock).toHaveBeenCalledWith({
      where: { courseId: "course-id", position: { gte: 2 } },
      select: { id: true, position: true },
    });
    expect(moduleUpdateMock.mock.calls).toEqual([
      [{ where: { id: "module-2" }, data: { position: -1 } }],
      [{ where: { id: "module-3" }, data: { position: -2 } }],
      [{ where: { id: "module-2" }, data: { position: 3 } }],
      [{ where: { id: "module-3" }, data: { position: 4 } }],
    ]);
    expect(moduleCreateMock).toHaveBeenCalledWith({
      data: {
        courseId: "course-id",
        title: "Novo modulo",
        description: null,
        position: 2,
        status: "ACTIVE",
      },
    });
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/tests/integration/admin-repository.test.ts`
Expected: FAIL — `upsertModule` still uses `updateMany`/no transaction, so `moduleFindFirstOrThrowMock`/`moduleCountMock`/etc. are never called and `transactionMock` is never invoked. You should see assertion failures like "expected moduleFindFirstOrThrowMock to have been called" or the mocked prisma client's `module`/`$transaction` fields being `undefined` when `upsertModule` runs.

- [ ] **Step 3: Implement the helpers and rewrite `upsertModule`**

In `src/server/repositories/admin-repository.ts`, replace the existing `upsertModule` function (currently at lines 271-304) with the helpers plus the new implementation:

```ts
type PositionEntry = { id: string; position: number };

function positionRangeFilter(oldPosition: number, newPosition: number): Prisma.IntFilter {
  return newPosition < oldPosition
    ? { gte: newPosition, lt: oldPosition }
    : { gt: oldPosition, lte: newPosition };
}

function shiftedSiblingPosition(position: number, oldPosition: number, newPosition: number): number {
  return newPosition < oldPosition ? position + 1 : position - 1;
}

function clampPosition(position: number, maxPosition: number): number {
  return Math.min(Math.max(position, 1), maxPosition);
}

async function shiftModulePositions(tx: Prisma.TransactionClient, entries: PositionEntry[]): Promise<void> {
  for (const [index, entry] of entries.entries()) {
    await tx.module.update({ where: { id: entry.id }, data: { position: -(index + 1) } });
  }
  for (const entry of entries) {
    await tx.module.update({ where: { id: entry.id }, data: { position: entry.position } });
  }
}

export async function upsertModule(
  organizationId: string,
  actorUserId: string,
  actorRole: ActorRole,
  input: ModuleInput,
) {
  const courseScope = scopedCourseWhere(organizationId, actorUserId, actorRole);

  return prisma.$transaction(async (tx) => {
    if (input.id) {
      const current = await tx.module.findFirstOrThrow({
        where: { id: input.id, course: courseScope },
        select: { position: true, courseId: true },
      });

      const total = await tx.module.count({ where: { courseId: current.courseId } });
      const position = clampPosition(input.position, total);

      if (position !== current.position) {
        const siblings = await tx.module.findMany({
          where: {
            courseId: current.courseId,
            id: { not: input.id },
            position: positionRangeFilter(current.position, position),
          },
          select: { id: true, position: true },
        });

        await shiftModulePositions(tx, [
          ...siblings.map((sibling) => ({
            id: sibling.id,
            position: shiftedSiblingPosition(sibling.position, current.position, position),
          })),
          { id: input.id, position },
        ]);
      }

      return tx.module.update({
        where: { id: input.id },
        data: {
          title: input.title,
          description: input.description,
          position,
          status: input.status,
        },
      });
    }

    const course = await tx.course.findFirstOrThrow({
      where: { id: input.courseId, ...courseScope },
      select: { id: true },
    });

    const total = await tx.module.count({ where: { courseId: course.id } });
    const position = clampPosition(input.position, total + 1);

    const siblings = await tx.module.findMany({
      where: { courseId: course.id, position: { gte: position } },
      select: { id: true, position: true },
    });

    if (siblings.length > 0) {
      await shiftModulePositions(
        tx,
        siblings.map((sibling) => ({ id: sibling.id, position: sibling.position + 1 })),
      );
    }

    return tx.module.create({
      data: {
        courseId: course.id,
        title: input.title,
        description: input.description,
        position,
        status: input.status ?? ModuleStatus.ACTIVE,
      },
    });
  });
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/tests/integration/admin-repository.test.ts`
Expected: PASS — all tests in the file, including the new `upsertModule position reordering` block, succeed.

- [ ] **Step 5: Typecheck and lint**

Run: `npm run typecheck && npm run lint`
Expected: both exit with no errors. `Prisma.TransactionClient` and `Prisma.IntFilter` are real exported types from `@prisma/client`, so `tx: Prisma.TransactionClient` and the `positionRangeFilter` return type will resolve without `any`.

- [ ] **Step 6: Commit**

```bash
git add src/server/repositories/admin-repository.ts src/tests/integration/admin-repository.test.ts
git commit -m "feat(admin): shift sibling positions when reordering modules"
```

---

### Task 2: Lesson reorder

**Files:**
- Modify: `src/server/repositories/admin-repository.ts:345-386` (replace `upsertLesson`)
- Modify: `src/tests/integration/admin-repository.test.ts` (extend mocks, add lesson reorder tests)

**Interfaces:**
- Consumes (from Task 1): `PositionEntry`, `positionRangeFilter`, `shiftedSiblingPosition`, `clampPosition` (module-private functions in the same file — no import needed).
- Produces (used only within this task): `function shiftLessonPositions(tx: Prisma.TransactionClient, entries: PositionEntry[]): Promise<void>`

- [ ] **Step 1: Write the failing tests (including mock scaffolding)**

In `src/tests/integration/admin-repository.test.ts`, add these hoisted mocks next to the module ones added in Task 1:

```ts
const lessonFindFirstOrThrowMock = vi.hoisted(() => vi.fn());
const lessonCountMock = vi.hoisted(() => vi.fn());
const lessonFindManyMock = vi.hoisted(() => vi.fn());
const lessonUpdateMock = vi.hoisted(() => vi.fn());
const lessonCreateMock = vi.hoisted(() => vi.fn());
```

Add a `lesson: { ... }` key to the mocked `prisma` object, alongside `module`:

```ts
    lesson: {
      findFirstOrThrow: lessonFindFirstOrThrowMock,
      count: lessonCountMock,
      findMany: lessonFindManyMock,
      update: lessonUpdateMock,
      create: lessonCreateMock,
    },
```

Add resets in `beforeEach`:

```ts
    lessonFindFirstOrThrowMock.mockReset();
    lessonCountMock.mockReset();
    lessonFindManyMock.mockReset();
    lessonUpdateMock.mockReset();
    lessonCreateMock.mockReset();
```

Add a default resolved value in `beforeEach`, next to `moduleFindManyMock.mockResolvedValue([]);`:

```ts
    lessonFindManyMock.mockResolvedValue([]);
```

Add this new `describe` block at the end of the file:

```ts
describe("upsertLesson position reordering", () => {
  const youtubeUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

  const baseInput = {
    id: "lesson-being-edited",
    moduleId: "module-id",
    title: "Aula",
    description: null,
    youtubeUrl,
    youtubeVideoId: null,
    coverImageUrl: null,
    status: "ACTIVE" as const,
  };

  it("moving a lesson to an earlier position shifts the in-between siblings forward", async () => {
    const { upsertLesson } = await import("@/server/repositories/admin-repository");
    const { extractYouTubeVideoId } = await import("@/server/services/video-platform-service");
    const expectedVideoId = extractYouTubeVideoId(youtubeUrl);

    lessonFindFirstOrThrowMock.mockResolvedValue({ position: 3, moduleId: "module-id" });
    lessonCountMock.mockResolvedValue(3);
    lessonFindManyMock.mockResolvedValue([{ id: "lesson-1", position: 1 }, { id: "lesson-2", position: 2 }]);

    await upsertLesson("org-id", "admin-id", "ADMIN", { ...baseInput, position: 1 });

    expect(lessonFindFirstOrThrowMock).toHaveBeenCalledWith({
      where: { id: "lesson-being-edited", module: { course: { organizationId: "org-id" } } },
      select: { position: true, moduleId: true },
    });
    expect(lessonFindManyMock).toHaveBeenCalledWith({
      where: {
        moduleId: "module-id",
        id: { not: "lesson-being-edited" },
        position: { gte: 1, lt: 3 },
      },
      select: { id: true, position: true },
    });
    expect(lessonUpdateMock.mock.calls).toEqual([
      [{ where: { id: "lesson-1" }, data: { position: -1 } }],
      [{ where: { id: "lesson-2" }, data: { position: -2 } }],
      [{ where: { id: "lesson-being-edited" }, data: { position: -3 } }],
      [{ where: { id: "lesson-1" }, data: { position: 2 } }],
      [{ where: { id: "lesson-2" }, data: { position: 3 } }],
      [{ where: { id: "lesson-being-edited" }, data: { position: 1 } }],
      [
        {
          where: { id: "lesson-being-edited" },
          data: {
            title: "Aula",
            description: null,
            youtubeUrl,
            youtubeVideoId: expectedVideoId,
            coverImageUrl: null,
            position: 1,
            status: "ACTIVE",
          },
        },
      ],
    ]);
  });

  it("moving a lesson to a position beyond the total clamps it to the last position", async () => {
    const { upsertLesson } = await import("@/server/repositories/admin-repository");

    lessonFindFirstOrThrowMock.mockResolvedValue({ position: 1, moduleId: "module-id" });
    lessonCountMock.mockResolvedValue(2);
    lessonFindManyMock.mockResolvedValue([{ id: "lesson-2", position: 2 }]);

    await upsertLesson("org-id", "admin-id", "ADMIN", { ...baseInput, position: 50 });

    expect(lessonFindManyMock).toHaveBeenCalledWith({
      where: {
        moduleId: "module-id",
        id: { not: "lesson-being-edited" },
        position: { gt: 1, lte: 2 },
      },
      select: { id: true, position: true },
    });
    expect(lessonUpdateMock.mock.calls).toEqual([
      [{ where: { id: "lesson-2" }, data: { position: -1 } }],
      [{ where: { id: "lesson-being-edited" }, data: { position: -2 } }],
      [{ where: { id: "lesson-2" }, data: { position: 1 } }],
      [{ where: { id: "lesson-being-edited" }, data: { position: 2 } }],
      [
        {
          where: { id: "lesson-being-edited" },
          data: {
            title: "Aula",
            description: null,
            youtubeUrl,
            youtubeVideoId: expect.anything(),
            coverImageUrl: null,
            position: 2,
            status: "ACTIVE",
          },
        },
      ],
    ]);
  });

  it("creating a lesson in the middle of the list shifts the following siblings forward", async () => {
    const { upsertLesson } = await import("@/server/repositories/admin-repository");

    lessonCountMock.mockResolvedValue(2);
    lessonFindManyMock.mockResolvedValue([{ id: "lesson-1", position: 1 }]);
    lessonCreateMock.mockResolvedValue({ id: "new-lesson-id" });

    // Module lookup for the create path re-uses the `module` delegate, already mocked in Task 1.
    moduleFindFirstOrThrowMock.mockResolvedValue({ id: "module-id" });

    await upsertLesson("org-id", "admin-id", "ADMIN", {
      moduleId: "module-id",
      title: "Nova aula",
      description: null,
      youtubeUrl,
      youtubeVideoId: null,
      coverImageUrl: null,
      position: 1,
      status: "ACTIVE" as const,
    });

    expect(moduleFindFirstOrThrowMock).toHaveBeenCalledWith({
      where: { id: "module-id", course: { organizationId: "org-id" } },
      select: { id: true },
    });
    expect(lessonFindManyMock).toHaveBeenCalledWith({
      where: { moduleId: "module-id", position: { gte: 1 } },
      select: { id: true, position: true },
    });
    expect(lessonUpdateMock.mock.calls).toEqual([
      [{ where: { id: "lesson-1" }, data: { position: -1 } }],
      [{ where: { id: "lesson-1" }, data: { position: 2 } }],
    ]);
    expect(lessonCreateMock).toHaveBeenCalledWith({
      data: {
        moduleId: "module-id",
        title: "Nova aula",
        description: null,
        youtubeUrl,
        youtubeVideoId: expect.anything(),
        coverImageUrl: null,
        position: 1,
        status: "ACTIVE",
      },
    });
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/tests/integration/admin-repository.test.ts`
Expected: FAIL — `upsertLesson` still uses `updateMany` directly and never calls the `lesson`/`module` mocks the new tests set up, or calls them with the old shape.

- [ ] **Step 3: Implement `shiftLessonPositions` and rewrite `upsertLesson`**

In `src/server/repositories/admin-repository.ts`, add this helper right after `shiftModulePositions` (added in Task 1):

```ts
async function shiftLessonPositions(tx: Prisma.TransactionClient, entries: PositionEntry[]): Promise<void> {
  for (const [index, entry] of entries.entries()) {
    await tx.lesson.update({ where: { id: entry.id }, data: { position: -(index + 1) } });
  }
  for (const entry of entries) {
    await tx.lesson.update({ where: { id: entry.id }, data: { position: entry.position } });
  }
}
```

Replace the existing `upsertLesson` function (currently at lines 345-386) with:

```ts
export async function upsertLesson(
  organizationId: string,
  actorUserId: string,
  actorRole: ActorRole,
  input: LessonInput,
) {
  const courseScope = scopedCourseWhere(organizationId, actorUserId, actorRole);
  const youtubeVideoId = normalizeLessonYouTubeVideoId(input.youtubeUrl);

  return prisma.$transaction(async (tx) => {
    if (input.id) {
      const current = await tx.lesson.findFirstOrThrow({
        where: { id: input.id, module: { course: courseScope } },
        select: { position: true, moduleId: true },
      });

      const total = await tx.lesson.count({ where: { moduleId: current.moduleId } });
      const position = clampPosition(input.position, total);

      if (position !== current.position) {
        const siblings = await tx.lesson.findMany({
          where: {
            moduleId: current.moduleId,
            id: { not: input.id },
            position: positionRangeFilter(current.position, position),
          },
          select: { id: true, position: true },
        });

        await shiftLessonPositions(tx, [
          ...siblings.map((sibling) => ({
            id: sibling.id,
            position: shiftedSiblingPosition(sibling.position, current.position, position),
          })),
          { id: input.id, position },
        ]);
      }

      return tx.lesson.update({
        where: { id: input.id },
        data: {
          title: input.title,
          description: input.description,
          youtubeUrl: input.youtubeUrl,
          youtubeVideoId,
          coverImageUrl: input.coverImageUrl,
          position,
          status: input.status,
        },
      });
    }

    const module = await tx.module.findFirstOrThrow({
      where: { id: input.moduleId, course: courseScope },
      select: { id: true },
    });

    const total = await tx.lesson.count({ where: { moduleId: module.id } });
    const position = clampPosition(input.position, total + 1);

    const siblings = await tx.lesson.findMany({
      where: { moduleId: module.id, position: { gte: position } },
      select: { id: true, position: true },
    });

    if (siblings.length > 0) {
      await shiftLessonPositions(
        tx,
        siblings.map((sibling) => ({ id: sibling.id, position: sibling.position + 1 })),
      );
    }

    return tx.lesson.create({
      data: {
        moduleId: module.id,
        title: input.title,
        description: input.description,
        youtubeUrl: input.youtubeUrl,
        youtubeVideoId,
        coverImageUrl: input.coverImageUrl,
        position,
        status: input.status ?? LessonStatus.ACTIVE,
      },
    });
  });
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/tests/integration/admin-repository.test.ts`
Expected: PASS — all tests, including `upsertLesson position reordering`, succeed.

- [ ] **Step 5: Typecheck and lint**

Run: `npm run typecheck && npm run lint`
Expected: both exit with no errors.

- [ ] **Step 6: Commit**

```bash
git add src/server/repositories/admin-repository.ts src/tests/integration/admin-repository.test.ts
git commit -m "feat(admin): shift sibling positions when reordering lessons"
```

---

### Task 3: Lesson material reorder

**Files:**
- Modify: `src/server/repositories/admin-repository.ts:430-477` (replace `upsertLessonMaterial`)
- Modify: `src/tests/integration/admin-repository.test.ts` (extend mocks, add material reorder tests)

**Interfaces:**
- Consumes (from Task 1): `PositionEntry`, `positionRangeFilter`, `shiftedSiblingPosition`, `clampPosition`.
- Produces (used only within this task): `function shiftLessonMaterialPositions(tx: Prisma.TransactionClient, entries: PositionEntry[]): Promise<void>`

- [ ] **Step 1: Write the failing tests (including mock scaffolding)**

In `src/tests/integration/admin-repository.test.ts`, add these hoisted mocks next to the lesson ones added in Task 2:

```ts
const lessonMaterialFindFirstOrThrowMock = vi.hoisted(() => vi.fn());
const lessonMaterialCountMock = vi.hoisted(() => vi.fn());
const lessonMaterialFindManyMock = vi.hoisted(() => vi.fn());
const lessonMaterialUpdateMock = vi.hoisted(() => vi.fn());
const lessonMaterialCreateMock = vi.hoisted(() => vi.fn());
```

Add a `lessonMaterial: { ... }` key to the mocked `prisma` object, alongside `lesson`:

```ts
    lessonMaterial: {
      findFirstOrThrow: lessonMaterialFindFirstOrThrowMock,
      count: lessonMaterialCountMock,
      findMany: lessonMaterialFindManyMock,
      update: lessonMaterialUpdateMock,
      create: lessonMaterialCreateMock,
    },
```

Add resets in `beforeEach`:

```ts
    lessonMaterialFindFirstOrThrowMock.mockReset();
    lessonMaterialCountMock.mockReset();
    lessonMaterialFindManyMock.mockReset();
    lessonMaterialUpdateMock.mockReset();
    lessonMaterialCreateMock.mockReset();
```

Add a default resolved value in `beforeEach`, next to `lessonFindManyMock.mockResolvedValue([]);`:

```ts
    lessonMaterialFindManyMock.mockResolvedValue([]);
```

Add this new `describe` block at the end of the file:

```ts
describe("upsertLessonMaterial position reordering", () => {
  const baseInput = {
    id: "material-being-edited",
    lessonId: "lesson-id",
    type: "PDF" as const,
    title: "Material",
    url: "https://example.com/material.pdf",
    status: "ACTIVE" as const,
  };

  it("moving a material to an earlier position shifts the in-between siblings forward", async () => {
    const { upsertLessonMaterial } = await import("@/server/repositories/admin-repository");

    lessonMaterialFindFirstOrThrowMock.mockResolvedValue({ position: 3, lessonId: "lesson-id" });
    lessonMaterialCountMock.mockResolvedValue(3);
    lessonMaterialFindManyMock.mockResolvedValue([
      { id: "material-1", position: 1 },
      { id: "material-2", position: 2 },
    ]);

    await upsertLessonMaterial("org-id", "admin-id", "ADMIN", { ...baseInput, position: 1 });

    expect(lessonMaterialFindFirstOrThrowMock).toHaveBeenCalledWith({
      where: { id: "material-being-edited", lesson: { module: { course: { organizationId: "org-id" } } } },
      select: { position: true, lessonId: true },
    });
    expect(lessonMaterialFindManyMock).toHaveBeenCalledWith({
      where: {
        lessonId: "lesson-id",
        id: { not: "material-being-edited" },
        position: { gte: 1, lt: 3 },
      },
      select: { id: true, position: true },
    });
    expect(lessonMaterialUpdateMock.mock.calls).toEqual([
      [{ where: { id: "material-1" }, data: { position: -1 } }],
      [{ where: { id: "material-2" }, data: { position: -2 } }],
      [{ where: { id: "material-being-edited" }, data: { position: -3 } }],
      [{ where: { id: "material-1" }, data: { position: 2 } }],
      [{ where: { id: "material-2" }, data: { position: 3 } }],
      [{ where: { id: "material-being-edited" }, data: { position: 1 } }],
      [
        {
          where: { id: "material-being-edited" },
          data: {
            type: "PDF",
            title: "Material",
            url: "https://example.com/material.pdf",
            position: 1,
            status: "ACTIVE",
          },
        },
      ],
    ]);
  });

  it("creating a material in the middle of the list shifts the following siblings forward", async () => {
    const { upsertLessonMaterial } = await import("@/server/repositories/admin-repository");

    lessonFindFirstOrThrowMock.mockResolvedValue({ id: "lesson-id" });
    lessonMaterialCountMock.mockResolvedValue(1);
    lessonMaterialFindManyMock.mockResolvedValue([{ id: "material-1", position: 1 }]);
    lessonMaterialCreateMock.mockResolvedValue({ id: "new-material-id" });

    await upsertLessonMaterial("org-id", "admin-id", "ADMIN", {
      lessonId: "lesson-id",
      type: "LINK" as const,
      title: "Novo material",
      url: "https://example.com/novo",
      position: 1,
      status: "ACTIVE" as const,
    });

    expect(lessonFindFirstOrThrowMock).toHaveBeenCalledWith({
      where: { id: "lesson-id", module: { course: { organizationId: "org-id" } } },
      select: { id: true },
    });
    expect(lessonMaterialFindManyMock).toHaveBeenCalledWith({
      where: { lessonId: "lesson-id", position: { gte: 1 } },
      select: { id: true, position: true },
    });
    expect(lessonMaterialUpdateMock.mock.calls).toEqual([
      [{ where: { id: "material-1" }, data: { position: -1 } }],
      [{ where: { id: "material-1" }, data: { position: 2 } }],
    ]);
    expect(lessonMaterialCreateMock).toHaveBeenCalledWith({
      data: {
        lessonId: "lesson-id",
        type: "LINK",
        title: "Novo material",
        url: "https://example.com/novo",
        position: 1,
        status: "ACTIVE",
      },
    });
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/tests/integration/admin-repository.test.ts`
Expected: FAIL — `upsertLessonMaterial` still uses `updateMany` directly.

- [ ] **Step 3: Implement `shiftLessonMaterialPositions` and rewrite `upsertLessonMaterial`**

In `src/server/repositories/admin-repository.ts`, add this helper right after `shiftLessonPositions` (added in Task 2):

```ts
async function shiftLessonMaterialPositions(tx: Prisma.TransactionClient, entries: PositionEntry[]): Promise<void> {
  for (const [index, entry] of entries.entries()) {
    await tx.lessonMaterial.update({ where: { id: entry.id }, data: { position: -(index + 1) } });
  }
  for (const entry of entries) {
    await tx.lessonMaterial.update({ where: { id: entry.id }, data: { position: entry.position } });
  }
}
```

Replace the existing `upsertLessonMaterial` function (currently at lines 430-477) with:

```ts
export async function upsertLessonMaterial(
  organizationId: string,
  actorUserId: string,
  actorRole: ActorRole,
  input: LessonMaterialInput,
) {
  const courseScope = scopedCourseWhere(organizationId, actorUserId, actorRole);

  return prisma.$transaction(async (tx) => {
    if (input.id) {
      const current = await tx.lessonMaterial.findFirstOrThrow({
        where: { id: input.id, lesson: { module: { course: courseScope } } },
        select: { position: true, lessonId: true },
      });

      const total = await tx.lessonMaterial.count({ where: { lessonId: current.lessonId } });
      const position = clampPosition(input.position, total);

      if (position !== current.position) {
        const siblings = await tx.lessonMaterial.findMany({
          where: {
            lessonId: current.lessonId,
            id: { not: input.id },
            position: positionRangeFilter(current.position, position),
          },
          select: { id: true, position: true },
        });

        await shiftLessonMaterialPositions(tx, [
          ...siblings.map((sibling) => ({
            id: sibling.id,
            position: shiftedSiblingPosition(sibling.position, current.position, position),
          })),
          { id: input.id, position },
        ]);
      }

      return tx.lessonMaterial.update({
        where: { id: input.id },
        data: {
          type: input.type,
          title: input.title,
          url: input.url,
          position,
          status: input.status,
        },
      });
    }

    const lesson = await tx.lesson.findFirstOrThrow({
      where: { id: input.lessonId, module: { course: courseScope } },
      select: { id: true },
    });

    const total = await tx.lessonMaterial.count({ where: { lessonId: lesson.id } });
    const position = clampPosition(input.position, total + 1);

    const siblings = await tx.lessonMaterial.findMany({
      where: { lessonId: lesson.id, position: { gte: position } },
      select: { id: true, position: true },
    });

    if (siblings.length > 0) {
      await shiftLessonMaterialPositions(
        tx,
        siblings.map((sibling) => ({ id: sibling.id, position: sibling.position + 1 })),
      );
    }

    return tx.lessonMaterial.create({
      data: {
        lessonId: lesson.id,
        type: input.type,
        title: input.title,
        url: input.url,
        position,
        status: input.status,
      },
    });
  });
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/tests/integration/admin-repository.test.ts`
Expected: PASS — all tests, including `upsertLessonMaterial position reordering`, succeed.

- [ ] **Step 5: Typecheck and lint**

Run: `npm run typecheck && npm run lint`
Expected: both exit with no errors.

- [ ] **Step 6: Commit**

```bash
git add src/server/repositories/admin-repository.ts src/tests/integration/admin-repository.test.ts
git commit -m "feat(admin): shift sibling positions when reordering lesson materials"
```

---

### Task 4: Full verification and push

**Files:** none (verification only).

- [ ] **Step 1: Run the full test suite**

Run: `npm run test`
Expected: all test files pass, including `src/tests/integration/admin-repository.test.ts`, `src/tests/integration/admin-service.test.ts`, and `src/tests/integration/admin-actions.test.ts` (these exercise `saveModule`/`saveLesson` through the service/action layers and must still pass unchanged, since their return-value contract with the repository didn't change in a way callers depend on).

- [ ] **Step 2: Run lint and typecheck one more time on the whole project**

Run: `npm run lint && npm run typecheck`
Expected: both exit with no errors.

- [ ] **Step 3: Push the branch**

```bash
git push
```

Expected: the three feature commits from Tasks 1-3 (plus the earlier spec-doc commit) are pushed to the remote tracking branch.
