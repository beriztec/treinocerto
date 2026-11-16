/**
 * (Opcional) Regera js/demos.js a partir da biblioteca de movimentos do projeto principal (treino-certo).
 * Só é preciso se você mudar as animações lá e quiser trazê-las para esta landing page.
 *
 * Uso (na pasta treino-certo-vsl):
 *   node tools/gerar-demos.mjs ../treino-certo
 */
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const main = path.resolve(process.argv[2] || path.join(here, '..', '..', 'treino-certo'));
const { getDemo } = await import(pathToFileURL(path.join(main, 'lib', 'pose', 'motions.ts')).href);

const keys = {
  squat: 'squat_smithGlute',
  legPress: 'legPress',
  hipThrustDb: 'hipThrust_db',
  hipThrustMachine: 'hipThrust_machine',
  abdLean: 'abdSeat_machineLean',
  bulgarian: 'bulgarian_db',
  bridgeBand: 'bridge_band',
  kickBand: 'quadKick_band',
};
const out = Object.fromEntries(Object.entries(keys).map(([k, m]) => [k, getDemo(m)]));
const file = path.join(here, '..', 'js', 'demos.js');
writeFileSync(
  file,
  '/* Gerado por tools/gerar-demos.mjs a partir do projeto Treino Certo. Não edite à mão. */\n' +
    'window.TC_DEMOS = ' + JSON.stringify(out) + ';\n',
);
console.log('demos.js atualizado: ' + Object.keys(out).join(', '));
