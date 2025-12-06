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

export interface CommandParam {
  name: string;
  description: string;
  type?: ParamType;
  required?: boolean;
  options?: any[];
}

export interface Command {
  name: string;
  description: string;
  params: CommandParam[];
  subcommands?: Command[];
  action: (args: { [key: string]: any }) => void;
}

export interface IntroAnimationOptions {
  /**
   * Enable or disable the intro animation. Disabled by default to avoid unexpected output.
   */
  enabled?: boolean;
  /**
   * Choose a preset style for the intro animation (e.g., 'retro-space', 'hacker', 'vaporwave').
   */
  preset?: string;
  /**
   * Animate text reveal. Defaults to true when intro is enabled.
   */
  animateText?: boolean;
  /**
   * Controls when to show the intro: 'always', 'never', or undefined (default is once).
   */
  introMode?: 'always' | 'never';
  /**
   * Title shown in the intro animation. Defaults to the CLI name.
   */
  title?: string;
  /**
   * Subtitle shown under the title. Defaults to the CLI description.
   */
  subtitle?: string;
  /**
   * Extra lines that appear under the subtitle.
   */
  lines?: string[];
  /**
   * Frames used to animate the leading icon/spinner.
   */
  frames?: string[];
  /**
   * Optional ASCII art block appended under the subtitle/lines.
   */
  asciiArt?: string[];
  /**
   * Delay in milliseconds between frames.
   */
  speedMs?: number;
  /**
   * How many times to loop through the frames. Defaults to 2.
   */
  loops?: number;
  /**
   * When true, the intro only appears once per machine (default). Set to false to show always.
   */
  showOnce?: boolean;
  /**
   * Override the file name used to remember that the intro has been shown.
   */
  storageKey?: string;
  /**
   * Left padding before the content block.
   */
  padding?: number;
}

export interface CLIOptions {
  interactive?: boolean;
  version?: string;
  branding?: boolean;
  introAnimation?: IntroAnimationOptions;
}
