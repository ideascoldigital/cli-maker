import test from 'node:test';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { Validator } from '../command/validator';
import { ParamType } from '../interfaces';
import { stripAnsiCodes } from '../common';

describe('Validator', () => {
  const validator = new Validator()

  describe('Boolean validations', () => {
    const cases: any = [
      {
        description: "Boolean empty required should return Missing required parameter",
        data: "",
        type: ParamType.Boolean,
        expectedError: "Missing required parameter",
        expectedValue: undefined,
        required: true,
      },
      {
        description: "Boolean empty not required, should return undefined without error",
        data: "",
        type: ParamType.Boolean,
        expectedError: "",
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
        description: "Boolean bad format not required, should return error, but the value is undefined",
        data: "trues",
        type: ParamType.Boolean,
        expectedError: "Invalid boolean: trues",
        expectedValue: undefined,
        required: false,
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

    runCases(cases, validator);
  })

  describe('Number validations', () => {
    const cases: any = [
      {
        description: "Number empty required should return Missing required parameter",
        data: "",
        type: ParamType.Number,
        expectedError: "Missing required parameter",
        expectedValue: undefined,
        required: true,
      },
      {
        description: "number empty not required, should return undefined without error",
        data: "",
        type: ParamType.Number,
        expectedError: "",
        expectedValue: undefined,
        required: false,
      },
      {
        description: "number bad format required",
        data: "veinte",
        type: ParamType.Number,
        expectedError: "Invalid number: veinte",
        expectedValue: undefined,
        required: true,
      },
      {
        description: "number bad format not required, should return error, but the value is undefined",
        data: "doce",
        type: ParamType.Number,
        expectedError: "Invalid number: doce",
        expectedValue: undefined,
        required: false,
      },
      {
        description: "number ok",
        data: "23",
        type: ParamType.Number,
        expectedError: "",
        expectedValue: 23,
        required: true,
      },
      {
        description: "number ok plain",
        data: 34,
        type: ParamType.Number,
        expectedError: "",
        expectedValue: 34,
        required: true,
      },
    ];

    runCases(cases, validator);
  })

  describe('Email validations', () => {
    const cases: any = [
      {
        description: "email empty required should return Missing required parameter",
        data: "",
        type: ParamType.Email,
        expectedError: "Missing required parameter",
        expectedValue: undefined,
        required: true,
      },
      {
        description: "email empty not required, should return undefined without error",
        data: "",
        type: ParamType.Email,
        expectedError: "",
        expectedValue: undefined,
        required: false,
      },
      {
        description: "email bad format required",
        data: "bademail.com",
        type: ParamType.Email,
        expectedError: "Invalid email: bademail.com",
        expectedValue: undefined,
        required: true,
      },
      {
        description: "email bad format not required, should return error, but the value is undefined",
        data: "bademail.com",
        type: ParamType.Email,
        expectedError: "Invalid email: bademail.com",
        expectedValue: undefined,
        required: false,
      },
      {
        description: "email ok",
        data: "good@email.com",
        type: ParamType.Email,
        expectedError: "",
        expectedValue: "good@email.com",
        required: true,
      },
    ];

    runCases(cases, validator);
  })

  describe('URL validations', () => {
    const cases: any = [
      {
        description: "url empty required should return Missing required parameter",
        data: "",
        type: ParamType.Url,
        expectedError: "Missing required parameter",
        expectedValue: undefined,
        required: true,
      },
      {
        description: "url empty not required, should return undefined without error",
        data: "",
        type: ParamType.Url,
        expectedError: "",
        expectedValue: undefined,
        required: false,
      },
      {
        description: "url bad format required",
        data: "badurlcom",
        type: ParamType.Url,
        expectedError: "Invalid URL: badurlcom",
        expectedValue: undefined,
        required: true,
      },
      {
        description: "url bad format not required, should return error, but the value is undefined",
        data: "badurlcom",
        type: ParamType.Url,
        expectedError: "Invalid URL: badurlcom",
        expectedValue: undefined,
        required: false,
      },
      {
        description: "url ok",
        data: "http://goodurl.com",
        type: ParamType.Url,
        expectedError: "",
        expectedValue: "http://goodurl.com",
        required: true,
      },
    ];

    runCases(cases, validator);
  })
})


function runCases(cases: any, validator: Validator) {
  for (let index = 0; index < cases.length; index++) {
    const caseTest = cases[index];
    executeTest(caseTest, validator);
  }
}

function executeTest(caseTest: any, validator: Validator) {
  test(caseTest.description, () => {
    const result = validator.validateParam(caseTest.data, caseTest.type, caseTest.required);
    const actualError = stripAnsiCodes(result.error || "");

    assert.equal(actualError, caseTest.expectedError, "Error message");
    assert.equal(result.value, caseTest.expectedValue, "Value message");
  });
}

