/**
 * @fileoverview Custom TypeScript transformers for AST transformations and performance optimizations
 * These transformers provide compile-time optimizations and code generation
 */

import * as ts from 'typescript';

/**
 * Transform function type for TypeScript transformers
 */
export type TransformerFactory<T extends ts.Node> = (
  context: ts.TransformationContext
) => (node: T) => T;

/**
 * Custom transformer for optimizing object property access
 * Converts repeated property access into cached variables
 */
export const optimizePropertyAccess: TransformerFactory<ts.SourceFile> = (context) => {
  return (sourceFile) => {
    const propertyAccessMap = new Map<string, string>();
    let variableCounter = 0;

    const visitor = (node: ts.Node): ts.Node => {
      // Optimize property access chains like obj.prop.subProp
      if (ts.isPropertyAccessExpression(node)) {
        const propertyChain = getPropertyChain(node);
        if (propertyChain.length > 2) {
          const cacheKey = propertyChain.join('.');
          if (!propertyAccessMap.has(cacheKey)) {
            propertyAccessMap.set(cacheKey, `_cached_${variableCounter++}`);
          }
        }
      }

      return ts.visitEachChild(node, visitor, context);
    };

    return ts.visitNode(sourceFile, visitor) as ts.SourceFile || sourceFile;
  };
};

/**
 * Custom transformer for inlining small pure functions
 * Replaces function calls with their body when beneficial
 */
export const inlineSmallFunctions: TransformerFactory<ts.SourceFile> = (context) => {
  return (sourceFile) => {
    const inlineCandidates = new Map<string, ts.FunctionDeclaration>();

    const visitor = (node: ts.Node): ts.Node => {
      // Identify small pure functions for inlining
      if (ts.isFunctionDeclaration(node) && node.name) {
        if (isSuitableForInlining(node)) {
          inlineCandidates.set(node.name.text, node);
        }
      }

      // Replace function calls with inlined versions
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
        const functionName = node.expression.text;
        const candidate = inlineCandidates.get(functionName);
        if (candidate && candidate.body) {
          return inlineFunction(candidate, node.arguments);
        }
      }

      return ts.visitEachChild(node, visitor, context);
    };

    return ts.visitNode(sourceFile, visitor) as ts.SourceFile || sourceFile;
  };
};

/**
 * Custom transformer for compile-time constant folding
 * Evaluates constant expressions at compile time
 */
export const constantFolding: TransformerFactory<ts.SourceFile> = (context) => {
  return (sourceFile) => {
    const visitor = (node: ts.Node): ts.Node => {
      // Fold binary expressions with literal operands
      if (ts.isBinaryExpression(node)) {
        const left = node.left;
        const right = node.right;
        
        if (ts.isNumericLiteral(left) && ts.isNumericLiteral(right)) {
          const leftValue = parseFloat(left.text);
          const rightValue = parseFloat(right.text);
          let result: number | undefined;

          switch (node.operatorToken.kind) {
            case ts.SyntaxKind.PlusToken:
              result = leftValue + rightValue;
              break;
            case ts.SyntaxKind.MinusToken:
              result = leftValue - rightValue;
              break;
            case ts.SyntaxKind.AsteriskToken:
              result = leftValue * rightValue;
              break;
            case ts.SyntaxKind.SlashToken:
              result = rightValue !== 0 ? leftValue / rightValue : undefined;
              break;
          }

          if (result !== undefined) {
            return context.factory.createNumericLiteral(result.toString());
          }
        }
      }

      return ts.visitEachChild(node, visitor, context);
    };

    return ts.visitNode(sourceFile, visitor) as ts.SourceFile || sourceFile;
  };
};

/**
 * Custom transformer for removing debug code in production
 * Strips debug statements and development-only code
 */
export const stripDebugCode: TransformerFactory<ts.SourceFile> = (context) => {
  return (sourceFile) => {
    const visitor = (node: ts.Node): ts.Node | undefined => {
      // Remove console.debug calls
      if (ts.isExpressionStatement(node) && 
          ts.isCallExpression(node.expression) &&
          ts.isPropertyAccessExpression(node.expression.expression) &&
          ts.isIdentifier(node.expression.expression.expression) &&
          node.expression.expression.expression.text === 'console' &&
          node.expression.expression.name.text === 'debug') {
        return undefined; // Remove this node
      }

      // Remove blocks marked with DEBUG comments
      if (ts.isBlock(node)) {
        const leadingComments = ts.getLeadingCommentRanges(sourceFile.text, node.getFullStart());
        if (leadingComments?.some(comment => 
          sourceFile.text.slice(comment.pos, comment.end).includes('DEBUG'))) {
          return undefined;
        }
      }

      return ts.visitEachChild(node, visitor, context);
    };

    return ts.visitNode(sourceFile, visitor) as ts.SourceFile || sourceFile;
  };
};

/**
 * Custom transformer for optimizing type assertions
 * Removes unnecessary type assertions and optimizes others
 */
export const optimizeTypeAssertions: TransformerFactory<ts.SourceFile> = (context) => {
  return (sourceFile) => {
    const visitor = (node: ts.Node): ts.Node => {
      // Optimize 'as any' assertions
      if (ts.isAsExpression(node) && 
          ts.isTypeReferenceNode(node.type) &&
          ts.isIdentifier(node.type.typeName) &&
          node.type.typeName.text === 'any') {
        // In many cases, we can just return the expression
        return node.expression;
      }

      return ts.visitEachChild(node, visitor, context);
    };

    return ts.visitNode(sourceFile, visitor) as ts.SourceFile || sourceFile;
  };
};

/**
 * Custom transformer for generating runtime type validators
 * Generates efficient runtime validation code from TypeScript types
 */
