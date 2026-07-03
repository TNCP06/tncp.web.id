import * as migration_20260703_092811_initial from './20260703_092811_initial';

export const migrations = [
  {
    up: migration_20260703_092811_initial.up,
    down: migration_20260703_092811_initial.down,
    name: '20260703_092811_initial'
  },
];
