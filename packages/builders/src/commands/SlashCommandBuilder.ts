/**
 * SlashCommandBuilder for OvenJS
 * Type-safe builder for Discord slash commands
 */

import type { 
  SlashCommandData, 
  ApplicationCommandType,
  ApplicationCommandOptionData,
  ApplicationCommandOptionType,
  StringOptionData,
  IntegerOptionData,
  NumberOptionData,
  BooleanOptionData,
  UserOptionData,
  ChannelOptionData,
  RoleOptionData,
  MentionableOptionData,
  AttachmentOptionData,
  SubCommandData,
  SubCommandGroupData,
  ValidationResult,
  FluentBuilder,
  COMMAND_LIMITS
} from '@ovenjs/types';

import { BuilderValidationError } from '@ovenjs/types';

export class SlashCommandBuilder implements FluentBuilder<SlashCommandData> {
  private data: SlashCommandData = {
    name: '',
    description: '',
    type: ApplicationCommandType.ChatInput,
  };

  /**
   * Set the command name
   */
  setName(name: string): this {
    if (name.length > COMMAND_LIMITS.NAME) {
      throw new BuilderValidationError(
        'name',
        name,
        `Command name must be ${COMMAND_LIMITS.NAME} characters or less`
      );
    }
    
    if (!/^[a-z0-9_-]+$/.test(name)) {
      throw new BuilderValidationError(
        'name',
        name,
        'Command name must contain only lowercase letters, numbers, underscores, and hyphens'
      );
    }
    
    this.data.name = name;
    return this;
  }

  /**
   * Set the command description
   */
  setDescription(description: string): this {
    if (description.length > COMMAND_LIMITS.DESCRIPTION) {
      throw new BuilderValidationError(
        'description',
        description,
        `Command description must be ${COMMAND_LIMITS.DESCRIPTION} characters or less`
      );
    }
    
    this.data.description = description;
    return this;
  }

  /**
   * Set the command type
   */
  setType(type: ApplicationCommandType): this {
    this.data.type = type;
    return this;
  }

  /**
   * Set default member permissions
   */
  setDefaultMemberPermissions(permissions: string): this {
    this.data.defaultMemberPermissions = permissions;
    return this;
  }

  /**
   * Set DM permission
   */
  setDMPermission(dmPermission: boolean): this {
    this.data.dmPermission = dmPermission;
    return this;
  }

  /**
   * Set NSFW flag
   */
  setNSFW(nsfw: boolean): this {
    this.data.nsfw = nsfw;
    return this;
  }

  /**
   * Add a string option
   */
  addStringOption(fn: (option: StringOptionBuilder) => StringOptionBuilder): this {
    const option = fn(new StringOptionBuilder());
    this.addOption(option.build());
    return this;
  }

  /**
   * Add an integer option
   */
  addIntegerOption(fn: (option: IntegerOptionBuilder) => IntegerOptionBuilder): this {
    const option = fn(new IntegerOptionBuilder());
    this.addOption(option.build());
    return this;
  }

  /**
   * Add a number option
   */
  addNumberOption(fn: (option: NumberOptionBuilder) => NumberOptionBuilder): this {
    const option = fn(new NumberOptionBuilder());
    this.addOption(option.build());
    return this;
  }

  /**
   * Add a boolean option
   */
  addBooleanOption(fn: (option: BooleanOptionBuilder) => BooleanOptionBuilder): this {
    const option = fn(new BooleanOptionBuilder());
    this.addOption(option.build());
    return this;
  }

  /**
   * Add a user option
   */
  addUserOption(fn: (option: UserOptionBuilder) => UserOptionBuilder): this {
    const option = fn(new UserOptionBuilder());
    this.addOption(option.build());
    return this;
  }

  /**
   * Add a channel option
   */
  addChannelOption(fn: (option: ChannelOptionBuilder) => ChannelOptionBuilder): this {
    const option = fn(new ChannelOptionBuilder());
    this.addOption(option.build());
    return this;
  }

  /**
   * Add a role option
   */
  addRoleOption(fn: (option: RoleOptionBuilder) => RoleOptionBuilder): this {
    const option = fn(new RoleOptionBuilder());
    this.addOption(option.build());
    return this;
  }

  /**
   * Add a mentionable option
   */
  addMentionableOption(fn: (option: MentionableOptionBuilder) => MentionableOptionBuilder): this {
    const option = fn(new MentionableOptionBuilder());
    this.addOption(option.build());
    return this;
  }

  /**
   * Add an attachment option
   */
  addAttachmentOption(fn: (option: AttachmentOptionBuilder) => AttachmentOptionBuilder): this {
    const option = fn(new AttachmentOptionBuilder());
    this.addOption(option.build());
    return this;
  }

