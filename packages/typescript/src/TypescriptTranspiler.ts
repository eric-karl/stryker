import { File, StrykerOptions } from '@stryker-mutator/api/core';
import { commonTokens, tokens, Injector, TranspilerPluginContext } from '@stryker-mutator/api/plugin';
import { Transpiler } from '@stryker-mutator/api/transpile';
import * as ts from 'typescript';

import { getProjectDirectory, getTSConfig, guardTypescriptVersion, isHeaderFile } from './helpers/tsHelpers';
import TranspileFilter from './transpiler/TranspileFilter';
import TranspilingLanguageService from './transpiler/TranspilingLanguageService';
import * as transpilerTokens from './transpiler/transpilerTokens';

export default class TypescriptTranspiler implements Transpiler {
  private languageService: TranspilingLanguageService;
  private readonly filter: TranspileFilter;

  public static inject = tokens(commonTokens.options, commonTokens.injector);
  constructor(private readonly options: StrykerOptions, private readonly injector: Injector<TranspilerPluginContext>) {
    guardTypescriptVersion();
    this.filter = TranspileFilter.create(this.options);
  }

  public transpile(files: readonly File[]): Promise<readonly File[]> {
    const typescriptFiles = this.filterIsIncluded(files);
    if (this.languageService) {
      this.languageService.replace(typescriptFiles);
    } else {
      this.languageService = this.createLanguageService(typescriptFiles);
    }
    const error = this.languageService.getSemanticDiagnostics(typescriptFiles);
    if (error.length) {
      return Promise.reject(new Error(error));
    } else {
      const resultFiles = this.transpileFiles(files);
      return Promise.resolve(resultFiles);
    }
  }

  private filterIsIncluded(files: readonly File[]): readonly File[] {
    return files.filter(file => this.filter.isIncluded(file.name));
  }

  private createLanguageService(typescriptFiles: readonly File[]) {
    const tsConfig = getTSConfig(this.options);
    const compilerOptions: Readonly<ts.CompilerOptions> = (tsConfig && tsConfig.options) || {};
    return this.injector
      .provideValue(transpilerTokens.compilerOptions, compilerOptions)
      .provideValue(transpilerTokens.rootFiles, typescriptFiles)
      .provideValue(transpilerTokens.projectDirectory, getProjectDirectory(this.options))
      .injectClass(TranspilingLanguageService);
  }

  private transpileFiles(files: readonly File[]): readonly File[] {
    let isSingleOutput = false;
    const fileDictionary: { [name: string]: File } = {};
    files.forEach(file => (fileDictionary[file.name] = file));
    files.forEach(file => {
      if (!isHeaderFile(file.name)) {
        if (this.filter.isIncluded(file.name)) {
          // File is to be transpiled. Only emit if more output is expected.
          if (!isSingleOutput) {
            const emitOutput = this.languageService.emit(file.name);
            isSingleOutput = emitOutput.singleResult;
            emitOutput.outputFiles.forEach(file => (fileDictionary[file.name] = file));
          }

          // Remove original file
          delete fileDictionary[file.name];
        }
      }
    });

    return Object.keys(fileDictionary).map(name => fileDictionary[name]);
  }
}
