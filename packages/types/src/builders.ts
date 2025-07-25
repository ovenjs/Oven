/**
 * Builder types for OvenJS
 * Types for type-safe Discord object builders
 */

import type { 
  Embed, 
  EmbedField, 
  EmbedFooter, 
  EmbedAuthor, 
  EmbedImage, 
  EmbedThumbnail,
  MessageComponent,
  SelectOption,
  Application,
  ImageURL
} from './discord/index.js';
import type { 
  Snowflake,
  UserId,
  ChannelId,
  RoleId,
  MessageId,
  BotToken
} from './primitives/index.js';
import type { Optional, DeepPartial } from './primitives/index.js';

// ========================= EMBED BUILDER TYPES =========================

export interface EmbedData {
  title?: string;
  description?: string;
  url?: string;
  timestamp?: string | Date;
  color?: number;
  footer?: EmbedFooter;
  image?: EmbedImage;
  thumbnail?: EmbedThumbnail;
  author?: EmbedAuthor;
  fields?: EmbedField[];
}

export interface EmbedFieldData {
  name: string;
  value: string;
  inline?: boolean;
}

export interface EmbedFooterData {
  text: string;
  iconURL?: string;
  proxyIconURL?: string;
}

export interface EmbedAuthorData {
  name: string;
  url?: string;
  iconURL?: string;
  proxyIconURL?: string;
}

export interface EmbedImageData {
  url: string;
  proxyURL?: string;
  height?: number;
  width?: number;
}

export interface EmbedThumbnailData {
  url: string;
  proxyURL?: string;
  height?: number;
  width?: number;
}

export type ColorResolvable = number | string | [number, number, number];

// ========================= COMPONENT BUILDER TYPES =========================

export enum ComponentType {
  ActionRow = 1,
  Button = 2,
  SelectMenu = 3,
  TextInput = 4,
  UserSelect = 5,
  RoleSelect = 6,
  MentionableSelect = 7,
  ChannelSelect = 8,
}

export enum ButtonStyle {
  Primary = 1,
  Secondary = 2,
  Success = 3,
  Danger = 4,
  Link = 5,
}

export enum TextInputStyle {
  Short = 1,
  Paragraph = 2,
}

export interface ComponentData {
  type: ComponentType;
  customId?: string;
  disabled?: boolean;
  style?: ButtonStyle | TextInputStyle;
  label?: string;
  emoji?: EmojiData;
  url?: string;
  options?: SelectOptionData[];
  placeholder?: string;
  minValues?: number;
  maxValues?: number;
  minLength?: number;
  maxLength?: number;
  required?: boolean;
  value?: string;
  channelTypes?: number[];
  components?: ComponentData[];
}

export interface ActionRowData {
  type: ComponentType.ActionRow;
  components: ComponentData[];
}

export interface ButtonData {
  type: ComponentType.Button;
  style: ButtonStyle;
  label?: string;
  emoji?: EmojiData;
  customId?: string;
  url?: string;
  disabled?: boolean;
}

export interface SelectMenuData {
  type: ComponentType.SelectMenu;
  customId: string;
  placeholder?: string;
  minValues?: number;
  maxValues?: number;
  options: SelectOptionData[];
  disabled?: boolean;
}

export interface TextInputData {
  type: ComponentType.TextInput;
  customId: string;
  style: TextInputStyle;
  label: string;
  minLength?: number;
  maxLength?: number;
  required?: boolean;
  value?: string;
  placeholder?: string;
}

export interface SelectOptionData {
  label: string;
  value: string;
  description?: string;
  emoji?: EmojiData;
  default?: boolean;
}

export interface EmojiData {
  id?: EmojiId;
  name?: string;
  animated?: boolean;
}

export type EmojiResolvable = EmojiData | string;

// ========================= MODAL BUILDER TYPES =========================

export interface ModalData {
  customId: string;
  title: string;
  components: ActionRowData[];
}

// ========================= SLASH COMMAND BUILDER TYPES =========================

export interface SlashCommandData {
  name: string;
  description: string;
  options?: ApplicationCommandOptionData[];
  defaultMemberPermissions?: string;
  dmPermission?: boolean;
  nsfw?: boolean;
  type?: ApplicationCommandType;
  contexts?: InteractionContextType[];
  integrationTypes?: ApplicationIntegrationType[];
}

export enum ApplicationCommandType {
  ChatInput = 1,
  User = 2,
  Message = 3,
}

export enum ApplicationCommandOptionType {
  SubCommand = 1,
  SubCommandGroup = 2,
  String = 3,
  Integer = 4,
  Boolean = 5,
  User = 6,
  Channel = 7,
  Role = 8,
  Mentionable = 9,
  Number = 10,
  Attachment = 11,
}

