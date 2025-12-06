import { Colors } from "../colors";
import { ParamType } from "../interfaces";

export interface ValidatorResult {
  error?: string;
  value?: any;
}

export class Validator {
  public validateParam(value: string | undefined, type?: ParamType, isRequired?: boolean, options?: any[], paramName?: string): ValidatorResult {
    if (this.checkEmpty(value) && isRequired) {
      return {
        error: `\n${Colors.BgRed}${Colors.FgWhite} ERROR ${Colors.Reset} ${Colors.FgRed}Missing required parameter${paramName ? `: ${Colors.Bright}${paramName}${Colors.Reset}${Colors.FgRed}` : ''}${Colors.Reset}\n`
      };
    } else if (this.checkEmpty(value) && !isRequired) {
      return { value: undefined, error: "" };
    }

    if (value === undefined) {
      return { value };
    }

    switch (type) {
      case ParamType.Number:
        if (!/^[0-9]+$/.test(value)) {
          return {
            error: `\n${Colors.BgRed}${Colors.FgWhite} ERROR ${Colors.Reset} ${Colors.FgRed}Invalid number format: '${Colors.Bright}${value}${Colors.Reset}${Colors.FgRed}'${Colors.Reset}\n${Colors.FgGray}       Expected: whole numbers only (e.g., 42)${Colors.Reset}\n`
          };
        }
        return { value: Number(value) };
      case ParamType.Custom:
        try {
          const customValue = JSON.parse(value);
          if (Array.isArray(customValue) || typeof customValue === 'object') {
            return { value: customValue };
          } else {
            return {
              error: `\n${Colors.BgRed}${Colors.FgWhite} ERROR ${Colors.Reset} ${Colors.FgRed}Invalid custom value: '${Colors.Bright}${value}${Colors.Reset}${Colors.FgRed}'${Colors.Reset}\n${Colors.FgGray}       Expected: JSON array or object (e.g., ["item1", "item2"] or {"key": "value"})${Colors.Reset}\n`
            };
          }
        } catch {
          return {
            error: `\n${Colors.BgRed}${Colors.FgWhite} ERROR ${Colors.Reset} ${Colors.FgRed}Invalid JSON format: '${Colors.Bright}${value}${Colors.Reset}${Colors.FgRed}'${Colors.Reset}\n${Colors.FgGray}       Expected: Valid JSON array or object${Colors.Reset}\n`
          };
        }
      case ParamType.List: {
        if (options === undefined || options?.length === 0) {
          return {
            error: `\n${Colors.BgRed}${Colors.FgWhite} ERROR ${Colors.Reset} ${Colors.FgRed}List parameter has no options configured${Colors.Reset}\n`,
            value: undefined
          }
        }
        const foundValue = options?.filter(x => x === value)
        if (foundValue?.length === 0) {
          return {
            error: `\n${Colors.BgRed}${Colors.FgWhite} ERROR ${Colors.Reset} ${Colors.FgRed}Invalid option: '${Colors.Bright}${value}${Colors.Reset}${Colors.FgRed}'${Colors.Reset}\n${Colors.FgGray}       Available options: ${options?.join(', ')}${Colors.Reset}\n`,
            value: undefined
          }
        }
        return { value: value };
      }
      case ParamType.Boolean:
        if (value.toLowerCase() !== 'true' && value.toLowerCase() !== 'false') {
          return {
            error: `\n${Colors.BgRed}${Colors.FgWhite} ERROR ${Colors.Reset} ${Colors.FgRed}Invalid boolean: '${Colors.Bright}${value}${Colors.Reset}${Colors.FgRed}'${Colors.Reset}\n${Colors.FgGray}       Expected: 'true' or 'false'${Colors.Reset}\n`
          };
        }
        return { value: value.toLowerCase() === 'true' };
      case ParamType.Email:
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return {
            error: `\n${Colors.BgRed}${Colors.FgWhite} ERROR ${Colors.Reset} ${Colors.FgRed}Invalid email format: '${Colors.Bright}${value}${Colors.Reset}${Colors.FgRed}'${Colors.Reset}\n${Colors.FgGray}       Expected: user@domain.com${Colors.Reset}\n`
          };
        }
        return { value };
      case ParamType.Url:
        if (!/^https?:\/\/.+$/.test(value)) {
          return {
            error: `\n${Colors.BgRed}${Colors.FgWhite} ERROR ${Colors.Reset} ${Colors.FgRed}Invalid URL format: '${Colors.Bright}${value}${Colors.Reset}${Colors.FgRed}'${Colors.Reset}\n${Colors.FgGray}       Expected: https://example.com or http://example.com${Colors.Reset}\n`
          };
        }
        return { value };
      case ParamType.Package:
        if (!/^@[a-zA-Z0-9-]+\/[a-zA-Z0-9-]+$/.test(value)) {
          return {
            error: `\n${Colors.BgRed}${Colors.FgWhite} ERROR ${Colors.Reset} ${Colors.FgRed}Invalid package format: '${Colors.Bright}${value}${Colors.Reset}${Colors.FgRed}'${Colors.Reset}\n${Colors.FgGray}       Expected: @company/package-name${Colors.Reset}\n`
          };
        }
        return { value };
      case ParamType.Password:
        if (this.checkEmpty(value) && isRequired) {
          return {
            error: `\n${Colors.BgRed}${Colors.FgWhite} ERROR ${Colors.Reset} ${Colors.FgRed}Password cannot be empty${Colors.Reset}\n`
          };
        }
        return { value };
      default:
        return { value };
    }
  }

  private checkEmpty(value: any){
    return value === undefined || value === '' || value === null
  }
}
