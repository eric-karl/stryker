import * as fs from 'fs';
import * as path from 'path';

import { Config } from '@stryker-mutator/api/config';
import { File } from '@stryker-mutator/api/core';
import { testInjector } from '@stryker-mutator/test-helpers';
import { expect } from 'chai';
import { commonTokens } from '@stryker-mutator/api/plugin';

import { CONFIG_KEY } from '../../src/helpers/keys';
import TypescriptConfigEditor from '../../src/TypescriptConfigEditor';
import TypescriptTranspiler from '../../src/TypescriptTranspiler';

describe('@stryker-mutator/typescript', () => {
  let config: Config;
  let inputFiles: File[];

  beforeEach(() => {
    const configEditor = testInjector.injector.injectClass(TypescriptConfigEditor);
    config = new Config();
    config.set({
      tsconfigFile: path.resolve(__dirname, '..', '..', 'tsconfig.src.json')
    });
    configEditor.edit(config);
    inputFiles = config[CONFIG_KEY].fileNames.map((fileName: string) => new File(fileName, fs.readFileSync(fileName, 'utf8')));
    testInjector.options = config;
  });

  function createTranspiler(produceSourceMaps: boolean) {
    return testInjector.injector.provideValue(commonTokens.produceSourceMaps, produceSourceMaps).injectClass(TypescriptTranspiler);
  }

  it('should be able to transpile itself', async () => {
    const transpiler = createTranspiler(true);
    const outputFiles = await transpiler.transpile(inputFiles);
    expect(outputFiles.length).greaterThan(10);
  });

  it('should result in an error if a variable is declared as any and noImplicitAny = true', async () => {
    const transpiler = createTranspiler(true);
    inputFiles[0] = new File(inputFiles[0].name, inputFiles[0].textContent + 'function foo(bar) { return bar; } ');
    return expect(transpiler.transpile(inputFiles)).rejectedWith("error TS7006: Parameter 'bar' implicitly has an 'any' type");
  });

  it('should not result in an error if a variable is declared as any and noImplicitAny = false', async () => {
    config.tsconfig.noImplicitAny = false;
    inputFiles[0] = new File(inputFiles[0].name, inputFiles[0].textContent + 'const shouldResultInError = 3');
    const transpiler = createTranspiler(true);
    const outputFiles = await transpiler.transpile(inputFiles);
    expect(outputFiles).lengthOf.greaterThan(0);
  });
});