  /**
   * Add a subcommand
   */
  addSubcommand(fn: (option: SubCommandBuilder) => SubCommandBuilder): this {
    const option = fn(new SubCommandBuilder());
    this.addOption(option.build());
    return this;
  }

  /**
   * Add a subcommand group
   */
  addSubcommandGroup(fn: (option: SubCommandGroupBuilder) => SubCommandGroupBuilder): this {
    const option = fn(new SubCommandGroupBuilder());
    this.addOption(option.build());
    return this;
  }

  /**
   * Add an option
   */
  private addOption(option: ApplicationCommandOptionData): this {
    if (!this.data.options) {
      this.data.options = [];
    }
    
    if (this.data.options.length >= COMMAND_LIMITS.OPTIONS) {
      throw new BuilderValidationError(
        'options',
        this.data.options.length,
        `Command can only have ${COMMAND_LIMITS.OPTIONS} options`
      );
    }
    
    this.data.options.push(option);
    return this;
  }

  /**
   * Validate the command data
   */
  validate(): ValidationResult {
    const errors: string[] = [];
    
    // Validate name
    if (!this.data.name) {
      errors.push('Command must have a name');
    }
    
    if (this.data.name.length > COMMAND_LIMITS.NAME) {
      errors.push(`Command name must be ${COMMAND_LIMITS.NAME} characters or less`);
    }
    
    if (!/^[a-z0-9_-]+$/.test(this.data.name)) {
      errors.push('Command name must contain only lowercase letters, numbers, underscores, and hyphens');
    }
    
    // Validate description
    if (!this.data.description) {
      errors.push('Command must have a description');
    }
    
    if (this.data.description.length > COMMAND_LIMITS.DESCRIPTION) {
      errors.push(`Command description must be ${COMMAND_LIMITS.DESCRIPTION} characters or less`);
    }
    
    // Validate options
    if (this.data.options && this.data.options.length > COMMAND_LIMITS.OPTIONS) {
      errors.push(`Command can only have ${COMMAND_LIMITS.OPTIONS} options`);
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Build the command
   */
  build(): SlashCommandData {
    const validation = this.validate();
    if (!validation.valid) {
      throw new BuilderValidationError(
        'command',
        this.data,
        `Command validation failed: ${validation.errors.join(', ')}`
      );
    }
    
    return { ...this.data };
  }

  /**
   * Clone the builder
   */
  clone(): SlashCommandBuilder {
    const cloned = new SlashCommandBuilder();
    cloned.data = JSON.parse(JSON.stringify(this.data));
    return cloned;
  }

  /**
   * Reset the builder
   */
  reset(): this {
    this.data = {
      name: '',
      description: '',
      type: ApplicationCommandType.ChatInput,
    };
    return this;
  }

  /**
   * Convert to JSON
   */
  toJSON(): SlashCommandData {
    return this.build();
  }
}

// Option builders would be implemented similarly...
class StringOptionBuilder {
  private data: StringOptionData = {
    type: ApplicationCommandOptionType.String,
    name: '',
    description: '',
  };

  setName(name: string): this {
    this.data.name = name;
    return this;
  }

  setDescription(description: string): this {
    this.data.description = description;
    return this;
  }

  setRequired(required: boolean = true): this {
    this.data.required = required;
    return this;
  }

  setMinLength(minLength: number): this {
    this.data.minLength = minLength;
    return this;
  }

  setMaxLength(maxLength: number): this {
    this.data.maxLength = maxLength;
    return this;
  }

  setAutocomplete(autocomplete: boolean = true): this {
    this.data.autocomplete = autocomplete;
    return this;
  }

  build(): StringOptionData {
    return { ...this.data };
  }
}

class IntegerOptionBuilder {
  private data: IntegerOptionData = {
    type: ApplicationCommandOptionType.Integer,
    name: '',
    description: '',
  };

  setName(name: string): this {
    this.data.name = name;
    return this;
  }

  setDescription(description: string): this {
    this.data.description = description;
    return this;
  }

  setRequired(required: boolean = true): this {
    this.data.required = required;
    return this;
  }

  setMinValue(minValue: number): this {
    this.data.minValue = minValue;
    return this;
  }

  setMaxValue(maxValue: number): this {
    this.data.maxValue = maxValue;
    return this;
  }

  setAutocomplete(autocomplete: boolean = true): this {
    this.data.autocomplete = autocomplete;
    return this;
  }

  build(): IntegerOptionData {
    return { ...this.data };
  }
}

class NumberOptionBuilder {
  private data: NumberOptionData = {
    type: ApplicationCommandOptionType.Number,
    name: '',
    description: '',
  };

  setName(name: string): this {
    this.data.name = name;
    return this;
  }

  setDescription(description: string): this {
    this.data.description = description;
    return this;
  }

  setRequired(required: boolean = true): this {
    this.data.required = required;
    return this;
  }

  setMinValue(minValue: number): this {
    this.data.minValue = minValue;
    return this;
  }

  setMaxValue(maxValue: number): this {
    this.data.maxValue = maxValue;
    return this;
  }

  setAutocomplete(autocomplete: boolean = true): this {
    this.data.autocomplete = autocomplete;
    return this;
  }

  build(): NumberOptionData {
    return { ...this.data };
  }
}

class BooleanOptionBuilder {
  private data: BooleanOptionData = {
    type: ApplicationCommandOptionType.Boolean,
    name: '',
    description: '',
  };

  setName(name: string): this {
    this.data.name = name;
    return this;
  }

  setDescription(description: string): this {
    this.data.description = description;
    return this;
  }

  setRequired(required: boolean = true): this {
    this.data.required = required;
    return this;
  }

  build(): BooleanOptionData {
    return { ...this.data };
  }
}

class UserOptionBuilder {
  private data: UserOptionData = {
    type: ApplicationCommandOptionType.User,
    name: '',
    description: '',
  };

  setName(name: string): this {
    this.data.name = name;
    return this;
  }

  setDescription(description: string): this {
    this.data.description = description;
    return this;
  }

  setRequired(required: boolean = true): this {
    this.data.required = required;
    return this;
  }

  build(): UserOptionData {
    return { ...this.data };
  }
}

class ChannelOptionBuilder {
  private data: ChannelOptionData = {
    type: ApplicationCommandOptionType.Channel,
    name: '',
    description: '',
  };

  setName(name: string): this {
    this.data.name = name;
    return this;
  }

  setDescription(description: string): this {
    this.data.description = description;
    return this;
  }

  setRequired(required: boolean = true): this {
    this.data.required = required;
    return this;
  }

  addChannelTypes(...types: number[]): this {
    if (!this.data.channelTypes) {
      this.data.channelTypes = [];
    }
    this.data.channelTypes.push(...types);
    return this;
  }

  build(): ChannelOptionData {
    return { ...this.data };
  }
}

class RoleOptionBuilder {
  private data: RoleOptionData = {
    type: ApplicationCommandOptionType.Role,
    name: '',
    description: '',
  };

  setName(name: string): this {
    this.data.name = name;
    return this;
  }

  setDescription(description: string): this {
    this.data.description = description;
    return this;
  }

  setRequired(required: boolean = true): this {
    this.data.required = required;
    return this;
  }

  build(): RoleOptionData {
    return { ...this.data };
  }
}

class MentionableOptionBuilder {
  private data: MentionableOptionData = {
    type: ApplicationCommandOptionType.Mentionable,
    name: '',
    description: '',
  };

  setName(name: string): this {
    this.data.name = name;
    return this;
  }

  setDescription(description: string): this {
    this.data.description = description;
    return this;
  }

  setRequired(required: boolean = true): this {
    this.data.required = required;
    return this;
  }

  build(): MentionableOptionData {
    return { ...this.data };
  }
}

class AttachmentOptionBuilder {
  private data: AttachmentOptionData = {
    type: ApplicationCommandOptionType.Attachment,
    name: '',
    description: '',
  };

  setName(name: string): this {
    this.data.name = name;
    return this;
  }

  setDescription(description: string): this {
    this.data.description = description;
    return this;
  }

  setRequired(required: boolean = true): this {
    this.data.required = required;
    return this;
  }

  build(): AttachmentOptionData {
    return { ...this.data };
  }
}

class SubCommandBuilder {
  private data: SubCommandData = {
    type: ApplicationCommandOptionType.SubCommand,
    name: '',
    description: '',
  };

  setName(name: string): this {
    this.data.name = name;
    return this;
  }

  setDescription(description: string): this {
    this.data.description = description;
    return this;
  }

  build(): SubCommandData {
    return { ...this.data };
  }
}

class SubCommandGroupBuilder {
  private data: SubCommandGroupData = {
    type: ApplicationCommandOptionType.SubCommandGroup,
    name: '',
    description: '',
  };

  setName(name: string): this {
    this.data.name = name;
    return this;
  }

  setDescription(description: string): this {
    this.data.description = description;
    return this;
  }

  build(): SubCommandGroupData {
    return { ...this.data };
  }
}