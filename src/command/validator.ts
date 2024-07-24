import { Colors } from "../colors";
import { ParamType } from "../interfaces";

export interface ValidatorResult {
  error?: string;
  value?: any;
}

export class Validator {
  public validateParam(value: string | undefined, type?: ParamType, isRequired?: boolean, options?: any[]): ValidatorResult {
    if (this.checkEmpty(value) && isRequired) {
      return { error: `${Colors.FgRed}Missing required parameter${Colors.Reset}` };
    } else if (this.checkEmpty(value) && !isRequired) {
      return { value: undefined, error: "" };
    }

    if (value === undefined) {
      return { value };
    }

    switch (type) {
      case ParamType.Number:
        if (!/^[0-9]+$/.test(value)) {
          return { error: `${Colors.FgRed}Invalid number:${Colors.Reset} ${value}` };
        }
        return { value: Number(value) };
      case ParamType.Custom:
        try {
          const customValue = JSON.parse(value);
          if (Array.isArray(customValue) || typeof customValue === 'object') {
            return { value: customValue };
          } else {
            return { error: `${Colors.FgRed}Invalid custom value:${Colors.Reset} ${value}` };
          }
        } catch {
          return { error: `${Colors.FgRed}Invalid custom value:${Colors.Reset} ${value}` };
        }
      case ParamType.List:
        if (options === undefined || options?.length === 0) {
          return { error: `${Colors.FgRed}Invalid List:${Colors.Reset} empty options`, value: undefined }
        }
        const foundValue = options?.filter(x => x === value)
        if (foundValue?.length === 0) {
          return { error: `${Colors.FgRed}Invalid List:${Colors.Reset} ${value} doesn't exists`, value: undefined }
        }
        return { value: value };
      case ParamType.Boolean:
        if (value.toLowerCase() !== 'true' && value.toLowerCase() !== 'false') {
          return { error: `${Colors.FgRed}Invalid boolean:${Colors.Reset} ${value}` };
        }
        return { value: value.toLowerCase() === 'true' };
      case ParamType.Email:
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return { error: `${Colors.FgRed}Invalid email:${Colors.Reset} ${value}` };
        }
        return { value };
      case ParamType.Url:
        if (!/^https?:\/\/.+$/.test(value)) {
          return { error: `${Colors.FgRed}Invalid URL:${Colors.Reset} ${value}` };
        }
        return { value };
      case ParamType.Package:
        if (!/^@[a-zA-Z0-9-]+\/[a-zA-Z0-9-]+$/.test(value)) {
          return { error: `${Colors.FgRed}the format of the package is not correct, @company/package-name${Colors.Reset}` };
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
