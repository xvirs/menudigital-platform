#!/usr/bin/env node
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const root = resolve(fileURLToPath(import.meta.url), '../..');
const schemaPath = resolve(root, 'schema/menu.schema.json');
const restaurantsDir = resolve(root, 'content/restaurants');

const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
const ajv = new Ajv({ allErrors: true, strict: true });
addFormats(ajv);
const validate = ajv.compile(schema);

const files = readdirSync(restaurantsDir)
  .filter((f) => extname(f) === '.json')
  .sort();

if (files.length === 0) {
  console.log('No restaurant JSONs to validate. OK.');
  process.exit(0);
}

let errorCount = 0;

for (const file of files) {
  const filePath = resolve(restaurantsDir, file);
  const expectedSlug = basename(file, '.json');
  let data;

  try {
    data = JSON.parse(readFileSync(filePath, 'utf8'));
  } catch (err) {
    console.error(`✗ ${file}: invalid JSON — ${err.message}`);
    errorCount++;
    continue;
  }

  const fileErrors = [];

  if (!validate(data)) {
    for (const err of validate.errors) {
      fileErrors.push(`schema: ${err.instancePath || '/'} ${err.message}`);
    }
  }

  if (data.slug !== expectedSlug) {
    fileErrors.push(`slug mismatch: file is "${file}" but data.slug is "${data.slug}"`);
  }

  if (data.items && typeof data.items === 'object') {
    for (const [key, item] of Object.entries(data.items)) {
      if (item && item.slug !== key) {
        fileErrors.push(`items["${key}"].slug is "${item.slug}", must equal its key`);
      }
    }
  }

  if (Array.isArray(data.menuSections) && data.items) {
    const itemKeys = new Set(Object.keys(data.items));
    for (const section of data.menuSections) {
      if (!Array.isArray(section.items)) continue;
      for (const ref of section.items) {
        if (!itemKeys.has(ref)) {
          fileErrors.push(
            `menuSections[id="${section.id}"] references missing item "${ref}"`
          );
        }
      }
    }
  }

  if (fileErrors.length > 0) {
    console.error(`✗ ${file}`);
    for (const e of fileErrors) console.error(`  - ${e}`);
    errorCount++;
  } else {
    console.log(`✓ ${file}`);
  }
}

console.log(`\n${files.length - errorCount}/${files.length} files valid.`);
process.exit(errorCount === 0 ? 0 : 1);
