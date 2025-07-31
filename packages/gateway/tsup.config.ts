import { createTsupConfig } from '../../tsup.config';

export default createTsupConfig({ external: ['zlib-sync'] });
