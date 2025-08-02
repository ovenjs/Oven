import { createTsupConfig } from '../../tsup.config';
import { esbuildPluginVersionInjector } from 'esbuild-plugin-version-injector';

export default createTsupConfig({
  esbuildPlugins: [esbuildPluginVersionInjector()],
});
