import test from 'node:test';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { Validator } from '../command/validator';
import { ParamType } from '../interfaces';
import { stripAnsiCodes } from '../common';

describe('Validator', () => {
  const validator = new Validator()

  const cases: any = [
    {
      description: "Boolean empty",
      data: "",
      type: ParamType.Boolean,
      expectedError: "Missing required parameter",
      expectedValue: undefined,
      required: true,
    },
    {
      description: "Boolean empty not required",
      data: "",
      type: ParamType.Boolean,
      expectedError: "Invalid boolean: ",
      expectedValue: undefined,
      required: false,
    },
    {
      description: "Boolean bad format",
      data: "trues",
      type: ParamType.Boolean,
      expectedError: "Invalid boolean: trues",
      expectedValue: undefined,
      required: true,
    },
    {
      description: "Boolean true",
      data: "true",
      type: ParamType.Boolean,
      expectedError: "",
      expectedValue: true,
      required: true,
    },
    {
      description: "Boolean false",
      data: "false",
      type: ParamType.Boolean,
      expectedError: "",
      expectedValue: false,
      required: true,
    },
  ];

  for (let index = 0; index < cases.length; index++) {
    const caseTest = cases[index];

    test(caseTest.description, () => {
      const result = validator.validateParam(caseTest.data, caseTest.type, caseTest.required);
      const actualError = stripAnsiCodes(result.error || "");

      assert.equal(actualError, caseTest.expectedError, "Error message");
      assert.equal(result.value, caseTest.expectedValue, "Value message");
    })
  }
})
