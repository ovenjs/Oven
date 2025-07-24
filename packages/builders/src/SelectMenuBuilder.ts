import type { MessageComponent, SelectOption, Emoji } from '@ovenjs/types';

export class SelectMenuBuilder {
  private data: Partial<MessageComponent> = {
    type: 3, // Select menu component type
  };

  public setCustomId(customId: string): this {
    if (customId.length > 100) {
      throw new Error('Custom ID cannot exceed 100 characters');
    }
    
    this.data.custom_id = customId;
    return this;
  }

  public setPlaceholder(placeholder: string): this {
    if (placeholder.length > 150) {
      throw new Error('Placeholder cannot exceed 150 characters');
    }
    
    this.data.placeholder = placeholder;
    return this;
  }

  public setMinValues(minValues: number): this {
    if (minValues < 0 || minValues > 25) {
      throw new Error('Min values must be between 0 and 25');
    }
    
    this.data.min_values = minValues;
    return this;
  }

  public setMaxValues(maxValues: number): this {
    if (maxValues < 1 || maxValues > 25) {
      throw new Error('Max values must be between 1 and 25');
    }
    
    this.data.max_values = maxValues;
    return this;
  }

  public setDisabled(disabled = true): this {
    this.data.disabled = disabled;
    return this;
  }

  public addOption(option: SelectOption): this {
    if (!this.data.options) {
      this.data.options = [];
    }

    if (this.data.options.length >= 25) {
      throw new Error('Cannot add more than 25 options to a select menu');
    }

    this.data.options.push(option);
    return this;
  }

  public addOptions(...options: SelectOption[]): this {
    for (const option of options) {
      this.addOption(option);
    }
    return this;
  }

  public setOptions(...options: SelectOption[]): this {
    this.data.options = [];
    return this.addOptions(...options);
  }

  public toJSON(): MessageComponent {
    // Validation
    if (!this.data.custom_id) {
      throw new Error('Select menu must have a custom ID');
    }

    if (!this.data.options || this.data.options.length === 0) {
      throw new Error('Select menu must have at least one option');
    }

    if (this.data.min_values && this.data.max_values && this.data.min_values > this.data.max_values) {
      throw new Error('Min values cannot be greater than max values');
    }

    return { ...this.data } as MessageComponent;
  }

  public static from(selectMenu: MessageComponent): SelectMenuBuilder {
    const builder = new SelectMenuBuilder();
    builder.data = { ...selectMenu };
    return builder;
  }
}

export class SelectOptionBuilder {
  private data: Partial<SelectOption> = {};

  public setLabel(label: string): this {
    if (label.length > 100) {
      throw new Error('Option label cannot exceed 100 characters');
    }
    
    this.data.label = label;
    return this;
  }

  public setValue(value: string): this {
    if (value.length > 100) {
      throw new Error('Option value cannot exceed 100 characters');
    }
    
    this.data.value = value;
    return this;
  }

  public setDescription(description: string): this {
    if (description.length > 100) {
      throw new Error('Option description cannot exceed 100 characters');
    }
    
    this.data.description = description;
    return this;
  }

  public setEmoji(emoji: string | Emoji): this {
    if (typeof emoji === 'string') {
      // Unicode emoji
      this.data.emoji = { name: emoji };
    } else {
      // Custom emoji
      this.data.emoji = emoji;
    }
    return this;
  }

  public setDefault(isDefault = true): this {
    this.data.default = isDefault;
    return this;
  }

  public toJSON(): SelectOption {
    // Validation
    if (!this.data.label) {
      throw new Error('Option must have a label');
    }

    if (!this.data.value) {
      throw new Error('Option must have a value');
    }

    return { ...this.data } as SelectOption;
  }

  public static from(option: SelectOption): SelectOptionBuilder {
    const builder = new SelectOptionBuilder();
    builder.data = { ...option };
    return builder;
  }
}

// Action Row Builder for organizing components
export class ActionRowBuilder {
  private data: MessageComponent = {
    type: 1, // Action row component type
    components: [],
  };

  public addComponents(...components: MessageComponent[]): this {
    if (!this.data.components) {
      this.data.components = [];
    }

    for (const component of components) {
      if (this.data.components.length >= 5) {
        throw new Error('Action row cannot have more than 5 components');
      }
      
      // Validate component types in action row
      if (component.type === 3) { // Select menu
        if (this.data.components.length > 0) {
          throw new Error('Action row with select menu cannot have other components');
        }
      } else if (component.type === 2) { // Button
        const hasSelectMenu = this.data.components.some(c => c.type === 3);
        if (hasSelectMenu) {
          throw new Error('Action row with select menu cannot have buttons');
        }
      }

      this.data.components.push(component);
    }
    
    return this;
  }

  public setComponents(...components: MessageComponent[]): this {
    this.data.components = [];
    return this.addComponents(...components);
  }

  public toJSON(): MessageComponent {
    if (!this.data.components || this.data.components.length === 0) {
      throw new Error('Action row must have at least one component');
    }

    return { ...this.data };
  }

  public static from(actionRow: MessageComponent): ActionRowBuilder {
    const builder = new ActionRowBuilder();
    builder.data = { ...actionRow };
    return builder;
  }
}