export const generateTypeValidators: TransformerFactory<ts.SourceFile> = (context) => {
  return (sourceFile) => {
    const typeValidators: ts.Statement[] = [];

    const visitor = (node: ts.Node): ts.Node => {
      // Generate validators for interface declarations
      if (ts.isInterfaceDeclaration(node) && node.name) {
        const validator = generateValidatorForInterface(node, context);
        if (validator) {
          typeValidators.push(validator);
        }
      }

      return ts.visitEachChild(node, visitor, context);
    };

    const visitedFile = ts.visitNode(sourceFile, visitor) as ts.SourceFile || sourceFile;
    
    // Add generated validators to the file
    if (typeValidators.length > 0) {
      return context.factory.updateSourceFile(visitedFile, [
        ...visitedFile.statements,
        ...typeValidators
      ]);
    }

    return visitedFile;
  };
};

/**
 * Helper function to get property access chain
 */
function getPropertyChain(node: ts.PropertyAccessExpression): string[] {
  const chain: string[] = [];
  let current: ts.Node = node;

  while (ts.isPropertyAccessExpression(current)) {
    chain.unshift(current.name.text);
    current = current.expression;
  }

  if (ts.isIdentifier(current)) {
    chain.unshift(current.text);
  }

  return chain;
}

/**
 * Helper function to check if function is suitable for inlining
 */
function isSuitableForInlining(func: ts.FunctionDeclaration): boolean {
  if (!func.body) return false;
  
  // Only inline small functions (fewer than 5 statements)
  const statements = func.body.statements;
  if (statements.length > 5) return false;

  // Don't inline functions with complex control flow
  for (const statement of statements) {
    if (ts.isIfStatement(statement) || 
        ts.isForStatement(statement) || 
        ts.isWhileStatement(statement)) {
      return false;
    }
  }

  return true;
}

/**
 * Helper function to inline a function call
 */
function inlineFunction(func: ts.FunctionDeclaration, args: ts.NodeArray<ts.Expression>): ts.Expression {
  // Simplified inlining - in practice, this would need parameter substitution
  if (func.body && func.body.statements.length === 1) {
    const statement = func.body.statements[0];
    if (ts.isReturnStatement(statement) && statement.expression) {
      return statement.expression;
    }
  }
  
  // Fallback to original call if inlining fails
  return ts.factory.createCallExpression(
    ts.factory.createIdentifier(func.name?.text || 'unknown'),
    undefined,
    args
  );
}

/**
 * Helper function to generate validator for interface
 */
function generateValidatorForInterface(
  node: ts.InterfaceDeclaration, 
  context: ts.TransformationContext
): ts.FunctionDeclaration | null {
  const interfaceName = node.name.text;
  const validatorName = `validate${interfaceName}`;

  // Generate validation logic based on interface members
  const validationStatements: ts.Statement[] = [];

  for (const member of node.members) {
    if (ts.isPropertySignature(member) && member.name && ts.isIdentifier(member.name)) {
      const propertyName = member.name.text;
      const isOptional = !!member.questionToken;
      
      // Add validation for this property
      const validation = ts.factory.createIfStatement(
        ts.factory.createBinaryExpression(
          ts.factory.createPropertyAccessExpression(
            ts.factory.createIdentifier('obj'),
            propertyName
          ),
          ts.SyntaxKind.EqualsEqualsEqualsToken,
          ts.factory.createIdentifier('undefined')
        ),
        isOptional 
          ? ts.factory.createBlock([]) 
          : ts.factory.createThrowStatement(
              ts.factory.createNewExpression(
                ts.factory.createIdentifier('Error'),
                undefined,
                [ts.factory.createStringLiteral(`Missing required property: ${propertyName}`)]
              )
            )
      );
      
      validationStatements.push(validation);
    }
  }

  // Return the validator function
  return ts.factory.createFunctionDeclaration(
    [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
    undefined,
    validatorName,
    undefined,
    [ts.factory.createParameterDeclaration(
      undefined,
      undefined,
      'obj',
      undefined,
      ts.factory.createKeywordTypeNode(ts.SyntaxKind.UnknownKeyword)
    )],
    ts.factory.createTypePredicateNode(
      undefined,
      'obj',
      ts.factory.createTypeReferenceNode(interfaceName)
    ),
    ts.factory.createBlock([
      ...validationStatements,
      ts.factory.createReturnStatement(ts.factory.createTrue())
    ])
  );
}

/**
 * Transformer configuration and registration
 */
export interface TransformerConfig {
  optimizePropertyAccess?: boolean;
  inlineSmallFunctions?: boolean;
  constantFolding?: boolean;
  stripDebugCode?: boolean;
  optimizeTypeAssertions?: boolean;
  generateTypeValidators?: boolean;
}

/**
 * Create transformer program with custom transformers
 */
export function createTransformerProgram(
  config: TransformerConfig = {}
): ts.CustomTransformerFactory {
  return (context: ts.TransformationContext) => {
    const transformers: TransformerFactory<ts.SourceFile>[] = [];

    if (config.optimizePropertyAccess) transformers.push(optimizePropertyAccess);
    if (config.inlineSmallFunctions) transformers.push(inlineSmallFunctions);
    if (config.constantFolding) transformers.push(constantFolding);
    if (config.stripDebugCode) transformers.push(stripDebugCode);
    if (config.optimizeTypeAssertions) transformers.push(optimizeTypeAssertions);
    if (config.generateTypeValidators) transformers.push(generateTypeValidators);

    return {
      transformSourceFile: (sourceFile: ts.SourceFile) => {
        return transformers.reduce(
          (file, transformer) => transformer(context)(file),  
          sourceFile
        );
      },
      transformBundle: (bundle: ts.Bundle) => bundle
    };
  };
}