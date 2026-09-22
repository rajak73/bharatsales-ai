import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { LocalDiskStorageProvider } from './storage.provider';

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const NAME = `${'a'.repeat(32)}.png`;

describe('LocalDiskStorageProvider', () => {
  let dir: string;
  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'uploads-spec-'));
  });
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

  it('stores a verified image under its generated name', async () => {
    const url = await new LocalDiskStorageProvider(dir).upload(PNG, NAME);
    expect(url).toBe(`/uploads/${NAME}`);
    expect(fs.readFileSync(path.join(dir, NAME))).toEqual(PNG);
  });

  it.each([
    ['non-image bytes', Buffer.from('<html><script>x</script></html>'), NAME],
    ['extension not matching the content', PNG, `${'a'.repeat(32)}.jpg`],
    ['a path-traversal name', PNG, '../../evil.png'],
    ['a client-style name', PNG, 'photo.png'],
  ])('refuses %s', async (_label, buf, name) => {
    await expect(new LocalDiskStorageProvider(dir).upload(buf as Buffer, name as string)).rejects.toThrow();
    expect(fs.readdirSync(dir)).toEqual([]);
  });
});
