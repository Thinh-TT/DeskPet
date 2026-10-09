import { existsSync, readdirSync, readFileSync } from 'fs';
import { join, resolve } from 'path';
import { CharacterManifestSchema } from '../src/shared/character/schema';

function validatePack(packDir: string): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const jsonPath = join(packDir, 'character.json');

  if (!existsSync(jsonPath)) {
    return { errors: [`character.json not found in ${packDir}`], warnings: [] };
  }

  let parsed: unknown;
  try {
    const content = readFileSync(jsonPath, 'utf-8');
    parsed = JSON.parse(content);
  } catch (err) {
    return { errors: [`Failed to parse character.json: ${String(err)}`], warnings: [] };
  }

  const result = CharacterManifestSchema.safeParse(parsed);
  if (!result.success) {
    return {
      errors: result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
      warnings: []
    };
  }

  const manifest = result.data;

  // Check base asset
  const basePath = join(packDir, manifest.base);
  if (!existsSync(basePath)) {
    errors.push(`Base asset file missing: ${manifest.base}`);
  }

  // Check poses
  for (const [poseName, relPath] of Object.entries(manifest.poses)) {
    const fullPath = join(packDir, relPath);
    if (!existsSync(fullPath)) {
      errors.push(`Pose "${poseName}" file missing: ${relPath}`);
    }
  }

  // Check clips
  for (const [clipName, clip] of Object.entries(manifest.clips)) {
    if (!clip.ready) {
      warnings.push(`Clip "${clipName}" is marked ready: false (fallback will be used)`);
      continue;
    }

    for (let i = 1; i <= clip.count; i++) {
      const frameFile = clip.pattern.replace('{n}', i.toString());
      const fullFramePath = join(packDir, frameFile);
      if (!existsSync(fullFramePath)) {
        errors.push(`Clip "${clipName}" missing frame ${i}: ${frameFile}`);
      }
    }
  }

  // Check expressions
  for (const [exprName, relPath] of Object.entries(manifest.expressions)) {
    const fullPath = join(packDir, relPath);
    if (!existsSync(fullPath)) {
      errors.push(`Expression "${exprName}" file missing: ${relPath}`);
    }
  }

  // Check mouth overlays
  for (const [mouthName, relPath] of Object.entries(manifest.mouth)) {
    const fullPath = join(packDir, relPath);
    if (!existsSync(fullPath)) {
      errors.push(`Mouth overlay "${mouthName}" file missing: ${relPath}`);
    }
  }

  return { errors, warnings };
}

function main(): void {
  const charactersDir = resolve(process.cwd(), 'characters');
  console.log(`🔍 Validating character packs in: ${charactersDir}`);

  if (!existsSync(charactersDir)) {
    console.error('Characters directory not found!');
    process.exit(1);
  }

  const entries = readdirSync(charactersDir, { withFileTypes: true });
  let hasErrors = false;
  let packCount = 0;

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const packDir = join(charactersDir, entry.name);
    const jsonPath = join(packDir, 'character.json');
    if (!existsSync(jsonPath)) continue;

    packCount++;
    console.log(`\n📦 Checking pack: [${entry.name}]`);
    const { errors, warnings } = validatePack(packDir);

    for (const w of warnings) {
      console.warn(`  ⚠️  ${w}`);
    }

    if (errors.length > 0) {
      hasErrors = true;
      for (const e of errors) {
        console.error(`  ❌ ${e}`);
      }
    } else {
      console.log(`  ✅ Pack [${entry.name}] is VALID!`);
    }
  }

  if (packCount === 0) {
    console.warn('No character packs with character.json found to validate.');
  }

  if (hasErrors) {
    console.error('\n❌ Character pack validation FAILED.');
    process.exit(1);
  } else {
    console.log('\n✨ All character packs passed validation.');
    process.exit(0);
  }
}

main();
