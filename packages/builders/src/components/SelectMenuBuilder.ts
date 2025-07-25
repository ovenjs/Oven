/**
 * SelectMenuBuilder for OvenJS
 * Type-safe builder for Discord select menus
 */

import type { 
  SelectMenuData, 
  SelectOptionData, 
  ComponentType, 
  EmojiResolvable,
  EmojiData,
  ValidationResult,
  FluentBuilder,
  COMPONENT_LIMITS
} from '@ovenjs/types';

import { BuilderValidationError } from '@ovenjs/types';

export class SelectMenuBuilder implements FluentBuilder<SelectMenuData> {
  private data: SelectMenuData = {
    type: ComponentType.SelectMenu,
    customId: '',
    options: [],
  };

  /**
   * Set the select menu custom ID
   */
  setCustomId(customId: string): this {
    this.data.customId = customId;
    return this;
  }

  /**
   * Set the select menu placeholder
   */
  setPlaceholder(placeholder: string): this {
    if (placeholder.length > COMPONENT_LIMITS.SELECT_PLACEHOLDER) {
      throw new BuilderValidationError(
        'placeholder',
        placeholder,
        `Select menu placeholder must be ${COMPONENT_LIMITS.SELECT_PLACEHOLDER} characters or less`
      );
    }
    this.data.placeholder = placeholder;
    return this;
  }

  /**
   * Set the minimum number of values that can be selected
   */
  setMinValues(minValues: number): this {
    if (minValues < 0) {
      throw new BuilderValidationError(
        'minValues',
        minValues,
        'Minimum values must be non-negative'
      );
    }
    this.data.minValues = minValues;
    return this;
  }

  /**
   * Set the maximum number of values that can be selected
   */
  setMaxValues(maxValues: number): this {
    if (maxValues < 1) {
      throw new BuilderValidationError(
        'maxValues',
        maxValues,
        'Maximum values must be at least 1'
      );
    }
    this.data.maxValues = maxValues;
    return this;
  }

  /**
   * Set the select menu as disabled
   */
  setDisabled(disabled: boolean = true): this {
    this.data.disabled = disabled;
    return this;
  }

  /**
   * Add an option to the select menu
   */
  addOption(option: SelectOptionData): this {
    if (this.data.options.length >= COMPONENT_LIMITS.SELECT_OPTIONS) {
      throw new BuilderValidationError(
        'options',
        this.data.options.length,
        `Select menu can only have ${COMPONENT_LIMITS.SELECT_OPTIONS} options`
      );
    }
    
    this.validateOption(option);
    this.data.options.push(option);
    return this;
  }

  /**
   * Add multiple options to the select menu
   */
  addOptions(...options: SelectOptionData[]): this {
    for (const option of options) {
      this.addOption(option);
    }
    return this;
  }

  /**
   * Set options for the select menu (replaces existing options)
   */
  setOptions(options: SelectOptionData[]): this {
    if (options.length > COMPONENT_LIMITS.SELECT_OPTIONS) {
      throw new BuilderValidationError(
        'options',
        options.length,
        `Select menu can only have ${COMPONENT_LIMITS.SELECT_OPTIONS} options`
      );
    }
    
    for (const option of options) {
      this.validateOption(option);
    }
    
    this.data.options = [...options];
    return this;
  }

  /**
   * Splice options from the select menu
   */
  spliceOptions(index: number, deleteCount: number, ...options: SelectOptionData[]): this {
    this.data.options.splice(index, deleteCount, ...options);
    
    if (this.data.options.length > COMPONENT_LIMITS.SELECT_OPTIONS) {
      throw new BuilderValidationError(
        'options',
        this.data.options.length,
        `Select menu can only have ${COMPONENT_LIMITS.SELECT_OPTIONS} options`
      );
    }
    
    return this;
  }

  /**
   * Validate a select option
   */
  private validateOption(option: SelectOptionData): void {
    if (!option.label || option.label.length === 0) {
      throw new BuilderValidationError(
        'option.label',
        option.label,
        'Option label is required'
      );
    }
    
    if (option.label.length > 100) {
      throw new BuilderValidationError(
        'option.label',
        option.label,
        'Option label must be 100 characters or less'
      );
    }
    
    if (!option.value || option.value.length === 0) {
      throw new BuilderValidationError(
        'option.value',
        option.value,
        'Option value is required'
      );
    }
    
    if (option.value.length > 100) {
      throw new BuilderValidationError(
        'option.value',
        option.value,
        'Option value must be 100 characters or less'
      );
    }
    
    if (option.description && option.description.length > 100) {
      throw new BuilderValidationError(
        'option.description',
        option.description,
        'Option description must be 100 characters or less'
      );
    }
  }

  /**
   * Validate the select menu data
   */
  validate(): ValidationResult {
    const errors: string[] = [];
    
    // Validate custom ID
    if (!this.data.customId) {
      errors.push('Select menu must have a custom ID');
    }
    
    // Validate options
    if (this.data.options.length === 0) {
      errors.push('Select menu must have at least one option');
    }
    
    if (this.data.options.length > COMPONENT_LIMITS.SELECT_OPTIONS) {
      errors.push(`Select menu can only have ${COMPONENT_LIMITS.SELECT_OPTIONS} options`);
    }
    
    // Validate min/max values
    if (this.data.minValues !== undefined && this.data.maxValues !== undefined) {
      if (this.data.minValues > this.data.maxValues) {
        errors.push('Minimum values cannot be greater than maximum values');
      }
    }
    
    if (this.data.maxValues !== undefined && this.data.maxValues > this.data.options.length) {
      errors.push('Maximum values cannot be greater than the number of options');
    }
    
    // Validate placeholder
    if (this.data.placeholder && this.data.placeholder.length > COMPONENT_LIMITS.SELECT_PLACEHOLDER) {
      errors.push(`Select menu placeholder must be ${COMPONENT_LIMITS.SELECT_PLACEHOLDER} characters or less`);
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Build the select menu
   */
  build(): SelectMenuData {
    const validation = this.validate();
    if (!validation.valid) {
      throw new BuilderValidationError(
        'selectMenu',
        this.data,
        `Select menu validation failed: ${validation.errors.join(', ')}`
      );
    }
    
    return { ...this.data };
  }

  /**
   * Clone the builder
   */
  clone(): SelectMenuBuilder {
    const cloned = new SelectMenuBuilder();
    cloned.data = JSON.parse(JSON.stringify(this.data));
    return cloned;
  }

  /**
   * Reset the builder
   */
  reset(): this {
    this.data = {
      type: ComponentType.SelectMenu,
      customId: '',
      options: [],
    };
    return this;
  }

  /**
   * Convert to JSON
   */
  toJSON(): SelectMenuData {
    return this.build();
  }
}