export enum InteractionContextType {
  Guild = 0,
  BotDM = 1,
  PrivateChannel = 2,
}

export enum ApplicationIntegrationType {
  GuildInstall = 0,
  UserInstall = 1,
}

export interface ApplicationCommandOptionData {
  type: ApplicationCommandOptionType;
  name: string;
  description: string;
  required?: boolean;
  choices?: ApplicationCommandOptionChoiceData[];
  options?: ApplicationCommandOptionData[];
  channelTypes?: number[];
  minValue?: number;
  maxValue?: number;
  minLength?: number;
  maxLength?: number;
  autocomplete?: boolean;
}

export interface ApplicationCommandOptionChoiceData {
  name: string;
  value: string | number;
}

export interface StringOptionData extends ApplicationCommandOptionData {
  type: ApplicationCommandOptionType.String;
  minLength?: number;
  maxLength?: number;
  autocomplete?: boolean;
}

export interface IntegerOptionData extends ApplicationCommandOptionData {
  type: ApplicationCommandOptionType.Integer;
  minValue?: number;
  maxValue?: number;
  autocomplete?: boolean;
}

export interface NumberOptionData extends ApplicationCommandOptionData {
  type: ApplicationCommandOptionType.Number;
  minValue?: number;
  maxValue?: number;
  autocomplete?: boolean;
}

export interface BooleanOptionData extends ApplicationCommandOptionData {
  type: ApplicationCommandOptionType.Boolean;
}

export interface UserOptionData extends ApplicationCommandOptionData {
  type: ApplicationCommandOptionType.User;
}

export interface ChannelOptionData extends ApplicationCommandOptionData {
  type: ApplicationCommandOptionType.Channel;
  channelTypes?: number[];
}

export interface RoleOptionData extends ApplicationCommandOptionData {
  type: ApplicationCommandOptionType.Role;
}

export interface MentionableOptionData extends ApplicationCommandOptionData {
  type: ApplicationCommandOptionType.Mentionable;
}

export interface AttachmentOptionData extends ApplicationCommandOptionData {
  type: ApplicationCommandOptionType.Attachment;
}

export interface SubCommandData extends ApplicationCommandOptionData {
  type: ApplicationCommandOptionType.SubCommand;
  options?: ApplicationCommandOptionData[];
}

export interface SubCommandGroupData extends ApplicationCommandOptionData {
  type: ApplicationCommandOptionType.SubCommandGroup;
  options?: SubCommandData[];
}

// ========================= BUILDER VALIDATION TYPES =========================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface BuilderValidationError extends Error {
  field: string;
  value: unknown;
  expected: string;
}

// ========================= BUILDER BASE TYPES =========================

export interface BaseBuilder<T> {
  build(): T;
  validate(): ValidationResult;
}

export interface FluentBuilder<T> extends BaseBuilder<T> {
  clone(): this;
  reset(): this;
}

// ========================= UTILITY TYPES =========================

export type BuilderOf<T> = T extends infer U ? BaseBuilder<U> : never;
export type DataOf<T> = T extends BaseBuilder<infer U> ? U : never;

// ========================= PERMISSION TYPES =========================

export interface PermissionResolvable {
  permissions: string | string[] | number | bigint;
}

export interface PermissionData {
  allow: string;
  deny: string;
}

// ========================= COLOR UTILITIES =========================

export interface ColorUtils {
  resolve(color: ColorResolvable): number;
  random(): number;
  hex(color: number): string;
  rgb(color: number): [number, number, number];
}

// ========================= CONSTANTS =========================

export const EMBED_LIMITS = {
  TITLE: 256,
  DESCRIPTION: 4096,
  FIELDS: 25,
  FIELD_NAME: 256,
  FIELD_VALUE: 1024,
  FOOTER: 2048,
  AUTHOR: 256,
  TOTAL: 6000,
} as const;

export const COMPONENT_LIMITS = {
  ACTION_ROW_COMPONENTS: 5,
  SELECT_OPTIONS: 25,
  BUTTON_LABEL: 80,
  SELECT_PLACEHOLDER: 150,
  TEXT_INPUT_LABEL: 45,
  TEXT_INPUT_PLACEHOLDER: 100,
  TEXT_INPUT_VALUE: 4000,
} as const;

export const COMMAND_LIMITS = {
  NAME: 32,
  DESCRIPTION: 100,
  OPTIONS: 25,
  CHOICES: 25,
  CHOICE_NAME: 100,
  CHOICE_VALUE: 100,
} as const;