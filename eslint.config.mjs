import { FlatCompat } from "@eslint/eslintrc"
import stylistic from "@stylistic/eslint-plugin"
import typescriptEslint from "@typescript-eslint/eslint-plugin"
import tsParser from "@typescript-eslint/parser"
import globals from "globals"
import { dirname } from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const compat = new FlatCompat({
  baseDirectory: __dirname,
})

export default [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [ "**/.next/*", "src/components/ui/*" ],
  },
  {
    files:           [ "**/*.{js,ts,tsx,mjs}" ],
    languageOptions: {
      globals:       { ...globals.node, ...globals.jest },
      parser:        tsParser,
      sourceType:    "module",
      parserOptions: {
        projectService:  true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: { "@typescript-eslint": typescriptEslint },
    rules:   {
      "@typescript-eslint/no-explicit-any":      "off",
      "@typescript-eslint/no-floating-promises": "warn",
      "@typescript-eslint/no-unused-vars":       "error",
      "import/no-anonymous-default-export":      "off",
    },
  },
  stylistic.configs.customize({
    quotes:     "double",
    semi:       false,
    jsx:        true,
    quoteProps: "as-needed",
  }),
  {
    rules: {
      // {js,ts,mjs} Rules
      "@stylistic/array-bracket-newline": [ "warn", { multiline: true } ],
      "@stylistic/array-bracket-spacing": [
        "warn",
        "always",
        { objectsInArrays: true, arraysInArrays: true },
      ],
      "@stylistic/array-element-newline": [
        "warn",
        { multiline: true, consistent: true },
      ],
      "@stylistic/arrow-parens": [ "warn", "always" ],
      "@stylistic/brace-style":  [
        "warn",
        "stroustrup",
        { allowSingleLine: true },
      ],
      "@stylistic/comma-dangle":  [ "warn", "always-multiline" ],
      "@stylistic/curly-newline": [
        "warn",
        { multiline: true, consistent: true },
      ],
      "@stylistic/nonblock-statement-body-position": [ "warn", "beside" ],
      "@stylistic/function-paren-newline":           [ "warn", "multiline" ],
      "@stylistic/indent":                           [
        "warn",
        2,
        { SwitchCase: 1, VariableDeclarator: "first" },
      ],
      "@stylistic/key-spacing": [
        "warn",
        {
          align:        { beforeColon: false, afterColon: true, on: "value" },
          ignoredNodes: [ "TSTypeLiteral" ],
        },
      ],
      "@stylistic/lines-between-class-members": [
        "warn",
        {
          enforce: [
            { blankLine: "always", prev: "method", next: "field" },
            { blankLine: "always", prev: "*", next: "method" },
            { blankLine: "never", prev: "field", next: "field" },
          ],
        },
      ],
      "@stylistic/no-multi-spaces": [
        "warn",
        {
          exceptions: {
            TSTypeAnnotation: true,
            TSInterfaceBody:  true,
            ClassDecorator:   true,
          },
        },
      ],
      "@stylistic/object-curly-spacing": [
        "warn",
        "always",
        { objectsInObjects: false },
      ],
      "@stylistic/object-property-newline": [
        "warn",
        { allowAllPropertiesOnSameLine: true },
      ],
      "@stylistic/padding-line-between-statements": [
        "warn",
        { blankLine: "always", prev: "directive", next: "*" },
        { blankLine: "always", prev: "if", next: "expression" },
        {
          blankLine: "always",
          prev:      "import",
          next:      [
            "block-like",
            "class",
            "const",
            "do",
            "expression",
            "return",
            "throw",
            "var",
            "with",
          ],
        },
        { blankLine: "always", prev: "*", next: "block-like" },
        { blankLine: "always", prev: "*", next: "class" },
        { blankLine: "always", prev: "*", next: "cjs-export" },
        { blankLine: "always", prev: "*", next: [ "enum", "interface", "type" ] },
        { blankLine: "always", prev: "*", next: "export" },
        { blankLine: "always", prev: "*", next: "return" },
        { blankLine: "never", prev: "const", next: "const" },
        { blankLine: "never", prev: "function-overload", next: "function" },
        { blankLine: "never", prev: "import", next: "import" },
        { blankLine: "never", prev: "let", next: "let" },
        { blankLine: "never", prev: "var", next: "var" },
      ],

      // {jsx,tsx} Rules
      "@stylistic/jsx-curly-brace-presence": [
        "warn",
        { props: "always", children: "never", propElementValues: "always" },
      ],
      "@stylistic/jsx-first-prop-new-line":   [ "warn", "multiline-multiprop" ],
      "@stylistic/jsx-function-call-newline": [ "warn", "multiline" ],
      "@stylistic/jsx-newline":               [
        "warn",
        { prevent: true, allowMultilines: true },
      ],
      "@stylistic/jsx-one-expression-per-line": [ "warn", { allow: "non-jsx" } ],
      "@stylistic/jsx-sort-props":              [
        "warn",
        { callbacksLast: true, shorthandFirst: true },
      ],
    },
  },
]
