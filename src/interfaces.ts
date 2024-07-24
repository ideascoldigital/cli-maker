export enum ParamType {
  Text = 'text',
  Number = 'number',
  Custom = 'custom',
  List = 'list',
  Boolean = 'boolean',
  Email = 'email',
  Phone = 'phone',
  Url = 'url',
  Package = "Package",
}

export interface Command {
  name: string;
  description: string;
  params: { name: string; description: string; type?: ParamType; required?: boolean; options?: any[] }[];
  action: (args: { [key: string]: any }) => void;
}

export interface CLIOptions {
  interactive?: boolean;
  version?: string;
}
